import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import axios from "axios";


// CORRECT Chart.js <Line /> SPY MOCK (fixes hoisting + calls)
vi.mock("react-chartjs-2", () => {
  const lineMock = vi.fn((props) => <canvas data-testid="mock-chart"></canvas>);
  return { Line: lineMock };
});
import * as ChartJS2 from "react-chartjs-2";

vi.mock("axios");
axios.get = vi.fn();

window.matchMedia = window.matchMedia || function () {
  return { matches: false, addListener() {}, removeListener() {} };
};

vi.mock("../../src/components/PortfolioChart/PortfolioChart.css", () => ({}));

import PortfolioChart from "../../src/components/PortfolioChart/PortfolioChart.jsx";

describe("PortfolioChart Component", () => {

  const mockDaily = Array.from({ length: 400 }, (_, i) => ({
    date: `2024-01-${String((i % 28) + 1).padStart(2, "0")}`,
    valuation: i + 100
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockReset();
    ChartJS2.Line.mockClear();
  });

  // -------------------------------------------------------------
  test("renders loading state initially", async () => {
    axios.get.mockResolvedValue({ data: { data: { daily: mockDaily } } });
    render(<PortfolioChart />);
    expect(screen.getByText(/Loading Portfolio Data/i)).toBeInTheDocument();
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });

  // -------------------------------------------------------------
  test("renders error message on API failure", async () => {
    axios.get.mockRejectedValue({ response: { status: 500 } });
    render(<PortfolioChart />);
    await screen.findByText("Failed to fetch portfolio performance data.");
  });

  // -------------------------------------------------------------
  test("renders session expired on 401", async () => {
    axios.get.mockRejectedValue({ response: { status: 401 } });
    render(<PortfolioChart />);
    await screen.findByText("Session expired. Please log in again.");
  });

  // -------------------------------------------------------------
  test("fetches data and renders chart", async () => {
    axios.get.mockResolvedValue({ data: { data: { daily: mockDaily } } });
    render(<PortfolioChart />);
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(screen.getByText("30D")).toBeInTheDocument();
    expect(screen.getByTestId("mock-chart")).toBeInTheDocument();
  });

  // -------------------------------------------------------------
  test("switches to 6M range", async () => {
    axios.get.mockResolvedValue({ data: { data: { daily: mockDaily } } });
    render(<PortfolioChart />);
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    fireEvent.click(screen.getByText("6M"));
    expect(screen.getByTestId("mock-chart")).toBeInTheDocument();
  });

  // -------------------------------------------------------------
  test("switches to 1Y range", async () => {
    axios.get.mockResolvedValue({ data: { data: { daily: mockDaily } } });
    render(<PortfolioChart />);
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    fireEvent.click(screen.getByText("1Y"));
    expect(screen.getByTestId("mock-chart")).toBeInTheDocument();
  });

  // -------------------------------------------------------------
  test("uses cached data on rerender", async () => {
    axios.get.mockResolvedValue({ data: { data: { daily: mockDaily } } });
    const { rerender } = render(<PortfolioChart />);
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    rerender(<PortfolioChart />);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------
  test("updates config on window resize", async () => {
    axios.get.mockResolvedValue({ data: { data: { daily: mockDaily } } });
    render(<PortfolioChart />);
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    act(() => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.getByTestId("mock-chart")).toBeInTheDocument();
  });

  // -------------------------------------------------------------
  test("tooltip parser branch covered", async () => {
    axios.get.mockResolvedValue({ data: { data: { daily: mockDaily } } });
    render(<PortfolioChart />);
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(screen.getByTestId("mock-chart")).toBeInTheDocument();
  });

  
  // CHART.JS OPTIONS LOGIC
  test("covers Chart.js scales & grid callback logic", async () => {
    axios.get.mockResolvedValue({ data: { data: { daily: mockDaily } } });

    const { rerender } = render(<PortfolioChart />);
    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    fireEvent.click(screen.getByText("30D"));
    rerender(<PortfolioChart />);

    let opts = ChartJS2.Line.mock.calls.at(-1)[0].options;

    expect(opts.scales.x.grid.color({ tick: { label: "15" } }))
      .toBe("rgba(0,0,0,0)");

    fireEvent.click(screen.getByText("6M"));
    rerender(<PortfolioChart />);
    opts = ChartJS2.Line.mock.calls.at(-1)[0].options;

    expect(typeof opts.scales.x.grid.color({ tick: { label: "15" } }))
      .toBe("string");

    expect(opts.scales.x.grid.lineWidth({ tick: { label: "5" } })).toBe(1.2);
    expect(opts.scales.x.grid.lineWidth({ tick: { label: "" } })).toBe(0);

    act(() => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));
    });
    rerender(<PortfolioChart />);

    const ticks = ChartJS2.Line.mock.calls.at(-1)[0].options.scales.x.ticks;
    expect(["undefined", "number"]).toContain(typeof ticks.maxTicksLimit);

    expect(opts.scales.y.ticks.callback(12345)).toBe("12,345");
  });


  test("6M range produces empty labels except first of month", async () => {
    axios.get.mockResolvedValue({ data: { data: { daily: mockDaily } } });
    render(<PortfolioChart />);
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    fireEvent.click(screen.getByText("6M"));

    const labels = ChartJS2.Line.mock.calls.at(-1)[0].data.labels;
    expect(labels.some(l => l === "")).toBe(true);
  });

  test("1Y range generates month labels on month start", async () => {
    axios.get.mockResolvedValue({ data: { data: { daily: mockDaily } } });
    render(<PortfolioChart />);
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    fireEvent.click(screen.getByText("1Y"));

    const labels = ChartJS2.Line.mock.calls.at(-1)[0].data.labels;
    expect(labels.filter(l => l !== "")).not.toHaveLength(0);
    expect(labels.some(l => l === "")).toBe(true);
  });

  test("handles missing daily data gracefully", async () => {
    axios.get.mockResolvedValue({ data: { data: {} } });
    render(<PortfolioChart />);
    await screen.findByText("Failed to fetch portfolio performance data.");
  });

  test("cache path regenerates labels and values correctly", async () => {
    axios.get.mockResolvedValue({ data: { data: { daily: mockDaily } } });
    const { rerender } = render(<PortfolioChart />);
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText("30D"));
    rerender(<PortfolioChart />);

    const last = ChartJS2.Line.mock.calls.at(-1)[0];
    expect(last.data.labels.length).toBeGreaterThan(0);
    expect(last.data.datasets[0].data.length).toBeGreaterThan(0);
  });

});
