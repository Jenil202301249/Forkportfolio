import { describe, it, expect, beforeEach } from "vitest";
import "@testing-library/react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import {
  formatDate,
  formatSmallNumber,
  roundTo,
  formatLargeNumber,
  formatPercentage,
  getPortfolioRiskFromCaps,
  getCapCategory,
  formatWithIndianCommas
} from "../../src/utils/dataCleaningFuncs";

import * as Utils from "../../src/utils/dataCleaningFuncs"; // For spying later



// -------------------------------------------------------------
// formatDate()
// -------------------------------------------------------------
describe("formatDate() formatDate method", () => {
  describe("Happy Path Tests", () => {
    it("formats a valid ISO date string correctly", () => {
      const isoString = "2023-10-15T00:00:00Z";
      const formattedDate = formatDate(isoString);
      expect(formattedDate).toBe("Oct 15, 2023");
    });

    it("handles a valid ISO date string with time correctly", () => {
      const isoString = "2023-10-15T14:30:00Z";
      const formattedDate = formatDate(isoString);
      expect(formattedDate).toBe("Oct 15, 2023");
    });
  });

  describe("Edge Case Tests", () => {
    it("returns '--' for null input", () => {
      expect(formatDate(null)).toBe("--");
    });

    it("returns '--' for undefined input", () => {
      expect(formatDate(undefined)).toBe("--");
    });

    it("returns '--' for a negative date string", () => {
      expect(formatDate("-2023-10-15T00:00:00Z")).toBe("--");
    });
  });
});


// -------------------------------------------------------------
// formatLargeNumber()
// -------------------------------------------------------------
describe("formatLargeNumber() formatLargeNumber method", () => {
  describe("Happy Paths", () => {
    it("formats numbers in the trillions correctly", () => {
      expect(formatLargeNumber(1.5e12)).toBe("1.50T");
    });

    it("formats billions correctly", () => {
      expect(formatLargeNumber(2.3e9)).toBe("2.30B");
    });

    it("formats millions correctly", () => {
      expect(formatLargeNumber(4.5e6)).toBe("4.50M");
    });

    it("formats thousands correctly", () => {
      expect(formatLargeNumber(7.8e3)).toBe("7.80K");
    });

    it("formats numbers < 1000 correctly", () => {
      expect(formatLargeNumber(123.45)).toBe("123.45");
    });
  });

  describe("Edge Cases", () => {
    it("returns '--' for null input", () => {
      expect(formatLargeNumber(null)).toBe("--");
    });

    it("returns '--' for undefined input", () => {
      expect(formatLargeNumber(undefined)).toBe("--");
    });

    it("returns '--' for non-numeric input", () => {
      expect(formatLargeNumber("abc")).toBe("--");
    });

    it("handles negative numbers correctly", () => {
      expect(formatLargeNumber(-1.5e12)).toBe("-1.50T");
    });

    it("handles zero correctly", () => {
      expect(formatLargeNumber(0)).toBe("0.00");
    });
  });
});


// -------------------------------------------------------------
// formatPercentage()
// -------------------------------------------------------------
describe("formatPercentage() formatPercentage method", () => {
  describe("Happy Path Tests", () => {
    it("formats numbers >= 1 correctly", () => {
      expect(formatPercentage(1.23)).toBe("1.23");
    });

    it("formats numbers < 1 correctly", () => {
      expect(formatPercentage(0.456)).toBe("45.60");
    });

    it("respects given decimals", () => {
      expect(formatPercentage(0.456, 1)).toBe("45.6");
    });
  });

  describe("Edge Case Tests", () => {
    it("returns '--' for null", () => {
      expect(formatPercentage(null)).toBe("--");
    });

    it("returns '--' for undefined", () => {
      expect(formatPercentage(undefined)).toBe("--");
    });

    it("returns '--' for non-numeric input", () => {
      expect(formatPercentage("abc")).toBe("--");
    });

    it("handles zero correctly", () => {
      expect(formatPercentage(0)).toBe("0.00");
    });

    it("handles negative correctly", () => {
      expect(formatPercentage(-0.5)).toBe("-50.00");
    });
  });
});


