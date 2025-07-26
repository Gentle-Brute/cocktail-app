import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Content, Part } from "@google/genai";

// Define types inline to avoid import issues
enum AgentName {
    USER = 'USER',
    AURA = 'AURA',
    MUSE = 'MUSE',
    GEMINI = 'GEMINI',
    SORA = 'SORA',
    SYSTEM = 'SYSTEM'
}

interface ChatMessage {
    id: string;
    sender: AgentName;
    text: string;
    imageUrl?: string;
    questions?: string[];
    prompts?: string[];
    isGenerating?: boolean;
}

// System instruction inline
const SYSTEM_INSTRUCTION = `You are a creative AI assistant specializing in cocktail creation and mixology. You have deep knowledge of spirits, liqueurs, bitters, syrups, and cocktail techniques. You can help users create custom cocktails, suggest variations, explain techniques, and provide detailed recipes with measurements and instructions.

When creating cocktails:
- Provide precise measurements (in ml, oz, or both)
- Include step-by-step instructions
- Suggest appropriate glassware
- Mention any special techniques or equipment needed
- Consider balance of flavors (sweet, sour, bitter, strong)
- Suggest garnishes when appropriate

You can also help with:
- Cocktail history and origins
- Ingredient substitutions
- Technique explanations
- Glassware recommendations
- Food pairing suggestions

Be enthusiastic about mixology and encourage creativity while maintaining safety and responsible drinking practices.`;

// Try multiple environment variable names for compatibility
const apiKey = process.env.GEMINI_API_KEY_VERCEL || process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("Missing API key. Available env vars:", Object.keys(process.env).filter(key => key.includes('GEMINI') || key.includes('API')));
    throw new Error("GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });
const generationModel = 'gemini-2.5-flash';
const imageModel = 'imagen-3.0-generate-002';

// This helper function converts the frontend's message array into the format
// required by the Gemini API's chat history, merging consecutive model messages.
const convertToGeminiHistory = (messages: ChatMessage[]): Content[] => {
    const history: Content[] = [];
    if (!messages || messages.length === 0) {
        return history;
    }

    // Filter out system/internal messages and image generation messages
    const relevantMessages = messages.filter(msg => 
        msg.sender === AgentName.USER || 
        msg.sender === AgentName.AURA ||
        msg.sender === AgentName.MUSE ||
        msg.sender === AgentName.GEMINI
    );

    let currentModelParts: Part[] = [];

    for (const msg of relevantMessages) {
        if (msg.sender === AgentName.USER) {
            // If there were any model messages before this user message, commit them.
            if (currentModelParts.length > 0) {
                history.push({ role: 'model', parts: currentModelParts });
                currentModelParts = [];
            }
            history.push({ role: 'user', parts: [{ text: msg.text }] });
        } else {
            // It's a model message. Accumulate its parts.
            currentModelParts.push({ text: msg.text });
        }
    }
    
    // If the loop ends and there are accumulated model parts, add them.
    if (currentModelParts.length > 0) {
        history.push({ role: 'model', parts: currentModelParts });
    }

    return history;
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action, payload } = req.body;

        if (action === 'sendMessage') {
            const { history, message, image } = payload;
            
            const chat = ai.chats.create({
                model: generationModel,
                config: { systemInstruction: SYSTEM_INSTRUCTION },
                history: convertToGeminiHistory(history),
            });

            const messageParts = image 
                ? [{ text: message }, { inlineData: image }] 
                : message;
            
            const result = await chat.sendMessage({ message: messageParts });
            
            // Extract the text from the response with better error handling
            const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!responseText) {
                console.error("No response text from Gemini API:", result);
                return res.status(500).json({ error: 'Failed to generate response from Gemini API' });
            }
            
            return res.status(200).json({ text: responseText });

        } else if (action === 'generateImage') {
            const { prompt } = payload;
            
            const response = await ai.models.generateImages({
                model: imageModel,
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                return res.status(200).json({ imageUrl });
            } else {
                throw new Error("Image generation failed");
            }
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ error: 'Failed to process request', details: errorMessage });
    }
}
