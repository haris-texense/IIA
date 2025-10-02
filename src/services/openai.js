// Function to resolve redirect links from web search results
async function resolveRedirectLinks(htmlContent) {
	if (!htmlContent || typeof htmlContent !== 'string') return [];
	
	console.log('Resolving redirect links from HTML content...');
	console.log('HTML content preview:', htmlContent.substring(0, 500));
	
	const redirectPattern = /href="https:\/\/vertexaisearch\.cloud\.google\.com\/grounding-api-redirect\/([^"]+)"/g;
	const matches = [...htmlContent.matchAll(redirectPattern)];
	
	console.log('Found redirect matches:', matches.length);
	console.log('Matches:', matches.map(m => m[0]));
	
	if (matches.length === 0) return [];
	
	const resolvedLinks = [];
	
	for (const match of matches) {
		const redirectUrl = match[0].replace('href="', '').replace('"', '');
		console.log('Processing redirect URL:', redirectUrl);
		
		try {
			// Try multiple approaches to resolve the redirect
			let finalUrl = null;
			
			// Approach 1: Use fetch with redirect follow
			try {
				console.log('Trying fetch approach...');
				const response = await fetch(redirectUrl, { 
					method: 'GET',
					redirect: 'follow',
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
					}
				});
				
				console.log('Fetch response status:', response.status);
				console.log('Fetch response URL:', response.url);
				console.log('Original URL:', redirectUrl);
				console.log('URLs are different:', response.url !== redirectUrl);
				
				if (response.ok && response.url !== redirectUrl) {
					finalUrl = response.url;
					console.log('Resolved via fetch to:', finalUrl);
				} else {
					console.log('Fetch did not resolve to different URL');
				}
			} catch (fetchError) {
				console.warn('Fetch approach failed:', fetchError);
			}
			
			// Approach 2: Try with a different method if first failed
			if (!finalUrl) {
				try {
					console.log('Trying HEAD approach...');
					const response = await fetch(redirectUrl, { 
						method: 'HEAD',
						redirect: 'follow',
						headers: {
							'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
						}
					});
					
					console.log('HEAD response status:', response.status);
					console.log('HEAD response URL:', response.url);
					
					if (response.ok && response.url !== redirectUrl) {
						finalUrl = response.url;
						console.log('Resolved via HEAD to:', finalUrl);
					} else {
						console.log('HEAD did not resolve to different URL');
					}
				} catch (headError) {
					console.warn('HEAD approach failed:', headError);
				}
			}
			
			// If we got a final URL, use it
			if (finalUrl && finalUrl !== redirectUrl) {
				resolvedLinks.push({
					uri: finalUrl,
					title: finalUrl,
					source: 'web_search'
				});
				console.log('Successfully resolved:', redirectUrl, '->', finalUrl);
			} else {
				// Approach 3: Try to decode the redirect URL to extract the target
				let foundDecodedUrl = false;
				try {
					console.log('Trying decode approach...');
					const urlParts = redirectUrl.split('/grounding-api-redirect/');
					console.log('URL parts:', urlParts);
					if (urlParts.length > 1) {
						const encodedPath = urlParts[1];
						console.log('Encoded path:', encodedPath);
						// Try to decode the base64 encoded path
						try {
							const decoded = atob(encodedPath);
							console.log('Decoded redirect path:', decoded);
							// If the decoded path looks like a URL, use it
							if (decoded.startsWith('http')) {
								resolvedLinks.push({
									uri: decoded,
									title: decoded,
									source: 'web_search'
								});
								console.log('Used decoded URL:', decoded);
								foundDecodedUrl = true;
							} else {
								console.log('Decoded path does not start with http:', decoded);
							}
						} catch (decodeError) {
							console.warn('Could not decode redirect path:', decodeError);
						}
					}
				} catch (extractError) {
					console.warn('Could not extract from redirect URL:', extractError);
				}
				
				// If still no URL found, use the redirect URL as fallback
				if (!foundDecodedUrl) {
					console.warn('Could not resolve redirect, using as fallback:', redirectUrl);
					resolvedLinks.push({
						uri: redirectUrl,
						title: 'Web Search Result',
						source: 'web_search'
					});
				}
			}
			
		} catch (error) {
			console.warn('Failed to resolve redirect link:', redirectUrl, error);
			// Add the redirect URL as fallback even if resolution failed
			resolvedLinks.push({
				uri: redirectUrl,
				title: 'Web Search Result',
				source: 'web_search'
			});
		}
	}
	
	console.log('Final resolved links:', resolvedLinks);
	return resolvedLinks;
}

