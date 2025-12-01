import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

// ------------------------------
// MOCK COMPONENTS
// ------------------------------
vi.mock("../../src/components/Navbar.jsx", () => ({
  default: () => <div>Navbar Component</div>,
}));

vi.mock("../../src/components/Dashboard-Header.jsx", () => ({
  default: () => <div>DashboardHeader Component</div>,
}));

vi.mock("../../src/components/Footer.jsx", () => ({
  default: () => <div>Footer Component</div>,
}));

vi.mock("../../src/components/FieldValue.jsx", () => ({
  FieldValue: ({ fieldname, value }) => (
    <div>{`${fieldname}: ${value}`}</div>
  ),
}));

vi.mock("../../src/components/MarketMovers/MarketMovers.jsx", () => ({
  MarketNewsItem: ({ headline }) => <div>{headline}</div>,
}));

vi.mock("../../src/components/StockAction", () => ({
  default: ({ action, onClose }) => (
    <div>
      StockAction Component - {action}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock("../../src/components/StockChart", () => ({
  default: () => <div>StockChart Component</div>,
}));

// ------------------------------
// MOCK ROUTER
// ------------------------------
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

import { useParams } from "react-router-dom";

// ------------------------------
// MOCK CONTEXT
// ------------------------------
vi.mock("../../src/context/AppContext.jsx", () => ({
  useAppContext: vi.fn(),
}));

import { useAppContext } from "../../src/context/AppContext.jsx";

// ------------------------------
// MOCK AXIOS
// ------------------------------
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { withCredentials: false },
  },
}));

import axios from "axios";

// ------------------------------
// IMPORT COMPONENT
// ------------------------------
import { StockDetails } from "../../src/pages/StockDetails";


describe("StockDetails() Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useParams
    useParams.mockReturnValue({ symbol: "AAPL" });

    // Mock AppContext
    useAppContext.mockReturnValue({
      userDetails: {
        name: "John Doe",
        email: "john@example.com",
        profileImage: "profile.jpg",
      },
    });

    // ------- correct GET mocks -------
    axios.get.mockImplementation((url) => {
      if (url.includes("/stockDetails")) {
        return Promise.resolve({
          data: {
            data: {
              priceInfo: {
                currentPrice: 150,
                change: 2,
                changePercentage: 1.35,
              },
              fundamentals: {},
              financials: {},
              balenceSheet: {},
              profitability: {},
              cashFlow: {},
              fiscalInformation: {},
              Company: {
                longname: "Apple Inc.",
                website: "https://apple.com",
              },
            },
          },
        });
      }

      if (url.includes("/news")) {
        return Promise.resolve({
          data: {
            news: [
              { title: "Apple News 1", providerPublishTime: "2023-10-01", link: "http://x.com" },
            ],
          },
        });
      }

      return Promise.reject(new Error("not found"));
    });

    axios.post.mockResolvedValue({});

    // 🔥 must spy once per test suite, not inside individual tests
    vi.spyOn(console, "error").mockImplementation(() => { });
  });

  // -------------------------
  // HAPPY PATHS
  // -------------------------
  it("renders StockDetails component with correct data", async () => {
    render(
      <MemoryRouter>
        <StockDetails />
      </MemoryRouter>
    );

    expect(screen.getByText("Navbar Component")).toBeInTheDocument();
    expect(screen.getByText("DashboardHeader Component")).toBeInTheDocument();
    expect(screen.getByText("Footer Component")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();

    // stock price
    await waitFor(() => {
      const pct = screen.getByTestId("stk-percentage").textContent;

      expect(pct.replace(/\s+/g, "")).toBe("+2.00(+1.35%)");
    });

    // news
    await waitFor(() => {
      expect(screen.getByText("Apple News 1")).toBeInTheDocument();
    });
  });

  it("opens and closes the StockAction modal", async () => {
    render(
      <MemoryRouter>
        <StockDetails />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Add"));

    expect(
      screen.getByText("StockAction Component - BUY")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close"));

    expect(
      screen.queryByText("StockAction Component - BUY")
    ).not.toBeInTheDocument();
  });

  it("opens SELL modal when Remove button is clicked", async () => {
    render(
      <MemoryRouter>
        <StockDetails />
      </MemoryRouter>
    );

    // Click Remove button
    fireEvent.click(screen.getByText("Remove"));

    await waitFor(() => {
      expect(
        screen.getByText("StockAction Component - SELL")
      ).toBeInTheDocument();
    });
  });

  it("adds stock to watchlist", async () => {
    render(
      <MemoryRouter>
        <StockDetails />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Add to watchlist"));

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/dashBoard/addToWatchlist"),
        { symbol: "AAPL" },
        { withCredentials: true }
      )
    );
  });

  // -------------------------
  // EDGE CASES
  // -------------------------
  it("handles error when fetching stock details", async () => {
    axios.get.mockRejectedValueOnce(
      new Error("Error fetching stock details")
    );

    render(
      <MemoryRouter>
        <StockDetails />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching stock details:",
        expect.any(Error)
      )
    );
  });

  it("handles error when fetching news", async () => {
    axios.get
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            data: {
              priceInfo: { currentPrice: 150, change: 2, changePercentage: 1.35 },
              fundamentals: {},
              financials: {},
              balenceSheet: {},
              profitability: {},
              cashFlow: {},
              fiscalInformation: {},
              Company: { longname: "Apple Inc." },
            },
          },
        })
      )
      .mockImplementationOnce(() =>
        Promise.reject(new Error("Error fetching news"))
      );

    render(
      <MemoryRouter>
        <StockDetails />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching news:",
        expect.any(Error)
      )
    );
  });

  it("logs error when watchlist API call fails", async () => {
    const error = new Error("Watchlist Error");

    axios.post.mockRejectedValueOnce(error);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    render(
      <MemoryRouter>
        <StockDetails />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Add to watchlist"));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in adding the stock to watchlist:",
        error
      );
    });

    consoleSpy.mockRestore();
  });

});
