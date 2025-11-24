// @ts-nocheck
import { sql } from "../../../src/db/dbConnection.js";
import {
  updateTheme,
  updateDashboardLayout,
} from "../../../src/db/updatePreferencesAndPersonalisation.js";

// Mock SQL
jest.mock("../../../src/db/dbConnection.js", () => ({
  sql: jest.fn(),
}));

describe("User Settings Update Methods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ======================================================
  // updateTheme(email, theme)
  // ======================================================
  describe("updateTheme()", () => {
    // ----------------------------
    // HAPPY PATH
    // ----------------------------
    it("should update theme for valid email and theme", async () => {
      const mockEmail = "user@example.com";
      const mockTheme = "dark";
      const mockResult = [{ id: 1 }];

      sql.mockResolvedValue(mockResult);

      const result = await updateTheme(mockEmail, mockTheme);

      expect(result).toEqual(mockResult);
      expect(sql).toHaveBeenCalledTimes(1);

      // Check correct parameters passed
      expect(sql.mock.calls[0][1]).toBe(mockTheme);
      expect(sql.mock.calls[0][2]).toBe(mockEmail);
    });

    // ----------------------------
    // DB ERROR CASE
    // ----------------------------
    it("should return null when DB throws error", async () => {
      const mockEmail = "user@example.com";
      const mockTheme = "dark";

      sql.mockRejectedValue(new Error("DB error"));

      const result = await updateTheme(mockEmail, mockTheme);

      expect(result).toBeNull();
      expect(sql).toHaveBeenCalledTimes(1);
    });

    // ----------------------------
    // VALIDATION CASES
    // ----------------------------
    const invalidValues = [null, undefined, ""];

    invalidValues.forEach((val) => {
      it(`should return null & NOT call DB if email is '${val}'`, async () => {
        const result = await updateTheme(val, "dark");

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it(`should return null & NOT call DB if theme is '${val}'`, async () => {
        const result = await updateTheme("user@example.com", val);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });
    });
  });

  // ======================================================
  // updateDashboardLayout(email, dashboardlayout)
  // ======================================================
  describe("updateDashboardLayout()", () => {
    // ----------------------------
    // HAPPY PATH
    // ----------------------------
    it("should update dashboardlayout for valid email and layout", async () => {
      const mockEmail = "user@example.com";
      const mockLayout = "layout2";
      const mockResult = [{ id: 3 }];

      sql.mockResolvedValue(mockResult);

      const result = await updateDashboardLayout(mockEmail, mockLayout);

      expect(result).toEqual(mockResult);
      expect(sql).toHaveBeenCalledTimes(1);

      // Check parameters passed
      expect(sql.mock.calls[0][1]).toBe(mockLayout);
      expect(sql.mock.calls[0][2]).toBe(mockEmail);
    });

    // ----------------------------
    // DB ERROR CASE
    // ----------------------------
    it("should return null when DB throws error", async () => {
      const mockEmail = "user@example.com";
      const mockLayout = "layout1";

      sql.mockRejectedValue(new Error("DB error"));

      const result = await updateDashboardLayout(mockEmail, mockLayout);

      expect(result).toBeNull();
      expect(sql).toHaveBeenCalledTimes(1);
    });

    // ----------------------------
    // VALIDATION CASES
    // ----------------------------
    const invalidValues = [null, undefined, ""];

    invalidValues.forEach((val) => {
      it(`should return null & NOT call DB if email is '${val}'`, async () => {
        const result = await updateDashboardLayout(val, "layout1");

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });

      it(`should return null & NOT call DB if dashboardlayout is '${val}'`, async () => {
        const result = await updateDashboardLayout("user@example.com", val);

        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
      });
    });
  });
});
