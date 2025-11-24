import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, vi, beforeEach } from "vitest";
import axios from "axios";
import WelcomeInvestor from "../../src/components/WelcomeInvestor/WelcomeInvestor.jsx";

// ---------------- Mock Image Assets ----------------
vi.mock("../../src/assets/evaluation-icon.png", () => ({ default: "evaluation.png" }));
vi.mock("../../src/assets/totalvalue-icon.png", () => ({ default: "totalvalue.png" }));
vi.mock("../../src/assets/gain-icon.png", () => ({ default: "gain.png" }));
vi.mock("../../src/assets/overallgraph-icon.png", () => ({ default: "overallgraph.png" }));

// ---------------- Mock axios ----------------
vi.mock("axios");

// ---------------- Mock Navigation ----------------
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
}));

// ---------------- Mock CSS ----------------
vi.mock("../../src/components/WelcomeInvestor/WelcomeInvestor.css", () => ({}));

// ---------------- Reset before each test ----------------
beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
});


describe("WelcomeInvestor — 100% Branch Coverage", () => {

  // -----------------------------------------------------------
  // 1. SUCCESS: Valuation + Profile
  // -----------------------------------------------------------
  test("renders dashboard on successful valuation + user fetch", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("Valuation")) {
        return Promise.resolve({
          data: {
            totalValuation: 100000,
            todayProfitLoss: 500,
            todayProfitLosspercentage: 1.2,
            overallProfitLoss: 7000,
            overallProfitLosspercentage: 8.5,
          }
        });
      }
      if (url.includes("myProfile")) {
        return Promise.resolve({ data: { data: { name: "John Doe" } } });
      }
      if (url.includes("marketActiveStocks")) {
        return Promise.resolve({ data: { data: [] } });
      }
    });

    render(<WelcomeInvestor />);
    await screen.findByText("Total Portfolio Value");
  });

  // -----------------------------------------------------------
  // 2. BACKEND: No stock summary found
  // -----------------------------------------------------------
  test("renders zero values when valuation returns 'No summary found'", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("Valuation")) {
        return Promise.reject({
          response: { data: { message: "No stock summary found for the user." } },
        });
      }
      if (url.includes("myProfile")) {
        return Promise.resolve({ data: { data: { name: "Investor" } } });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(<WelcomeInvestor />);
    await screen.findByText("Total Portfolio Value");
  });

  // -----------------------------------------------------------
  // 3. 401 SESSION EXPIRED
  // -----------------------------------------------------------
  test("shows session expired on 401", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("Valuation")) {
        return Promise.reject({ response: { status: 401 } });
      }
      return Promise.resolve({ data: { data: { name: "X" } } });
    });

    render(<WelcomeInvestor />);
    await screen.findByText(/Session expired/i);
  });



  // -----------------------------------------------------------
  // 5. NETWORK ERROR (no response field)
  // -----------------------------------------------------------
  test("handles network failure", async () => {
    axios.get.mockImplementation(() => Promise.reject({ message: "Network Error" }));

    render(<WelcomeInvestor />);
    await screen.findByText(/Network Error/i);
  });



  // -----------------------------------------------------------
  // 7. TRENDING STOCKS SUCCESS
  // -----------------------------------------------------------
  test("renders trending stock items", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("marketActiveStocks")) {
        return Promise.resolve({
          data: {
            data: [
              {
                shortName: "Reliance",
                symbol: "RELI",
                exchange: "NSE",
                price: 2500,
                change: 10,
                changePercent: 0.40
              }
            ]
          }
        });
      }
      return Promise.resolve({ data: { data: { name: "User" } } });
    });

    render(<WelcomeInvestor />);

    await screen.findByText("Reliance");
    expect(screen.getByText(/₹2500/)).toBeInTheDocument();
  });

  // -----------------------------------------------------------
  // 8. TRENDING CLICK → NAVIGATE
  // -----------------------------------------------------------
  test("navigates to stock details on click", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { data: [{ shortName: "TCS", symbol: "TCS", exchange: "NSE", price: 3000 }] }
      })
      .mockResolvedValue({ data: { data: { name: "User" } } });

    render(<WelcomeInvestor />);

    const stockItem = await screen.findByText("TCS");
    fireEvent.click(stockItem);

    expect(mockNavigate).toHaveBeenCalledWith("/stockdetails/TCS");
  });

  // -----------------------------------------------------------
  // 9. TRENDING FAIL
  // -----------------------------------------------------------
  test("shows trending error on backend failure", async () => {
    axios.get.mockRejectedValueOnce(new Error("Failed"));
    axios.get.mockResolvedValue({ data: { data: { name: "User" } } });

    render(<WelcomeInvestor />);
    await screen.findByText(/Failed to load trending stocks/i);
  });

  // -----------------------------------------------------------
  // 11. NO-NAVIGATION CLICK
  // -----------------------------------------------------------
  test("does not navigate when clicking random UI element", async () => {
    axios.get.mockResolvedValue({ data: { data: [] } });

    render(<WelcomeInvestor />);
    const title = await screen.findByText(/Trending Stocks/i);

    fireEvent.click(title);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------
  // 12. RISK → HIGH
  // -----------------------------------------------------------
  test("shows HIGH risk category", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("Valuation")) {
        return Promise.resolve({
          data: {
            totalValuation: 100000,
            todayProfitLoss: 5000,
            todayProfitLosspercentage: 12,
            overallProfitLoss: 20000,
            overallProfitLosspercentage: -20,
          }
        });
      }
      return Promise.resolve({ data: { data: { name: "User" } } });
    });

    render(<WelcomeInvestor />);
    await screen.findByText("High");
  });

  // -----------------------------------------------------------
  // 13. RISK → MODERATE
  // -----------------------------------------------------------
  test("shows MODERATE risk category", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("Valuation")) {
        return Promise.resolve({
          data: {
            totalValuation: 100000,
            todayProfitLoss: 100,
            todayProfitLosspercentage: 0.5,
            overallProfitLoss: 1000,
            overallProfitLosspercentage: 2.0,
          }
        });
      }
      return Promise.resolve({ data: { data: { name: "User" } } });
    });

    render(<WelcomeInvestor />);
    await screen.findByText("Moderate");
  });

  // -----------------------------------------------------------
  // 14. RISK → LOW
  // -----------------------------------------------------------
  test("shows LOW risk category", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("Valuation")) {
        return Promise.resolve({
          data: {
            totalValuation: 100000,
            todayProfitLoss: 10,
            todayProfitLosspercentage: 0.01,
            overallProfitLoss: 50,
            overallProfitLosspercentage: 10,
          }
        });
      }
      return Promise.resolve({ data: { data: { name: "User" } } });
    });

    render(<WelcomeInvestor />);
    await screen.findByText("Low");
  });

  

});
