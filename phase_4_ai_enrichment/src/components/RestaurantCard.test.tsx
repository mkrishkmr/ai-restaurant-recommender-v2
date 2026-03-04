import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RestaurantCard } from './RestaurantCard';
import { useCompletion } from '@ai-sdk/react';

// Mock the Vercel AI SDK hook to control the streaming state
jest.mock('@ai-sdk/react', () => ({
    useCompletion: jest.fn()
}), { virtual: true });

const mockData = {
    id: 'res_123',
    name: 'Third Wave Coffee',
    rating: 4.5,
    cuisines: ['Cafe', 'Desserts'],
    location: 'HSR Layout'
};

// Next.js setup
jest.mock('next/font/google', () => ({
    Inter: () => ({ className: 'inter' })
}));

describe('Phase 4: RestaurantCard AI Streaming UI', () => {
    it('Renders the high-fidelity restaurant metadata correctly', () => {
        (useCompletion as jest.Mock).mockReturnValue({
            completion: '',
            complete: jest.fn(),
            isLoading: false
        });

        render(<RestaurantCard restaurant={mockData} query="" />);
        expect(screen.getByTestId('restaurant-name')).toHaveTextContent('Third Wave Coffee');
        expect(screen.getByText('HSR Layout')).toBeInTheDocument();
        expect(screen.getByText('4.5')).toBeInTheDocument();
        expect(screen.getByText('Cafe')).toBeInTheDocument();
    });

    it('Displays AI text streaming from Vercel AI SDK', () => {
        (useCompletion as jest.Mock).mockReturnValue({
            completion: 'Highly praised for its quiet ambiance making it perfect for studying.',
            complete: jest.fn(),
            isLoading: false
        });

        render(<RestaurantCard restaurant={mockData} query="Quiet cafe" />);
        expect(screen.getByTestId('ai-summary')).toHaveTextContent('Highly praised for its quiet ambiance making it perfect for studying.');
    });

    it('Automatically fetches the Vibe Summary on mount if query is provided', () => {
        const completeMock = jest.fn();
        (useCompletion as jest.Mock).mockReturnValue({
            completion: '',
            complete: completeMock,
            isLoading: false
        });

        render(<RestaurantCard restaurant={mockData} query="Romantic spots" />);
        expect(completeMock).toHaveBeenCalledWith('Romantic spots');
    });
});
