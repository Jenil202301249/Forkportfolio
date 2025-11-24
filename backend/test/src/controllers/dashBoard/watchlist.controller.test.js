jest.mock("../../../../src/db/watchlist.js");
jest.mock("../../../../src/utils/getQuotes.js");
jest.mock("../../../../src/mongoModels/user.model.js");

import { showWatchlist, addToWatchlist, removeFromWatchlist } from "../../../../src/controllers/dashBoard/watchlist.controller.js";
import { addSymbol, checkpresent, getWatchlist, removeSymbol } from "../../../../src/db/watchlist.js";
import { getPrice } from "../../../../src/utils/getQuotes.js";
import { addActivityHistory } from "../../../../src/mongoModels/user.model.js";
jest.mock("../../../../src/utils/stores/priceRates.js", () => ({}));
jest.mock("../../../../src/db/dbConnection.js", () => ({
  sql: jest.fn()
}));
jest.mock("../../../../src/utils/stockPriceStore.js", () => ({
  stockPriceStore: {
    get: jest.fn(),
    add: jest.fn()
  }
}));
const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("watchlist.controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { email: "test@example.com" },
      body: {},
      query: {},
      activeSession: { osType: "Windows", browserType: "Chrome" },
      cookies: { token: "token-123" },
    };
    res = mockRes();
    jest.clearAllMocks();
  });

  describe("showWatchlist()", () => {
    it("503 when getWatchlist returns null/undefined", async () => {
      getWatchlist.mockResolvedValueOnce(undefined);

      await showWatchlist(req, res);

      expect(getWatchlist).toHaveBeenCalledWith("test@example.com");
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to fetch watchlist." });
    });

    it("200 with empty array when watchlist is empty", async () => {
      getWatchlist.mockResolvedValueOnce([]);

      await showWatchlist(req, res);

      expect(getWatchlist).toHaveBeenCalledWith("test@example.com");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, watchlist: [] });
    });

    it("500 with log db error", async () => {
      getWatchlist.mockRejectedValue(new Error("DB down"));;

      await showWatchlist(req, res);

      expect(getWatchlist).toHaveBeenCalledWith("test@example.com");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "An error occurred while fetching the watchlist." });
    });

    it("200 with sorted data and default sector 'others'", async () => {
      getWatchlist.mockResolvedValueOnce([
        { symbol: "BBB" },
        { symbol: "AAA" },
      ]);

      getPrice.mockImplementation(async (symbol) => {
        if (symbol === "AAA") {
          return {
            current: 100,
            currency: "INR",
            percentageChange: 1.2,
            change: 1.2,
            shortname: "AAA Co",
            longname: "AAA Company",
            marketcap: 1000,
            sector: undefined, // should default to 'others'
          };
        }
        if (symbol === "BBB") {
          return {
            current: 250,
            currency: "INR",
            percentageChange: -0.5,
            change: -1.25,
            shortname: "BBB Co",
            longname: "BBB Company",
            marketcap: 2000,
            sector: "Tech",
          };
        }
        return null;
      });

      await showWatchlist(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        watchlist: [
          {
            symbol: "BBB",
            currentPrice: 250,
            currency: "INR",
            percentageChange: -0.5,
            currentchange: -1.25,
            shortName: "BBB Co",
            longName: "BBB Company",
            marketcap: 2000,
            sector: "Tech",
          },
          {
            symbol: "AAA",
            currentPrice: 100,
            currency: "INR",
            percentageChange: 1.2,
            currentchange: 1.2,
            shortName: "AAA Co",
            longName: "AAA Company",
            marketcap: 1000,
            sector: "others",
          },
        ],
      });
    });

    it("504 with getPrice returning undefined", async () => {
      getWatchlist.mockResolvedValueOnce([
        { symbol: "BBB" },
        { symbol: "AAA" },
      ]);

      getPrice.mockImplementation(async (symbol) => {
        if (symbol === "AAA") {
          return {
            current: 100,
            currency: "INR",
            percentageChange: 1.2,
            change: 1.2,
            shortname: "AAA Co",
            longname: "AAA Company",
            marketcap: 1000,
            sector: undefined, // should default to 'others'
          };
        }
        return null;
      });

      await showWatchlist(req, res);

      expect(res.status).toHaveBeenCalledWith(504);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to fetch stock prices."
      });
    });
  });

  describe("addToWatchlist()", () => {
    it("400 when symbol missing", async () => {
      req.body.symbol = undefined;

      await addToWatchlist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Stock symbol is required." });
    });

    it("200 on success and logs activity", async () => { 
        req.body.symbol = "AAPL"; addSymbol.mockResolvedValueOnce(true); 
        await addToWatchlist(req, res); 
        expect(addSymbol).toHaveBeenCalledWith("test@example.com", "AAPL"); 
        expect(addActivityHistory).toHaveBeenCalledWith("test@example.com", 
            expect.objectContaining({ type: expect.stringContaining("add AAPL in Watchlist"), })); 
        expect(res.status).toHaveBeenCalledWith(200); 
        expect(res.json).toHaveBeenCalledWith({ success: true, message: "Symbol added to watchlist." }); 
    });

    it("503 on db returning false", async () => {
      req.body.symbol = "AAPL";
      addSymbol.mockResolvedValueOnce(false);

      await addToWatchlist(req, res);

      expect(addSymbol).toHaveBeenCalledWith("test@example.com", "AAPL");
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to add symbol to watchlist." });
    });

    it("500 on db faliure", async () => {
      req.body.symbol = "AAPL";
      addSymbol.mockRejectedValue(new Error("DB down"));

      await addToWatchlist(req, res);

      expect(addSymbol).toHaveBeenCalledWith("test@example.com", "AAPL");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "An error occurred while adding to the watchlist." });
    });
  });

  describe("removeFromWatchlist()", () => {
    it("400 when symbol not provided", async () => {
      req.query.symbol = undefined;

      await removeFromWatchlist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Stock symbol is required." });
    });

    it("400 when stock not present to remove", async () => {
      req.query.symbol = "MSFT";
      checkpresent.mockResolvedValueOnce(0);

      await removeFromWatchlist(req, res);

      expect(checkpresent).toHaveBeenCalledWith("test@example.com", "MSFT");
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("503 when DB returns null", async () => {
      req.query.symbol = "MSFT";
      checkpresent.mockResolvedValueOnce(null);

      await removeFromWatchlist(req, res);

      expect(checkpresent).toHaveBeenCalledWith("test@example.com", "MSFT");
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("200 when everything is perfect", async () => {
      req.query.symbol = "MSFT";
      checkpresent.mockResolvedValueOnce(1);
      removeSymbol.mockResolvedValueOnce(true);
      await removeFromWatchlist(req, res);

      expect(checkpresent).toHaveBeenCalledWith("test@example.com", "MSFT");
      expect(removeSymbol).toHaveBeenCalledWith("test@example.com", "MSFT");
      expect(addActivityHistory).toHaveBeenCalledWith("test@example.com",
          expect.objectContaining({ type: expect.stringContaining("Remove MSFT from Watchlist") }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("503 when remove symbol return false", async () => {
      req.query.symbol = "MSFT";
      checkpresent.mockResolvedValueOnce(1);
      removeSymbol.mockResolvedValueOnce(false);
      await removeFromWatchlist(req, res);

      expect(checkpresent).toHaveBeenCalledWith("test@example.com", "MSFT");
      expect(removeSymbol).toHaveBeenCalledWith("test@example.com", "MSFT");
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("500 when checkPresent throws error", async () => {
      req.query.symbol = "MSFT";
      checkpresent.mockRejectedValueOnce(new Error("DB down"));
      await removeFromWatchlist(req, res);

      expect(checkpresent).toHaveBeenCalledWith("test@example.com", "MSFT");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
});
