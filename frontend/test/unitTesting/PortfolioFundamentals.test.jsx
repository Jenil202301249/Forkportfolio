import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PortfolioFundamentals } from "../../src/components/PortfolioFundamentals";

// Mock useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),   // <-- THIS becomes a mock function
  };
});

import { useNavigate } from "react-router-dom";

describe("PortfolioFundamentals Component", () => {
  let mockNavigate;

  beforeEach(() => {
    mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);  // <-- CORRECT FIX
  });

  const mockData = [
    {
      symbol: "AAPL",
      lastPrice: "150",
      marketCap: "2.5T",
      epsEstimateNextYear: "7.2",
      forwardPE: "25",
      divPaymentDate: "2024-04-01",
      exDivDate: "2024-03-10",
      dividendPerShare: "0.24",
      forwardAnnualDivRate: "0.96",
      forwardAnnualDivYield: "0.70%",
      trailingAnnualDivRate: "0.88",
      trailingAnnualDivYield: "0.63%",
      priceToBook: "45.1",
      currentHolding: "32 shares",
    },
    {
      symbol: "MSFT",
      lastPrice: "350",
      marketCap: "3T",
      epsEstimateNextYear: "11.5",
      forwardPE: "28",
      divPaymentDate: "2024-05-03",
      exDivDate: "2024-04-20",
      dividendPerShare: "0.68",
      forwardAnnualDivRate: "2.72",
      forwardAnnualDivYield: "0.80%",
      trailingAnnualDivRate: "2.48",
      trailingAnnualDivYield: "0.77%",
      priceToBook: "14.5",
      currentHolding: "10 shares",
    }
  ];

  it("renders all table headers", () => {
    render(
      <MemoryRouter>
        <PortfolioFundamentals portfolioFundamentals={mockData} />
      </MemoryRouter>
    );

    [
      "Stock","Last Price","Market Cap","EPS Est. Next Yr",
      "Forward P/E","Div Payment Date","Ex - Div Date",
      "Div/Share","Fwn Ann Div Rate","Fwn Ann Div Yield",
      "Trl Ann Div Rate","Trl Ann Div Yield","Price Book","Current Holding"
    ].forEach(header => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  it("renders all rows correctly", () => {
    render(
      <MemoryRouter>
        <PortfolioFundamentals portfolioFundamentals={mockData} />
      </MemoryRouter>
    );

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("2.5T")).toBeInTheDocument();

    expect(screen.getByText("MSFT")).toBeInTheDocument();
    expect(screen.getByText("350")).toBeInTheDocument();
    expect(screen.getByText("3T")).toBeInTheDocument();
  });

  it("navigates when clicking a stock symbol", () => {
    render(
      <MemoryRouter>
        <PortfolioFundamentals portfolioFundamentals={mockData} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("AAPL"));
    expect(mockNavigate).toHaveBeenCalledWith("/stockdetails/AAPL");

    fireEvent.click(screen.getByText("MSFT"));
    expect(mockNavigate).toHaveBeenCalledWith("/stockdetails/MSFT");
  });

  it("renders empty state with no rows", () => {
    render(
      <MemoryRouter>
        <PortfolioFundamentals portfolioFundamentals={[]} />
      </MemoryRouter>
    );

    const rows = screen.queryAllByRole("row");
    expect(rows.length).toBe(1); // only header
  });
});
