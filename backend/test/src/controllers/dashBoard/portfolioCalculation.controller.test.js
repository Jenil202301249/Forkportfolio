process.env.NODE_ENV = "test";
jest.mock("../../../../src/db/stockSummary.js");
jest.mock("../../../../src/utils/getQuotes.js");
jest.mock("../../../../src/mongoModels/userPortfolioValuation.model.js");
jest.mock("../../../../src/utils/stockPriceStore.js", () => ({
  stockPriceStore: {
    get: jest.fn(),
    add: jest.fn()
  }
}));
jest.mock("../../../../src/utils/stores/priceRates.js", () => ({
  PriceStore: { get: jest.fn() },
}));
jest.mock("../../../../src/db/dbConnection.js", () => ({
  sql: jest.fn()
}));
import { calculatePortfolio } from "../../../../src/controllers/dashBoard/portfolioCalculation.controller.js";
import { getStockSummary } from "../../../../src/db/stockSummary.js";
import { getPrice } from "../../../../src/utils/getQuotes.js";
import { UserPortfolioValuationdaily } from "../../../../src/mongoModels/userPortfolioValuation.model.js";
jest.mock("../../../../src/db/stockSummary.js");
jest.mock("../../../../src/utils/getQuotes.js");

const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("calculatePortfolio", () => {
  let req, res;

  beforeEach(() => {
    req = { user: { email: "test@example.com" } };
    res = mockRes();
    jest.clearAllMocks();
  });

  test("503 → stockSummary null", async () => {
    getStockSummary.mockResolvedValue(null);

    await calculatePortfolio(req, res);

    expect(getStockSummary).toHaveBeenCalledWith("test@example.com");
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database Error in getting stock summary.",
    });
  });

  test("200 → empty stockSummary returns zeros", async () => {
    getStockSummary.mockResolvedValue([]);

    await calculatePortfolio(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      totalValuation: 0,
      overallProfitLoss: 0,
      todayProfitLoss: 0,
      todayProfitLosspercentage: 0,
      overallProfitLosspercentage: 0,
      totalInvestment: 0,
    });
  });

  test("504 → getPrice returns null", async () => {
    getStockSummary.mockResolvedValue([
      {
        symbol: "AAPL",
        current_holding: 2,
        spended_amount: 100,
        avg_price: 50,
      },
    ]);

    getPrice.mockResolvedValue(null);

    await calculatePortfolio(req, res);

    expect(getPrice).toHaveBeenCalledWith("AAPL");
    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Failed to get stock data",
    });
  });

  test("200 → skips entries with undefined current/close", async () => {
    getStockSummary.mockResolvedValue([
      {
        symbol: "AAPL",
        current_holding: 2,
        spended_amount: 100,
        avg_price: 50,
      },
    ]);

    getPrice.mockResolvedValue({ current: undefined, close: undefined });

    UserPortfolioValuationdaily.updateOne.mockResolvedValue({});

    await calculatePortfolio(req, res);

    expect(getPrice).toHaveBeenCalledWith("AAPL");

    expect(UserPortfolioValuationdaily.updateOne).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      totalValuation: "0.00",
      overallProfitLoss: "0.00",
      todayProfitLoss: "0.00",
      todayProfitLosspercentage: "0.00",
      overallProfitLosspercentage: "0.00",
      totalInvestment: "0.00",
    });
  });

  test("200 → multiple stocks with mixed skip conditions", async () => {
    getStockSummary.mockResolvedValue([
      {
        symbol: "AAPL",
        current_holding: 2,
        spended_amount: 100,
        avg_price: 50,
      },
      {
        symbol: "TCS.NS",
        current_holding: 2,
        spended_amount: 100,
        avg_price: 50,
      },
    ]);

    getPrice.mockImplementation((symbol) => {
      if (symbol === "AAPL") return { current: 0, close: undefined };
      if (symbol === "TCS.NS") return { current: undefined, close: 2 };
      return null;
    });

    UserPortfolioValuationdaily.updateOne.mockResolvedValue({});

    await calculatePortfolio(req, res);

    expect(getPrice).toHaveBeenCalledTimes(2);
    expect(getPrice).toHaveBeenNthCalledWith(1, "AAPL");
    expect(getPrice).toHaveBeenNthCalledWith(2, "TCS.NS");

    expect(UserPortfolioValuationdaily.updateOne).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      totalValuation: "0.00",
      overallProfitLoss: "0.00",
      todayProfitLoss: "0.00",
      todayProfitLosspercentage: "0.00",
      overallProfitLosspercentage: "0.00",
      totalInvestment: "0.00",
    });
  });

  test("200 → fully correct numeric calculation", async () => {
    getStockSummary.mockResolvedValue([
      {
        symbol: "AAPL",
        current_holding: 2,
        spended_amount: 100,
        avg_price: 40,
      },
    ]);

    getPrice.mockResolvedValue({ current: 60, close: 55 });

    UserPortfolioValuationdaily.updateOne.mockResolvedValue({});

    await calculatePortfolio(req, res);

    expect(UserPortfolioValuationdaily.updateOne).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      totalValuation: "120.00",
      overallProfitLoss: "20.00",
      todayProfitLoss: "10.00",
      todayProfitLosspercentage: "8.33",
      overallProfitLosspercentage: "20.00",
      totalInvestment: "80.00",
    });
  });

  test("500 → catch block", async () => {
    getStockSummary.mockRejectedValue(new Error("DB down"));

    await calculatePortfolio(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "An error occurred while calculating the portfolio.",
    });
  });
});
