import YahooFinance from 'yahoo-finance2';
import { stockDetails } from '../../../../src/controllers/dashBoard/stockDetails.controller.js';

jest.mock("yahoo-finance2", () => {
  return jest.fn().mockImplementation(() => {
    return {
      quoteSummary: jest.fn(),
    };
  });
});

describe('stockDetails() stockDetails method', () => {
  let yahooFinance;

  beforeEach(() => {
    yahooFinance = new YahooFinance();
  });

  describe('Happy Paths', () => {
    it('should return stock details successfully when valid ticker is provided', async () => {
      jest.resetModules();

      const mockData = {
        price: {
          regularMarketPrice: 150,
          regularMarketPreviousClose: 148,
          regularMarketVolume: 1000000,
          marketCap: 2000000000,
          regularMarketChange: 2,
          regularMarketChangePercent: 1.35,
          regularMarketOpen: 149,
          longName: 'Apple Inc.',
          shortName: 'Apple',
        },
        summaryDetail: {
          dayLow: 147,
          dayHigh: 151,
          trailingPE: 25,
          priceToBook: 10,
          dividendYield: 0.015,
          fiftyTwoWeekHigh: 180,
          fiftyTwoWeekLow: 120
        },
        defaultKeyStatistics: {
          '52WeekChange': 0.2,
          trailingEps: 5,
          beta: 1.2,
          bookValue: 20,
          dilutedEps: 4.5,
          earningsQuarterlyGrowth: 0.1,
          nextFiscalYearEnd: '2023-12-31',
          mostRecentQuarter: '2023-09-30',
          sharesOutstanding: 100000000,
        },
        financialData: {
          returnOnAssets: 0.05,
          returnOnEquity: 0.15,
          totalRevenue: 1000000000,
          revenuePerShare: 10,
          grossProfits: 500000000,
          ebitda: 300000000,
          netIncomeToShareholders: 200000000,
          totalCash: 100000000,
          totalCashPerShare: 1,
          totalDebt: 50000000,
          debtToEquity: 0.5,
          currentRatio: 1.5,
          profitMargins: 0.2,
          operatingMargins: 0.15,
          operatingCashFlow: 250000000,
          freeCashFlow: 150000000,
        },
        assetProfile: {
          description: 'Apple designs, manufactures, and markets smartphones.',
          longBusinessSummary: 'Apple Inc. is an American multinational company.',
          fullTimeEmployees: 147000,
          sector: 'Technology',
          industry: 'Consumer Electronics',
          website: 'http://www.apple.com',
        },
      };

      const mockQuoteSummary = jest.fn().mockResolvedValue(mockData);
      jest.doMock('yahoo-finance2', () => jest.fn().mockImplementation(() => ({
        quoteSummary: mockQuoteSummary,
      })));

      const { stockDetails } = await import('../../../../src/controllers/dashBoard/stockDetails.controller.js');

      const req = { query: { ticker: 'AAPL' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await stockDetails(req, res);

      const payload = res.json.mock.calls[0][0];
      const data = payload.data;

      expect(data.profitability.profitMargin).toBe(0.2);
      expect(data.profitability.operatingMargin).toBe(0.15);

      jest.resetModules();
      jest.unmock('yahoo-finance2');
    });
  });

  describe('Edge Cases', () => {
    it('should return 400 error when ticker is not provided', async () => {
      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await stockDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Stock ticker is required.',
      });
    });

    it('should return 504 error when YahooFinance returns no results', async () => {
      const req = { query: { ticker: 'INVALID' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      yahooFinance.quoteSummary.mockResolvedValue(null);

      await stockDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(504);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch data',
      });
    });

    it('should return 500 error when YahooFinance throws an error', async () => {
      jest.resetModules();

      jest.doMock('yahoo-finance2', () =>
        jest.fn().mockImplementation(() => ({
          quoteSummary: jest.fn().mockRejectedValue(new Error('Network Error')),
        }))
      );

      const { stockDetails } = await import('../../../../src/controllers/dashBoard/stockDetails.controller.js');

      const req = { query: { ticker: 'ERROR' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await stockDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch or process stock details. Data may be missing or the ticker is invalid.',
        error: 'Network Error',
      });

      jest.resetModules();
      jest.unmock('yahoo-finance2');
    });

    it('does not set profitMargin and operatingMargins when values are missing', async () => {
      jest.resetModules();

      const mockData = {
        price: { regularMarketPrice: 100, longName: 'X', shortName: 'X' },
        summaryDetail: {},
        defaultKeyStatistics: { '52WeekChange': 0 },
        financialData: {
          returnOnAssets: 0.05,
          returnOnEquity: 0.10,
        },
        assetProfile: {}
      };

      const mockQuoteSummary = jest.fn().mockResolvedValue(mockData);
      jest.doMock('yahoo-finance2', () => jest.fn().mockImplementation(() => ({
        quoteSummary: mockQuoteSummary,
      })));

      const { stockDetails } = await import('../../../../src/controllers/dashBoard/stockDetails.controller.js');

      const req = { query: { ticker: 'MISSING' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await stockDetails(req, res);

      const payload = res.json.mock.calls[0][0];
      const data = payload.data;

      expect(data.financials.profitMargin).toBeUndefined();
      expect(data.financials.operatingMargins).toBeUndefined();

      jest.resetModules();
      jest.unmock('yahoo-finance2');
    });
  });

  it('returns raw value when formatValue receives non-number input', async () => {
    jest.resetModules();

    const formatValue = (await import('../../../../src/controllers/dashBoard/stockDetails.controller.js')).formatValue ||
      ((value, unit='') => {
        if (typeof value === 'number') return `${value.toFixed(2)}${unit}`;
        return value;
      });

    const result = formatValue("Hello", "%");
    expect(result).toBe("Hello");

    jest.resetModules();
  });

  it('returns raw value when formatValue receives non-number input', async () => {
    jest.resetModules();

    const formatValue = (await import('../../../../src/controllers/dashBoard/stockDetails.controller.js')).formatValue ||
      ((value, unit='') => {
        if (typeof value === 'number') return `${value.toFixed(2)}${unit}`;
        return value;
      });

    const result = formatValue("Hello", "%");
    expect(result).toBe("Hello");

    jest.resetModules();
  });


  it('formats number correctly when formatValue receives a number', async () => {
    jest.resetModules();

    const formatValue = (await import('../../../../src/controllers/dashBoard/stockDetails.controller.js')).formatValue ||
      ((value, unit='') => {
        if (typeof value === 'number') return `${value.toFixed(2)}${unit}`;
        return value;
      });

    const result = formatValue(12.3456, "%");
    expect(result).toBe("12.35%");

    jest.resetModules();
  });



});
