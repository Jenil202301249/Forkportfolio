import { sql } from "../../../src/db/dbConnection.js";
import { 
  deleteActiveSessionByEmail,
  deleteActiveSessionByToken
} from "../../../src/db/deleteActiveSession.js"
// Mock sql function

jest.mock("../../../src/db/dbConnection.js", () => ({
    sql: jest.fn(),
}));

describe("deleteActiveSession DB methods", () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------
  // deleteActiveSessionByEmail
  // ----------------------------
  describe("deleteActiveSessionByEmail()", () => {

    describe("Happy Path", () => {
      it("should delete session and return [] when a valid email is provided", async () => {
        const mockEmail = "test@example.com";
        const mockResult = [];

        sql.mockResolvedValue(mockResult);

        const result = await deleteActiveSessionByEmail(mockEmail);

        expect(result).toEqual(mockResult);
        expect(sql).toHaveBeenCalledTimes(1);

        // Check tagged template parameter
        expect(sql.mock.calls[0][1]).toBe(mockEmail);
      });
    });

    describe("Edge Cases", () => {
      it("should return [] when no rows match the email", async () => {
        const mockEmail = "noexist@example.com";
        const mockResult = [];

        sql.mockResolvedValue(mockResult);

        const result = await deleteActiveSessionByEmail(mockEmail);

        expect(result).toEqual(mockResult);
        expect(sql).toHaveBeenCalledTimes(1);
        expect(sql.mock.calls[0][1]).toBe(mockEmail);
      });

      it("should return null when database throws an error", async () => {
        const mockEmail = "error@example.com";
        sql.mockRejectedValue(new Error("DB error"));

        const result = await deleteActiveSessionByEmail(mockEmail);

        expect(result).toBeNull();
        expect(sql).toHaveBeenCalledTimes(1);
        expect(sql.mock.calls[0][1]).toBe(mockEmail);
      });

      it("should return null and NOT call DB when empty string email", async () => {
        const result = await deleteActiveSessionByEmail("");

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it("should return null and NOT call DB when null email", async () => {
        const result = await deleteActiveSessionByEmail(null);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it("should return null and NOT call DB when undefined email", async () => {
        const result = await deleteActiveSessionByEmail(undefined);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });
    });
  });

  // ----------------------------
  // deleteActiveSessionByToken
  // ----------------------------
  describe("deleteActiveSessionByToken()", () => {

    describe("Happy Path", () => {
      it("should delete session when valid token is provided and return []", async () => {
        const mockToken = "abc123";
        const mockResult = [];

        sql.mockResolvedValue(mockResult);

        const result = await deleteActiveSessionByToken(mockToken);

        expect(result).toEqual(mockResult);
        expect(sql).toHaveBeenCalledTimes(1);
        expect(sql.mock.calls[0][1]).toBe(mockToken);
      });
    });

    describe("Edge Cases", () => {
      it("should return DB result when token does not exist and return []", async () => {
        const mockToken = "invalidToken";
        const mockResult = [];

        sql.mockResolvedValue(mockResult);

        const result = await deleteActiveSessionByToken(mockToken);

        expect(result).toEqual(mockResult);
        expect(sql).toHaveBeenCalledTimes(1);
        expect(sql.mock.calls[0][1]).toBe(mockToken);
      });

      it("should return null when DB throws error", async () => {
        const mockToken = "errorToken";
        sql.mockRejectedValue(new Error("DB error"));

        const result = await deleteActiveSessionByToken(mockToken);

        expect(result).toBeNull();
        expect(sql).toHaveBeenCalledTimes(1);
        expect(sql.mock.calls[0][1]).toBe(mockToken);
      });

      it("should return null and NOT call DB on empty token", async () => {
        const result = await deleteActiveSessionByToken("");

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it("should return null and NOT call DB on null token", async () => {
        const result = await deleteActiveSessionByToken(null);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it("should return null and NOT call DB on undefined token", async () => {
        const result = await deleteActiveSessionByToken(undefined);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });
    });
  });
});