// -------------------------------------------------------------
// formatSmallNumber()
// -------------------------------------------------------------
describe("formatSmallNumber() formatSmallNumber method", () => {
  describe("Happy Paths", () => {
    it("formats a small number", () => {
      expect(formatSmallNumber(0.0005)).toBe("0");
    });

    it("formats a regular number", () => {
      expect(formatSmallNumber(123.456)).toBe("123.46");
    });

    it("handles negative small numbers", () => {
      expect(formatSmallNumber(-0.004)).toBe("0");
    });
  });

  describe("Edge Cases", () => {
    it("returns '--' for null", () => {
      expect(formatSmallNumber(null)).toBe("--");
    });

    it("returns '--' for undefined", () => {
      expect(formatSmallNumber(undefined)).toBe("--");
    });

    it("returns '--' for non-numeric", () => {
      expect(formatSmallNumber("abc")).toBe("--");
    });

    it("handles extremely small numbers", () => {
      expect(formatSmallNumber(0.0000001)).toBe("0");
    });

    it("handles very large numbers", () => {
      expect(formatSmallNumber(1e10)).toBe("10000000000.00");
    });
  });
});


// -------------------------------------------------------------
// getCapCategory()
// -------------------------------------------------------------
describe("getCapCategory() getCapCategory method", () => {
  describe("Happy Paths", () => {
    it("returns 'large' for ≥ 20,000 crore", () => {
      expect(getCapCategory(20000 * 1e7)).toBe("large");
    });

    it("returns 'mid' for 5,000–20,000 crore", () => {
      expect(getCapCategory(10000 * 1e7)).toBe("mid");
    });

    it("returns 'small' for < 5,000 crore", () => {
      expect(getCapCategory(3000 * 1e7)).toBe("small");
    });
  });

  describe("Edge Cases", () => {
    it("returns 'unknown' for 0", () => {
      expect(getCapCategory(0)).toBe("unknown");
    });

    it("returns 'unknown' for negative values", () => {
      expect(getCapCategory(-1000)).toBe("unknown");
    });

    it("returns 'unknown' for non-numeric", () => {
      expect(getCapCategory("not-a-number")).toBe("unknown");
    });

    it("returns 'unknown' for undefined", () => {
      expect(getCapCategory(undefined)).toBe("unknown");
    });

    it("returns 'unknown' for null", () => {
      expect(getCapCategory(null)).toBe("unknown");
    });
  });
});


// -------------------------------------------------------------
// roundTo()
// -------------------------------------------------------------
const MockComponent = ({ num, decimals }) => {
  const roundedValue = roundTo(num, decimals);
  return <div data-testid="rounded-value">{roundedValue}</div>;
};

describe("roundTo() roundTo method", () => {
  describe("Happy Paths", () => {
    it("rounds positive numbers", () => {
      render(<MockComponent num={123.456} />);
      expect(screen.getByTestId("rounded-value")).toHaveTextContent("123.46");
    });

    it("rounds negative numbers", () => {
      render(<MockComponent num={-123.456} />);
      expect(screen.getByTestId("rounded-value")).toHaveTextContent("-123.46");
    });

    it("rounds to specific decimals", () => {
      render(<MockComponent num={123.456789} decimals={4} />);
      expect(screen.getByTestId("rounded-value")).toHaveTextContent("123.4568");
    });
  });

  describe("Edge Cases", () => {
    it("returns '--' for null", () => {
      render(<MockComponent num={null} />);
      expect(screen.getByTestId("rounded-value")).toHaveTextContent("--");
    });

    it("returns '--' for undefined", () => {
      render(<MockComponent num={undefined} />);
      expect(screen.getByTestId("rounded-value")).toHaveTextContent("--");
    });

    it("returns '--' for NaN", () => {
      render(<MockComponent num={NaN} />);
      expect(screen.getByTestId("rounded-value")).toHaveTextContent("--");
    });

    it("handles zero", () => {
      render(<MockComponent num={0} />);
      expect(screen.getByTestId("rounded-value")).toHaveTextContent("0.00");
    });

    it("handles large numbers", () => {
      render(<MockComponent num={1e10} />);
      expect(screen.getByTestId("rounded-value")).toHaveTextContent("10000000000.00");
    });

    it("handles tiny numbers", () => {
      render(<MockComponent num={1e-10} />);
      expect(screen.getByTestId("rounded-value")).toHaveTextContent("0.00");
    });
  });
});


