import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import axios from "axios";

// SAFE MOCK for Chart.js Pie (prevents canvas context errors)
vi.mock("react-chartjs-2", () => {
  const pieMock = vi.fn((props) => <canvas data-testid="mock-pie-chart"></canvas>);
  return { Pie: pieMock };
});
import * as ChartMock from "react-chartjs-2";

vi.mock("axios");
axios.get = vi.fn();

window.matchMedia ??= function () {
  return { matches: false, addEventListener() {}, removeEventListener() {} };
};

vi.mock("../../src/components/SectorAllocation/SectorAllocation.css", () => ({}));

import SectorAllocationChart from "../../src/components/SectorAllocation/SectorAllocation.jsx";

const mockApiData = {
  labels: ["Tech", "Finance", "Energy"],
  values: [40, 35, 25],
};

describe("SectorAllocationChart Component — Full Coverage Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockReset();
    ChartMock.Pie.mockClear();
  });

  // -------------------------------------------------------------
  test("renders loading state initially", async () => {
    axios.get.mockResolvedValueOnce({ data: mockApiData });
    render(<SectorAllocationChart />);

    expect(screen.getByText(/Loading Allocation Data/i)).toBeInTheDocument();
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });

  // -------------------------------------------------------------
  test("renders chart on successful fetch", async () => {
    axios.get.mockResolvedValueOnce({ data: mockApiData });

    render(<SectorAllocationChart />);

    await waitFor(() =>
      expect(screen.getByTestId("mock-pie-chart")).toBeInTheDocument()
    );
  });

  // -------------------------------------------------------------
  test("handles missing labels or values (invalid backend format)", async () => {
    axios.get.mockResolvedValueOnce({ data: { wrong: "data" } });

    render(<SectorAllocationChart />);

    await screen.findByText("Failed to fetch allocation data from backend.");
  });

  // -------------------------------------------------------------
  test("handles generic backend failure", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    render(<SectorAllocationChart />);

    await screen.findByText("Failed to fetch allocation data from backend.");
  });

  // -------------------------------------------------------------
  test("handles 401 session expired", async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 401 } });

    render(<SectorAllocationChart />);

    await screen.findByText("Session expired. Please log in again.");
  });

  // -------------------------------------------------------------
  test("chart receives correct labels, values, and dynamic colors", async () => {
    axios.get.mockResolvedValueOnce({ data: mockApiData });

    render(<SectorAllocationChart />);

    await waitFor(() => ChartMock.Pie.mock.calls.length > 0);

    const lastCallProps = ChartMock.Pie.mock.calls.at(-1)[0];
    const data = lastCallProps.data;

    expect(data.labels).toEqual(mockApiData.labels);
    expect(data.datasets[0].data).toEqual(mockApiData.values);

    // dynamic colors length must match number of values
    expect(data.datasets[0].backgroundColor).toHaveLength(mockApiData.values.length);
  });

  // -------------------------------------------------------------
  test("tooltip callback formats label correctly", async () => {
    axios.get.mockResolvedValueOnce({ data: mockApiData });

    render(<SectorAllocationChart />);

    await waitFor(() => ChartMock.Pie.mock.calls.length > 0);

    const opts = ChartMock.Pie.mock.calls.at(-1)[0].options;
    const cb = opts.plugins.tooltip.callbacks.label;

    const result = cb({
      label: "Tech",
      parsed: 40
    });

    expect(result).toBe("Tech: 40%");
  });

  // -------------------------------------------------------------
  test("animation options exist and are passed to chart", async () => {
    axios.get.mockResolvedValueOnce({ data: mockApiData });

    render(<SectorAllocationChart />);

    await waitFor(() => ChartMock.Pie.mock.calls.length > 0);

    const opts = ChartMock.Pie.mock.calls.at(-1)[0].options;

    expect(opts.animation.animateScale).toBe(true);
    expect(opts.animation.animateRotate).toBe(true);
  });


  test("handles missing values while labels exist", async () => {
    axios.get.mockResolvedValueOnce({
      data: { labels: ["Tech", "Finance"] } // values missing
    });

    render(<SectorAllocationChart />);

    await screen.findByText("Failed to fetch allocation data from backend.");
  });

  test("handles missing labels while values exist", async () => {
    axios.get.mockResolvedValueOnce({
      data: { values: [30, 40] } // labels missing
    });

    render(<SectorAllocationChart />);

    await screen.findByText("Failed to fetch allocation data from backend.");
  });

});
