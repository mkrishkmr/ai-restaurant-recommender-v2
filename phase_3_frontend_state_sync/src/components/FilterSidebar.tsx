'use client';

import { useQueryStore } from '../store/QueryStore';

export function FilterSidebar() {
    const { activeFilters, updateFilters } = useQueryStore();

    const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        updateFilters({ min_rating: val ? parseFloat(val) : null });
    };

    const toggleVeg = () => {
        updateFilters({ pure_veg: activeFilters.pure_veg === true ? null : true });
    };

    return (
        <aside className="w-64 p-6 bg-gray-50 border-r border-gray-200 min-h-screen">
            <h2 className="text-lg font-semibold mb-6 text-gray-900">Filters</h2>

            {/* Location Filter */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div
                    data-testid="location-display"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-600"
                >
                    {activeFilters.location || 'Anywhere'}
                </div>
            </div>

            {/* Minimum Rating */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                <select
                    data-testid="rating-select"
                    value={activeFilters.min_rating || ''}
                    onChange={handleRatingChange}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 outline-none"
                >
                    <option value="">Any</option>
                    <option value="3.5">3.5+</option>
                    <option value="4.0">4.0+</option>
                    <option value="4.5">4.5+</option>
                </select>
            </div>

            {/* Pure Veg Toggle */}
            <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        data-testid="veg-checkbox"
                        checked={activeFilters.pure_veg === true}
                        onChange={toggleVeg}
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pure Veg Only</span>
                </label>
            </div>
        </aside>
    );
}
