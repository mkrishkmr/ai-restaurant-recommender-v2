import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatWidget } from './ChatWidget';
import { useRefinementStore } from '../store/RefinementStore';

describe('Phase 5: Chat Refinement & Mutational State API', () => {
    beforeEach(() => {
        // Reset store
        useRefinementStore.getState().resetChat();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('Adds user message to the chat history', () => {
        render(<ChatWidget />);

        const input = screen.getByTestId('chat-input');
        const submitBtn = screen.getByTestId('chat-submit');

        fireEvent.change(input, { target: { value: 'Make it pure veg' } });
        fireEvent.click(submitBtn);

        // Initial state check - user message exists
        expect(useRefinementStore.getState().chatHistory[0]).toEqual({
            role: 'user',
            text: 'Make it pure veg'
        });
    });

    it('Mutates the core Zustand filter state when AI contextualizes intent', () => {
        render(<ChatWidget />);

        // Ensure initial pure_veg is null
        expect(useRefinementStore.getState().activeFilters.pure_veg).toBeNull();

        const input = screen.getByTestId('chat-input');
        const submitBtn = screen.getByTestId('chat-submit');

        fireEvent.change(input, { target: { value: 'i want vegetarian only' } });
        fireEvent.click(submitBtn);

        // Filter should immediately mutate based on our ChatWidget logic simulation
        expect(useRefinementStore.getState().activeFilters.pure_veg).toBe(true);

        // Advance timers for AI response simulation
        act(() => {
            jest.advanceTimersByTime(500);
        });

        const aiResponses = screen.getAllByTestId('message-ai');
        expect(aiResponses[0]).toHaveTextContent("Got it! I've updated the filters for: pure_veg. The results have been refreshed.");
    });

    it('Handles multiple nested mutations', () => {
        render(<ChatWidget />);

        const input = screen.getByTestId('chat-input');
        const submitBtn = screen.getByTestId('chat-submit');

        // User asks for two things at once
        fireEvent.change(input, { target: { value: 'top rated italian' } });
        fireEvent.click(submitBtn);

        const filters = useRefinementStore.getState().activeFilters;
        expect(filters.min_rating).toBe(4.5);
        expect(filters.cuisines).toEqual(['Italian']);
    });
});