async function makeApiCall(url, message, systemInstruction, tools = [], isWebSearch = false) {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Authorization": "Bearer ", 
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
    console.log('Raw grounding chunks:', groundingChunks);
    
    const referencesRaw = groundingChunks
        .map(chunk => {
            const ctx = chunk?.retrievedContext;
            const uri = ctx?.uri || ctx?.url || null;
            const title = ctx?.title || ctx?.documentTitle || null;
            console.log('Grounding chunk context:', { uri, title, ctx });
            if (!uri) return null;
            return { uri, title: title || uri };
        })
        .filter(Boolean);
    
    console.log('Initial references from grounding chunks:', referencesRaw);

    // For web search, don't show any references
    if (isWebSearch) {
        console.log('Web search mode - no references will be shown');
        // Clear any existing references for web search
        referencesRaw.length = 0;
    }

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

	// Map support segments to reference numbers using groundingSupports
	const uriToRefIndex = new Map();
	references.forEach((r, i) => {
		const u = String(r?.uri || '').trim();
		if (u && !uriToRefIndex.has(u)) uriToRefIndex.set(u, i + 1);
	});
	const rawSupports = Array.isArray(data?.candidates?.[0]?.groundingMetadata?.groundingSupports)
		? data.candidates[0].groundingMetadata.groundingSupports
		: [];
	const supports = rawSupports.map(s => {
		const seg = s?.segment || {};
		const startIndex = Number.isFinite(seg?.startIndex) ? seg.startIndex : (Number.isFinite(seg?.endIndex) ? null : null);
		const endIndex = Number.isFinite(seg?.endIndex) ? seg.endIndex : null;
		const segmentText = String(seg?.text || '').trim();
		// Map chunk indices to URIs
		const chunkIdxs = Array.isArray(s?.groundingChunkIndices) ? s.groundingChunkIndices : [];
		const uris = chunkIdxs
			.map(ci => groundingChunks?.[ci]?.retrievedContext?.uri || groundingChunks?.[ci]?.retrievedContext?.url || null)
			.filter(Boolean);
		const primaryUri = uris.find(u => uriToRefIndex.has(String(u).trim())) || uris[0] || null;
		const refNumber = primaryUri ? uriToRefIndex.get(String(primaryUri).trim()) || null : null;
		// Prefer rich chunk text (ragChunk.text), fallback to retrievedContext.text
		let snippet = '';
		let pageSpan = null;
		if (Number.isFinite(chunkIdxs?.[0])) {
			const chunk = groundingChunks?.[chunkIdxs[0]];
			const ctx = chunk?.retrievedContext || {};
			snippet = String(ctx?.ragChunk?.text || ctx?.text || '').trim();
			pageSpan = ctx?.pageSpan || null;
		}
		return { startIndex, endIndex, text: segmentText, uris, refNumber, snippet, pageSpan };
	}).filter(s => s && s.text);

	if (!text.trim()) {
		throw new Error("Empty response from generateContent");
	}

	return { text: text.trim(), references, supports };
}

// Primary API call (with retrieval tool)
export async function fetchBotReply(conversation) {
	const lastMessage = conversation[conversation.length - 1]?.content || "";

	const primarySystemInstruction = "Act as an Internal Auditor Authority. Answer only from the provided files. Rules: 1. Return the output strictly in HTML format only (no markdowns, no plain text). 2. If the response language is Arabic, set text flows right-to-left. - Ensure bullet points are aligned on the right side when Arabic is used. 3. If no relevant data is  or does not contain any information, return exactly: <p>No data found.</p> 4. Never include anything outside of HTML (no explanations, no notes).5. return response as bulleted lists or table format and bold key phrases";

	const primaryUrl = "https://aiplatform.googleapis.com/v1/projects/new-cb-470108/locations/global/publishers/google/models/gemini-2.5-flash-lite:generateContent";

	const retrievalTool = [
		{
			retrieval: {
				vertexRagStore: {
					ragResources: [
						{
							ragCorpus: "projects/new-cb-470108/locations/europe-west4/ragCorpora/4611686018427387904"
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

	const fallbackSystemInstruction =
		"Act as an Internal Auditor in Saudia Arabia, for all context, only use and search these sites: https://www.iia.org.sa/en , https://www.theiia.org/en , https://nca.gov.sa/en/ . https://zatca.gov.sa/en.Rules: 1. Provide comprehensive answers strictly based on the information from the allowed sites above. 2. Return the response strictly in plain HTML format only.  3. If no relevant data is found, return exactly: `<p>No data found</p>` 5. Do not include any content or context from outside the specified websites. 6. Return response as bulleted lists or table format and bold key phrases";

	const fallbackUrl =
		"https://aiplatform.googleapis.com/v1/projects/new-cb-470108/locations/global/publishers/google/models/gemini-2.5-flash-lite:generateContent";

	const googleSearchTool = [
		{
			googleSearch: {},
		},
	];

	async function tryApiCall(retries = 1) {
		try {
			// Pass isWebSearch=true to enable redirect resolution
			return await makeApiCall(
				fallbackUrl,
				lastMessage,
				fallbackSystemInstruction,
				googleSearchTool,
				true
			);
		} catch (error) {
			console.error("Fallback API call failed:", error);

			if (retries > 0) {
				console.log(`Retrying fallback API... attempts left: ${retries}`);
				return await tryApiCall(retries - 1);
			}

			// If all retries failed, rethrow the error
			throw error;
		}
	}

	// First attempt with 1 retry allowed
	return await tryApiCall(1);
}

// Graph creation API call (uses same primary URL, different system instruction)
export async function fetchGraphReply(conversation) {
    const lastMessage = conversation[conversation.length - 1]?.content || "";

    const graphSystemInstruction = "Give only HTML format of suitable graph for the above data. Do not include any irrelevant info other than graph. If not found, output should be \"No Graph data found.\" ";

    const primaryUrl = "https://aiplatform.googleapis.com/v1/projects/new-cb-470108/locations/global/publishers/google/models/gemini-2.5-flash-lite:generateContent";

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