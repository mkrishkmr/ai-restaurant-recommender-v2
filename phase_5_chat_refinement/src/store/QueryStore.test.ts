import { useQueryStore } from './QueryStore';

describe('QueryStore Zustand Store', () => {
    // Reset store state before every test
    beforeEach(() => {
        useQueryStore.getState().clearFilters();
    });

    it('should have correct initial state', () => {
        const state = useQueryStore.getState();
        expect(state.rawPrompt).toBe('');
        expect(state.activeFilters).toEqual({
            cuisines: null,
            location: null,
            min_rating: null,
            pure_veg: null,
        });
    });

    it('should update raw prompt', () => {
        const store = useQueryStore.getState();
        store.setRawPrompt('Asian food near HSR');

        expect(useQueryStore.getState().rawPrompt).toBe('Asian food near HSR');
    });

    it('should update partial active filters while keeping others intact', () => {
        const store = useQueryStore.getState();

        // Set first set of filters
        store.updateFilters({ location: 'HSR Layout', min_rating: 4.0 });
        expect(useQueryStore.getState().activeFilters).toEqual({
            cuisines: null,
            location: 'HSR Layout',
            min_rating: 4.0,
            pure_veg: null,
        });

        // Update another filter, previous ones should remain
        useQueryStore.getState().updateFilters({ pure_veg: true, cuisines: ['Asian'] });
        expect(useQueryStore.getState().activeFilters).toEqual({
            cuisines: ['Asian'],
            location: 'HSR Layout',
            min_rating: 4.0,
            pure_veg: true,
        });
    });

    it('should clear filters and prompt completely', () => {
        const store = useQueryStore.getState();
        store.setRawPrompt('some prompt');
        store.updateFilters({ cuisines: ['Italian'] });

        // Clear everything
        useQueryStore.getState().clearFilters();

        const clearedState = useQueryStore.getState();
        expect(clearedState.rawPrompt).toBe('');
        expect(clearedState.activeFilters.cuisines).toBeNull();
    });
});
