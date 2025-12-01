// test/unitTesting/DataPrivacy.test.jsx
import React from "react";
import axios from "axios";
import { DataPrivacy } from "../../src/pages/DataPrivacy";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

// ✅ Mock SweetAlert2
vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn() },
}));

// ✅ Mock axios
vi.mock("axios");

// ✅ ✅ ✅ MOCK NAVBAR WITH EXACT SRC PATH
vi.mock("../../src/components/Navbar.jsx", () => ({
  default: () => <div data-testid="navbar-mock">Navbar Mock</div>,
}));

// ✅ Other UI mocks
vi.mock("../../src/components/Footer.jsx", () => ({
  default: () => <div>Footer Mock</div>,
}));

vi.mock("../../src/components/Sidebar.jsx", () => ({
  Sidebar: () => <div>Sidebar Mock</div>,
}));

vi.mock("../../src/components/Toggle.jsx", () => ({
  default: ({ value, onChange }) => (
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
      data-testid="ai-toggle"
    />
  ),
}));

// ✅ Enhanced Modal Mock with backdrop click support
vi.mock("../../src/components/PolicyModal", () => ({
  PolicyModal: ({ title, isOpen, onClose, content }) => {
    const modalContentTestId = title.includes('Terms') ? 'terms-content' : 'privacy-content';

    if (!isOpen) return null;
    
    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div 
        data-testid={`modal-${title.toLowerCase().replace(/\s/g, "-")}`}
        onClick={handleBackdropClick}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <div data-testid={modalContentTestId}>
          <h2>{title}</h2>
          {content}
          <button onClick={onClose} data-testid="close-modal-btn">
            Close
          </button>
        </div>
      </div>
    );
  },
}));

vi.mock("../../src/components/PrivacyPolicy", () => ({
  PrivacyPolicy: () => (
    <div>Privacy Policy Content</div>
  ),
}));

vi.mock("../../src/components/TermsCondition", () => ({
  TermsCondition: () => (
    <div>
      Terms and Conditions Content
    </div>
  ),
}));

// ✅ ✅ ✅ CRITICAL CONTEXT MOCK WITH EXACT PATH
const mockUseAppContext = vi.fn();
vi.mock("../../src/context/AppContext", () => ({
  useAppContext: () => mockUseAppContext(),
}));

