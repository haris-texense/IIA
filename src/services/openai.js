import { Client } from "@gradio/client";

// Environment variables (Vite style)
const GRADIO_URL = "https://aiplatform.googleapis.com/v1/projects/new-cb-470108/locations/global/publishers/google/models/gemini-2.5-pro:generateContent"; 
const GRADIO_KEY = import.meta.env.VITE_GRADIO_SECRET_KEY;

let clientPromise = null;

async function getClient() {
	if (!clientPromise) {
		Client.connect(`${GRADIO_URL}?key=${GRADIO_KEY}`);
	}
	return clientPromise;
}

export async function fetchBotReply(conversation) {
	const lastMessage = conversation[conversation.length - 1]?.content || "";
  
	const response = await fetch(
	  "https://aiplatform.googleapis.com/v1/projects/new-cb-470108/locations/global/publishers/google/models/gemini-2.5-pro:generateContent",
	  {
		method: "POST",
		headers: {
		  "Authorization": "Bearer ya29.A0AS3H6Nwnz3mx-4aewQGX6EaAjl3YZHlUG9t6FBIita7ZH88BhJC-NBJuaoePKCYsCwAVxXwoqbKkgjF7ncY46XFFgJZau0b2eNnCwnfpL1WVZptQpiwQkUvkKzzni9T-0ntx6TYfOoxQXJ6WTnVFvqe3qfWCgApoxfUBPl8J8p0Hg2Qc5sPXnE9R_NRu5iBW1ySWQO7Q2AN2V_W8stDqL9hWzhiW3ZbXafbp7v4_X24dIa_qKBGh0EKYMPN7o6cxthoVmd3TOXbkSmZNRVvSA6jljFBRTmlH4LRW3GA5MNmoqX8GdizAXPzofAknVd24qX-XyO-5T7jIs_ugKoU5Oh6WHA0jEfHuhu7maCgYKATUSARQSFQHGX2MiSogytk2e8W-HmXq-GB8cWw0363", 
		  "Content-Type": "application/json"
		},
		body: JSON.stringify({
		  contents: [{ role: "user", parts: [{ text: lastMessage }] }]
		})
	  }
	);
  
	if (!response.ok) {
	  console.error("Error response", await response.text());
	  throw new Error("Vertex AI request failed");
	}
  
	const data = await response.json();
	const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
  
	if (!text.trim()) {
	  throw new Error("Empty response from generateContent");
	}
  
	return text.trim();
  }