// -------------------------------------------------------------
// getPortfolioRiskFromCaps()
// -------------------------------------------------------------
describe("getPortfolioRiskFromCaps()", () => {

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Utils, "getCapCategory");
  });

  it("returns 'Aggressive' when riskScore ≥ 15", () => {
    Utils.getCapCategory
      .mockReturnValueOnce("small")
      .mockReturnValueOnce("small")
      .mockReturnValueOnce("small")
      .mockReturnValueOnce("small")
      .mockReturnValueOnce("small");

    const portfolio = [
        {marketcap: 1e10},
        {marketcap: 1e10},
        {marketcap: 1e10},
        {marketcap: 1e10},
        {marketcap: 1e10}
    ];
    expect(getPortfolioRiskFromCaps(portfolio)).toBe("Aggressive");
  });

  it("returns 'Moderate' when 9 ≤ riskScore < 15", () => {
    Utils.getCapCategory
      .mockReturnValueOnce("small")  // 3
      .mockReturnValueOnce("small")  // 3
      .mockReturnValueOnce("mid")    // 2
      .mockReturnValueOnce("mid")    // 2
      .mockReturnValueOnce("large"); // 1 → Total = 11

    const portfolio = [
        {marketcap: 1e10},
        {marketcap: 1e10},
        {marketcap: 1e11},
        {marketcap: 1e11},
        {marketcap: 2*1e11}
    ];
    expect(getPortfolioRiskFromCaps(portfolio)).toBe("Moderate");
  });

  it("returns 'Conservative' when riskScore < 9", () => {
    Utils.getCapCategory
      .mockReturnValueOnce("large")
      .mockReturnValueOnce("large")
      .mockReturnValueOnce("large");

    const result = getPortfolioRiskFromCaps([{},{},{}]);
    expect(result).toBe("Conservative");
  });

  it("returns 'Conservative' for empty portfolio", () => {
    expect(getPortfolioRiskFromCaps([])).toBe("Conservative");
  });

  it("ignores unknown categories", () => {
    Utils.getCapCategory
      .mockReturnValueOnce("unknown")
      .mockReturnValueOnce("unknown");

    expect(getPortfolioRiskFromCaps([{},{}])).toBe("Conservative");
  });

  it("handles mixed valid + unknown", () => {
    Utils.getCapCategory
      .mockReturnValueOnce("small")   // 3
      .mockReturnValueOnce("unknown") // 0
      .mockReturnValueOnce("large");  // 1

    expect(getPortfolioRiskFromCaps([{marketcap: 1e10}, {}, {marketcap: 2*1e11}])).toBe("Conservative");
  });

  it("returns 'Aggressive' for many smallcaps", () => {
    Utils.getCapCategory.mockReturnValue("small");

    const bigPortfolio = new Array(10).fill({marketcap: 1e10});
    expect(getPortfolioRiskFromCaps(bigPortfolio)).toBe("Aggressive");
  });
});


describe("formatWithIndianCommas() formatWithIndianCommas method", () => {
  
  // ---------------------------
  // HAPPY PATH TESTS
  // ---------------------------
  describe("Happy Paths", () => {
    it("formats a large number with Indian commas correctly", () => {
      const num = 1234567890.12;
      const formattedNum = formatWithIndianCommas(num);
      expect(formattedNum).toBe("1,23,45,67,890.12");
    });

    it("formats a small number with Indian commas correctly", () => {
      const num = 1234.56;
      const formattedNum = formatWithIndianCommas(num);
      expect(formattedNum).toBe("1,234.56");
    });

    it("formats zero correctly", () => {
      const num = 0;
      const formattedNum = formatWithIndianCommas(num);
      expect(formattedNum).toBe("0.00");
      // (or "0.00" depending on your function's logic)
    });
  });

  // ---------------------------
  // EDGE CASE TESTS
  // ---------------------------
  describe("Edge Cases", () => {
    it("returns '--' for null input", () => {
      expect(formatWithIndianCommas(null)).toBe("--");
    });

    it("returns '--' for undefined input", () => {
      expect(formatWithIndianCommas(undefined)).toBe("--");
    });

    it("returns '--' for non-numeric input", () => {
      expect(formatWithIndianCommas("abc")).toBe("--");
    });

    it("handles negative numbers correctly", () => {
      const num = -123456.78;
      const formattedNum = formatWithIndianCommas(num);
      expect(formattedNum).toBe("-1,23,456.78");
    });

    it("handles very large numbers correctly", () => {
      const num = 123456789012345.67;
      const formattedNum = formatWithIndianCommas(num);
      expect(formattedNum).toBe("12,34,56,78,90,12,345.67");
    });
  });
});
