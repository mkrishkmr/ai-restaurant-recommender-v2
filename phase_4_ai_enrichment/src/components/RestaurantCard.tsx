'use client';

import { useCompletion } from '@ai-sdk/react';
import { Star, MapPin, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

export interface RestaurantData {
    id: string;
    name: string;
    rating: number;
    cuisines: string[];
    location: string;
}

export function RestaurantCard({ restaurant, query }: { restaurant: RestaurantData; query: string }) {
    const { completion, complete, isLoading } = useCompletion({
        api: '/api/summarize',
        body: { restaurant, query }
    });

    useEffect(() => {
        // Only automatically fetch if we have a query and no completion yet
        if (query && !completion && !isLoading) {
            complete(query);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 w-full max-w-sm overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-tight" data-testid="restaurant-name">
                            {restaurant.name}
                        </h3>
                        <div className="flex items-center text-gray-500 mt-1.5 text-sm font-medium">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                            <span>{restaurant.location}</span>
                        </div>
                    </div>

                    <div className="flex items-center bg-black text-white px-2.5 py-1 rounded-md font-bold text-sm shadow-sm">
                        <span>{restaurant.rating.toFixed(1)}</span>
                        <Star className="w-3.5 h-3.5 ml-1 fill-current" />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    {restaurant.cuisines.map((cuisine) => (
                        <span key={cuisine} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            {cuisine}
                        </span>
                    ))}
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100/50 relative">
                    <div className="flex items-center text-indigo-700 font-bold text-xs uppercase tracking-wider mb-2">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        AI Vibe Summary
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed min-h-[48px]" data-testid="ai-summary">
                        {isLoading && !completion ? (
                            <span className="animate-pulse text-indigo-400">Analyzing the vibe...</span>
                        ) : completion ? (
                            completion
                        ) : (
                            'Waiting for query...'
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
