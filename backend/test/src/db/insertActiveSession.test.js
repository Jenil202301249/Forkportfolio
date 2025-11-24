import { sql } from "../../../src/db/dbConnection.js";
import { insertActiveSession } from "../../../src/db/insertActiveSession.js";

// Mock SQL
jest.mock("../../../src/db/dbConnection.js", () => ({
  sql: jest.fn(),
}));

describe("insertActiveSession()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------
  // HAPPY PATH
  // -----------------------
  it("should insert active session and return result for valid inputs", async () => {
    const mockData = {
      token: "abc123",
      email: "test@example.com",
      browser_type: "Chrome",
      os_type: "Windows",
    };

    const mockResult = [{ email: mockData.email }];

    sql.mockResolvedValue(mockResult);

    const result = await insertActiveSession(mockData);

    expect(result).toEqual(mockResult);
    expect(sql).toHaveBeenCalledTimes(1);

    // Ensure correct params sent
    expect(sql.mock.calls[0][1]).toBe(mockData.token);
    expect(sql.mock.calls[0][2]).toBe(mockData.email);
    expect(sql.mock.calls[0][3]).toBe(mockData.browser_type);
    expect(sql.mock.calls[0][4]).toBe(mockData.os_type);
  });

  // -----------------------
  // DB ERROR CASE
  // -----------------------
  it("should return null when DB throws error(ex.if email not exists)", async () => {
    const mockData = {
      token: "abc123",
      email: "test@example.com",
      browser_type: "Chrome",
      os_type: "Windows",
    };

    sql.mockRejectedValue(new Error("DB insert error"));

    const result = await insertActiveSession(mockData);

    expect(result).toBeNull();
    expect(sql).toHaveBeenCalledTimes(1);
  });

  // -----------------------
  // VALIDATION TESTS
  // -----------------------
  describe("Validation tests — should NOT call DB", () => {
    const baseData = {
      token: "t1",
      email: "e@example.com",
      browser_type: "Chrome",
      os_type: "Windows",
    };

    const invalidValues = [null, undefined, ""];

    invalidValues.forEach((invalid) => {
      it(`should return null if token is '${invalid}'`, async () => {
        const data = { ...baseData, token: invalid };
        const result = await insertActiveSession(data);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it(`should return null if email is '${invalid}'`, async () => {
        const data = { ...baseData, email: invalid };
        const result = await insertActiveSession(data);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it(`should return null if browser_type is '${invalid}'`, async () => {
        const data = { ...baseData, browser_type: invalid };
        const result = await insertActiveSession(data);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it(`should return null if os_type is '${invalid}'`, async () => {
        const data = { ...baseData, os_type: invalid };
        const result = await insertActiveSession(data);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });
    });
  });
});
