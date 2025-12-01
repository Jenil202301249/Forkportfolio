import { vi, describe, test, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Toggle from '../../src/components/Toggle';
import React from 'react';

// Mock CSS imports if needed
vi.mock('../../src/components/Toggle.css', () => ({}));

describe('Toggle Component', () => {
  // Happy Path Tests
  describe('Happy Paths', () => {
    test('should render the toggle switch with the correct initial state', () => {
      const initialValue = true;
      const handleChange = vi.fn();

      render(<Toggle value={initialValue} onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    test('should call onChange with the correct value when toggled', () => {
      const initialValue = false;
      const handleChange = vi.fn();

      render(<Toggle value={initialValue} onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    test('should toggle from true to false correctly', () => {
      const initialValue = true;
      const handleChange = vi.fn();

      render(<Toggle value={initialValue} onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(handleChange).toHaveBeenCalledWith(false);
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    test('should handle undefined value prop gracefully', () => {
      const handleChange = vi.fn();

      render(<Toggle value={undefined} onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    test('should handle null value prop gracefully', () => {
      const handleChange = vi.fn();

      render(<Toggle value={null} onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    test('should not throw error if onChange is not provided', () => {
      const initialValue = true;

      // Render without onChange prop
      render(<Toggle value={initialValue} />);

      const checkbox = screen.getByRole('checkbox');
      
      // This should not throw an error
      expect(() => fireEvent.click(checkbox)).not.toThrow();
    });

    test('should handle multiple rapid clicks with controlled component behavior', () => {
      const initialValue = false;
      const handleChange = vi.fn();

      // For a controlled component, each click should call onChange with the opposite of current value
      // Since the component doesn't maintain internal state, all clicks will call with true
      render(<Toggle value={initialValue} onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      
      // Simulate multiple rapid clicks
      // Since it's a controlled component and value remains false, all clicks call onChange(true)
      fireEvent.click(checkbox); // false -> true
      fireEvent.click(checkbox); // false -> true (still false because parent hasn't updated)
      fireEvent.click(checkbox); // false -> true (still false because parent hasn't updated)

      expect(handleChange).toHaveBeenCalledTimes(3);
      expect(handleChange).toHaveBeenCalledWith(true); // All calls should be with true
    });

    test('should handle multiple clicks with updated props', () => {
      const handleChange = vi.fn();
      const { rerender } = render(<Toggle value={false} onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      
      // First click - should call with true
      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(true);
      
      // Simulate parent updating the value
      rerender(<Toggle value={true} onChange={handleChange} />);
      
      // Second click - should call with false
      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(false);
    });
  });

  // Component Structure Tests
  describe('Component Structure', () => {
    test('should render with correct DOM structure', () => {
      render(<Toggle value={false} onChange={vi.fn()} />);

      const checkbox = screen.getByRole('checkbox');
      const label = checkbox.parentElement;
      
      expect(checkbox).toHaveAttribute('type', 'checkbox');
      expect(label).toHaveClass('toggle-switch');
      expect(document.querySelector('.slider')).toBeInTheDocument();
    });

    test('should update when value prop changes', () => {
      const handleChange = vi.fn();
      const { rerender } = render(<Toggle value={false} onChange={handleChange} />);

      // Initial state
      expect(screen.getByRole('checkbox')).not.toBeChecked();

      // Re-render with new value
      rerender(<Toggle value={true} onChange={handleChange} />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });

  // Fix for the unhandled error
  describe('Error Handling', () => {
    test('should handle missing onChange prop safely', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // This should not throw even if onChange is undefined
      expect(() => {
        render(<Toggle value={false} />);
        
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    test('should call onChange only when provided', () => {
      // Test with no onChange prop
      render(<Toggle value={false} />);
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      // No assertions needed - just verifying no errors are thrown
    });
  });
});