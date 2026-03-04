'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RestaurantCard, RestaurantData } from '@/components/RestaurantCard';
import { FilterChips, ActiveFilters } from '@/components/FilterChips';
import { Search, Sparkles } from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allResults, setAllResults] = useState<RestaurantData[]>([]);
  const [filteredResults, setFilteredResults] = useState<RestaurantData[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({ location: null, cuisines: null, min_rating: null });
  const [hasSearched, setHasSearched] = useState(false);
  const [rowCount, setRowCount] = useState<string>('51,000+');

  // Fetch real dataset size from backend health check
  useEffect(() => {
    fetch('/api/proxy/health')
      .then(r => r.json())
      .then(d => {
        if (d.rows_indexed) {
          setRowCount(Number(d.rows_indexed).toLocaleString());
        }
      })
      .catch(() => { }); // Silently fall back to default
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      const restaurants = data.restaurants || [];
      setAllResults(restaurants);
      setFilteredResults(restaurants);
      setActiveFilters(data.active_filters || { location: null, cuisines: null, min_rating: null });
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side chip removal: re-filters allResults WITHOUT any new API call
  const handleRemoveFilter = useCallback((key: keyof ActiveFilters) => {
    setActiveFilters(prev => {
      const next = { ...prev, [key]: null };

      // Re-apply remaining active filters to the full result set
      let filtered = [...allResults];
      if (next.location) {
        filtered = filtered.filter(r =>
          r.location.toLowerCase().includes((next.location as string).toLowerCase())
        );
      }
      if (next.cuisines?.length) {
        const target = (next.cuisines as string[])[0].toLowerCase();
        filtered = filtered.filter(r =>
          r.cuisines.some(c => c.toLowerCase().includes(target))
        );
      }
      if (next.min_rating) {
        filtered = filtered.filter(r => r.rating >= (next.min_rating as number));
      }
      setFilteredResults(filtered);

      return next;
    });
  }, [allResults]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a1a] font-sans">
      {/* ── Animated Mesh Gradient Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="mesh-gradient" />
        <div className="mesh-gradient mesh-gradient--2" />
        <div className="mesh-gradient mesh-gradient--3" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-24 pb-16">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="text-violet-400 text-sm font-semibold tracking-widest uppercase">AI-Powered Discovery</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Perfect Vibe</span>
          </h1>
          <p className="text-white/50 mt-4 text-lg">Search {rowCount} Bangalore restaurants in natural language.</p>
        </motion.div>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSearch}
          className="w-full max-w-2xl"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-5 text-white/40 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. quiet cafe in Indiranagar above 4.2 stars"
              className="w-full pl-14 pr-36 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-base focus:outline-none focus:ring-2 focus:ring-violet-500/60 backdrop-blur-sm transition-all"
              id="search-input"
            />
            <button
              type="submit"
              disabled={isLoading}
              id="search-submit"
              className="absolute right-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Filter Chips appear directly under the search bar */}
          <FilterChips filters={activeFilters} onRemove={handleRemoveFilter} />
        </motion.form>

        {/* Results */}
        <div className="w-full max-w-5xl mt-12">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-52 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                ))}
              </motion.div>
            )}

            {!isLoading && hasSearched && filteredResults.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-white/40 mt-8"
              >
                <p className="text-lg">No restaurants matched your filters.</p>
                <p className="text-sm mt-1">Try removing a filter chip above.</p>
              </motion.div>
            )}

            {!isLoading && filteredResults.length > 0 && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ staggerChildren: 0.08 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filteredResults.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <RestaurantCard restaurant={r} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {!hasSearched && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-white/25 mt-8"
              >
                <p className="text-base">Type a vibe above and hit Search.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
