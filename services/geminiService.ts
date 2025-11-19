import { GoogleGenAI } from "@google/genai";
import { StreamChunk } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

export const streamDeepResearch = async (
  topic: string,
  onChunk: (chunk: StreamChunk) => void
): Promise<void> => {
  const modelId = 'gemini-2.5-flash';

  const systemInstruction = `
    You are DeepResearch AI, an advanced research assistant.
    Your task is to conduct a comprehensive deep dive into the user's requested topic.
    
    Follow these rules strictly:
    1. USE THE GOOGLE SEARCH TOOL to find the most recent and relevant data.
    2. Structure your response as a professional Markdown report.
    3. Start immediately with a Title (H1).
    4. Use H2 and H3 for sections.
    5. Include specific details, numbers, dates, and technical depth.
    6. Do not include conversational fillers like "Here is your report" or "I have found...". Just output the report.
    7. Aim for a "Deep Dive" style: comprehensive, analytical, and well-formatted.
  `;

  try {
    // Using the chat interface to maintain context if we expand this later, 
    // but essentially a single turn deep research request.
    const responseStream = await ai.models.generateContentStream({
        model: modelId,
        contents: [
            { role: 'user', parts: [{ text: `Conduct deep research and write a comprehensive report on: ${topic}` }] }
        ],
        config: {
            tools: [{ googleSearch: {} }], // Enable Search Grounding
            systemInstruction: systemInstruction,
        }
    });

    for await (const chunk of responseStream) {
        const textPart = chunk.text;
        let sources: any[] = [];

        // Extract grounding metadata if present (Google Search results)
        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        if (groundingChunks) {
            sources = groundingChunks
                .map((c: any) => c.web)
                .filter((w: any) => w && w.uri && w.title)
                .map((w: any) => ({ title: w.title, url: w.uri }));
        }

        onChunk({
            text: textPart || '',
            sources: sources.length > 0 ? sources : undefined
        });
    }

  } catch (error) {
    console.error("Error during deep research stream:", error);
    throw error;
  }
};