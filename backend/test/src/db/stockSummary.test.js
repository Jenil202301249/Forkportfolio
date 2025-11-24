import { getStockSummary, getPortfolioStockSummary } from "../../../src/db/stockSummary.js";
import { sql } from "../../../src/db/dbConnection.js";

jest.mock("../../../src/db/dbConnection.js", () => ({
  sql: jest.fn(),
}));

describe("Stock Summary Service", () => {
  let email;

  beforeEach(() => {
    email = "test@example.com";
    jest.clearAllMocks();
  });

  describe("getStockSummary()", () => {
    it("returns stock summary when query succeeds", async () => {
      const mockResult = [{ symbol: "TCS", email }];
      sql.mockResolvedValue(mockResult);

      const result = await getStockSummary(email);

      expect(sql).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it("returns empty array when no records exist", async () => {
      sql.mockResolvedValue([]);

      const result = await getStockSummary(email);

      expect(result).toEqual([]);
    });

    it("returns null when SQL throws error", async () => {
      const err = new Error("DB FAIL");
      sql.mockRejectedValue(err);
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await getStockSummary(email);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith("Stock details error:", err);
      spy.mockRestore();
    });
  });

  describe("getPortfolioStockSummary()", () => {
    it("returns portfolio stock summary on success", async () => {
      const mockResult = [
        { short_name: "TCS", long_name: "Tata Consultancy", current_holding: 10, spended_amount: 1000 }
      ];
      sql.mockResolvedValue(mockResult);

      const result = await getPortfolioStockSummary(email);

      expect(sql).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it("returns empty array when portfolio is empty", async () => {
      sql.mockResolvedValue([]);

      const result = await getPortfolioStockSummary(email);

      expect(result).toEqual([]);
    });

    it("returns null when SQL throws error", async () => {
      const err = new Error("Portfolio FAIL");
      sql.mockRejectedValue(err);
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await getPortfolioStockSummary(email);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Database error - getPortfolioStockSummary",
        err
      );
      spy.mockRestore();
    });
  });
});
