import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const envVars = {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
        GEMINI_API_KEY_VERCEL: process.env.GEMINI_API_KEY_VERCEL ? 'SET' : 'NOT SET',
        API_KEY: process.env.API_KEY ? 'SET' : 'NOT SET',
        allKeys: Object.keys(process.env).filter(key => key.includes('GEMINI') || key.includes('API'))
    };
    
    return res.status(200).json(envVars);
} 