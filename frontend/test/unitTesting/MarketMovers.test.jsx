import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import axios from "axios";

vi.mock("axios");
axios.get = vi.fn();
vi.mock("../../src/components/MarketMovers/MarketMovers.css", () => ({}));
vi.mock("../../src/assets/tata-icon.png", () => ({ default: "tata" }));
vi.mock("../../src/assets/reliance-icon.png", () => ({ default: "reliance" }));
vi.mock("../../src/assets/adani-icon.png", () => ({ default: "adani" }));
vi.mock("../../src/assets/mahindra-icon.png", () => ({ default: "mahindra" }));
vi.mock("../../src/assets/bajaj-icon.png", () => ({ default: "bajaj" }));
vi.mock("../../src/assets/adityabirla-icon.png", () => ({ default: "birla" }));


const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import MarketMovers from "../../src/components/MarketMovers/MarketMovers.jsx";
const now = Date.now();

const mockNews = [
  {
    title: "Market jumps",
    providerPublishTime: new Date(now - 10 * 60 * 1000).toISOString(), // 10 min ago
    link: "https://example.com",
  },
  {
    title: "RBI update",
    providerPublishTime: new Date(now - 5 * 60 * 60 * 1000).toISOString(), // 5 hrs ago
    link: "https://rbi.com",
  },
  {
    title: "Global markets",
    providerPublishTime: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    link: "https://global.com",
  }
];

const mockGainers = [
  { shortName: "TCS", symbol: "TCS", price: 3500, change: 40, changePercent: 1.2 },
  { shortName: "INFY", symbol: "INFY", price: 1500, change: 20, changePercent: 1.3 }
];

const mockLosers = [
  { shortName: "Paytm", symbol: "PAYTM", price: 420, change: -15, changePercent: -3.2 },
  { shortName: "Zomato", symbol: "ZOMATO", price: 110, change: -6, changePercent: -4.4 }
];

// MAIN SUITE
describe("MarketMovers Component — Full Coverage Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------
  test("shows loading state initially", () => {
    axios.get.mockResolvedValue({ data: { news: [] } });

    render(
      <MemoryRouter>
        <MarketMovers />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading Market Data...")).toBeInTheDocument();
  });

  // -------------------------------------------------------------
  test("renders full dataset correctly", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { news: mockNews } }) // news
      .mockResolvedValueOnce({ data: { data: mockGainers } }) // gainers
      .mockResolvedValueOnce({ data: { data: mockLosers } }); // losers

    render(
      <MemoryRouter>
        <MarketMovers />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Market Movers")).toBeInTheDocument();
    });

    // Gainers
    expect(screen.getByText("TCS")).toBeInTheDocument();
    expect(screen.getByText("INFY")).toBeInTheDocument();

    // Losers
    expect(screen.getByText("Paytm")).toBeInTheDocument();
    expect(screen.getByText("Zomato")).toBeInTheDocument();

    // News
    expect(screen.getByText("Market jumps")).toBeInTheDocument();
    expect(screen.getByText("RBI update")).toBeInTheDocument();
    expect(screen.getByText("Global markets")).toBeInTheDocument();
  });

  // -------------------------------------------------------------
  test("navigates correctly when clicking a stock item", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { news: [] } })
      .mockResolvedValueOnce({ data: { data: mockGainers } })
      .mockResolvedValueOnce({ data: { data: [] } });

    render(
      <MemoryRouter>
        <MarketMovers />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("TCS"));

    fireEvent.click(screen.getByText("TCS"));

    expect(mockNavigate).toHaveBeenCalledWith("/StockDetails/TCS");
  });

  // -------------------------------------------------------------
  test("handles empty arrays gracefully", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { news: [] } })
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } });

    render(
      <MemoryRouter>
        <MarketMovers />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText("Market Movers")).toBeInTheDocument()
    );

    // no items rendered
    expect(screen.queryByText("↑")).not.toBeInTheDocument();
    expect(screen.queryByText("↓")).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------
  test("MarketNewsItem anchors open correct link", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { news: mockNews } })
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } });

    render(
      <MemoryRouter>
        <MarketMovers />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText("Market jumps")).toBeInTheDocument()
    );

    const news = screen.getByText("Market jumps").closest("a");
    expect(news).toHaveAttribute("href", mockNews[0].link);
    expect(news).toHaveAttribute("target", "_blank");
  });

  // -------------------------------------------------------------
  test("business group static cards render", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { news: [] } })
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } });

    render(
      <MemoryRouter>
        <MarketMovers />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Top Business Groups"));

    expect(screen.getByText("TATA")).toBeInTheDocument();
    expect(screen.getByText("Reliance")).toBeInTheDocument();
    expect(screen.getByText("Mahindra")).toBeInTheDocument();
    expect(screen.getByText("Aditya Birla")).toBeInTheDocument();
  });

  // -------------------------------------------------------------
  test("timeAgo utility covers minutes / hours / days branch", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { news: mockNews } })
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } });

    render(
      <MemoryRouter>
        <MarketMovers />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText("Market jumps")).toBeInTheDocument()
    );

    const times = screen.getAllByText(/ago/);
    expect(times.length).toBe(3); // 3 branches covered
  });
});

test("handles API failure and still stops loading", async () => {
  // Make one of the API calls fail
  axios.get.mockRejectedValueOnce(new Error("Network Failed"));

  render(
    <MemoryRouter>
      <MarketMovers />
    </MemoryRouter>
  );

  // Loading initially
  expect(screen.getByText("Loading Market Data...")).toBeInTheDocument();

  // After failure, loading stops
  await waitFor(() =>
    expect(screen.queryByText("Loading Market Data...")).not.toBeInTheDocument()
  );
});

test("formats market news when backend returns valid news array", async () => {
  axios.get
    .mockResolvedValueOnce({
      data: {
        news: [
          {
            title: "Market Rally Today",
            providerPublishTime: new Date().toISOString(),
            link: "https://example.com/news1"
          }
        ]
      }
    })
    .mockResolvedValueOnce({ data: { data: [] } }) // gainers
    .mockResolvedValueOnce({ data: { data: [] } }); // losers

  render(
    <MemoryRouter>
      <MarketMovers />
    </MemoryRouter>
  );

  // Wait for news headline to appear → means Array.isArray(...) TRUE branch was executed
  await screen.findByText("Market Rally Today");

  expect(screen.getByText("Market Rally Today")).toBeInTheDocument();
});
test("skips news formatting when backend returns non-array news", async () => {
  axios.get
    .mockResolvedValueOnce({ data: { news: null } })   // FALSE branch
    .mockResolvedValueOnce({ data: { data: [] } })     // gainers
    .mockResolvedValueOnce({ data: { data: [] } });    // losers

  render(
    <MemoryRouter>
      <MarketMovers />
    </MemoryRouter>
  );

  // Should NOT crash or render any headline
  await waitFor(() =>
    expect(screen.queryByTestId("news-item")).not.toBeInTheDocument()
  );
});
