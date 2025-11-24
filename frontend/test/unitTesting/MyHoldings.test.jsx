import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import axios from "axios";

// MOCK axios
vi.mock("axios");
axios.get = vi.fn();

// MOCK CSS
vi.mock("../../src/components/MyHoldings/MyHoldings.css", () => ({}));

// IMPORT COMPONENT
import MyHoldings from "../../src/components/MyHoldings/MyHoldings.jsx";

// SHARED MOCK HOLDINGS
const mockHoldings = [
  {
    shortName: "TCS",
    quantity: 10,
    avg_price: 3200,
    current_price: 3500,
    value: 35000
  },
  {
    shortName: "INFY",
    quantity: 5,
    avg_price: 1400,
    current_price: 1500,
    value: 7500
  }
];

describe("MyHoldings Component — Full Coverage Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------
  test("shows loading state initially", async () => {
    axios.get.mockResolvedValueOnce({
      data: { data: mockHoldings }
    });

    render(<MyHoldings />);

    expect(screen.getByText("Loading holdings...")).toBeInTheDocument();

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });

  // -------------------------------------------------------------
  test("renders table correctly on successful fetch", async () => {
    axios.get.mockResolvedValueOnce({
      data: { data: mockHoldings }
    });

    render(<MyHoldings />);

    await screen.findByText("My Holdings");

    // Validate stock rows
    expect(screen.getByText("TCS")).toBeInTheDocument();
    expect(screen.getByText("INFY")).toBeInTheDocument();

    // Values formatted properly
    expect(screen.getByText("3,200")).toBeInTheDocument();
    expect(screen.getByText("3,500")).toBeInTheDocument();
    expect(screen.getByText("35,000")).toBeInTheDocument();
  });

  // -------------------------------------------------------------
  test("handles API error gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network failed"));

    render(<MyHoldings />);

    await screen.findByText("Failed to load holdings. Please ensure you are logged in.");
  });

  // -------------------------------------------------------------
  test("handles invalid response format", async () => {
    axios.get.mockResolvedValueOnce({
      data: { message: "wrong format" } // missing data array
    });

    render(<MyHoldings />);

    await screen.findByText("Failed to load holdings. Please ensure you are logged in.");
  });

  // -------------------------------------------------------------
  test("renders empty holdings table correctly", async () => {
  axios.get.mockResolvedValueOnce({
    data: { data: [] }
  });

  render(<MyHoldings />);

  await screen.findByText("My Holdings");

  // Only header row is rendered
  const rows = screen.getAllByRole("row");
  expect(rows.length).toBe(1); // correct: only header row
});


  // -------------------------------------------------------------
  test("component renders title always after loading", async () => {
    axios.get.mockResolvedValueOnce({
      data: { data: mockHoldings }
    });

    render(<MyHoldings />);

    await screen.findByText("My Holdings");

    expect(screen.getByText("See More →")).toBeInTheDocument();
  });
});
