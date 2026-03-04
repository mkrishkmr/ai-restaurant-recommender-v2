'use client';

import { useState } from 'react';
import { useRefinementStore } from '../store/RefinementStore';
import { Send, Bot, User } from 'lucide-react';

export function ChatWidget() {
    const { chatHistory, addMessage, mutateFilters } = useRefinementStore();
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // 1. Add user message
        addMessage({ role: 'user', text: input });

        // 2. Simulate AI parsing intent from follow-up query
        const lowerInput = input.toLowerCase();
        const mutations: Record<string, any> = {};

        if (lowerInput.includes('veg') || lowerInput.includes('vegetarian')) {
            mutations.pure_veg = true;
        }
        if (lowerInput.includes('4.5') || lowerInput.includes('top rated')) {
            mutations.min_rating = 4.5;
        }
        if (lowerInput.includes('italian')) {
            mutations.cuisines = ['Italian'];
        }

        // 3. Mutate Global Filter State
        if (Object.keys(mutations).length > 0) {
            mutateFilters(mutations);

            const appliedFiltersText = Object.keys(mutations).join(', ');
            setTimeout(() => {
                addMessage({
                    role: 'ai',
                    text: `Got it! I've updated the filters for: ${appliedFiltersText}. The results have been refreshed.`
                });
            }, 500);
        } else {
            setTimeout(() => {
                addMessage({
                    role: 'ai',
                    text: `I didn't detect any specific filter changes, but I am looking at your context!`
                });
            }, 500);
        }

        setInput('');
    };

    return (
        <div className="flex flex-col w-full max-w-md h-[500px] border border-gray-200 rounded-xl bg-white shadow-lg overflow-hidden">
            <div className="bg-black text-white p-4 font-semibold text-sm">
                AI Refinement Assistant
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-scroll-area">
                {chatHistory.length === 0 ? (
                    <div className="text-gray-400 text-sm text-center mt-10">
                        Tell me to refine your results! (e.g. "Make it pure veg")
                    </div>
                ) : (
                    chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl flex items-start gap-2 ${msg.role === 'user'
                                    ? 'bg-black text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}>
                                {msg.role === 'ai' && <Bot className="w-4 h-4 mt-0.5 opacity-70" />}
                                <p className="text-sm leading-relaxed" data-testid={`message-${msg.role}`}>{msg.text}</p>
                                {msg.role === 'user' && <User className="w-4 h-4 mt-0.5 opacity-70" />}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Refine search..."
                    className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    data-testid="chat-input"
                />
                <button
                    type="submit"
                    className="bg-black text-white p-2.5 rounded-full hover:bg-gray-800 transition-colors"
                    data-testid="chat-submit"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
