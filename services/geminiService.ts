import type { GenerateContentResponse } from "@google/genai";
import type { ChatMessage } from '../types';

export const sendMessage = async (
    history: ChatMessage[],
    message: string,
    image?: { mimeType: string; data: string }
): Promise<GenerateContentResponse> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'sendMessage',
            payload: { history, message, image },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.details || `Server error: ${response.statusText}`);
    }

    return response.json();
};

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'generateImage',
            payload: { prompt },
        }),
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.details || `Server error: ${response.statusText}`);
    }

    const { imageUrl } = await response.json();
    if (!imageUrl) {
        throw new Error("Image generation failed to return an image URL.");
    }
    return imageUrl;
};
