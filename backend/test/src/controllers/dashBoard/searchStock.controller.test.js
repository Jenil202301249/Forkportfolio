import Fuse from "fuse.js";
import YahooFinance from "yahoo-finance2";
import { searchStock } from "../../../../src/controllers/dashBoard/searchStock.controller.js";

jest.mock("fuse.js", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    search: jest.fn(),
  })),
}));

jest.mock("yahoo-finance2", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    search: jest.fn(),
  })),
}));

describe("searchStock() controller", () => {
  let req, res, fuseInstance, yahooFinanceInstance;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    fuseInstance = Fuse.mock.results[0].value;
    yahooFinanceInstance = YahooFinance.mock.results[0].value;

    fuseInstance.search.mockReset();
    yahooFinanceInstance.search.mockReset();
    
  });

  describe("Happy paths", () => {
    it("returns merged local + Yahoo suggestions", async () => {
      req.query.ticker = "TCS";

      const local = [{ symbol: "TCS.NS", shortname: "TCS", longname: "TCS LTD" }];
      const yahoo = [{ symbol: "TCS.NS", shortname: "TCS", longname: "TCS LTD" }];

      fuseInstance.search.mockReturnValue(local.map(item => ({ item })));
      yahooFinanceInstance.search.mockResolvedValue({ quotes: yahoo });

      await searchStock(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: local,
      });
    });

    it("returns only local suggestions when Yahoo has none", async () => {
      req.query.ticker = "TCS";

      const local = [{ symbol: "TCS.NS", shortname: "TCS", longname: "TCS LTD" }];

      fuseInstance.search.mockReturnValue(local.map(item => ({ item })));
      yahooFinanceInstance.search.mockResolvedValue({ quotes: [] });

      await searchStock(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: local,
      });
    });

    it("returns only Yahoo suggestions when local has none", async () => {
      req.query.ticker = "TCS";

      const yahoo = [{ symbol: "TCS.NS", shortname: "TCS", longname: "TCS LTD" }];

      fuseInstance.search.mockReturnValue([]);
      yahooFinanceInstance.search.mockResolvedValue({ quotes: yahoo });

      await searchStock(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: yahoo,
      });
    });
  });

  describe("Edge cases", () => {
    it("returns 400 when ticker is empty", async () => {
      req.query.ticker = "";

      await searchStock(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Query is required",
      });
    });
    it("returns 200 when ticker is of length 1", async () => {
      req.query.ticker = "T";
      const local = [{ symbol: "TCS.NS", shortname: "TCS", longname: "TCS LTD" }];

      fuseInstance.search.mockReturnValue(local.map(item => ({ item })));
      yahooFinanceInstance.search.mockResolvedValue({ quotes: [] });
      await searchStock(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: local,
      });
    });
    it("returns 404 when nothing found", async () => {
      req.query.ticker = "UNKNOWN";

      fuseInstance.search.mockReturnValue([]);
      yahooFinanceInstance.search.mockResolvedValue({ quotes: [] });

      await searchStock(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Stock not found",
      });
    });

    it("returns 500 on error", async () => {
      req.query.ticker = "TCS";

      fuseInstance.search.mockReturnValue([]);
      yahooFinanceInstance.search.mockRejectedValue(new Error("fail"));

      await searchStock(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
      });
    });
  });
});
