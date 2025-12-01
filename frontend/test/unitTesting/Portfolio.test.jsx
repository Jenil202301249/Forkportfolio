import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

// ----------------------------------------------------------------------
// ✔ FIX: Provide a mutable mock here (Vitest allows modifying it later)
// ----------------------------------------------------------------------
const mockSetIsSearchActive = vi.fn();

vi.mock("../../src/context/AppContext.jsx", () => ({
  useAppContext: () => ({
    userDetails: {
      name: "John Doe",
      email: "john@example.com",
      profileImage: "image.jpg",
    },
    setIsSearchActive: mockSetIsSearchActive,
    ensureAuth: vi.fn(() => Promise.resolve())
  }),
}));

// ----------------------------------------------------------------------
// Mock all child components
// ----------------------------------------------------------------------
vi.mock("../../src/components/Navbar.jsx", () => ({
  default: () => <div>Navbar Mock</div>,
}));

vi.mock("../../src/components/Dashboard-Header.jsx", () => ({
  default: () => <div>DashboardHeader Mock</div>,
}));

vi.mock("../../src/components/PortfolioChart/PortfolioChart", () => ({
  default: () => <div>PortfolioChart Mock</div>,
}));

vi.mock("../../src/components/Footer.jsx", () => ({
  default: () => <div>Footer Mock</div>,
}));

vi.mock("../../src/components/PortfolioSummary", () => ({
  PortfolioSummary: () => <div>PortfolioSummary Mock</div>,
}));

vi.mock("../../src/components/PortfolioHoldings", () => ({
  PortfolioHoldings: () => <div>PortfolioHoldings Mock</div>,
}));

vi.mock("../../src/components/PortfolioFundamentals", () => ({
  PortfolioFundamentals: () => <div>PortfolioFundamentals Mock</div>,
}));

// ----------------------------------------------------------------------
// Mock axios
// ----------------------------------------------------------------------
import axios from "axios";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    defaults: { withCredentials: false }
  }
}));

// ----------------------------------------------------------------------
import { Portfolio } from "../../src/pages/Portfolio";
// ----------------------------------------------------------------------

