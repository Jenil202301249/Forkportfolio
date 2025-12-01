import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

// -------------------------
// MOCK react-router-dom
// -------------------------
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// -------------------------
// IMPORT COMPONENT
// -------------------------
import { PortfolioHoldings } from "../../src/components/PortfolioHoldings";

describe("PortfolioHoldings Component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const mockData = [
    {
      symbol: "AAPL",
      status: "Active",
      shares: 10,
      lastPrice: 150,
      avgPrice: 120,
      totalCost: 1200,
      marketValue: 1500,
      dayGainValue: 20,
      dayGainPercent: "1.5%",
      totalGainValue: 300,
      totalGainPercent: "25%",
      realizedGain: 50,
    },
  ];

  // -------------------------------------------------------
  // 1. Renders headers correctly
  // -------------------------------------------------------

  it("renders all table headers", () => {
    render(
      <MemoryRouter>
        <PortfolioHoldings portfolioHoldings={mockData} />
      </MemoryRouter>
    );

    const headers = [
      "Stock",
      "Status",
      "Shares",
      "Last Price",
      "AC/Share",
      "Total Cost",
      "Market Value",
      "Day Gain UNRL",
      "Day Gain UNRL (%)",
      "Total Gain UNRL",
      "Total Gain UNRL (%)",
      "Realized Gain",
    ];

    headers.forEach((h) => {
      expect(screen.getByText(h)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------
  // 2. Renders each portfolio row correctly
  // -------------------------------------------------------

  it("renders portfolio rows with correct values", () => {
    render(
      <MemoryRouter>
        <PortfolioHoldings portfolioHoldings={mockData} />
      </MemoryRouter>
    );

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("1200")).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("1.5%")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  // -------------------------------------------------------
  // 3. Clicking symbol triggers navigate()
  // -------------------------------------------------------

  it("navigates to stockdetails page on clicking stock symbol", () => {
    render(
      <MemoryRouter>
        <PortfolioHoldings portfolioHoldings={mockData} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("AAPL"));
    expect(mockNavigate).toHaveBeenCalledWith("/stockdetails/AAPL");
  });

  // -------------------------------------------------------
  // 4. Handles empty portfolio list safely
  // -------------------------------------------------------

  it("renders empty tbody when portfolioHoldings is empty", () => {
    render(
      <MemoryRouter>
        <PortfolioHoldings portfolioHoldings={[]} />
      </MemoryRouter>
    );

    const rows = screen.queryAllByRole("row");
    expect(rows.length).toBe(1); // only header row
  });

  // -------------------------------------------------------
  // 5. Handles undefined portfolioHoldings safely
  // -------------------------------------------------------

  it("does not crash when portfolioHoldings is undefined", () => {
    render(
      <MemoryRouter>
        <PortfolioHoldings />
      </MemoryRouter>
    );

    // No rows except header row
    const rows = screen.queryAllByRole("row");
    expect(rows.length).toBe(1);
  });
});
