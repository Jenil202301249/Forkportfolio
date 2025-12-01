import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

// -------------------------------------
// MOCK useNavigate
// -------------------------------------
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// -------------------------------------
// IMPORT COMPONENT
// -------------------------------------
import { PortfolioSummary } from "../../src/components/PortfolioSummary";

describe("PortfolioSummary Component", () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    const mockData = [
        {
            symbol: "AAPL",
            lastPrice: "150",
            changePercent: "2.5",
            change: "3",
            currency: "USD",
            marketTime: "2023-10-01",
            volume: "50M",
            shares: 10,
            dayRange: "140 → 152",
            yearRange: "120 → 180",
            marketCap: "2T",
        },
        {
            symbol: "TSLA",
            lastPrice: "200",
            changePercent: "-1.5",
            change: "-3",
            currency: "USD",
            marketTime: "2023-10-02",
            volume: "40M",
            shares: 5,
            dayRange: "180 → 205",
            yearRange: "150 → 300",
            marketCap: "800B",
        },
    ];

    // -------------------------------------------------------
    // 1. Renders all headers
    // -------------------------------------------------------
    it("renders all table headers", () => {
        render(
            <MemoryRouter>
                <PortfolioSummary portfolioSummary={mockData} />
            </MemoryRouter>
        );

        const headers = [
            "Stock",
            "Last Price",
            "Change (%)",
            "Change",
            "Currency",
            "Market Time",
            "Volume",
            "Shares",
            "Day Range",
            "52W Range",
            "Market Cap",
        ];

        headers.forEach((h) => {
            expect(screen.getByText(h)).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------
    // 2. Renders all values correctly
    // -------------------------------------------------------
    it("renders portfolio rows with correct values", () => {
        render(
            <MemoryRouter>
                <PortfolioSummary portfolioSummary={mockData} />
            </MemoryRouter>
        );

        // First row (positive)
        expect(screen.getAllByText("USD").length).toBe(2); // USD appears twice

        expect(screen.getAllByText("2.5%")[0]).toHaveClass("positive");
        expect(screen.getAllByText("3")[0]).toHaveClass("positive");

        // Day range
        expect(screen.getByText("140 → 152")).toHaveClass("range");

        // Second row (negative)
        expect(screen.getAllByText("-1.5%")[0]).toHaveClass("negative");
        expect(screen.getAllByText("-3")[0]).toHaveClass("negative");

        expect(screen.getByText("180 → 205")).toHaveClass("range");
    });

    // -------------------------------------------------------
    // 3. Clicking stock navigates correctly
    // -------------------------------------------------------
    it("navigates to stock details on clicking symbol", () => {
        render(
            <MemoryRouter>
                <PortfolioSummary portfolioSummary={mockData} />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText("AAPL"));

        expect(mockNavigate).toHaveBeenCalledWith("/stockdetails/AAPL");
    });

    // -------------------------------------------------------
    // 4. Handles empty arrays safely
    // -------------------------------------------------------
    it("renders only header row when portfolioSummary is empty", () => {
        render(
            <MemoryRouter>
                <PortfolioSummary portfolioSummary={[]} />
            </MemoryRouter>
        );

        const rows = screen.getAllByRole("row");
        expect(rows.length).toBe(1); // only header
    });

    // -------------------------------------------------------
    // 5. Handles undefined safely
    // -------------------------------------------------------
    it("does not crash when portfolioSummary is undefined", () => {
        render(
            <MemoryRouter>
                <PortfolioSummary />
            </MemoryRouter>
        );

        const rows = screen.getAllByRole("row");
        expect(rows.length).toBe(1); // only header
    });
});
