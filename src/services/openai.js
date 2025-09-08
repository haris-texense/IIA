async function makeApiCall(url, message, systemInstruction, tools = []) {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Authorization": "Bearer ya29.a0AS3H6Nzy_zLDBBRQi69b3rei319AJwkh3oD0dS3N2MtdcfASu-TdhY0q0y31-V-ApLOODWHjKk9cuKQOM3deccNTTcIXvFAkwXt34imfVGTyJUJXg1UddXTXDoP9SMJ7JB3gMqUbFKURnR_CP0vMQXancuyLbK3we47yB_IwFmNxShwWo5hb-TLkOQUImH6nSVS2nEZb5T6dzF-VrP5i9FXNOCcvnH0LDI56OFKNScxL3wkdtgVTBYcu8K21Ny1G2KTKgAzQKUlAMMi_bbA8uLxg1nCSMUJzt-72e1JEaq9bWSKM_75JbHn_ojAiktqvN1JYvfCM9SZhgRsc2L1G0TTxOGtHli_Tc26q0AaCgYKAQ4SARQSFQHGX2MiYE4See9YSqA1W9bjblMK6Q0365", 
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			contents: [
				{
					role: "user",
					parts: [{ text: message }]
				}
			],
			systemInstruction: {
				role: "system",
				parts: [{ text: systemInstruction }]
			},
			generationConfig: {
				temperature: 0,
				maxOutputTokens: 8192,
				topP: 1,
				seed: 0
			},
			safetySettings: [
				{ category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
				{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
				{ category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
				{ category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" }
			],
			tools
		})
	});

	if (!response.ok) {
		console.error("Error response", await response.text());
		throw new Error("Vertex AI request failed");
	}

	const data = await response.json();

	// Extract text content
	const text = data?.candidates?.[0]?.content?.parts?.map(p => p?.text || "").join("") || "";

	// Extract reference links from grounding metadata
	const groundingChunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
	const referencesRaw = groundingChunks
		.map(chunk => {
			const ctx = chunk?.retrievedContext;
			const uri = ctx?.uri || ctx?.url || null;
			const title = ctx?.title || ctx?.documentTitle || null;
			if (!uri) return null;
			return { uri, title: title || uri };
		})
		.filter(Boolean);

	// Deduplicate by URI
	const seen = new Set();
	const references = [];
	for (const ref of referencesRaw) {
		const key = String(ref.uri).trim();
		if (key && !seen.has(key)) {
			seen.add(key);
			references.push(ref);
		}
	}

	if (!text.trim()) {
		throw new Error("Empty response from generateContent");
	}

	return { text: text.trim(), references };
}

// Primary API call (with retrieval tool)
export async function fetchBotReply(conversation) {
	const lastMessage = conversation[conversation.length - 1]?.content || "";

	const primarySystemInstruction = "Act as an Internal Auditor. Answer only from the provided context files. Rules: 1. Return the output strictly in HTML format only (no markdowns, no plain text). 2. If the response language is Arabic, set text flows right-to-left. - Ensure bullet points are aligned on the right side when Arabic is used. 3. If no relevant data is  or does not contain any information, return exactly: <p>No data found.</p> 4. Never include anything outside of HTML (no explanations, no notes).";

	const primaryUrl = "https://aiplatform.googleapis.com/v1/projects/new-cb-470108/locations/global/publishers/google/models/gemini-2.5-flash-lite:generateContent";

	const retrievalTool = [
		{
			retrieval: {
				vertexRagStore: {
					ragResources: [
						{
							ragCorpus: "projects/186916176801/locations/europe-west4/ragCorpora/2305843009213693952"
						}
					],
					ragRetrievalConfig: {}
				}
			}
		}
	];

	return await makeApiCall(primaryUrl, lastMessage, primarySystemInstruction, retrievalTool);
}

// Fallback API call (with googleSearch tool)
export async function fetchFallbackReply(conversation) {
	const lastMessage = conversation[conversation.length - 1]?.content || "";

	const fallbackSystemInstruction = "For all context, only use and search these sites: https://www.iia.org.sa/en , https://www.theiia.org/en , https://www.sama.gov.sa/en-US/Pages/default.aspx , https://nca.gov.sa/en/ . Rules: 1. Provide comprehensive answers strictly based on the information from the allowed sites above. 2. Return the response strictly in plain HTML format only. No Markdown, no plain text, no additional formatting. 3. If no relevant data is found, return exactly: `<p>No data found</p>` 5. Do not include any content or context from outside the specified websites.";

	const fallbackUrl = "https://aiplatform.googleapis.com/v1/projects/new-cb-470108/locations/global/publishers/google/models/gemini-2.5-flash-lite:generateContent";

	const googleSearchTool = [
		{
			googleSearch: {}
		}
	];

	try {
		return await makeApiCall(fallbackUrl, lastMessage, fallbackSystemInstruction, googleSearchTool);
	} catch (error) {
		console.error("Fallback API call failed:", error);
		throw error;
	}
}

// Graph creation API call (uses same primary URL, different system instruction)
export async function fetchGraphReply(conversation) {
    const lastMessage = conversation[conversation.length - 1]?.content || "";

    const graphSystemInstruction = "Give only HTML format of suitable graph for the above data. Do not include any irrelevant info other than graph. If not found, output should be \"No Graph data found.\" ";

    const primaryUrl = "https://aiplatform.googleapis.com/v1/projects/new-cb-470108/locations/global/publishers/google/models/gemini-2.5-pro:generateContent";

    return await makeApiCall(primaryUrl, lastMessage, graphSystemInstruction, []);
}

// Suggested prompts API call (uses same model; different system instruction and parsing)
export async function fetchSuggestedPrompts(userInput) {
    const input = (userInput || "").trim();
    if (!input) return [];

    const systemInstruction = "You are a prompt suggester. Given the user's input, produce 2-3 concise, helpful follow-up prompts strictly relevant to the user's topic and API response. Output rules: 1) Output only the suggestions, 2) one suggestion per line, 3) no numbering, no bullets, no quotes, no extra text.";
    const primaryUrl = "https://aiplatform.googleapis.com/v1/projects/new-cb-470108/locations/global/publishers/google/models/gemini-2.5-flash-lite:generateContent";

    try {
        const { text } = await makeApiCall(primaryUrl, input, systemInstruction, []);
        const lines = String(text || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        const seen = new Set();
        const unique = [];
        for (const l of lines) {
            const key = l.toLowerCase();
            if (!seen.has(key)) { seen.add(key); unique.push(l); }
            if (unique.length >= 3) break;
        }
        return unique;
    } catch {
        return [];
    }
}