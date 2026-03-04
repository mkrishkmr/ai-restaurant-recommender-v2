import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HeroSearchBar } from './HeroSearchBar';
import { FilterSidebar } from './FilterSidebar';
import { useQueryStore } from '../store/QueryStore';

describe('Phase 3: Bidirectional State Sync', () => {
    beforeEach(() => {
        // Clear the store between tests so they are isolated
        useQueryStore.getState().clearFilters();
    });

    it('Syncs physical sidebar input to the global store', () => {
        render(<FilterSidebar />);

        // Initial state check
        const ratingSelect = screen.getByTestId('rating-select');
        expect(ratingSelect).toHaveValue('');

        // User physically selects rating filter
        fireEvent.change(ratingSelect, { target: { value: '4.5' } });

        // Store should instantly reflect this
        expect(useQueryStore.getState().activeFilters.min_rating).toBe(4.5);

        // User checks pure veg
        const vegCheckbox = screen.getByTestId('veg-checkbox');
        expect(vegCheckbox).not.toBeChecked();
        fireEvent.click(vegCheckbox);

        expect(useQueryStore.getState().activeFilters.pure_veg).toBe(true);
    });

    it('Simulates Gemini Intent Sync: Search input string dynamically populates sidebar', () => {
        render(
            <div>
                <HeroSearchBar />
                <FilterSidebar />
            </div>
        );

        const input = screen.getByTestId('hero-search-input');
        const button = screen.getByTestId('hero-search-button');
        const locationDisplay = screen.getByTestId('location-display');

        // Sidebar location is "Anywhere" initially
        expect(locationDisplay).toHaveTextContent('Anywhere');

        // User types natural language prompt
        fireEvent.change(input, { target: { value: 'Romantic spots in HSR' } });
        fireEvent.click(button);

        // Store's raw search prompt updates
        expect(useQueryStore.getState().rawPrompt).toBe('Romantic spots in HSR');

        // Based on our simulation logic, 'HSR' updates the activeFilters location!
        // The sidebar UI strictly binds to the global store, so the text should update magically.
        expect(locationDisplay).toHaveTextContent('HSR Layout');
        expect(useQueryStore.getState().activeFilters.location).toBe('HSR Layout');
    });
});
