import { getStocksSector } from "../../../src/db/stockSector.js";
import { sql } from "../../../src/db/dbConnection.js";

jest.mock("../../../src/db/dbConnection.js", () => ({
  sql: jest.fn(),
}));

describe("getStocksSector", () => {
  const email = "user@example.com";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns rows when query succeeds", async () => {
    const mockRows = [
      { symbol: "TCS.NS", current_holding: 5, sector: "IT" },
      { symbol: "INFY.NS", current_holding: 2, sector: "IT" }
    ];
    sql.mockResolvedValue(mockRows);

    const result = await getStocksSector(email);

    expect(sql).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockRows);
  });

  it("returns empty array when no rows found", async () => {
    sql.mockResolvedValue([]);

    const result = await getStocksSector(email);

    expect(result).toEqual([]);
    expect(sql).toHaveBeenCalledTimes(1);
  });

  it("returns null and logs error when sql throws", async () => {
    const err = new Error("DB error");
    sql.mockRejectedValue(err);
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await getStocksSector(email);

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith("Stock sector fetch error:", err);
    spy.mockRestore();
  });
});
