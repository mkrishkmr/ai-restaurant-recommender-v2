'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ActiveFilters {
    location: string | null;
    cuisines: string[] | null;
    min_rating: number | null;
}

interface FilterChipsProps {
    filters: ActiveFilters;
    onRemove: (key: keyof ActiveFilters) => void;
}

export function FilterChips({ filters, onRemove }: FilterChipsProps) {
    const chips: { key: keyof ActiveFilters; label: string }[] = [];

    if (filters.location) chips.push({ key: 'location', label: `📍 ${filters.location}` });
    if (filters.cuisines?.length) chips.push({ key: 'cuisines', label: `🍽 ${filters.cuisines.join(', ')}` });
    if (filters.min_rating) chips.push({ key: 'min_rating', label: `⭐ ${filters.min_rating}+` });

    if (!chips.length) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-4" role="list" aria-label="Active filters">
            <AnimatePresence>
                {chips.map(({ key, label }) => (
                    <motion.div
                        key={key}
                        initial={{ opacity: 0, scale: 0.85, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -4 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <button
                            onClick={() => onRemove(key)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-sm font-medium hover:bg-red-500/20 hover:border-red-400/50 transition-all duration-200 group backdrop-blur-sm"
                            aria-label={`Remove ${label} filter`}
                        >
                            <span>{label}</span>
                            <X className="w-3.5 h-3.5 text-white/50 group-hover:text-red-300 transition-colors" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
