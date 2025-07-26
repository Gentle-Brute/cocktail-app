
import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { AgentName } from '../types';
import AgentAvatar from './AgentAvatar';
import SpinnerIcon from './icons/SpinnerIcon';

interface ChatWindowProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onPromptClick: (prompt: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onPromptClick }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const Message: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
        const isUser = msg.sender === AgentName.USER;
        const isSystem = msg.sender === AgentName.SYSTEM;

        const baseClasses = "flex items-start gap-3 max-w-4xl mx-auto py-4 px-5 rounded-lg";
        const userClasses = "bg-blue-900/30 flex-row-reverse";
        const agentClasses = "bg-slate-800/60";
        const systemClasses = "bg-red-900/50 text-red-300";

        return (
            <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`${baseClasses} ${isUser ? userClasses : isSystem ? systemClasses : agentClasses}`}>
                    {!isUser && <AgentAvatar agent={msg.sender} />}
                    <div className="flex-1">
                        {!isUser && !isSystem && <p className="font-bold text-purple-300">{msg.sender}</p>}
                        <p className="whitespace-pre-wrap text-slate-200">{msg.text}</p>
                        {msg.questions && (
                             <div className="mt-4 p-4 border-l-2 border-purple-400/50 bg-slate-700/30 rounded-r-lg">
                                <p className="font-semibold text-slate-300 mb-2">Please answer these questions to refine the concept:</p>
                                <ul className="list-decimal list-inside space-y-2 text-slate-300">
                                    {msg.questions.map((q, i) => <li key={i}>{q}</li>)}
                                </ul>
                            </div>
                        )}
                        {msg.imageUrl && (
                             <img src={msg.imageUrl} alt="chat content" className="mt-3 rounded-lg max-w-sm" />
                        )}
                        {msg.isGenerating && (
                             <div className="flex items-center gap-2 mt-3 text-slate-400">
                                <SpinnerIcon />
                                <span>Creating...</span>
                             </div>
                        )}
                        {msg.prompts && (
                            <div className="mt-4 space-y-2">
                                {msg.prompts.map((prompt, index) => (
                                    <button 
                                        key={index}
                                        onClick={() => onPromptClick(prompt)}
                                        className="w-full text-left p-3 bg-slate-700 hover:bg-slate-600/70 rounded-lg transition-colors duration-200 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <p className="text-sm text-slate-300 font-medium">{prompt}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 space-y-6">
            {messages.map((msg) => <Message key={msg.id} msg={msg} />)}
            {isLoading && messages[messages.length-1]?.sender === AgentName.USER && (
                 <div className="flex justify-start">
                    <div className="flex items-start gap-3 max-w-xl mx-auto py-4 px-5 rounded-lg bg-slate-800/60">
                        <AgentAvatar agent={AgentName.GEMINI} />
                        <div className="flex items-center gap-2 pt-1">
                           <SpinnerIcon />
                           <p className="text-slate-400">Thinking...</p>
                        </div>
                    </div>
                </div>
            )}
            <div ref={endOfMessagesRef} />
        </div>
    );
};

export default ChatWindow;