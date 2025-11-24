// @ts-nocheck
import { sql } from "../../../src/db/dbConnection.js";
import { updateActiveTime } from "../../../src/db/updateActiveTime.js";

// Mock SQL
jest.mock("../../../src/db/dbConnection.js", () => ({
  sql: jest.fn(),
}));

describe("updateActiveTime()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------
  // HAPPY PATH
  // ----------------------------
  it("should update last_active_time and return result for valid token", async () => {
    const mockToken = "abc123";
    const mockResult = [{ email: "test@example.com" }];

    sql.mockResolvedValue(mockResult);

    const result = await updateActiveTime(mockToken);

    expect(result).toEqual(mockResult);
    expect(sql).toHaveBeenCalledTimes(1);

    // Ensure token passed correctly
    expect(sql.mock.calls[0][1]).toBe(mockToken);
  });

  // ----------------------------
  // DB ERROR CASE
  // ----------------------------
  it("should return null when DB throws an error", async () => {
    const mockToken = "errorToken";

    sql.mockRejectedValue(new Error("DB error"));

    const result = await updateActiveTime(mockToken);

    expect(result).toBeNull();
    expect(sql).toHaveBeenCalledTimes(1);
    expect(sql.mock.calls[0][1]).toBe(mockToken);
  });

  // ----------------------------
  // VALIDATION CASES (should NOT call DB)
  // ----------------------------
  it("should return null for empty token", async () => {
    const result = await updateActiveTime("");

    expect(result).toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });

  it("should return null for null token", async () => {
    const result = await updateActiveTime(null);

    expect(result).toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });

  it("should return null for undefined token", async () => {
    const result = await updateActiveTime(undefined);

    expect(result).toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });
});
