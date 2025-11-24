import { getSummaryTable } from "../../../../src/controllers/Portfolio/portfolioSummary.controller.js";
import { getStockSummary } from "../../../../src/db/stockSummary.js";
import YahooFinance from "yahoo-finance2";
import { PriceStore } from "../../../../src/utils/stores/priceRates.js";
import { stockPriceStore } from "../../../../src/utils/stockPriceStore.js";
jest.mock("../../../../src/db/dbConnection.js", () => ({
  sql: jest.fn()
}));
jest.mock("yahoo-finance2");
jest.mock("../../../../src/db/stockSummary.js");
jest.mock("../../../../src/utils/stores/priceRates.js", () => ({
  PriceStore: { get: jest.fn() }
}));
jest.mock("../../../../src/utils/stockPriceStore.js", () => ({
  stockPriceStore: { add: jest.fn(), get: jest.fn() }
}));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("getSummaryTable Controller", () => {
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockRes();
  });
  test("should return 503 when getStockSummary returns null", async () => {
    const req = { user: { email: "test@mail.com" } };
    getStockSummary.mockResolvedValue(null);

    await getSummaryTable(req, res);

    expect(getStockSummary).toHaveBeenCalledWith("test@mail.com");
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to fetch stock Summary"
    });
  });
  test("should return empty summary array when no holdings", async () => {
    const req = { user: { email: "test@mail.com" } };
    getStockSummary.mockResolvedValue([]);

    await getSummaryTable(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      summary: []
    });
  });
  test("should return summary table with full correct data", async () => {
    const req = { user: { email: "test@mail.com" } };

    getStockSummary.mockResolvedValue([
      { symbol: "AAPL", current_holding: 5 }
    ]);

    PriceStore.get.mockReturnValue(2); 

    YahooFinance.prototype.quoteSummary.mockResolvedValue({
      price: {
        symbol: "AAPL",
        currency: "USD",
        longName: "Apple Inc",
        shortName: "Apple",
        regularMarketPrice: 200,
        regularMarketPreviousClose: 190,
        regularMarketChange: 10,
        regularMarketChangePercent: 5,
        regularMarketTime: 1732084800,
        regularMarketVolume: 100000
      },
      summaryDetail: {
        dayLow: 180,
        dayHigh: 220,
        fiftyTwoWeekLow: 150,
        fiftyTwoWeekHigh: 250,
        averageVolume3Month: 200000
      }
    });
    const expectedMarketTime = new Date(1732084800).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    await getSummaryTable(req, res);
    expect(YahooFinance.prototype.quoteSummary).toHaveBeenCalledWith("AAPL", {
      modules: ["price", "summaryDetail", "defaultKeyStatistics"],
    });
    expect(stockPriceStore.add).toHaveBeenCalledWith("AAPL", {
      symbol: "AAPL",
      current: 100,
      currency: "USD",
      close: 95,
      percentageChange: 5,
      shortname: "Apple",
      longname: "Apple Inc",
      change: 5,
      expiresAt: expect.any(Number)
    });

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      summary: [
        {
          symbol: "AAPL",
          shortname: "Apple",
          longname: "Apple Inc",
          lastPrice: 100,
          changePercent: 5,
          change: 5,
          currency: "USD",
          marketTime: expectedMarketTime,
          volume: "100.00K",
          shares: 5,
          avgVolume: "200.00K",
          dayRange: "90.00 → 110.00",
          yearRange: "75.00 → 125.00",
          marketCap: "-"
        }
      ]
    });
  });
  test("should skip rejected yahooFinance results", async () => {
    const req = { user: { email: "x@mail.com" } };
    getStockSummary.mockResolvedValue([{ symbol: "TSLA", current_holding: 10 }]);

    YahooFinance.prototype.quoteSummary.mockRejectedValue(new Error("fail"));

    await getSummaryTable(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      summary: []
    });
  });
  test("should catch error when summaryDetail missing", async () => {
    const req = { user: { email: "t@mail.com" } };
    getStockSummary.mockResolvedValue([{ symbol: "AMZN", current_holding: 2 }]);

    YahooFinance.prototype.quoteSummary.mockResolvedValue({
      price: { regularMarketPrice: 100 },
      summaryDetail: null
    });

    await getSummaryTable(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      meaasge: undefined
    });
  });
  test("should ignore holdings where current_holding = 0", async () => {
    const req = { user: { email: "t@mail.com" } };
    getStockSummary.mockResolvedValue([
      { symbol: "META", current_holding: 0 }
    ]);

    await getSummaryTable(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      summary: []
    });

    expect(YahooFinance.prototype.quoteSummary).not.toHaveBeenCalled();
  });
  test("should return 500 on thrown error", async () => {
    const req = { user: { email: "err@mail.com" } };

    getStockSummary.mockRejectedValue(new Error("DB failed"));

    await getSummaryTable(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      meaasge: undefined
    });
  });
  test("should cover all formatNumber branches", async () => {
    const req = { user: { email: "branch@mail.com" } };

    getStockSummary.mockResolvedValue([
      { symbol: "BRN", current_holding: 1 }
    ]);

    PriceStore.get.mockReturnValue(1);

    YahooFinance.prototype.quoteSummary.mockResolvedValue({
      price: {
        symbol: "BRN",
        currency: "USD",
        longName: "Branch Test",
        shortName: "BRN Test",
        regularMarketPrice: 10,
        regularMarketPreviousClose: 8,
        regularMarketChange: 2,
        regularMarketChangePercent: 25,
        regularMarketTime: 1732084800,
        regularMarketVolume: null,

        marketCap: 1500 
      },
      summaryDetail: {
        dayLow: 1000000000000,     
        dayHigh: 5000000000,        
        fiftyTwoWeekLow: 5000000,   
        fiftyTwoWeekHigh: null,     
        averageVolume3Month: Number.NaN    
      }
    });
    
    await getSummaryTable(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      summary: [
        expect.objectContaining({
          dayRange: "1000000000000.00 → 5000000000.00",
          yearRange: "5000000.00 → -",
          marketCap: 1500,
          volume: "-",
          avgVolume: "-",
        })
      ]
    });
  });

  test("should cover all formatNumber branches", async () => {
    const req = { user: { email: "branch@mail.com" } };

    getStockSummary.mockResolvedValue([
      { symbol: "BRN", current_holding: 1 }
    ]);

    PriceStore.get.mockReturnValue(1);

    YahooFinance.prototype.quoteSummary.mockResolvedValue({
      price: {
        symbol: "BRN",
        currency: "USD",
        longName: "Branch Test",
        shortName: "BRN Test",
        regularMarketPrice: null,
        regularMarketPreviousClose: null,
        regularMarketChange: null,
        regularMarketChangePercent: null,
        regularMarketTime: 1732084800,
        regularMarketVolume: 1000000000,

        marketCap: 1500 
      },
      summaryDetail: {
        dayLow: 1000000000000,     
        dayHigh: 5000000000,        
        fiftyTwoWeekLow: 5000000,   
        fiftyTwoWeekHigh: 5000,     
        averageVolume3Month: 1000000    
      }
    });

    await getSummaryTable(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      summary: [
        expect.objectContaining({
          dayRange: "1000000000000.00 → 5000000000.00",
          yearRange: "5000000.00 → 5000.00",
          marketCap: 1500,
          volume: "1.00B",
          lastPrice: 0,
          changePercent: 0,
          change: 0,
          currency: "USD",
          avgVolume: "1.00M",
        })
      ]
    });
  });
  test("should use default fallbacks for missing price fields and currency conversion", async () => {
    const req = { user: { email: "fallback@mail.com" } };

    getStockSummary.mockResolvedValue([
      { symbol: "FALLBACK", current_holding: 10 }
    ]);

    PriceStore.get.mockReturnValue(undefined);

    YahooFinance.prototype.quoteSummary.mockResolvedValue({
      price: {
        symbol: "FALLBACK",

        regularMarketPrice: 100,
        regularMarketPreviousClose: 90,
        regularMarketChange: 10,
        regularMarketChangePercent: 0.1,
        regularMarketTime: 1732084800,
        regularMarketVolume: 1000,

      },
      summaryDetail: {

        fiftyTwoWeekLow: 10, 
        fiftyTwoWeekHigh: 20, 
        averageVolume3Month: null 
      }
    });

    await getSummaryTable(req, res);

    expect(stockPriceStore.add).toHaveBeenCalledWith("FALLBACK", {
      symbol: "FALLBACK",
      current: 100, 
      currency: "INR", 
      close: 90,
      percentageChange: 0.1,
      shortname: null, 
      longname: null, 
      change: 10,
      expiresAt: expect.any(Number)
    });

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      summary: [
        expect.objectContaining({
          symbol: "FALLBACK",
          shortname: null, 
          longname: null, 
          currency: "INR", 
          volume: "1.00K", 
          avgVolume: "-", 
          marketCap: "-", 
          dayRange: "- → -", 
          yearRange: "10.00 → 20.00"
        })
      ]
    });
  });

  test("should correctly format large numbers in Trillion, Billion, and Million range", async () => {
    const req = { user: { email: "big_nums@mail.com" } };

    getStockSummary.mockResolvedValue([
      { symbol: "BIG", current_holding: 1 }
    ]);

    PriceStore.get.mockReturnValue(1); 

    YahooFinance.prototype.quoteSummary.mockResolvedValue({
      price: {
        symbol: "BIG",
        currency: "USD",
        regularMarketPrice: 10,
        regularMarketPreviousClose: 8,
        regularMarketChange: 2,
        regularMarketChangePercent: 25,
        regularMarketTime: 1732084800,
        regularMarketVolume: 1000000000000, 
        marketCap: 5000000000 
      },
      summaryDetail: {
        dayLow: 1500000, 
        dayHigh: 500000000000, 
        fiftyTwoWeekLow: 100, 
        fiftyTwoWeekHigh: 1000, 
        averageVolume3Month: 50000 
      }
    });

    await getSummaryTable(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      summary: [
        expect.objectContaining({
          volume: "1.00T", 
          avgVolume: "50.00K", 
          marketCap: 5000000000, 
          dayRange: "1500000.00 → 500000000000.00", 
          yearRange: "100.00 → 1000.00" 
        })
      ]
    });
  });

  test("should handle numeric properties being returned as strings or not existing", async () => {
      const req = { user: { email: "string_nums@mail.com" } };
      getStockSummary.mockResolvedValue([
          { symbol: "STR", current_holding: 1 }
      ]);

      PriceStore.get.mockReturnValue(1);

      YahooFinance.prototype.quoteSummary.mockResolvedValue({
          price: {
              symbol: "STR",
              regularMarketPrice: 10,
              regularMarketPreviousClose: 8,
              regularMarketChange: 2,
              regularMarketChangePercent: 25,
              regularMarketTime: 1732084800,
              regularMarketVolume: 100,
              marketCap: 1000000 
          },
          summaryDetail: {
              dayLow: "1.00", 
              dayHigh: 12,
              fiftyTwoWeekLow: null,
              fiftyTwoWeekHigh: 20,
          }
      });

      await getSummaryTable(req, res);

      expect(res.json).toHaveBeenCalledWith({
          success: true,
          summary: [
              expect.objectContaining({
                  volume: "100.00",
                  avgVolume: "-", 
                  dayRange: "- → 12.00",
                  yearRange: "- → 20.00", 
              })
          ]
      });
  });
});