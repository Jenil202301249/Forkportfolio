// @ts-nocheck
import { sql } from "../../../src/db/dbConnection.js";
import { toggleAiSuggestion } from "../../../src/db/toggleAiSuggestion.js";

// Mock SQL function
jest.mock("../../../src/db/dbConnection.js", () => ({
  sql: jest.fn(),
}));

describe("toggleAiSuggestion()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // HAPPY PATH
  // -------------------------
  it("should toggle aiSuggestion and return DB result for valid email", async () => {
    const mockEmail = "test@example.com";
    const mockResult = [{ id: 5 }];

    sql.mockResolvedValue(mockResult);

    const result = await toggleAiSuggestion(mockEmail);

    expect(result).toEqual(mockResult);
    expect(sql).toHaveBeenCalledTimes(1);

    // Check parameter
    expect(sql.mock.calls[0][1]).toBe(mockEmail);
  });

  // -------------------------
  // DB ERROR CASE
  // -------------------------
  it("should return null when DB throws an error", async () => {
    const mockEmail = "error@example.com";

    sql.mockRejectedValue(new Error("DB error"));

    const result = await toggleAiSuggestion(mockEmail);

    expect(result).toBeNull();
    expect(sql).toHaveBeenCalledTimes(1);
    expect(sql.mock.calls[0][1]).toBe(mockEmail);
  });

  // -------------------------
  // VALIDATION CASES (should NOT hit DB)
  // -------------------------
  it("should return null for empty email", async () => {
    const result = await toggleAiSuggestion("");

    expect(result).toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });

  it("should return null for null email", async () => {
    const result = await toggleAiSuggestion(null);

    expect(result).toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });

  it("should return null for undefined email", async () => {
    const result = await toggleAiSuggestion(undefined);

    expect(result).toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });
});
