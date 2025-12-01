// test/unitTesting/StockChart.test.jsx
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";

// --- Mock axios ---
vi.mock("axios");

// --- Helper: generate ISO date strings going back from today ---
function generateISODates(count) {
    const arr = [];
    const today = new Date();
    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        arr.push(d.toISOString());
    }
    return arr;
}

// --- Capture latest props passed to mocked Line component ---
let lastLineProps = null;
function clearLastLineProps() {
    lastLineProps = null;
}

// --- Mock react-chartjs-2 Line component ---
vi.mock("react-chartjs-2", () => {
    return {
        Line: (props) => {
            lastLineProps = props;
            return (
                <div
                    data-testid="mock-line"
                    data-labels={JSON.stringify(props.data?.labels || [])}
                    data-dataset-len={props.data?.datasets?.[0]?.data?.length ?? 0}
                >
                    Mock Line
                </div>
            );
        },
    };
});

// Import component after mocks
import StockChart from "../../src/components/StockChart";

describe("StockChart component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearLastLineProps();
    });

    it("shows loading while fetching data and then renders the chart", async () => {
        let resolver;
        const axiosPromise = new Promise((res) => { resolver = res; });
        axios.get.mockImplementation(() => axiosPromise);

        render(<StockChart symbol="AAPL" />);

        expect(screen.getByText(/Loading chart\.\.\./i)).toBeInTheDocument();

        const x = generateISODates(10);
        const y = Array.from({ length: 10 }, (_, i) => i + 1);

        await act(async () => { resolver({ data: { x, y } }); });

        await waitFor(() => expect(screen.getByTestId("mock-line")).toBeInTheDocument());
        expect(screen.queryByText(/Loading chart\.\.\./i)).not.toBeInTheDocument();
        expect(Number(screen.getByTestId("mock-line").getAttribute("data-dataset-len"))).toBe(10);
    });

    it("renders error message when axios throws", async () => {
        axios.get.mockRejectedValueOnce(new Error("Network failed"));
        render(<StockChart symbol="AAPL" />);
        await waitFor(() => expect(screen.getByText(/Failed to fetch stock chart data\./i)).toBeInTheDocument());
        expect(screen.queryByTestId("mock-line")).not.toBeInTheDocument();
    });

    it("has range buttons and toggles active class", async () => {
        const x = generateISODates(400);
        const y = Array.from({ length: 400 }, (_, i) => i + 1);
        axios.get.mockResolvedValueOnce({ data: { x, y } });

        render(<StockChart symbol="AAPL" />);
        await waitFor(() => expect(screen.getByTestId("mock-line")).toBeInTheDocument());

        const btn1M = screen.getByText("1M");
        const btn3M = screen.getByText("3M");
        const btn6M = screen.getByText("6M");
        const btn1Y = screen.getByText("1Y");

        expect(btn1Y.className).toContain("active");

        fireEvent.click(btn1M);
        await waitFor(() => expect(lastLineProps.data.datasets[0].data.length).toBe(30));
        expect(btn1M.className).toContain("active");

        fireEvent.click(btn3M);
        await waitFor(() => expect(lastLineProps.data.datasets[0].data.length).toBe(90));
        expect(btn3M.className).toContain("active");

        fireEvent.click(btn6M);
        await waitFor(() => expect(lastLineProps.data.datasets[0].data.length).toBe(180));
        expect(btn6M.className).toContain("active");

        fireEvent.click(btn1Y);
        await waitFor(() => expect(lastLineProps.data.datasets[0].data.length).toBe(365));
        expect(btn1Y.className).toContain("active");
    });

    it("sliceByRange returns entire arrays if not enough data (default fallback)", async () => {
        const x = generateISODates(20);
        const y = Array.from({ length: 20 }, (_, i) => i + 1);
        axios.get.mockResolvedValueOnce({ data: { x, y } });

        render(<StockChart symbol="AAPL" />);
        await waitFor(() => expect(screen.getByTestId("mock-line")).toBeInTheDocument());

        fireEvent.click(screen.getByText("1M"));
        await waitFor(() => expect(lastLineProps.data.datasets[0].data.length).toBe(20));
    });

    it("unsupported range returns raw ISO labels", async () => {
        const data = [
            { datetime: "2025-01-01", close: 100 },
            { datetime: "2025-01-02", close: 101 },
            { datetime: "2025-01-03", close: 102 },
        ];
        render(<StockChart symbol="AAPL" range="XYZ" data={data} />);
        await waitFor(() => expect(lastLineProps).not.toBeNull());
        expect(lastLineProps.data.labels).toEqual(data.map(d => d.datetime));
        expect(lastLineProps.data.datasets[0].data).toEqual(data.map(d => d.close));
    });

    it("tooltip callbacks produce expected title and label strings", async () => {
        const count = 50;
        const x = generateISODates(count);
        const y = Array.from({ length: count }, (_, i) => (i + 1) * 10);
        axios.get.mockResolvedValueOnce({ data: { x, y } });

        render(<StockChart symbol="AAPL" />);
        await waitFor(() => expect(lastLineProps).not.toBeNull());

        const callbacks = lastLineProps.options.plugins.tooltip.callbacks;
        const testIndex = 10;

        const titleResult = callbacks.title([{ dataIndex: testIndex }]);
        const expectedTitle = new Date(lastLineProps.data.labels[testIndex]).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        expect(titleResult).toBe(expectedTitle);

        const labelResult = callbacks.label({ parsed: { y: y[testIndex] } });
        expect(labelResult).toBe(`Price: ${y[testIndex].toLocaleString()}`);
    });

    it("sliceByRange returns all points if data is shorter than requested range", async () => {
        const x = generateISODates(10);
        const y = Array.from({ length: 10 }, (_, i) => i + 1);
        axios.get.mockResolvedValueOnce({ data: { x, y } });

        render(<StockChart symbol="AAPL" />);
        await waitFor(() => expect(lastLineProps).not.toBeNull());

        fireEvent.click(screen.getByText("1M"));
        await waitFor(() => {
            expect(lastLineProps.data.datasets[0].data.length).toBe(10);
            expect(lastLineProps.data.labels.length).toBe(10);
        });
    });

    it("y-axis ticks callback formats numbers correctly", async () => {
        const x = generateISODates(5);
        const y = [1000, 2000, 3000, 4000, 5000];
        axios.get.mockResolvedValueOnce({ data: { x, y } });

        render(<StockChart symbol="AAPL" />);
        await waitFor(() => expect(lastLineProps).not.toBeNull());

        const yTicksCallback = lastLineProps.options.scales.y.ticks.callback;
        y.forEach((val) => {
            expect(yTicksCallback(val)).toBe(Number(val).toLocaleString());
        });
    });
});
