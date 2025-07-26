import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Get API key
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable not set");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const generationModel = 'gemini-2.5-flash';
const imageModel = 'imagen-3.0-generate-002';

// System instruction (you can move this to a separate file if needed)
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

// Helper function to convert messages to Gemini format
const convertToGeminiHistory = (messages) => {
    const history = [];
    if (!messages || messages.length === 0) {
        return history;
    }

    // Filter out system/internal messages and image generation messages
    const relevantMessages = messages.filter(msg => 
        msg.sender === 'USER' || 
        msg.sender === 'AURA' ||
        msg.sender === 'MUSE' ||
        msg.sender === 'GEMINI'
    );

    let currentModelParts = [];

    for (const msg of relevantMessages) {
        if (msg.sender === 'USER') {
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

// API Routes
app.post('/api/gemini', async (req, res) => {
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
            
            // Extract the text from the response
            const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response generated';
            
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
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
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
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API server is running' });
});

app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
}); 