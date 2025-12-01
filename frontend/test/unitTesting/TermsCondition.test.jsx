import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { TermsCondition } from '../../src/components/TermsCondition';
import { render, screen } from '@testing-library/react';
import "@testing-library/jest-dom";

describe('TermsCondition() TermsCondition method', () => {
  
  // Happy Path Tests
  describe('Happy Path Tests', () => {
    test('should render the TermsCondition component with all sections', () => {
      render(<TermsCondition />);
      
      expect(screen.getByText(/1. Agreement to Terms/i)).toBeInTheDocument();
      expect(screen.getByText(/2. User Registration and Account Security/i)).toBeInTheDocument();
      expect(screen.getByText(/3. Acceptable Use/i)).toBeInTheDocument();
      expect(screen.getByText(/4. Investment Disclaimers & AI Insights/i)).toBeInTheDocument();
      expect(screen.getByText(/5. Data Sources & API Limits/i)).toBeInTheDocument();
      expect(screen.getByText(/6. Termination/i)).toBeInTheDocument();
      expect(screen.getByText(/7. Changes to Terms/i)).toBeInTheDocument();
      expect(screen.getByText(/8. Contact Us/i)).toBeInTheDocument();
    });

    test('should render list items under Acceptable Use section', () => {
      render(<TermsCondition />);
      
      expect(screen.getByText(/Systematically retrieve data/i)).toBeInTheDocument();
      expect(screen.getByText(/Use the platform in a manner inconsistent/i)).toBeInTheDocument();
      expect(screen.getByText(/Attempt to bypass any measures/i)).toBeInTheDocument();
    });

    test('should render list items under Investment Disclaimers & AI Insights section', () => {
      render(<TermsCondition />);
      
      expect(screen.getByText(/We do not guarantee the accuracy/i)).toBeInTheDocument();
      expect(screen.getByText(/Investment in the stock market involves significant risk/i)).toBeInTheDocument();
      expect(screen.getByText(/You are solely responsible for your own investment decisions/i)).toBeInTheDocument();
    });
  });

  // Edge Case Tests
  describe('Edge Case Tests', () => {
    test('should handle rendering without crashing even if no props are passed', () => {
      render(<TermsCondition />);
      
      expect(screen.getByText(/Agreement to Terms/i)).toBeInTheDocument();
    });

    test('should handle unexpected HTML structure gracefully', () => {
      render(<TermsCondition />);
      
      // Use a more specific query to avoid multiple matches
      // Look for the contact information text instead of just "Contact Us"
      expect(screen.getByText(/If you have any questions about these Terms, please contact us/i)).toBeInTheDocument();
      
      // Or check that at least one "Contact Us" exists
      expect(screen.getAllByText(/Contact Us/i).length).toBeGreaterThan(0);
    });
  });

  // Test cleanup
  afterEach(() => {
    vi.clearAllMocks();
  });
});