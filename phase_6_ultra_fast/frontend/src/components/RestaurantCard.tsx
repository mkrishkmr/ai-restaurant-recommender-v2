'use client';

export interface RestaurantData {
    id: string;
    name: string;
    rating: number;
    cuisines: string[];
    location: string;
    vibe_summary?: string;
}

export function RestaurantCard({ restaurant }: { restaurant: RestaurantData }) {
    return (
        <div className="relative group rounded-2xl overflow-hidden backdrop-blur-sm bg-white/10 border border-white/20 shadow-lg hover:shadow-2xl hover:bg-white/15 transition-all duration-300">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 pointer-events-none" />

            <div className="p-6 relative z-10">
                {/* Header: name + rating badge */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-4">
                        <h3 className="text-lg font-bold text-white leading-tight tracking-tight" data-testid="restaurant-name">
                            {restaurant.name}
                        </h3>
                        <p className="text-white/60 text-sm mt-1 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400" />
                            {restaurant.location}
                        </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1 bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded-xl">
                        <span className="text-white font-bold text-sm">{restaurant.rating.toFixed(1)}</span>
                        <span className="text-yellow-400 text-xs">★</span>
                    </div>
                </div>

                {/* Cuisine chips */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                    {restaurant.cuisines.map((cuisine) => (
                        <span
                            key={cuisine}
                            className="px-2.5 py-0.5 bg-white/10 border border-white/20 text-white/80 rounded-full text-xs font-medium"
                        >
                            {cuisine}
                        </span>
                    ))}
                </div>

                {/* AI Vibe Summary */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-violet-300 text-xs">✦</span>
                        <span className="text-violet-300 text-xs font-semibold uppercase tracking-widest">AI Vibe</span>
                    </div>
                    <p className="text-white/75 text-sm leading-relaxed" data-testid="ai-summary">
                        {restaurant.vibe_summary
                            ? restaurant.vibe_summary
                            : <span className="text-white/30 italic">Generating vibe...</span>
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}
