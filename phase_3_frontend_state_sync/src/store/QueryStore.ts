import { create } from 'zustand';

export interface Filters {
  cuisines: string[] | null;
  location: string | null;
  min_rating: number | null;
  pure_veg: boolean | null;
}

export interface QueryState {
  rawPrompt: string;
  activeFilters: Filters;
  
  // Actions
  setRawPrompt: (prompt: string) => void;
  updateFilters: (filters: Partial<Filters>) => void;
  clearFilters: () => void;
}

const initialFilters: Filters = {
  cuisines: null,
  location: null,
  min_rating: null,
  pure_veg: null,
};

export const useQueryStore = create<QueryState>((set) => ({
  rawPrompt: '',
  activeFilters: initialFilters,
  
  setRawPrompt: (prompt) => set({ rawPrompt: prompt }),
  
  updateFilters: (newFilters) => 
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        ...newFilters
      }
    })),
    
  clearFilters: () => set({ activeFilters: initialFilters, rawPrompt: '' })
}));
