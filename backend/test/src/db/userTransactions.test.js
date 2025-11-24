// @ts-nocheck
import { sql } from "../../../src/db/dbConnection.js";
import { getPortfolioTransactions } from "../../../src/db/userTransactions.js";

// Mock SQL
jest.mock("../../../src/db/dbConnection.js", () => ({
  sql: jest.fn(),
}));

describe("getPortfolioTransactions()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------
  // HAPPY PATH
  // ----------------------------
  it("should return portfolio transactions for valid email", async () => {
    const mockEmail = "user@example.com";

    const mockResult = [
      {
        short_name: "AAPL",
        long_name: "Apple Inc.",
        transaction_type: "BUY",
        quantity: 10,
        price: 150,
        transaction_date: "2024-01-01",
      },
    ];

    sql.mockResolvedValue(mockResult);

    const result = await getPortfolioTransactions(mockEmail);

    expect(result).toEqual(mockResult);
    expect(sql).toHaveBeenCalledTimes(1);

    // Ensure correct parameter passed
    expect(sql.mock.calls[0][1]).toBe(mockEmail);
  });

  // ----------------------------
  // DB ERROR CASE
  // ----------------------------
  it("should return null when DB throws an error", async () => {
    const mockEmail = "error@example.com";

    sql.mockRejectedValue(new Error("DB error"));

    const result = await getPortfolioTransactions(mockEmail);

    expect(result).toBeNull();
    expect(sql).toHaveBeenCalledTimes(1);
    expect(sql.mock.calls[0][1]).toBe(mockEmail);
  });

  // ----------------------------
  // VALIDATION CASES (must NOT call DB)
  // ----------------------------
  const invalidValues = [null, undefined, ""];

  invalidValues.forEach((invalid) => {
    it(`should return null & NOT call DB for invalid email: '${invalid}'`, async () => {
      const result = await getPortfolioTransactions(invalid);

      expect(result).toBeNull();
      expect(sql).not.toHaveBeenCalled();
    });
  });
});
