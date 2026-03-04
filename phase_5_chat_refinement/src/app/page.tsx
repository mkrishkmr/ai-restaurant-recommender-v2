'use client';

import { HeroSearchBar } from '@/components/HeroSearchBar';
import { FilterSidebar } from '@/components/FilterSidebar';
import { RestaurantCard } from '@/components/RestaurantCard';
import { ChatWidget } from '@/components/ChatWidget';
import { useQueryStore } from '@/store/QueryStore';
import { useEffect, useState } from 'react';

export default function Home() {
  const { rawPrompt, activeFilters, updateFilters, setRawPrompt } = useQueryStore();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Trigger search pipeline whenever prompt updates
  useEffect(() => {
    if (!rawPrompt) return;

    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/recommend', {
          method: 'POST',
          body: JSON.stringify({ query: rawPrompt })
        });

        const data = await res.json();

        // 1. Sync backend AI intent parsing with global Zustand state
        if (data.active_filters) {
          updateFilters(data.active_filters);
        }

        // 2. Set actual restaurant cards
        if (data.restaurants) {
          setRestaurants(data.restaurants);
        }
      } catch (e) {
        console.error("Failed to fetch matches", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPrompt]);

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row font-sans">
      <FilterSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-gray-900">
          Bangalore AI Discoveries
        </h1>
        <p className="text-gray-500 mb-8 font-medium">Find your perfect vibe, simply by asking.</p>

        <HeroSearchBar />

        {/** Only render results if the user has inputted a vibe/search **/}
        {rawPrompt ? (
          isLoading ? (
            <div className="mt-16 text-center text-gray-400 animate-pulse">
              <p className="text-lg">Parsing Intent & Querying Database...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-12">
              {restaurants.map(res => (
                <RestaurantCard key={res.id} restaurant={res} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-64 mt-12 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
            <h3 className="text-xl font-semibold text-gray-700">Awaiting your cravings...</h3>
            <p className="text-gray-400 mt-2">Type a vibe like "quiet romantic cafe" to search 51,000+ restaurants.</p>
          </div>
        )}
      </main>

      <aside className="w-full md:w-96 border-l border-gray-200 bg-white shadow-xl flex flex-col justify-center p-6 z-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">Contextual Memory</h2>
          <p className="text-xs text-gray-500 mt-1 mb-4">Refine your search parameters below without losing your place.</p>
        </div>
        <ChatWidget />
      </aside>
    </div>
  );
}
