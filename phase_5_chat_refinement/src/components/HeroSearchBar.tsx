'use client';

import { useState } from 'react';
import { useQueryStore } from '../store/QueryStore';

export function HeroSearchBar() {
    const { rawPrompt, setRawPrompt, updateFilters } = useQueryStore();
    const [inputValue, setInputValue] = useState(rawPrompt);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setRawPrompt(inputValue);

        // In Phase 2, this calls the intent parser. For Phase 3 UI simulation,
        // if the user types anything with "hsr", we simulate a backend response syncing back to the UI state.
        if (inputValue.toLowerCase().includes('hsr')) {
            updateFilters({ location: 'HSR Layout' });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto my-8">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask for a vibe, e.g., 'Quiet romantic cafes in Indiranagar'"
                    className="w-full px-6 py-4 text-gray-800 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400"
                    data-testid="hero-search-input"
                />
                <button
                    type="submit"
                    className="absolute right-2 px-6 py-2 h-10 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                    data-testid="hero-search-button"
                >
                    Search
                </button>
            </div>
        </form>
    );
}
