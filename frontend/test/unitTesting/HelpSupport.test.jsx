import React from 'react';
import { describe, test, expect, beforeEach, beforeAll, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import axios from 'axios';
import { HelpSupport } from '../../src/pages/HelpSupport';
import * as HelpModule from '../../src/pages/HelpSupport';

vi.stubGlobal('import.meta.env', {
  VITE_BACKEND_LINK: 'http://mock-api',
});


// --- Global Mocks ---
beforeAll(() => {
  vi.stubGlobal('alert', vi.fn());
  vi.stubGlobal('scrollTo', vi.fn());
});


// Mock Axios
vi.mock('axios');

// --- Component Mocks ---


vi.mock('../../src/components/Navbar.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar-mock">Navbar</div>,
}));

vi.mock('../../src/components/Sidebar.jsx', () => ({
  __esModule: true,
  Sidebar: () => <div data-testid="sidebar-mock">Sidebar</div>,
}));

vi.mock('../../src/components/Footer.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="footer-mock">Footer</div>,
}));

vi.mock('../../src/context/AppContext.jsx', () => ({
  __esModule: true,
  useAppContext: () => ({
    darkMode: false,
    setDarkMode: vi.fn(),
    userDetails: { name: 'Test', email: 'test@test.com', profileImage: 'img.jpg' },
  }),
}));

// --- React Router Mock ---
const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => navigateMock,
  // FIXED: Added useLocation here to prevent Navbar crash
  useLocation: () => ({ pathname: '/help-support' }),
  Link: ({ children }) => <div>{children}</div>,
}));


// --- Test Suite ---
describe('HelpSupport Page Coverage Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // --- Group 1: Rendering & UI Structure ---
  
  test('1. Renders complete page structure (Navbar, Sidebar, Footer, Sections)', () => {
    render(<HelpSupport />);
    
    // Check Layout Components
    expect(screen.getByTestId('navbar-mock')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
    expect(screen.getByTestId('footer-mock')).toBeInTheDocument();
    
    // Check Section Headers
    expect(screen.getByText('Quick Help')).toBeInTheDocument();
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    expect(screen.getByText('Feedback')).toBeInTheDocument();
  });

  // --- Group 2: Modal Logic & Navigation ---

  test('2. Opens modal, renders specific content, and handles internal navigation', () => {
    render(<HelpSupport />);
    
    // Open Modal
    fireEvent.click(screen.getByText('Getting Started Guide'));
    expect(screen.getByText('Getting Started with InsightStox')).toBeInTheDocument();
    
    // Check Internal Navigation Button
    const navBtn = screen.getByText('Explore My dashboard');
    fireEvent.click(navBtn);
    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });

  test('3. Closes modal when clicking the overlay', () => {
    render(<HelpSupport />);
    
    fireEvent.click(screen.getByText('How to Build Portfolio'));
    expect(screen.getByText('How to build & Manage Portfolio')).toBeInTheDocument();
    
    // Click Overlay (found by class)
    const overlay = document.querySelector('.modal-overlay');
    fireEvent.click(overlay);
    
    expect(screen.queryByText('How to build & Manage Portfolio')).not.toBeInTheDocument();
  });

  test('4. Does NOT close modal when clicking inside the content card (stopPropagation)', () => {
    render(<HelpSupport />);
    
    fireEvent.click(screen.getByText('How to Build Portfolio'));
    
    // Click the content card specifically
    const contentCard = document.querySelector('.detailed-content-card');
    fireEvent.click(contentCard);
    
    // Should still be open
    expect(screen.getByText('How to build & Manage Portfolio')).toBeInTheDocument();
  });

  test('5. Closes modal via Escape key (useEffect listener)', () => {
    render(<HelpSupport />);
    
    fireEvent.click(screen.getByText('Understanding AI Suggestions'));
    expect(screen.getByText('Understanding AI-Based Suggestions')).toBeInTheDocument();
    
    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    
    expect(screen.queryByText('Understanding AI-Based Suggestions')).not.toBeInTheDocument();
  });

  // --- Group 3: Contact Form Logic (Full Branch Coverage) ---

  test('6. Contact Form: Validation prevents empty submission', () => {
    render(<HelpSupport />);
    
    const submitBtn = screen.getByText('Submit Ticket');
    fireEvent.click(submitBtn);
    
    // Assert axios was NOT called
    expect(axios.post).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Please enter a message.');
  });

  test('7. Contact Form: Successful submission clears input', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    render(<HelpSupport />);
    
    const input = screen.getByPlaceholderText('Describe your issue or question here...');
    fireEvent.change(input, { target: { value: 'My issue' } });
    fireEvent.click(screen.getByText('Submit Ticket'));
    
    await waitFor(() => {
      // Expecting post call
      expect(axios.post).toHaveBeenCalled();
      // Check success alert
      expect(window.alert).toHaveBeenCalledWith('Support ticket submitted successfully!');
      // Verify clear
      expect(input.value).toBe(''); 
    });
  });

  test('8. Contact Form: API returns 200 but logical failure (success: false)', async () => {
    // This covers the specific "if (!data.success)" branch
    axios.post.mockResolvedValueOnce({ data: { success: false } });
    render(<HelpSupport />);
    
    const input = screen.getByPlaceholderText('Describe your issue or question here...');
    fireEvent.change(input, { target: { value: 'My issue' } });
    fireEvent.click(screen.getByText('Submit Ticket'));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Something went wrong. Try again later.');
    });
  });

  test('9. Contact Form: Handles Network Error (Catch Block)', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Fail'));
    render(<HelpSupport />);
    
    const input = screen.getByPlaceholderText('Describe your issue or question here...');
    fireEvent.change(input, { target: { value: 'My issue' } });
    fireEvent.click(screen.getByText('Submit Ticket'));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Could not submit ticket. Please try again later.');
    });
  });

  // --- Group 4: Feedback Form Logic (Full Branch Coverage) ---

  test('10. Feedback Form: Validation prevents empty submission', () => {
    render(<HelpSupport />);
    fireEvent.click(screen.getByText('Send feedback'));
    expect(axios.post).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Please enter a feedback.');
  });

  test('11. Feedback Form: Successful submission', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    render(<HelpSupport />);
    
    const input = screen.getByPlaceholderText('Suggest a feature or report on issue...');
    fireEvent.change(input, { target: { value: 'Nice app' } });
    fireEvent.click(screen.getByText('Send feedback'));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Thank you for your feedback!');
    });
  });

  test('12. Feedback Form: API returns 200 but logical failure (success: false)', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false } });
    render(<HelpSupport />);
    
    const input = screen.getByPlaceholderText('Suggest a feature or report on issue...');
    fireEvent.change(input, { target: { value: 'Nice app' } });
    fireEvent.click(screen.getByText('Send feedback'));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Something went wrong. Try again later.');
    });
  });

  test('13. Feedback Form: Handles Network Error', async () => {
    axios.post.mockRejectedValueOnce(new Error('Async error'));
    render(<HelpSupport />);
    
    const input = screen.getByPlaceholderText('Suggest a feature or report on issue...');
    fireEvent.change(input, { target: { value: 'Nice app' } });
    fireEvent.click(screen.getByText('Send feedback'));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Could not send feedback. Please try again later.');
    });
  });


