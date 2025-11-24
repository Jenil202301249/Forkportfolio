import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import axios from "axios";

// Mock axios
vi.mock("axios");
axios.get = vi.fn();


// Mock CSS
vi.mock("../../src/components/AiInsights/AiInsights.css", () => ({}));
// Import component
import AiInsights from "../../src/components/AiInsights/AiInsights.jsx";

// Helper JSON string
const baseJson = {
  user: { name: "Vivek" },
  summary: {
    totalStocks: 5,
    totalValue: 200000,
    totalInvested: 150000,
    totalProfitLoss: 50000,
    totalGainPercent: 33.33,
    largestHolding: {
      symbol: "TCS",
      allocation: 40,
      value: 80000
    },
    weightedPE: 18,
    weightedDivYield: 2.5
  },
  performance: {
    gainers: ["TCS", "INFY", "HCL"],
    losers: ["RELIANCE"]
  }
};

describe("AiInsights Component — Full Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  test("renders loading initially", async () => {
    axios.get.mockResolvedValueOnce({
      data: { reply: JSON.stringify(baseJson) }
    });

    render(<AiInsights />);

    expect(screen.getByText(/Loading portfolio insights/i)).toBeInTheDocument();

    await screen.findByText(/AI - Powered Insights/i);
  });

  // ----------------------------------------------------------
  test("renders insights on successful fetch", async () => {
    axios.get.mockResolvedValueOnce({
      data: { reply: JSON.stringify(baseJson) }
    });

    render(<AiInsights />);

    await waitFor(() =>
      expect(screen.getByText(/AI - Powered Insights/i)).toBeInTheDocument()
    );

    expect(screen.getByText(/Largest Holding: TCS/i)).toBeInTheDocument();
  });

  // ----------------------------------------------------------
  test("handles API error gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network failure"));

    render(<AiInsights />);

    await screen.findByText("Error fetching portfolio insights");
  });

  // ----------------------------------------------------------
  test("handles JSON parse failure", async () => {
    axios.get.mockResolvedValueOnce({
      data: { reply: "INVALID_JSON" }
    });

    render(<AiInsights />);

    await screen.findByText("Unable to parse portfolio insights");
  });

  // ----------------------------------------------------------
  test("handles profit branch", async () => {
    const json = structuredClone(baseJson);
    json.summary.totalProfitLoss = 5000;
    json.summary.totalGainPercent = 5;

    axios.get.mockResolvedValueOnce({
      data: { reply: JSON.stringify(json) }
    });

    render(<AiInsights />);

    await screen.findByText(/Overall Profit/i);
  });

  // ----------------------------------------------------------
  test("handles loss branch", async () => {
    const json = structuredClone(baseJson);
    json.summary.totalProfitLoss = -8000;
    json.summary.totalGainPercent = -4;

    axios.get.mockResolvedValueOnce({
      data: { reply: JSON.stringify(json) }
    });

    render(<AiInsights />);

    await screen.findByText(/Overall Loss/i);
  });

  // ----------------------------------------------------------
  test("handles neutral branch (0 profit/loss)", async () => {
    const json = structuredClone(baseJson);
    json.summary.totalProfitLoss = 0;

    axios.get.mockResolvedValueOnce({
      data: { reply: JSON.stringify(json) }
    });

    render(<AiInsights />);

    await screen.findByText(/neutral/i);
  });

  // ----------------------------------------------------------
  test("handles undervalued P/E", async () => {
    const json = structuredClone(baseJson);
    json.summary.weightedPE = 10;

    axios.get.mockResolvedValueOnce({
      data: { reply: JSON.stringify(json) }
    });

    render(<AiInsights />);

    await screen.findByText(/undervalued/i);
  });

  // ----------------------------------------------------------
  test("handles overvalued P/E", async () => {
    const json = structuredClone(baseJson);
    json.summary.weightedPE = 30;

    axios.get.mockResolvedValueOnce({
      data: { reply: JSON.stringify(json) }
    });

    render(<AiInsights />);

    await screen.findByText(/overvalued/i);
  });

  // ----------------------------------------------------------
  test("handles fair valuation", async () => {
    const json = structuredClone(baseJson);
    json.summary.weightedPE = 18;

    axios.get.mockResolvedValueOnce({
      data: { reply: JSON.stringify(json) }
    });

    render(<AiInsights />);

    await screen.findByText(/Fair Valuation/i);
  });

  // ----------------------------------------------------------
  test("handles empty gainers/losers lists", async () => {
    const json = structuredClone(baseJson);
    json.performance.gainers = [];
    json.performance.losers = [];

    axios.get.mockResolvedValueOnce({
      data: { reply: JSON.stringify(json) }
    });

    render(<AiInsights />);

    await screen.findByText(/Weighted Portfolio/i);
  });
});
