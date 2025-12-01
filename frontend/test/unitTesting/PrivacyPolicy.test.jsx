import React from 'react'
import { PrivacyPolicy } from '../../src/components/PrivacyPolicy';
import { render, screen } from '@testing-library/react';
import "@testing-library/jest-dom";

// Mocking any nested components or hooks if they existed
// For this example, we assume there are no nested components or hooks to mock

describe('PrivacyPolicy() PrivacyPolicy method', () => {
  
  // Happy Path Tests
  describe('Happy Paths', () => {
    test('renders the PrivacyPolicy component with all sections', () => {
      // Render the component
      render(<PrivacyPolicy />);
      
      // Check if all sections are rendered
      expect(screen.getByText(/1. Introduction/i)).toBeInTheDocument();
      expect(screen.getByText(/2. Information We Collect/i)).toBeInTheDocument();
      expect(screen.getByText(/3. How We Use Your Information/i)).toBeInTheDocument();
      expect(screen.getByText(/4. Regulatory Compliance/i)).toBeInTheDocument();
      expect(screen.getByText(/5. Data Sharing and Disclosure/i)).toBeInTheDocument();
      expect(screen.getByText(/6. Data Security/i)).toBeInTheDocument();
      expect(screen.getByText(/7. Your Rights/i)).toBeInTheDocument();
      expect(screen.getByText(/8. Contact Us/i)).toBeInTheDocument();
    });

    test('renders list items under "Information We Collect" section', () => {
      // Render the component
      render(<PrivacyPolicy />);
      
      // Check if list items are rendered
      expect(screen.getByText(/Stocks added to your Portfolio/i)).toBeInTheDocument();
      expect(screen.getByText(/Stocks added to your Watchlists/i)).toBeInTheDocument();
      expect(screen.getByText(/Transaction history for performance analysis/i)).toBeInTheDocument();
    });

    test('renders list items under "How We Use Your Information" section', () => {
      // Render the component
      render(<PrivacyPolicy />);
      
      // Check if list items are rendered
      expect(screen.getByText(/Real-time Tracking/i)).toBeInTheDocument();
      expect(screen.getByText(/AI Insights/i)).toBeInTheDocument();
      expect(screen.getByText(/Dashboard Visualization/i)).toBeInTheDocument();
      expect(screen.getByText(/Service Availability/i)).toBeInTheDocument();
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    test('renders without crashing when no props are passed', () => {
      // Render the component
      render(<PrivacyPolicy />);
      
      // Check if the component renders without crashing
      expect(screen.getByText(/Welcome to InsightStox/i)).toBeInTheDocument();
    });

    test('handles unexpected text content gracefully', () => {
      // Render the component
      render(<PrivacyPolicy />);
      
      // Check if the component handles unexpected text content
      expect(screen.queryByText(/Unexpected Text/i)).not.toBeInTheDocument();
    });
  });
});