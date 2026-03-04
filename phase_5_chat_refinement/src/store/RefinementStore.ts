import { create } from 'zustand';

export interface Filters {
    cuisines: string[] | null;
    location: string | null;
    min_rating: number | null;
    pure_veg: boolean | null;
}

export interface RefinementState {
    chatHistory: { role: 'user' | 'ai'; text: string }[];
    activeFilters: Filters;

    // Actions
    addMessage: (msg: { role: 'user' | 'ai'; text: string }) => void;
    mutateFilters: (mutations: Partial<Filters>) => void;
    resetChat: () => void;
}

const initialFilters: Filters = {
    cuisines: null,
    location: null,
    min_rating: null,
    pure_veg: null,
};

export const useRefinementStore = create<RefinementState>((set) => ({
    chatHistory: [],
    activeFilters: initialFilters,

    addMessage: (msg) =>
        set((state) => ({ chatHistory: [...state.chatHistory, msg] })),

    mutateFilters: (newMutations) =>
        set((state) => ({
            activeFilters: {
                ...state.activeFilters,
                ...newMutations
            }
        })),

    resetChat: () => set({ chatHistory: [], activeFilters: initialFilters })
}));
