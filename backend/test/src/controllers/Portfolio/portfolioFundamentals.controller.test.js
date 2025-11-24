import YahooFinance from "yahoo-finance2";
import { getStockSummary } from "../../../../src/db/stockSummary.js";
import { getPortfolioFundamentals } from '../../../../src/controllers/Portfolio/portfolioFundamentals.controller.js';
import { PriceStore } from "../../../../src/utils/stores/priceRates.js";

function mockFormatNumber(num) {
  if (!num && num !== 0) return "--";
  const abs = Math.abs(Number(num));
  if (abs >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (num / 1e6).toFixed(2) + "M";
  return num.toFixed(2);
}
jest.mock("../../../../src/db/dbConnection.js", () => ({
  sql: jest.fn()
}));
jest.mock("../../../../src/utils/stores/priceRates.js", () => ({
  PriceStore: { get: jest.fn() }
}));

jest.mock("yahoo-finance2");
jest.mock("../../../../src/db/stockSummary.js");

describe('getPortfolioFundamentals() getPortfolioFundamentals method', () => {
  let req, res;

  beforeEach(() => {

    jest.clearAllMocks();
    req = {
      user: { email: 'test@example.com' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    PriceStore.get.mockReturnValue(1); 
  });

  describe('Happy Paths', () => {
    it('should return portfolio fundamentals successfully', async () => {

      getStockSummary.mockResolvedValue([
        { symbol: 'AAPL', current_holding: 10 },
        { symbol: 'GOOGL', current_holding: 5 }
      ]);

      YahooFinance.prototype.quoteSummary.mockResolvedValueOnce({
        price: { symbol: 'AAPL', regularMarketPrice: 150, marketCap: 2e12 },
        summaryDetail: { averageVolume3Month: 1000000, exDividendDate: '2023-11-15' },
        defaultKeyStatistics: { forwardEps: 5, forwardPE: 30 },
        calendarEvents: { dividendDate: '2023-12-01' }
      }).mockResolvedValueOnce({
        price: { symbol: 'GOOGL', regularMarketPrice: 2800, marketCap: 1.5e12 },
        summaryDetail: { averageVolume3Month: 1500000, exDividendDate: '2023-10-15' },
        defaultKeyStatistics: { forwardEps: 10, forwardPE: 25 },
        calendarEvents: { dividendDate: '2023-11-01' }
      });

      await getPortfolioFundamentals(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: expect.arrayContaining([
          expect.objectContaining({ symbol: 'AAPL', currentHolding: 10 }),
          expect.objectContaining({ symbol: 'GOOGL', currentHolding: 5 }),
        ])
      });
    });

    it('should return portfolio fundamentals successfully and handle all undefined modules', async () => {
      PriceStore.get.mockReturnValue(null); 
      getStockSummary.mockResolvedValue([
        { symbol: 'AAPL', current_holding: 10 }
      ]);

      YahooFinance.prototype.quoteSummary.mockResolvedValueOnce({
        price: undefined,
        summaryDetail: undefined,
        defaultKeyStatistics: undefined,
        calendarEvents: undefined
      });

      await getPortfolioFundamentals(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: [
          expect.objectContaining({
            symbol: 'AAPL', 
            lastPrice: "--", 
            marketCap: "--", 
            avgVolume3M: "--", 
            epsEstimateNextYear: "--", 
            forwardPE: "--", 
            divPaymentDate: "--", 
            exDivDate: "--", 
            dividendPerShare: "--", 
            forwardAnnualDivYield: "--", 
            trailingAnnualDivYield: "--", 
            priceToBook: "--", 
            currentHolding: 10
          })
        ]
      });
    });

    it('should return portfolio fundamentals successfully, handle currency conversion, and nullish coalescing', async () => {

      PriceStore.get.mockReturnValue(2); 

      getStockSummary.mockResolvedValue([
        { symbol: 'AAPL', current_holding: 10 },
        { symbol: 'GOOGL', current_holding: 5 } 
      ]);
      YahooFinance.prototype.quoteSummary.mockResolvedValueOnce({
        price: { symbol: 'AAPL', regularMarketPrice: 200, marketCap: 2e12, currency: 'USD' },
        summaryDetail: {
          averageVolume3Month: 1000000,
          dividendYield: 0.05, 
          trailingAnnualDividendYield: 0.035, 
          trailingAnnualDividendRate: 2,
          exDividendDate: 1672531200, 
          dividendRate: 2.0 
        },
        defaultKeyStatistics: { forwardEps: 5, forwardPE: 30, priceToBook: 4.5 },
        calendarEvents: { dividendDate: '2023-12-01' }
      }).mockResolvedValueOnce({

        price: { regularMarketPrice: 2800, marketCap: 1e12, currency: 'EUR' },
        summaryDetail: { averageVolume3Month: 1500000 },
        defaultKeyStatistics: { forwardEps: 10, forwardPE: 25, priceToBook: 3 },
        calendarEvents: { dividendDate: '2023-11-01' }
      });

      await getPortfolioFundamentals(req, res);
      expect(YahooFinance.prototype.quoteSummary).toHaveBeenCalledTimes(2);
      expect(YahooFinance.prototype.quoteSummary).toHaveBeenCalledWith('AAPL', {modules: ["price", "summaryDetail", "defaultKeyStatistics", "calendarEvents"]});
      expect(YahooFinance.prototype.quoteSummary).toHaveBeenCalledWith('GOOGL', {modules: ["price", "summaryDetail", "defaultKeyStatistics", "calendarEvents"]});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].data[0]).toEqual(
        expect.objectContaining({
          symbol: "AAPL",
          lastPrice: mockFormatNumber(100), 
          marketCap: "2000000000000.00", 
          avgVolume3M: mockFormatNumber(1000000), 
          epsEstimateNextYear: "5.00",
          forwardPE: "30.00",
          divPaymentDate: '2023-12-01',
          exDivDate: 1672531200, 
          dividendPerShare: 2.0,
          forwardAnnualDivYield: "5.00%", 
          trailingAnnualDivYield: "3.50%", 
          trailingAnnualDivRate: "2.00",
          priceToBook: mockFormatNumber(2.25), 
          currentHolding: 10, 
        })
      );

      expect(res.json.mock.calls[0][0].data[1]).toEqual(
        expect.objectContaining({
          symbol: "GOOGL", 
          lastPrice: mockFormatNumber(1400), 
          marketCap: 1e12.toFixed(2), 
          avgVolume3M: mockFormatNumber(1500000), 
          forwardAnnualDivYield: "--", 
          trailingAnnualDivYield: "--", 
          priceToBook: mockFormatNumber(1.5), 
          currentHolding: 5, 
        })
      );
    });

    it('should skip holdings where current_holding is 0 or less but still return successful holdings', async () => {
      getStockSummary.mockResolvedValue([
        { symbol: 'AAPL', current_holding: 10 },
        { symbol: 'GOOGL', current_holding: 0 }, 
        { symbol: 'MSFT', current_holding: -5 } 
      ]);

      YahooFinance.prototype.quoteSummary.mockResolvedValueOnce({
        price: { symbol: 'AAPL', regularMarketPrice: 150 },
        summaryDetail: {},
        defaultKeyStatistics: {},
        calendarEvents: {}
      });

      await getPortfolioFundamentals(req, res);

      expect(YahooFinance.prototype.quoteSummary).toHaveBeenCalledTimes(1);
      expect(YahooFinance.prototype.quoteSummary).toHaveBeenCalledWith('AAPL', expect.anything());
      expect(res.json.mock.calls[0][0].count).toBe(1);
      expect(res.json.mock.calls[0][0].data[0].symbol).toBe('AAPL');
    });
  });

  describe('Missing Fields and Fallbacks', () => {
    it('should handle missing price fields resulting in "--" output', async () => {
      getStockSummary.mockResolvedValue([{ symbol: 'MSFT', current_holding: 10 }]);

      YahooFinance.prototype.quoteSummary.mockResolvedValueOnce({
        price: { symbol: 'MSFT', marketCap: null, regularMarketPrice: Number.NaN },
        summaryDetail: { exDividendDate: null, dividendRate: undefined },
        defaultKeyStatistics: { forwardEps: null, priceToBook: 0 },
        calendarEvents: { dividendDate: "1970-01-01" } 
      });

      await getPortfolioFundamentals(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].data[0]).toEqual(
        expect.objectContaining({
          symbol: 'MSFT',
          lastPrice: "--", 
          marketCap: "--", 
          epsEstimateNextYear: "--", 
          dividendPerShare: "--", 
          forwardAnnualDivRate: "--", 
          priceToBook: "--", 
          divPaymentDate: '1970-01-01', 
        })
      );
    });
  });

  describe('formatNumber utility function coverage', () => {
    it('should format numbers into T, B, M, --, and fixed decimals (100% coverage)', async () => {
      getStockSummary.mockResolvedValue([
        { symbol: "AAA", current_holding: 1 },
        { symbol: "BBB", current_holding: 1 },
        { symbol: "CCC", current_holding: 1 },
        { symbol: "DDD", current_holding: 1 },
        { symbol: "EEE", current_holding: 1 },
        { symbol: "FFF", current_holding: 1 },
        { symbol: "GGG", current_holding: 1 }, 
        { symbol: "HHH", current_holding: 1 }, 
      ]);

      YahooFinance.prototype.quoteSummary
        .mockResolvedValueOnce({ price: { symbol: "AAA", regularMarketPrice: 1000000000000 }, summaryDetail: { averageVolume3Month: 2e12 } })
        .mockResolvedValueOnce({ price: { symbol: "BBB", regularMarketPrice: 5000000000 }, summaryDetail: { averageVolume3Month: 1e9 } })
        .mockResolvedValueOnce({ price: { symbol: "CCC", regularMarketPrice: 3000000 }, summaryDetail: { averageVolume3Month: 1e6 } })
        .mockResolvedValueOnce({ price: { symbol: "DDD", regularMarketPrice: 999999.99 }, summaryDetail: { averageVolume3Month: 999999.99 } })
        .mockResolvedValueOnce({ price: { symbol: "EEE", regularMarketPrice: null }, summaryDetail: { averageVolume3Month: undefined } })
        .mockResolvedValueOnce({ price: { symbol: "FFF", regularMarketPrice: 500.123 }, summaryDetail: { averageVolume3Month: 500.123 } })
        .mockResolvedValueOnce({ price: { symbol: "GGG", regularMarketPrice: 0 }, summaryDetail: { averageVolume3Month: 0 } })
        .mockResolvedValueOnce({ price: { symbol: "HHH", regularMarketPrice: -5000000000 }, summaryDetail: { averageVolume3Month: -5000000000 } });

      await getPortfolioFundamentals(req, res);

      const data = res.json.mock.calls[0][0].data;

      expect(data[0].lastPrice).toBe("1.00T");
      expect(data[0].avgVolume3M).toBe("2.00T");

      expect(data[1].lastPrice).toBe("5.00B");
      expect(data[1].avgVolume3M).toBe("1.00B");

      expect(data[2].lastPrice).toBe("3.00M");
      expect(data[2].avgVolume3M).toBe("1.00M");

      expect(data[3].lastPrice).toBe("999999.99"); 
      expect(data[3].avgVolume3M).toBe("999999.99"); 

      expect(data[4].lastPrice).toBe("--"); 
      expect(data[4].avgVolume3M).toBe("--"); 

      expect(data[5].lastPrice).toBe("500.12"); 
      expect(data[5].avgVolume3M).toBe("500.12"); 

      expect(data[6].lastPrice).toBe("0.00"); 
      expect(data[6].avgVolume3M).toBe("0.00"); 

      expect(data[7].lastPrice).toBe("-5.00B");
      expect(data[7].avgVolume3M).toBe("-5.00B");
    });
  });

  describe('Edge Cases', () => {
    it('should return 400 if email is not provided', async () => {
      req.user.email = null;

      await getPortfolioFundamentals(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email required'
      });
    });

    it('should return 404 if no holdings are found', async () => {
      getStockSummary.mockResolvedValue([]);

      await getPortfolioFundamentals(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No holdings found'
      });
    });

    it('should handle YahooFinance API failure gracefully', async () => {
      getStockSummary.mockResolvedValue([{ symbol: 'AAPL', current_holding: 10 }]);

      YahooFinance.prototype.quoteSummary.mockRejectedValueOnce(new Error('API Error'));

      await getPortfolioFundamentals(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: [
          {
            symbol: 'AAPL',
            error: 'Data not available'
          }
        ]
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      getStockSummary.mockRejectedValue(new Error('Unexpected Error'));

      await getPortfolioFundamentals(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch portfolio financial details'
      });
    });
  });
});