jest.mock("../../../../src/db/stockSummary.js");
jest.mock("../../../../src/utils/getQuotes.js");
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
jest.mock("../../../../src/db/stockSummary.js");
jest.mock("../../../../src/utils/getQuotes.js");

import { userStockSummary } from "../../../../src/controllers/dashBoard/userStockSummary.controller.js";
import { getStockSummary } from "../../../../src/db/stockSummary.js";
import { getPrice } from "../../../../src/utils/getQuotes.js";

const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("userStockSummary() -> final strict tests", () => {
  let req, res;

  beforeEach(() => {
    req = { user: { email: "test@example.com" } };
    res = mockRes();
    jest.clearAllMocks();
  });

  it("200 → formats a single stock including marketcap and proper toFixed()", async () => {
    getStockSummary.mockResolvedValue([
      { symbol: "AAPL", current_holding: 2, avg_price: 40 }
    ]);

    getPrice.mockResolvedValue({
      current: 60,
      shortname: "Apple Inc",
      marketcap: "2.5T"
    });

    await userStockSummary(req, res);

    expect(getStockSummary).toHaveBeenCalledTimes(1);
    expect(getStockSummary).toHaveBeenCalledWith("test@example.com");

    expect(getPrice).toHaveBeenCalledTimes(1);
    expect(getPrice).toHaveBeenCalledWith("AAPL");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        {
          symbol: "AAPL",
          shortName: "Apple Inc",
          quantity: 2,
          avg_price: "40.00",
          current_price: "60.00",
          value: "120.00",
          marketcap: "2.5T"
        }
      ]
    });
  });

  it("200 → handles multiple holdings with correct numeric formatting & marketcap passthrough", async () => {
    getStockSummary.mockResolvedValue([
      { symbol: "AAPL", current_holding: 1, avg_price: 100 },
      { symbol: "GOOG", current_holding: 3, avg_price: 50 }
    ]);

    getPrice.mockImplementation((s) => {
      if (s === "AAPL") return { current: 10, shortname: "Apple", marketcap: "100B" };
      if (s === "GOOG") return { current: 20, shortname: "Google", marketcap: "200B" };
      return null;
    });

    await userStockSummary(req, res);

    expect(getPrice).toHaveBeenCalledTimes(2);
    expect(getPrice).toHaveBeenNthCalledWith(1, "AAPL");
    expect(getPrice).toHaveBeenNthCalledWith(2, "GOOG");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        {
          symbol: "AAPL",
          shortName: "Apple",
          quantity: 1,
          avg_price: "100.00",
          current_price: "10.00",
          value: "10.00",
          marketcap: "100B"
        },
        {
          symbol: "GOOG",
          shortName: "Google",
          quantity: 3,
          avg_price: "50.00",
          current_price: "20.00",
          value: "60.00",
          marketcap: "200B"
        }
      ]
    });
  });

  it("503 → returns proper response when summary = null", async () => {
    getStockSummary.mockResolvedValue(null);

    await userStockSummary(req, res);

    expect(getStockSummary).toHaveBeenCalledTimes(1);
    expect(getStockSummary).toHaveBeenCalledWith("test@example.com");

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to retrieve stock summary"
    });
  });

  it("200 → priceData missing returns default current_price, value, shortname, and marketcap outputs correctly", async () => {
    getStockSummary.mockResolvedValue([
      { symbol: "TCS.NS", current_holding: 5, avg_price: 12.345 }
    ]);

    getPrice.mockResolvedValue(null);

    await userStockSummary(req, res);

    expect(getPrice).toHaveBeenCalledTimes(1);
    expect(getPrice).toHaveBeenCalledWith("TCS.NS");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        {
          symbol: "TCS.NS",
          shortName: "--",
          quantity: 5,
          avg_price: "12.35",
          current_price: "0.00",
          value: "0.00",
          marketcap: "--"
        }
      ]
    });
  });

  it("500 → handles thrown errors from DB or internal logic", async () => {
    getStockSummary.mockRejectedValue(new Error("DB down"));

    await userStockSummary(req, res);

    expect(getStockSummary).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error"
    });
  });

  it("200 → coerces string inputs for quantity and avg_price and marketcap still forwarded", async () => {
    getStockSummary.mockResolvedValue([
      { symbol: "INFY.NS", current_holding: "4", avg_price: "7.1" }
    ]);

    getPrice.mockResolvedValue({
      current: 2.5,
      shortname: "Infosys",
      marketcap: "1.2T"
    });

    await userStockSummary(req, res);

    expect(getPrice).toHaveBeenCalledTimes(1);
    expect(getPrice).toHaveBeenCalledWith("INFY.NS");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        {
          symbol: "INFY.NS",
          shortName: "Infosys",
          quantity: 4,
          avg_price: "7.10",
          current_price: "2.50",
          value: "10.00",
          marketcap: "1.2T"
        }
      ]
    });
  });

  it("200 → filters out all entries with current_holding <= 0 and returns an empty array", async () => {
    getStockSummary.mockResolvedValue([
      { symbol: "AAPL", current_holding: 0, avg_price: 10 },
      { symbol: "GOOG", current_holding: -1, avg_price: 20 }
    ]);

    await userStockSummary(req, res);

    expect(getPrice).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: []
    });
  });

  it("200 → uses marketcap='--' when priceData.marketcap is undefined", async () => {
    getStockSummary.mockResolvedValue([
      { symbol: "MSFT", current_holding: 1, avg_price: 200 }
    ]);

    getPrice.mockResolvedValue({
      current: 300,
      shortname: "Microsoft",
      marketcap: undefined
    });

    await userStockSummary(req, res);

    expect(getPrice).toHaveBeenCalledTimes(1);
    expect(getPrice).toHaveBeenCalledWith("MSFT");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        {
          symbol: "MSFT",
          shortName: "Microsoft",
          quantity: 1,
          avg_price: "200.00",
          current_price: "300.00",
          value: "300.00",
          marketcap: "--"
        }
      ]
    });
  });
});
