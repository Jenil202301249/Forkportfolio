jest.mock("../../../../src/utils/stockPriceStore.js", () => ({
  stockPriceStore: {
    get: jest.fn(),
    add: jest.fn()
  }
}));
jest.mock("../../../../src/utils/getQuotes.js", () => ({
  getPrice: jest.fn(),
}));

import { getPortfolioHoldings } from "../../../../src/controllers/Portfolio/portfolioHolding.controller.js";
import { getStockSummary } from "../../../../src/db/stockSummary.js";
import { getPrice } from "../../../../src/utils/getQuotes.js";

jest.mock("../../../../src/db/stockSummary.js");
jest.mock("../../../../src/utils/getQuotes.js");

describe("getPortfolioHoldings Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { user: { email: "test@example.com" }, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return 400 when email is missing", async () => {
    req.user.email = null;

    await getPortfolioHoldings(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Email required",
    });
  });

  it("should return 404 when no holdings exist", async () => {
    getStockSummary.mockResolvedValue([]);

    await getPortfolioHoldings(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "No holdings found",
    });
  });

  it("should return fallback values when getPrice fails", async () => {
    getStockSummary.mockResolvedValue([
      { symbol: "AAPL", current_holding: 10, avg_price: 100, realized_gain: 50 },
    ]);

    getPrice.mockRejectedValueOnce(new Error("API error"));

    await getPortfolioHoldings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 1,
      data: [
        {
          symbol: "AAPL",
          status: "Open",
          shares: 10,
          lastPrice: "--",
          avgPrice: 100,
          totalCost: "--",
          marketValue: "--",
          totalDivIncome: "--",
          dayGainPercent: "--",
          dayGainValue: "--",
          totalGainPercent: "--",
          totalGainValue: "--",
          realizedGain: 50,
        },
      ],
    });
  });
  it("should return correct calculated portfolio holdings", async () => {
    getStockSummary.mockResolvedValue([
      {
        symbol: "AAPL",
        current_holding: 10,
        avg_price: 100,
        realized_gain: 25,
      },
    ]);

    getPrice.mockResolvedValueOnce({
      current: 150,    // last price
      close: 140,      // prev close
      marketstate: "REGULAR",
    });

    await getPortfolioHoldings(req, res);

    const expected = [
      {
        symbol: "AAPL",
        status: "REGULAR",
        shares: 10,
        lastPrice: "150.00",
        avgPrice: "100.00",
        totalCost: "1,000.00",
        marketValue: "1,500.00",
        totalDivIncome: "--",
        dayGainPercent: "7.14%",
        dayGainValue: "100.00",
        totalGainPercent: "50.00%",
        totalGainValue: "500.00",
        realizedGain: "25.00",
      },
    ];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 1,
      data: expected,
    });
  });
  it("should return 500 when exception occurs", async () => {
    getStockSummary.mockRejectedValue(new Error("DB Down"));

    await getPortfolioHoldings(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to fetch portfolio holdings",
    });
  });

  it("should format null/undefined as '--'", async () => {
    getStockSummary.mockResolvedValue([
      { symbol: "TSLA", current_holding: 5, avg_price: null, realized_gain: undefined },
      { symbol: "TSLA", current_holding: 0, avg_price: 200, realized_gain: 100 },
      { symbol: "TSLA", current_holding: -2, avg_price: undefined, realized_gain: null }
    ]);

    getPrice.mockResolvedValueOnce({
      current: null,
      close: undefined,
      marketstate: "REGULAR",
    });

    await getPortfolioHoldings(req, res);

    const expected = [
      {
        symbol: "TSLA",
        status: "REGULAR",
        shares: 5,
        lastPrice: "--",
        avgPrice: "--",
        totalCost: "0.00",
        marketValue: "0.00",
        totalDivIncome: "--",
        dayGainPercent: "0.00%",
        dayGainValue: "--",
        totalGainPercent: "0.00%",
        totalGainValue: "0.00",
        realizedGain: "--",
      },
    ];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 1,
      data: expected,
    });
  });

  it("should format null/undefined as '--'", async () => {
    getStockSummary.mockResolvedValue([
      { symbol: "TSLA", current_holding: 5, avg_price: null, realized_gain: undefined }
    ]);

    getPrice.mockResolvedValueOnce({
      current: null,
      close: 0,
      marketstate: null,
    });

    await getPortfolioHoldings(req, res);

    const expected = [
      {
        symbol: "TSLA",
        status: "UNKNOWN",
        shares: 5,
        lastPrice: "--",
        avgPrice: "--",
        totalCost: "0.00",
        marketValue: "0.00",
        totalDivIncome: "--",
        dayGainPercent: "0.00%",
        dayGainValue: "0.00",
        totalGainPercent: "0.00%",
        totalGainValue: "0.00",
        realizedGain: "--",
      },
    ];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 1,
      data: expected,
    });
  });
});