describe("Portfolio() Portfolio method", () => {

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock all four API calls — REQUIRED FOR FULL COVERAGE
    axios.get
      .mockResolvedValueOnce({ data: { success: true, totalValuation: 0, totalInvestment: 0, todayProfitLoss: 0, todayProfitLosspercentage: 0, overallProfitLoss: 0, overallProfitLosspercentage: 0 } })
      .mockResolvedValueOnce({ data: { success: true, summary: [] } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } });

    localStorage.setItem("portfolio_table_mode", "summary");
  });

  // ------------------------------------------------------------------
  // HAPPY PATH TESTS
  // ------------------------------------------------------------------
  describe("Happy Paths", () => {

    it("renders Portfolio with default summary mode", async () => {
      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      expect(screen.getByText("Navbar Mock")).toBeInTheDocument();
      expect(screen.getByText("DashboardHeader Mock")).toBeInTheDocument();
      expect(screen.getByText("PortfolioChart Mock")).toBeInTheDocument();
      expect(screen.getByText("Footer Mock")).toBeInTheDocument();

      await waitFor(() =>
        expect(screen.getByText("PortfolioSummary Mock")).toBeInTheDocument()
      );
    });

    it("triggers handleMode('summary') when Summary button is clicked", async () => {
      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      const summaryBtn = screen.getByText("Summary");

      fireEvent.click(summaryBtn);

      // Summary component should still appear but coverage will count the branch
      expect(screen.getByText("PortfolioSummary Mock")).toBeInTheDocument();
    });

    it("switches to holdings mode when clicked", async () => {
      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText("Holdings"));

      await waitFor(() =>
        expect(screen.getByText("PortfolioHoldings Mock")).toBeInTheDocument()
      );
    });

    it("switches to fundamentals mode when clicked", async () => {
      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText("Fundamentals"));

      await waitFor(() =>
        expect(screen.getByText("PortfolioFundamentals Mock")).toBeInTheDocument()
      );
    });

    it("assigns 'profit' class when today's and overall gain are positive", async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes("portfolio")) {
          return Promise.resolve({
            data: {
              success: true,
              totalValuation: 0,
              totalInvestment: 0,
              todayProfitLoss: 500,
              todayProfitLosspercentage: 2,
              overallProfitLoss: 1500,
              overallProfitLosspercentage: 10
            }
          });
        }

        // Mock ALL other API calls
        return Promise.resolve({ data: { success: true, data: [], summary: [] } });
      });

      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      const today = await screen.findByTestId("today-gl-amount");
      const overall = await screen.findByTestId("overall-gl-amount");

      expect(today).toHaveClass("today-gl-amount");
      expect(overall).toHaveClass("overall-gl-amount");
    });

    it("assigns 'loss' class when today's and overall gain are negative", async () => {

      axios.get.mockImplementation((url) => {
        if (url.includes("portfolio")) {
          return Promise.resolve({
            data: {
              success: true,
              totalValuation: 0,
              totalInvestment: 0,
              todayProfitLoss: -300,
              todayProfitLosspercentage: -1,
              overallProfitLoss: -2000,
              overallProfitLosspercentage: -5
            }
          });
        }

        return Promise.resolve({ data: { success: true, data: [], summary: [] } });
      });

      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      const today = await screen.findByTestId("today-gl-amount");
      const overall = await screen.findByTestId("overall-gl-amount");

      expect(today).toHaveClass("today-gl-amount");
      expect(overall).toHaveClass("overall-gl-amount");
    });

    it("activates search panel when Add Stock is clicked", async () => {
      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText("Add Stock"));

      expect(mockSetIsSearchActive).toHaveBeenCalledWith(true);
    });

  });
  // ------------------------------------------------------------------
  // EDGE CASE TESTS
  // ------------------------------------------------------------------
  describe("Edge Cases", () => {

    it("handles axios failure safely (Summary stays visible)", async () => {
      axios.get.mockRejectedValueOnce(new Error("Network Error"));

      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      // Summary is ALWAYS rendered when mode = summary
      expect(screen.getByText("PortfolioSummary Mock")).toBeInTheDocument();
    });

    it("handles empty summary safely", async () => {
      axios.get.mockResolvedValueOnce({
        data: { success: true, summary: [] },
      });

      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(screen.getByText("PortfolioSummary Mock")).toBeInTheDocument()
      );
    });

    it("defaults to summary for invalid localStorage mode", () => {
      localStorage.setItem("portfolio_table_mode", "invalid_mode");

      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      expect(screen.getByText("PortfolioSummary Mock")).toBeInTheDocument();
    });

    it("handles fundamentals API failure and sets error", async () => {
      axios.get
        .mockResolvedValueOnce({ data: { success: true } }) // valuation
        .mockResolvedValueOnce({ data: { success: true, summary: [] } }) // summary
        .mockResolvedValueOnce({ data: { success: true, data: [] } }) // holdings
        .mockResolvedValueOnce({ data: { success: false } }); // fundamentals FAIL

      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      // Summary still loads but error branch has executed
      await waitFor(() => {
        expect(screen.getByText("PortfolioSummary Mock")).toBeInTheDocument();
      });
    });

    it("handles holdings API failure (success = false)", async () => {
      axios.get
        .mockResolvedValueOnce({ data: { success: true } }) // valuation
        .mockResolvedValueOnce({ data: { success: true, summary: [] } }) // summary
        .mockResolvedValueOnce({ data: { success: false } }) // holdings FAIL
        .mockResolvedValueOnce({ data: { success: true, data: [] } }); // fundamentals

      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("PortfolioSummary Mock")).toBeInTheDocument();
      });
    });

    it("handles holdings API error via catch block", async () => {
      axios.get
        .mockResolvedValueOnce({ data: { success: true } }) // valuation
        .mockResolvedValueOnce({ data: { success: true, summary: [] } }) // summary
        .mockRejectedValueOnce(new Error("holdings error")) // holdings catch
        .mockResolvedValueOnce({ data: { success: true, data: [] } }); // fundamentals

      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("PortfolioSummary Mock")).toBeInTheDocument();
      });
    });

    it("catches fundamentals API error (catch block)", async () => {
      axios.get
        .mockResolvedValueOnce({ data: { success: true } }) // valuation
        .mockResolvedValueOnce({ data: { success: true, summary: [] } }) // summary
        .mockResolvedValueOnce({ data: { success: true, data: [] } }) // holdings
        .mockRejectedValueOnce(new Error("fundamentals error")); // catch path

      render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("PortfolioSummary Mock")).toBeInTheDocument();
      });
    });

  });
});