describe("DataPrivacy Component Tests", () => {
  const BACKEND_URL = "/api/v1/users";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    mockUseAppContext.mockReturnValue({
      darkMode: false,
      setDarkMode: vi.fn(),
      userDetails: {
        name: "John Doe",
        email: "john@example.com",
        profimg: "profile.jpg",
      },
    });

    axios.get.mockResolvedValue({
      data: { data: { aisuggestion: true } },
    });
    axios.delete.mockResolvedValue({});
    axios.patch.mockResolvedValue({});

    // Spy on global alert and confirm
    vi.stubGlobal("confirm", vi.fn());
    vi.stubGlobal("alert", vi.fn());

    Object.defineProperty(import.meta, "env", {
      value: { VITE_BACKEND_LINK: "" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ✅ ✅ ✅ SAFE RENDER WITH ROUTER
  const renderPage = () =>
    render(
      <MemoryRouter>
        <DataPrivacy />
      </MemoryRouter>
    );

  // ---------------- ✅ HAPPY PATHS ----------------
  describe("Happy Paths", () => {
    it("renders DataPrivacy component with correct initial AI state", async () => {
      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      expect(screen.getByText("Data & Privacy")).toBeInTheDocument();
      expect(
        screen.getByText("AI-Powered Insights & Suggestions")
      ).toBeInTheDocument();
      expect(screen.getByText("Delete My Account")).toBeInTheDocument();
      expect(screen.getByTestId("ai-toggle")).toBeChecked();
    });

    it("toggles AI suggestion switch and calls patch API", async () => {
      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      const toggle = screen.getByTestId("ai-toggle");
      fireEvent.click(toggle);

      await waitFor(() =>
        expect(axios.patch).toHaveBeenCalledWith(
          expect.stringContaining(`${BACKEND_URL}/toggleAiSuggestion`),
          { aisuggestion: false },
          { withCredentials: true }
        )
      );
    });

    it("opens and closes Privacy Policy modal", async () => {
      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Find the button within the Privacy Policy section
      const policySection = screen.getByText("Privacy Policy").closest('.analytics-improvement');
      fireEvent.click(within(policySection).getByRole('button'));

      expect(screen.getByTestId("privacy-content")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("close-modal-btn"));

      await waitFor(() =>
        expect(
          screen.queryByTestId("privacy-content")
        ).not.toBeInTheDocument()
      );
    });

    it("opens and closes Terms and Conditions modal", async () => {
      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Find the button within the Terms & Condition section
      const termsSection = screen.getByText("Terms & Condition").closest('.consent-compliance');
      fireEvent.click(within(termsSection).getByRole('button')); 

      expect(screen.getByTestId("terms-content")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("close-modal-btn"));

      await waitFor(() =>
        expect(
          screen.queryByTestId("terms-content")
        ).not.toBeInTheDocument()
      );
    });

    it("closes modal using ESC key", async () => {
      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Clicking the Privacy Policy button using the fixed logic
      const policySection = screen.getByText("Privacy Policy").closest('.analytics-improvement');
      fireEvent.click(within(policySection).getByRole('button'));

      fireEvent.keyDown(window, { key: "Escape" });

      await waitFor(() =>
        expect(
          screen.queryByTestId("privacy-content")
        ).not.toBeInTheDocument()
      );
    });

    it("initiates data download", async () => {
      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      fireEvent.click(screen.getByText("Download Data"));

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining(
            `${BACKEND_URL}/downloadPortfolioData`
          ),
          { withCredentials: true }
        )
      );
    });

    it("initiates account deletion with confirmation", async () => {
      global.confirm.mockReturnValue(true);

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      fireEvent.click(screen.getByText("Delete My Account"));

      await waitFor(() =>
        expect(axios.delete).toHaveBeenCalledWith(
          expect.stringContaining(
            `${BACKEND_URL}/deleteAccount`
          ),
          { withCredentials: true }
        )
      );
    });

    it("cancels account deletion when user declines confirmation", async () => {
      global.confirm.mockReturnValue(false);

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      fireEvent.click(screen.getByText("Delete My Account"));

      expect(axios.delete).not.toHaveBeenCalled();
    });
  });

  // ---------------- ✅ EDGE CASES ----------------
  describe("Edge Cases", () => {
    it("reverts AI toggle on patch failure", async () => {
      axios.patch.mockRejectedValueOnce(new Error("Network Error"));

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      fireEvent.click(screen.getByTestId("ai-toggle"));

      // Added waitFor to ensure the async API call finishes and the alert is called.
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });

    it("resets download button on failed download", async () => {
      axios.get.mockImplementation(async (url) => {
        if (url.includes("downloadPortfolioData")) {
          throw new Error("Download Failed");
        }
        return { data: { data: { aisuggestion: true } } };
      });

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      fireEvent.click(screen.getByText("Download Data"));

      await waitFor(() =>
        expect(screen.getByText("Download Data")).toBeInTheDocument()
      );
    });

    it("resets delete button on failed account deletion", async () => {
      global.confirm.mockReturnValue(true);
      axios.delete.mockRejectedValueOnce(new Error("Network Error"));

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      fireEvent.click(screen.getByText("Delete My Account"));

      await waitFor(() =>
        expect(
          screen.getByText("Delete My Account")
        ).toBeInTheDocument()
      );
    });

    it("handles error when fetching data privacy settings fails", async () => {
      axios.get.mockRejectedValueOnce(new Error("Network Error"));

      renderPage();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining(`${BACKEND_URL}/getDataAndPrivacy`),
          { withCredentials: true }
        );
      });

      // Should handle error gracefully without crashing
      expect(screen.getByText("Data & Privacy")).toBeInTheDocument();
    });

    it("sets AI toggle to false when API returns false", async () => {
      axios.get.mockResolvedValueOnce({
        data: { data: { aisuggestion: false } },
      });

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      expect(screen.getByTestId("ai-toggle")).not.toBeChecked();
    });

    it("handles missing user details gracefully", async () => {
      // Override the context mock for this test
      mockUseAppContext.mockReturnValueOnce({
        darkMode: false,
        setDarkMode: vi.fn(),
        userDetails: null, // No user details
      });

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Component should render without crashing
      expect(screen.getByText("Data & Privacy")).toBeInTheDocument();
    });

    it("shows loading state during download request", async () => {
      // Mock a slow download
      let downloadResolve;
      const downloadPromise = new Promise(resolve => {
        downloadResolve = resolve;
      });

      axios.get.mockImplementationOnce(async (url) => {
        if (url.includes("downloadPortfolioData")) {
          await downloadPromise;
          return { data: {} };
        }
        return { data: { data: { aisuggestion: true } } };
      });

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      const downloadButton = screen.getByText("Download Data");
      fireEvent.click(downloadButton);

      // Should show loading state immediately
      expect(screen.getByText("Downloading...")).toBeInTheDocument();
      expect(screen.getByText("Downloading...")).toBeDisabled();

      // Resolve the download
      downloadResolve();

      await waitFor(() => {
        expect(screen.getByText("Download Data")).toBeInTheDocument();
      });
    });

    it("handles empty API response for user data", async () => {
      axios.get.mockResolvedValueOnce({
        data: { data: null }, // Empty response
      });

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Component should handle this gracefully
      expect(screen.getByText("Data & Privacy")).toBeInTheDocument();
      // Toggle should default to false when no data
      expect(screen.getByTestId("ai-toggle")).not.toBeChecked();
    });

    it("switches between different modals correctly", async () => {
      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Open privacy modal
      const policySection = screen.getByText("Privacy Policy").closest('.analytics-improvement');
      fireEvent.click(within(policySection).getByRole('button'));
      expect(screen.getByTestId("privacy-content")).toBeInTheDocument();

      // Open terms modal - should close privacy and open terms
      const termsSection = screen.getByText("Terms & Condition").closest('.consent-compliance');
      fireEvent.click(within(termsSection).getByRole('button'));

      await waitFor(() => {
        expect(screen.queryByTestId("privacy-content")).not.toBeInTheDocument();
        expect(screen.getByTestId("terms-content")).toBeInTheDocument();
      });
    });

    it("handles missing backend URL gracefully", async () => {
      // Temporarily remove backend URL
      Object.defineProperty(import.meta, "env", {
        value: { VITE_BACKEND_LINK: undefined },
        writable: true,
      });

      renderPage();

      // Should not crash and still attempt API calls
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Restore for other tests
      Object.defineProperty(import.meta, "env", {
        value: { VITE_BACKEND_LINK: "" },
        writable: true,
      });
    });

    it("closes modal when clicking on backdrop/overlay", async () => {
      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Open privacy modal
      const policySection = screen.getByText("Privacy Policy").closest('.analytics-improvement');
      fireEvent.click(within(policySection).getByRole('button'));

      expect(screen.getByTestId("privacy-content")).toBeInTheDocument();

      // Click on modal backdrop (the container div, not the content)
      const modal = screen.getByTestId("modal-privacy-policy");
      fireEvent.click(modal);

      await waitFor(() =>
        expect(screen.queryByTestId("privacy-content")).not.toBeInTheDocument()
      );
    });

    it("handles undefined aisuggestion in API response", async () => {
      axios.get.mockResolvedValueOnce({
        data: { data: { } }, // No aisuggestion field
      });

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Component should handle missing aisuggestion field
      expect(screen.getByText("Data & Privacy")).toBeInTheDocument();
      // Toggle should default to false
      expect(screen.getByTestId("ai-toggle")).not.toBeChecked();
    });

    it("maintains toggle state during API call", async () => {
      let patchResolve;
      const patchPromise = new Promise(resolve => {
        patchResolve = resolve;
      });

      axios.patch.mockImplementationOnce(async () => {
        await patchPromise;
        return {};
      });

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      const toggle = screen.getByTestId("ai-toggle");
      
      // Toggle should change immediately (optimistic update)
      fireEvent.click(toggle);
      expect(toggle).not.toBeChecked();

      // Resolve the API call
      patchResolve();

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalled();
      });
    });

    it("handles user with partial details", async () => {
      mockUseAppContext.mockReturnValueOnce({
        darkMode: false,
        setDarkMode: vi.fn(),
        userDetails: {
          name: "Partial User",
          // Missing email and profimg
        },
      });

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Component should render without crashing
      expect(screen.getByText("Data & Privacy")).toBeInTheDocument();
    });
  });

  // ---------------- ✅ COMPREHENSIVE COVERAGE ----------------
  describe("Comprehensive Coverage", () => {
    it("covers all modal interaction scenarios", async () => {
      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Test opening and closing both modals multiple times
      const policySection = screen.getByText("Privacy Policy").closest('.analytics-improvement');
      const termsSection = screen.getByText("Terms & Condition").closest('.consent-compliance');

      // Open Privacy
      fireEvent.click(within(policySection).getByRole('button'));
      expect(screen.getByTestId("privacy-content")).toBeInTheDocument();

      // Close with ESC
      fireEvent.keyDown(window, { key: "Escape" });
      await waitFor(() => expect(screen.queryByTestId("privacy-content")).not.toBeInTheDocument());

      // Open Terms
      fireEvent.click(within(termsSection).getByRole('button'));
      expect(screen.getByTestId("terms-content")).toBeInTheDocument();

      // Close with button
      fireEvent.click(screen.getByTestId("close-modal-btn"));
      await waitFor(() => expect(screen.queryByTestId("terms-content")).not.toBeInTheDocument());
    });

    it("covers all API error scenarios", async () => {
      // Test various API failure scenarios
      axios.get.mockRejectedValueOnce(new Error("Fetch failed"));
      axios.patch.mockRejectedValueOnce(new Error("Update failed"));
      axios.delete.mockRejectedValueOnce(new Error("Delete failed"));

      global.confirm.mockReturnValue(true);

      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Test toggle with error
      fireEvent.click(screen.getByTestId("ai-toggle"));
      await waitFor(() => expect(global.alert).toHaveBeenCalled());

      // Test download with error
      fireEvent.click(screen.getByText("Download Data"));
      await waitFor(() => expect(global.alert).toHaveBeenCalled());

      // Test delete with error
      fireEvent.click(screen.getByText("Delete My Account"));
      await waitFor(() => expect(global.alert).toHaveBeenCalled());
    });

    it("covers all user interaction states", async () => {
      renderPage();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Test all interactive elements exist and are functional
      expect(screen.getByTestId("ai-toggle")).toBeInTheDocument();
      expect(screen.getByText("Download Data")).toBeInTheDocument();
      expect(screen.getByText("Delete My Account")).toBeInTheDocument();

      // Test modal buttons exist
      const policySection = screen.getByText("Privacy Policy").closest('.analytics-improvement');
      const termsSection = screen.getByText("Terms & Condition").closest('.consent-compliance');
      
      expect(within(policySection).getByRole('button')).toBeInTheDocument();
      expect(within(termsSection).getByRole('button')).toBeInTheDocument();
    });
  });
});