test('14. Renders Troubleshooting specific hidden button correctly', () => {
  render(<HelpSupport />);

  fireEvent.click(screen.getByText('Troubleshooting common issues'));

  // The visually hidden button
  const hiddenBtn = screen.getByText('Tell us your issue');
  expect(hiddenBtn).toBeInTheDocument();
  expect(hiddenBtn).toHaveStyle({ display: 'none' });

  // Even if display:none, we can still "click" it in tests
  fireEvent.click(hiddenBtn);
  expect(navigateMock).toHaveBeenCalledWith('/ai-insight');
});

test('15. HelpTopicModal returns null for invalid topic', () => {
  const { container } = render(
    <HelpModule.HelpTopicModal
      topic="invalid-topic"
      onNavigate={vi.fn()}
      onClose={vi.fn()}
    />
  );

  // When topic is not in helpContent, it should hit: if (!content) return null;
  expect(container.innerHTML).toBe('');
});


test('16. AI Suggestions modal button navigates to /ai-insight', () => {
  render(<HelpSupport />);

  fireEvent.click(screen.getByText('Understanding AI Suggestions'));
  const btn = screen.getByText('View My AI Insights');
  fireEvent.click(btn);

  expect(navigateMock).toHaveBeenCalledWith('/ai-insight');
});

test('17. Build Portfolio modal button navigates to /portfolio', () => {
  render(<HelpSupport />);

  fireEvent.click(screen.getByText('How to Build Portfolio'));
  const btn = screen.getByText('Go to Portfolio');
  fireEvent.click(btn);

  expect(navigateMock).toHaveBeenCalledWith('/portfolio');
});

test('18. Non-Escape key does not close modal (covers else branch)', () => {
  render(<HelpSupport />);

  // Open modal first
  fireEvent.click(screen.getByText('Getting Started Guide'));
  expect(screen.getByText('Getting Started with InsightStox')).toBeInTheDocument();

  // Fire a non-escape key
  fireEvent.keyDown(window, { key: 'Enter' });

  // Modal should still be visible
  expect(screen.getByText('Getting Started with InsightStox')).toBeInTheDocument();
});


});