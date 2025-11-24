// @ts-nocheck
import { sql } from "../../../src/db/dbConnection.js";
import { deleteUserByEmail } from "../../../src/db/removeUser.js";

// Mock SQL function
jest.mock("../../../src/db/dbConnection.js", () => ({
  sql: jest.fn(),
}));

describe("deleteUserByEmail()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // HAPPY PATH
  // -------------------------
  it("should delete user and return [] for valid email or email that doesn't exist", async () => {
    const mockEmail = "test@example.com";
    const mockResult = [];

    sql.mockResolvedValue(mockResult);

    const result = await deleteUserByEmail(mockEmail);

    expect(result).toEqual(mockResult);
    expect(sql).toHaveBeenCalledTimes(1);

    // Ensure correct parameter
    expect(sql.mock.calls[0][1]).toBe(mockEmail);
  });

  // -------------------------
  // DB ERROR CASE
  // -------------------------
  it("should return null when DB throws an error", async () => {
    const mockEmail = "error@example.com";

    sql.mockRejectedValue(new Error("DB error"));

    const result = await deleteUserByEmail(mockEmail);

    expect(result).toBeNull();
    expect(sql).toHaveBeenCalledTimes(1);
    expect(sql.mock.calls[0][1]).toBe(mockEmail);
  });

  // -------------------------
  // VALIDATION CASES (should NOT hit DB)
  // -------------------------
  it("should return null for empty email", async () => {
    const result = await deleteUserByEmail("");

    expect(result).toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });

  it("should return null for null email", async () => {
    const result = await deleteUserByEmail(null);

    expect(result).toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });

  it("should return null for undefined email", async () => {
    const result = await deleteUserByEmail(undefined);

    expect(result).toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });
});
