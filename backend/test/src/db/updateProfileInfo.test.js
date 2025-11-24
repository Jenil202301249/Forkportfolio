// @ts-nocheck
import { sql } from "../../../src/db/dbConnection.js";
import {
  updateProfileName,
  updateProfileInvestmentExperience,
  updateProfileRiskProfile,
  updateProfileFinancialGoals,
  updateProfileInvestmentHorizon,
} from "../../../src/db/updateProfileInfo.js";

// Mock SQL
jest.mock("../../../src/db/dbConnection.js", () => ({
  sql: jest.fn(),
}));

describe("Profile Update Methods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Common invalid values
  const invalidValues = [null, undefined, ""];

  // Utility to generate consistent tests
  const runValidationTests = (fn, validArgs) => {
    invalidValues.forEach((invalid) => {
      it(`should return null & NOT call DB if email is '${invalid}'`, async () => {
        const args = [invalid, validArgs[1]];
        const result = await fn(...args);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it(`should return null & NOT call DB if second parameter is '${invalid}'`, async () => {
        const args = [validArgs[0], invalid];
        const result = await fn(...args);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });
    });
  };

  //-------------------------------------------------------
  // updateProfileName
  //-------------------------------------------------------
  describe("updateProfileName()", () => {
    it("should update name for valid email & name", async () => {
      const email = "user@example.com";
      const name = "John Doe";
      const mockResult = [{ id: 1 }];

      sql.mockResolvedValue(mockResult);

      const result = await updateProfileName(email, name);

      expect(result).toEqual(mockResult);
      expect(sql).toHaveBeenCalledTimes(1);
      expect(sql.mock.calls[0][1]).toBe(name);
      expect(sql.mock.calls[0][2]).toBe(email);
    });

    it("should return null when DB throws error", async () => {
      const email = "user@example.com";
      const name = "John Doe";

      sql.mockRejectedValue(new Error("DB error"));

      const result = await updateProfileName(email, name);

      expect(result).toBeNull();
      expect(sql).toHaveBeenCalledTimes(1);
    });

    runValidationTests(updateProfileName, ["user@example.com", "John Doe"]);
  });

  //-------------------------------------------------------
  // updateProfileInvestmentExperience
  //-------------------------------------------------------
  describe("updateProfileInvestmentExperience()", () => {
    it("should update investment experience for valid args", async () => {
      const email = "user@example.com";
      const val = "Beginner";
      const mockResult = [{ id: 2 }];

      sql.mockResolvedValue(mockResult);

      const result = await updateProfileInvestmentExperience(email, val);

      expect(result).toEqual(mockResult);
      expect(sql).toHaveBeenCalledTimes(1);
      expect(sql.mock.calls[0][1]).toBe(val);
      expect(sql.mock.calls[0][2]).toBe(email);
    });

    it("should return null when DB throws error", async () => {
      const email = "user@example.com";
      const val = "Beginner";

      sql.mockRejectedValue(new Error("DB error"));

      const result = await updateProfileInvestmentExperience(email, val);

      expect(result).toBeNull();
      expect(sql).toHaveBeenCalledTimes(1);
    });

    runValidationTests(updateProfileInvestmentExperience, [
      "user@example.com",
      "Beginner",
    ]);
  });

  //-------------------------------------------------------
  // updateProfileRiskProfile
  //-------------------------------------------------------
  describe("updateProfileRiskProfile()", () => {
    it("should update risk profile for valid args", async () => {
      const email = "user@example.com";
      const risk = "Moderate";
      const mockResult = [{ id: 3 }];

      sql.mockResolvedValue(mockResult);

      const result = await updateProfileRiskProfile(email, risk);

      expect(result).toEqual(mockResult);
      expect(sql).toHaveBeenCalledTimes(1);
      expect(sql.mock.calls[0][1]).toBe(risk);
      expect(sql.mock.calls[0][2]).toBe(email);
    });

    it("should return null when DB throws error", async () => {
      const email = "user@example.com";
      const risk = "Moderate";

      sql.mockRejectedValue(new Error("DB error"));

      const result = await updateProfileRiskProfile(email, risk);

      expect(result).toBeNull();
      expect(sql).toHaveBeenCalledTimes(1);
    });

    runValidationTests(updateProfileRiskProfile, [
      "user@example.com",
      "Moderate",
    ]);
  });

  //-------------------------------------------------------
  // updateProfileFinancialGoals
  //-------------------------------------------------------
  describe("updateProfileFinancialGoals()", () => {
    it("should update financial goals for valid args", async () => {
      const email = "user@example.com";
      const goals = "Retirement";
      const mockResult = [{ id: 4 }];

      sql.mockResolvedValue(mockResult);

      const result = await updateProfileFinancialGoals(email, goals);

      expect(result).toEqual(mockResult);
      expect(sql).toHaveBeenCalledTimes(1);
      expect(sql.mock.calls[0][1]).toBe(goals);
      expect(sql.mock.calls[0][2]).toBe(email);
    });

    it("should return null when DB throws error", async () => {
      const email = "user@example.com";
      const goals = "Retirement";

      sql.mockRejectedValue(new Error("DB error"));

      const result = await updateProfileFinancialGoals(email, goals);

      expect(result).toBeNull();
      expect(sql).toHaveBeenCalledTimes(1);
    });

    runValidationTests(updateProfileFinancialGoals, [
      "user@example.com",
      "Retirement",
    ]);
  });

  //-------------------------------------------------------
  // updateProfileInvestmentHorizon
  //-------------------------------------------------------
  describe("updateProfileInvestmentHorizon()", () => {
    it("should update investment horizon for valid args", async () => {
      const email = "user@example.com";
      const horizon = "Long Term";
      const mockResult = [{ id: 5 }];

      sql.mockResolvedValue(mockResult);

      const result = await updateProfileInvestmentHorizon(email, horizon);

      expect(result).toEqual(mockResult);
      expect(sql).toHaveBeenCalledTimes(1);
      expect(sql.mock.calls[0][1]).toBe(horizon);
      expect(sql.mock.calls[0][2]).toBe(email);
    });

    it("should return null when DB throws error", async () => {
      const email = "user@example.com";
      const horizon = "Long Term";

      sql.mockRejectedValue(new Error("DB error"));

      const result = await updateProfileInvestmentHorizon(email, horizon);

      expect(result).toBeNull();
      expect(sql).toHaveBeenCalledTimes(1);
    });

    runValidationTests(updateProfileInvestmentHorizon, [
      "user@example.com",
      "Long Term",
    ]);
  });
});
