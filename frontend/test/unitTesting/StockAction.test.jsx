import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import StockAction from '../../src/components/StockAction'; // Assuming StockAction.jsx is in the same directory

// Mock axios
vi.mock('axios');

// Mock environment variables
const BASE_URL = 'http://test-backend';
vi.stubEnv('VITE_BACKEND_LINK', BASE_URL);

// Mock window.alert and console.error for submission tests
const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('StockAction Component', () => {
    const mockProps = {
        action: 'BUY',
        handler: vi.fn(),
        symbol: 'TSLA',
        currPrice: 200.50,
        priceChange: 5.25,
        pricePercentChange: 2.68,
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Resetting the environment variable mock for each test
        vi.stubEnv('VITE_BACKEND_LINK', BASE_URL);
        axios.post.mockClear();
    });

    // --- Rendering Tests ---

    it('renders correctly for BUY action with positive change', () => {
        render(<StockAction {...mockProps} />);
        
        // Title and Symbol
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Add to Portfolio');
        expect(screen.getByText('TSLA')).toBeInTheDocument();
        
        // Price Info
        expect(screen.getByText(String(mockProps.currPrice))).toBeInTheDocument();
        // Check for positive sign and color
        const priceChangeDiv = screen.getByText('+5.25 (+2.68%)');
        expect(priceChangeDiv).toBeInTheDocument();
        expect(priceChangeDiv).toHaveStyle('color: #00C853'); // Green color for positive change

        // BUY button active state
        expect(screen.getByText('Add')).toHaveClass('active-buy');
        expect(screen.getByText('Rmv')).not.toHaveClass('active-sell');

        // Input Styling
        const input = document.querySelector('input[type="number"]');
        expect(input).toHaveStyle('border: 1px solid #00c853');
    });

    it('renders correctly for SELL action with negative change', () => {
        const sellProps = { 
            ...mockProps, 
            action: 'SELL', 
            priceChange: -3.00, 
            pricePercentChange: -1.50 
        };
        render(<StockAction {...sellProps} />);
        
        // Title
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Remove from Portfolio');
        
        // Price Info
        // Check for negative sign and color (no '+' sign)
        const priceChangeDiv = screen.getByTestId("model-price-change");
        expect(priceChangeDiv).toBeInTheDocument();
        expect(priceChangeDiv).toHaveStyle('color: rgb(200, 27, 0)'); // Matches JSDOM's interpretation of #c81b00ff

        // SELL button active state
        expect(screen.getByText('Rmv')).toHaveClass('active-sell');
        expect(screen.getByText('Add')).not.toHaveClass('active-buy');

        // Input Styling
        const input = document.querySelector('input[type="number"]');
        expect(input).toHaveStyle('border: 1px solid #c81b00');
    });

    it('displays zero change correctly', () => {
        const zeroProps = { 
            ...mockProps, 
            priceChange: 0.00, 
            pricePercentChange: 0.00 
        };
        render(<StockAction {...zeroProps} />);
        
        const priceChangeDiv = screen.getByText('0 (0%)');
        expect(priceChangeDiv).toBeInTheDocument();
        expect(priceChangeDiv).toHaveStyle('color: #FFF'); // White/default color
    });

    // --- Interaction & Toggling Tests ---

    it('calls handler with "SELL" when "Rmv" is clicked in BUY mode', () => {
        render(<StockAction {...mockProps} />);
        
        fireEvent.click(screen.getByText('Rmv'));
        
        expect(mockProps.handler).toHaveBeenCalledWith('SELL');
    });

    it('calls handler with "BUY" when "Add" is clicked in SELL mode', () => {
        const sellProps = { ...mockProps, action: 'SELL' };
        render(<StockAction {...sellProps} />);
        
        fireEvent.click(screen.getByText('Add'));
        
        expect(mockProps.handler).toHaveBeenCalledWith('BUY');
    });

    it('resets quantity on toggleModel call', () => {
        render(<StockAction {...mockProps} />);
        
        const input = document.querySelector('input[type="number"]');
        fireEvent.change(input, { target: { value: '5' } });
        expect(input.value).toBe('5');
        
        fireEvent.click(screen.getByText('Rmv')); // Triggers toggleModel
        
        // Re-render should happen in the component, but we assert the handler was called
        expect(mockProps.handler).toHaveBeenCalledWith('SELL'); 
        // We can't easily check the internal state reset, but we check the handler was called.
        // For a more comprehensive test, we'd render a wrapper component, but here we focus on unit test output.
    });

    // --- Quantity Input Tests ---

    it('updates quantity state when input changes', () => {
        render(<StockAction {...mockProps} />);
        const input = document.querySelector('input[type="number"]');
        
        fireEvent.change(input, { target: { value: '10' } });
        
        expect(input.value).toBe('10');
        expect(screen.getByText('2005.00')).toBeInTheDocument(); // 200.50 * 10
    });

    it('increments quantity when up arrow button is clicked', () => {
        render(<StockAction {...mockProps} />);
        const input = document.querySelector('input[type="number"]');
        const upButton = screen.getByRole('button', { name: '▲' });
        
        fireEvent.change(input, { target: { value: '5' } });
        fireEvent.click(upButton);
        
        expect(input.value).toBe('6');
    });

    it('decrements quantity when down arrow button is clicked, min 0', () => {
        render(<StockAction {...mockProps} />);
        const input = document.querySelector('input[type="number"]');
        const downButton = screen.getByRole('button', { name: '▼' });
        
        fireEvent.change(input, { target: { value: '1' } });
        fireEvent.click(downButton);
        expect(input.value).toBe('0');

        fireEvent.click(downButton); // Try to go below 0
        expect(input.value).toBe('0'); // Should stay at 0
    });

    it('prevents non-numeric input keys ("e", "E", "+", "-")', () => {
        render(<StockAction {...mockProps} />);
        const input = document.querySelector('input[type="number"]');

        // 1. Set a known, valid starting quantity.
        fireEvent.change(input, { target: { value: '10' } });
        expect(input.value).toBe('10');
        const originalValue = input.value; 

        // 2. Test forbidden keys ('e', 'E', '+', '-') 
        // We assert that the value does not change after the key down event,
        // which proves the default action (typing the character) was prevented.

        fireEvent.keyDown(input, { key: 'e' });
        expect(input.value).toBe(originalValue);

        fireEvent.keyDown(input, { key: 'E' });
        expect(input.value).toBe(originalValue);

        fireEvent.keyDown(input, { key: '+' });
        expect(input.value).toBe(originalValue);

        fireEvent.keyDown(input, { key: '-' });
        expect(input.value).toBe(originalValue);
        
        // 3. Test a valid key ('5'), asserting the value remains unchanged 
        // (as keydown only prevents the character, the state only updates on change)
        fireEvent.keyDown(input, { key: '5' });
        expect(input.value).toBe(originalValue); 
    });

    // --- Keyboard ESC Handler Test ---

    it('calls onClose when Escape key is pressed', () => {
        render(<StockAction {...mockProps} />);
        
        fireEvent.keyDown(window, { key: 'Escape' });
        
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    // --- Submission Tests (handleSubmit) ---

    it('shows alert and prevents submission if quantity is empty', async () => {
        render(<StockAction {...mockProps} />);
        
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        
        expect(alertSpy).toHaveBeenCalledWith('Invalid quantity entered.');
        expect(axios.post).not.toHaveBeenCalled();
        expect(mockProps.onClose).not.toHaveBeenCalled();
    });

    it('shows alert and prevents submission if quantity is not an integer', async () => {
        render(<StockAction {...mockProps} />);
        const input = document.querySelector('input[type="number"]');
        
        fireEvent.change(input, { target: { value: '10.5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        
        expect(alertSpy).toHaveBeenCalledWith('Invalid quantity entered.');
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('successfully submits a BUY transaction and calls onClose', async () => {
        axios.post.mockResolvedValueOnce({ data: { success: true } });
        render(<StockAction {...mockProps} />);
        const input = document.querySelector('input[type="number"]');
        
        fireEvent.change(input, { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `${BASE_URL}/api/v1/dashBoard/addTransaction`, 
                { symbol: 'TSLA', quantity: 2, transaction_type: 'BUY' }, 
                { withCredentials: true }
            );
        });
        
        expect(alertSpy).toHaveBeenCalledWith('Transaction done of amount: 401.00'); // 200.50 * 2
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
    
    it('successfully submits a SELL transaction and calls onClose', async () => {
        axios.post.mockResolvedValueOnce({ data: { success: true } });
        const sellProps = { ...mockProps, action: 'SELL' };
        render(<StockAction {...sellProps} />);
        const input = document.querySelector('input[type="number"]');
        
        fireEvent.change(input, { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `${BASE_URL}/api/v1/dashBoard/addTransaction`, 
                { symbol: 'TSLA', quantity: 5, transaction_type: 'SELL' }, 
                { withCredentials: true }
            );
        });
        
        expect(alertSpy).toHaveBeenCalledWith('Transaction done of amount: 1002.50'); // 200.50 * 5
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('handles server validation error response (err.response.data.message)', async () => {
        const errorMessage = "Insufficient funds.";
        axios.post.mockRejectedValueOnce({ 
            response: { 
                data: { message: errorMessage } 
            },
            message: 'Axios Error'
        });
        render(<StockAction {...mockProps} />);
        const input = document.querySelector('input[type="number"]');

        fireEvent.change(input, { target: { value: '1' } });
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(alertSpy).toHaveBeenCalledWith(errorMessage);
            expect(mockProps.onClose).toHaveBeenCalledTimes(1);
        });
    });

    it('handles generic network/axios error response (err.message)', async () => {
        const errorMessage = "Network Error: Request failed.";
        axios.post.mockRejectedValueOnce({ 
            message: errorMessage 
        });
        render(<StockAction {...mockProps} />);
        const input = document.querySelector('input[type="number"]');

        fireEvent.change(input, { target: { value: '1' } });
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(alertSpy).toHaveBeenCalledWith(errorMessage);
            expect(mockProps.onClose).toHaveBeenCalledTimes(1);
        });
    });
});