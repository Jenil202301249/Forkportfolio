import { sql } from "../../../src/db/dbConnection.js";
import {
  getAllActiveSessionOfUser,
  getActiveSessionByToken,
} from "../../../src/db/getActiveSession.js";

// Mock SQL function
jest.mock("../../../src/db/dbConnection.js", () => ({
  sql: jest.fn(),
}));

describe("Active Session Fetch Methods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ======================================================
  // getAllActiveSessionOfUser(email)
  // ======================================================
  describe("getAllActiveSessionOfUser()", () => {
    describe("Happy Paths", () => {
      it("should return all active sessions for valid email", async () => {
        const mockEmail = "test@example.com";
        const mockResult = [
          { token: "t1", browser_type: "Chrome", os_type: "Windows" },
        ];

        sql.mockResolvedValue(mockResult);

        const result = await getAllActiveSessionOfUser(mockEmail);

        expect(result).toEqual(mockResult);
        expect(sql).toHaveBeenCalledTimes(1);
        expect(sql.mock.calls[0][1]).toBe(mockEmail);
      });
    });

    describe("Edge Cases", () => {
      it("should return empty array if no active sessions found", async () => {
        const mockEmail = "none@example.com";
        const mockResult = [];

        sql.mockResolvedValue(mockResult);

        const result = await getAllActiveSessionOfUser(mockEmail);

        expect(result).toEqual(mockResult);
        expect(sql).toHaveBeenCalledTimes(1);
        expect(sql.mock.calls[0][1]).toBe(mockEmail);
      });

      it("should return null on database error", async () => {
        const mockEmail = "error@example.com";

        sql.mockRejectedValue(new Error("DB error"));

        const result = await getAllActiveSessionOfUser(mockEmail);

        expect(result).toBeNull();
        expect(sql).toHaveBeenCalledTimes(1);
      });

      // ---- invalid input tests (should NOT hit DB) ----

      it("should return null for empty email", async () => {
        const result = await getAllActiveSessionOfUser("");

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it("should return null for null email", async () => {
        const result = await getAllActiveSessionOfUser(null);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it("should return null for undefined email", async () => {
        const result = await getAllActiveSessionOfUser(undefined);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });
    });
  });

  // ======================================================
  // getActiveSessionByToken(token)
  // ======================================================
  describe("getActiveSessionByToken()", () => {
    describe("Happy Paths", () => {
      it("should return session details for valid token", async () => {
        const mockToken = "token123";
        const mockResult = {
          email: "test@example.com",
          browser_type: "Chrome",
          os_type: "macOS",
        };

        sql.mockResolvedValue(mockResult);

        const result = await getActiveSessionByToken(mockToken);

        expect(result).toEqual(mockResult);
        expect(sql).toHaveBeenCalledTimes(1);
        expect(sql.mock.calls[0][1]).toBe(mockToken);
      });
    });

    describe("Edge Cases", () => {
      it("should return empty result if no session exists for token", async () => {
        const mockToken = "notfound";
        const mockResult = [];

        sql.mockResolvedValue(mockResult);

        const result = await getActiveSessionByToken(mockToken);

        expect(result).toEqual(mockResult);
        expect(sql).toHaveBeenCalledTimes(1);
        expect(sql.mock.calls[0][1]).toBe(mockToken);
      });

      it("should return null on DB error", async () => {
        const mockToken = "errortoken";

        sql.mockRejectedValue(new Error("DB error"));

        const result = await getActiveSessionByToken(mockToken);

        expect(result).toBeNull();
        expect(sql).toHaveBeenCalledTimes(1);
      });

      // ---- invalid input tests (should NOT hit DB) ----

      it("should return null for empty token", async () => {
        const result = await getActiveSessionByToken("");

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it("should return null for null token", async () => {
        const result = await getActiveSessionByToken(null);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it("should return null for undefined token", async () => {
        const result = await getActiveSessionByToken(undefined);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });
    });
  });
});
