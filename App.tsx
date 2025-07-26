import React, { useState, useCallback } from 'react';
import { ChatMessage, AgentName } from './types';
import { MOODBOARD_PROMPT_INITIAL } from './constants';
import { sendMessage, generateImage } from './services/geminiService';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';

const App: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'init',
            sender: AgentName.GEMINI,
            text: "Hello! I am a multi-agent creative assistant. Upload a moodboard to begin our iterative creative process, or ask me anything.",
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [conversationPhase, setConversationPhase] = useState<'idle' | 'awaiting_refinement'>('idle');

    const processResponse = useCallback(async (history: ChatMessage[], prompt: string, image?: { mimeType: string; data: string }) => {
        try {
            const response = await sendMessage(history, prompt, image);
            const responseText = response.text;
            
            if (responseText.includes("AURA'S INITIAL ANALYSIS:") && responseText.includes("AURA'S QUESTIONS:")) {
                const analysisPart = responseText.split("AURA'S QUESTIONS:")[0].replace("AURA'S INITIAL ANALYSIS:", "").trim();
                const questionsPart = responseText.split("AURA'S QUESTIONS:")[1].trim();
                const questions = questionsPart.split(/\d+\.\s/).filter(q => q.trim() !== "").map(q => q.trim());

                const auraMessage: ChatMessage = {
                    id: Date.now().toString() + "-aura-initial",
                    sender: AgentName.AURA,
                    text: analysisPart,
                    questions: questions,
                };
                setMessages(prev => [...prev, auraMessage]);

            } else if (responseText.includes("AURA'S REFINED ANALYSIS:") && responseText.includes("MUSE'S HYPER-DETAILED PROMPTS:")) {
                const refinedAnalysisPart = responseText.split("MUSE'S HYPER-DETAILED PROMPTS:")[0].replace("AURA'S REFINED ANALYSIS:", "").trim();
                const musePart = responseText.split("MUSE'S HYPER-DETAILED PROMPTS:")[1].trim();
                const prompts = musePart.split(/\d+\.\s/).filter(p => p.trim() !== "").map(p => p.trim());

                const auraMessage: ChatMessage = {
                    id: Date.now().toString() + "-aura-refined",
                    sender: AgentName.AURA,
                    text: `Based on your answers, here is the refined analysis:\n\n${refinedAnalysisPart}`,
                };
                const museMessage: ChatMessage = {
                    id: Date.now().toString() + "-muse",
                    sender: AgentName.MUSE,
                    text: "And here are some hyper-detailed prompts inspired by our discussion:",
                    prompts: prompts,
                };
                setMessages(prev => [...prev, auraMessage, museMessage]);
                setConversationPhase('idle');

            } else {
                // General response from Gemini
                const geminiMessage: ChatMessage = {
                    id: Date.now().toString(),
                    sender: AgentName.GEMINI,
                    text: responseText,
                };
                setMessages(prev => [...prev, geminiMessage]);
                setConversationPhase('idle');
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage: ChatMessage = {
                id: Date.now().toString(),
                sender: AgentName.SYSTEM,
                text: `Sorry, I encountered an error. ${error instanceof Error ? error.message : 'Please check the console for details.'}`,
            };
            setMessages(prev => [...prev, errorMessage]);
            setConversationPhase('idle');
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const handleSendMessage = useCallback(async (text: string, imageFile?: File) => {
        if (isLoading) return;

        setIsLoading(true);
        const userMessageId = Date.now().toString();
        const historyForApi = [...messages];
        
        if (imageFile) {
            setConversationPhase('awaiting_refinement');
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = () => {
                const base64data = (reader.result as string).split(',')[1];
                const userMessage: ChatMessage = {
                    id: userMessageId,
                    sender: AgentName.USER,
                    text: text || "Here's a moodboard. Let's start the creative process.",
                    imageUrl: URL.createObjectURL(imageFile),
                };
                setMessages(prev => [...prev, userMessage]);
                processResponse(historyForApi, MOODBOARD_PROMPT_INITIAL, { mimeType: imageFile.type, data: base64data });
            };
        } else {
            const userMessage: ChatMessage = { id: userMessageId, sender: AgentName.USER, text };
            setMessages(prev => [...prev, userMessage]);
            processResponse(historyForApi, text);
        }
    }, [messages, isLoading, conversationPhase, processResponse]);
    
    const handleGenerateImage = useCallback(async (prompt: string) => {
        setIsLoading(true);
        const soraMessageId = Date.now().toString();

        const soraPlaceholder: ChatMessage = {
            id: soraMessageId,
            sender: AgentName.SORA,
            text: `Generating an image for the prompt: "${prompt}"`,
            isGenerating: true,
        };
        setMessages(prev => [...prev, soraPlaceholder]);
        
        try {
            const imageUrl = await generateImage(prompt);
            const soraResult: ChatMessage = {
                id: soraMessageId, 
                sender: AgentName.SORA,
                text: `Here is the generated image for: "${prompt}"`,
                imageUrl,
                isGenerating: false,
            };
            setMessages(prev => prev.map(msg => msg.id === soraMessageId ? soraResult : msg));

        } catch (error) {
            console.error("Failed to generate image:", error);
            const errorResult: ChatMessage = {
                 id: soraMessageId,
                 sender: AgentName.SORA,
                 text: `Sorry, I couldn't create the image. ${error instanceof Error ? error.message : 'There was an error.'}`,
                 isGenerating: false,
            };
            setMessages(prev => prev.map(msg => msg.id === soraMessageId ? errorResult : msg));
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
            <header className="p-4 border-b border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm">
                <h1 className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                    Gemini Multi-Agent Creative Suite
                </h1>
            </header>
            <main className="flex-1 overflow-y-auto">
                <ChatWindow 
                    messages={messages} 
                    onPromptClick={handleGenerateImage}
                    isLoading={isLoading}
                />
            </main>
            <footer className="p-4 border-t border-slate-700 bg-slate-900">
                <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            </footer>
        </div>
    );
};

export default App;
