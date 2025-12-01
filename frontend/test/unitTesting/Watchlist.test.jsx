import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { vi } from "vitest";
import axios from "axios";
import Watchlist from "../../src/pages/WatchList.jsx";

/* ---------- MOCKS ---------- */
vi.mock("axios");
axios.get = vi.fn();
axios.post = vi.fn();
axios.delete = vi.fn();

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
}));

vi.mock("../../src/context/AppContext.jsx", () => ({
  __esModule: true,
  useAppContext: () => ({
    darkMode: false,
    setDarkMode: vi.fn(),
    setIsSearchActive: vi.fn(),
  }),
}));

vi.mock("../../src/components/Navbar.jsx", () => ({
  __esModule: true,
  default: () => <div data-testid="navbar" />,
}));

vi.mock("../../src/components/Footer.jsx", () => ({
  __esModule: true,
  default: () => <div data-testid="footer" />,
}));

vi.mock("../../src/components/Dashboard-Header.jsx", () => ({
  __esModule: true,
  default: ({ onAddToWatchlist }) => (
    <button data-testid="add-stock" onClick={() => onAddToWatchlist("AAPL")}>
      Add Stock
    </button>
  ),
}));

vi.mock("../../src/assets/filter-button.svg", () => ({
  default: "filter-button.svg",
}));

/* ---------- FIXTURES ---------- */
const mockWatchlist = [
  {
    shortName: "Apple Inc",
    symbol: "AAPL",
    currentPrice: 190,
    currentchange: 2,
    percentageChange: 1.2,
    sector: "Technology / IT",
    marketcap: 200000000000, // Large
  },
  {
    shortName: "Tesla Motors",
    symbol: "TSLA",
    currentPrice: 250,
    currentchange: -3,
    percentageChange: -1.0,
    sector: "Consumer Cyclical",
    marketcap: 180000000000, // Mid
  },
  {
    shortName: "Tiny Corp",
    symbol: "TINY",
    currentPrice: 10,
    currentchange: 0.5,
    percentageChange: 5.0,
    sector: "Basic Materials",
    marketcap: 10000000000, // Small
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

const renderPage = async () => {
  await act(async () => {
    render(<Watchlist />);
  });
};

/* ---------- TEST SUITE ---------- */

describe("Watchlist Page — FULL 100% COVERAGE", () => {
  /* ✅ INITIAL LOAD */
  test("renders loading skeletons initially", async () => {
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    axios.get.mockReturnValue(pendingPromise);

    render(<Watchlist />);

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);

    await act(async () => {
      resolvePromise({ data: { watchlist: mockWatchlist } });
    });
  });

  test("loading skeleton disappears after data loads", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    await waitFor(() =>
      expect(document.querySelectorAll(".skeleton").length).toBe(0)
    );
  });

  test("fetchWatchlist failure sets empty state and stops loading", async () => {
    axios.get.mockRejectedValueOnce(new Error("boom"));

    await renderPage();

    await screen.findByText("Nothing in this watchlist yet");
  });

  test("fetchWatchlist handles response with missing watchlist property", async () => {
    axios.get.mockResolvedValueOnce({ data: {} }); 

    await renderPage();

    await screen.findByText("Nothing in this watchlist yet");
  });

  /* ✅ DISPLAY & EMPTY STATE */
  test("displays fetched watchlist", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    expect(await screen.findByText("Apple Inc")).toBeInTheDocument();
    expect(screen.getByText("Tesla Motors")).toBeInTheDocument();
    expect(screen.getByText("Tiny Corp")).toBeInTheDocument();
  });

  test("shows empty state when watchlist is empty", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: [] } });

    await renderPage();

    await screen.findByText("Nothing in this watchlist yet");
  });

  /* ✅ ADD TO WATCHLIST */
  test("adds stock and refetches", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { watchlist: [] } })
      .mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    axios.post.mockResolvedValueOnce({ data: { success: true } });

    await renderPage();

    fireEvent.click(screen.getByTestId("add-stock"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  test("addToWatchlist handles failure", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: [] } });
    axios.post.mockRejectedValueOnce({ response: { status: 500 } });

    await renderPage();

    fireEvent.click(screen.getByTestId("add-stock"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
  });

  test("addToWatchlist logs specific error message from response", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    axios.get.mockResolvedValueOnce({ data: { watchlist: [] } });
    axios.post.mockRejectedValueOnce({ response: { data: "Duplicate Stock" } });

    await renderPage();

    fireEvent.click(screen.getByTestId("add-stock"));

    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(
      "Error adding stock to watchlist:",
      "Duplicate Stock"
    ));
    consoleSpy.mockRestore();
  });

  /* ✅ REMOVE STOCK */
  test("removing last stock shows empty state", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: [mockWatchlist[0]] } });
    axios.delete.mockResolvedValueOnce({ status: 200 });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /remove aapl/i }));

    await screen.findByText("Nothing in this watchlist yet");
  });

  test("clicking remove button stops propagation (does not navigate)", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });
    axios.delete.mockResolvedValueOnce({ status: 200 });

    await renderPage();

    const removeBtn = (await screen.findAllByRole("button", { name: /remove/i }))[0];
    fireEvent.click(removeBtn);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("remove failure with status 200 does NOT refetch", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });
    axios.delete.mockRejectedValueOnce({ response: { status: 200 } });

    await renderPage();

    fireEvent.click((await screen.findAllByRole("button", { name: /remove/i }))[0]);

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test("remove failure with 500 triggers refetch", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { watchlist: mockWatchlist } })
      .mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    axios.delete.mockRejectedValueOnce({ response: { status: 500 } });

    await renderPage();

    fireEvent.click((await screen.findAllByRole("button", { name: /remove/i }))[0]);

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  });

  test("remove failure with Network Error triggers refetch", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { watchlist: mockWatchlist } })
      .mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    axios.delete.mockRejectedValueOnce(new Error("Network Error"));

    await renderPage();

    fireEvent.click((await screen.findAllByRole("button", { name: /remove/i }))[0]);

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  });

  /* ✅ SEARCH */
  test("search matches company name", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });
    await renderPage();

    fireEvent.change(screen.getByPlaceholderText("Search your stock"), {
      target: { value: "Tesla" },
    });

    expect(screen.getByText("Tesla Motors")).toBeInTheDocument();
    expect(screen.queryByText("Apple Inc")).not.toBeInTheDocument();
  });

  test("search matches symbol", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });
    await renderPage();

    fireEvent.change(screen.getByPlaceholderText("Search your stock"), {
      target: { value: "AAPL" },
    });

    expect(screen.getByText("Apple Inc")).toBeInTheDocument();
    expect(screen.queryByText("Tesla Motors")).not.toBeInTheDocument();
  });

  test("search empty restores data", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });
    await renderPage();

    fireEvent.change(screen.getByPlaceholderText("Search your stock"), {
      target: { value: "Tesla" },
    });
    expect(screen.queryByText("Apple Inc")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search your stock"), {
      target: { value: "   " }, 
    });

    expect(screen.getByText("Apple Inc")).toBeInTheDocument();
  });

  test("no filter matches shows no-results row", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });
    await renderPage();

    fireEvent.change(screen.getByPlaceholderText("Search your stock"), {
      target: { value: "xyz" },
    });

    expect(screen.getByText("No stocks matched your filters")).toBeInTheDocument();
  });

  /* ✅ NAVIGATION */
  test("row click navigates", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click((await screen.findByText("Apple Inc")).closest("tr"));

    expect(mockNavigate).toHaveBeenCalledWith("/stockdetails/AAPL");
  });

  /* ✅ FILTER MODAL */
  test("opens and closes filter modal", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    expect(screen.getByText("Filter Options")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close Filters" }));

    await waitFor(() =>
      expect(screen.queryByText("Filter Options")).not.toBeInTheDocument()
    );
  });

  test("closing modal by clicking overlay", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    fireEvent.click(
      screen.getByRole("button", { name: "Close Filters Overlay" })
    );

    await waitFor(() =>
      expect(screen.queryByText("Filter Options")).not.toBeInTheDocument()
    );
  });

  test("clicking inside filter modal does not close it", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    const modalContent = screen.getByText("Filter Options").closest(".filter-modal");
    fireEvent.click(modalContent);

    expect(screen.getByText("Filter Options")).toBeInTheDocument();
  });

  /* ✅ PRICE VALIDATION */
  test("price validation error and reset", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });
    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    const fromInput = screen.getByLabelText("From");
    const toInput = screen.getByLabelText("Upto");

    fireEvent.change(fromInput, { target: { value: "500" } });
    await waitFor(() => expect(fromInput.value).toBe("500"));

    fireEvent.change(toInput, { target: { value: "100" } });

    expect(
      screen.getByText("“From” cannot be greater than “Upto”.")
    ).toBeInTheDocument();

    fireEvent.change(toInput, { target: { value: "600" } });

    expect(
      screen.queryByText("“From” cannot be greater than “Upto”.")
    ).not.toBeInTheDocument();
  });

  test("price validation error when Upto set before From", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });
    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    const fromInput = screen.getByLabelText("From");
    const toInput = screen.getByLabelText("Upto");

    fireEvent.change(toInput, { target: { value: "100" } });
    await waitFor(() => expect(toInput.value).toBe("100"));

    fireEvent.change(fromInput, { target: { value: "200" } });

    expect(screen.getByText("“From” cannot be greater than “Upto”.")).toBeInTheDocument();
  });

  test("apply disabled when price error exists", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    fireEvent.change(screen.getByLabelText("From"), { target: { value: "500" } });
    await waitFor(() => expect(screen.getByLabelText("From").value).toBe("500"));

    fireEvent.change(screen.getByLabelText("Upto"), { target: { value: "100" } });

    expect(
      screen.getByRole("button", { name: /apply filters/i })
    ).toBeDisabled();
  });

  /* ✅ CLEAR & APPLY FILTERS */
  test("clear filters resets everything", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    fireEvent.click(screen.getByText("Clear All"));

    expect(screen.getByText("Apple Inc")).toBeInTheDocument();
  });

  test("apply filters does nothing when none selected", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    expect(screen.getByText("Apple Inc")).toBeInTheDocument();
  });

  test("apply filters sorts and closes modal", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    fireEvent.click(screen.getByLabelText("High-Low"));
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() =>
      expect(screen.queryByText("Filter Options")).not.toBeInTheDocument()
    );
  });

  /* ✅ MARKET CAP */
  test("market cap filtering small / mid / large", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    // MID
    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    fireEvent.click(screen.getByLabelText("Mid Cap"));
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(screen.getByText("Tesla Motors")).toBeInTheDocument();
    expect(screen.queryByText("Tiny Corp")).not.toBeInTheDocument();

    // SMALL (Explicitly uncheck Mid to isolate Small)
    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    fireEvent.click(screen.getByLabelText("Mid Cap")); // Uncheck
    fireEvent.click(screen.getByLabelText("Small Cap")); // Check
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(screen.getByText("Tiny Corp")).toBeInTheDocument();
    expect(screen.queryByText("Tesla Motors")).not.toBeInTheDocument();

    // LARGE (Explicitly uncheck Small to isolate Large)
    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    fireEvent.click(screen.getByLabelText("Small Cap")); // Uncheck
    fireEvent.click(screen.getByLabelText("Large Cap")); // Check
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(screen.getByText("Apple Inc")).toBeInTheDocument();
  });

  test("market cap toggles off when already selected", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    const midCap = screen.getByLabelText("Mid Cap");

    fireEvent.click(midCap); // select
    fireEvent.click(midCap); // deselect

    expect(midCap).not.toBeChecked();
  });

  test("handles stocks with missing market cap during filtering", async () => {
    const weirdStock = { ...mockWatchlist[0], shortName: "Null Cap", symbol: "NULLCAP", marketcap: null };
    axios.get.mockResolvedValueOnce({ data: { watchlist: [weirdStock] } });
    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    fireEvent.click(screen.getByLabelText("Small Cap"));
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    expect(screen.queryByText("Null Cap")).not.toBeInTheDocument();
  });

  /* ✅ SECTOR */
  test("sector filter handles multiple selections and removal correctly", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });
    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    const tech = screen.getByText("Technology / IT");
    const consumer = screen.getByText("Consumer Cyclical");

    fireEvent.click(tech);
    fireEvent.click(consumer);
    
    expect(tech).toHaveClass("active");
    expect(consumer).toHaveClass("active");

    fireEvent.click(tech); // Remove Tech
    expect(tech).not.toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(screen.getByText("Tesla Motors")).toBeInTheDocument();
    expect(screen.queryByText("Apple Inc")).not.toBeInTheDocument();
  });

  test("sector toggle on and off", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    const tech = screen.getByText("Technology / IT");

    fireEvent.click(tech);
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(screen.getByText("Apple Inc")).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    fireEvent.click(tech);
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(screen.getByText("Apple Inc")).toBeInTheDocument();
  });

  /* ✅ SORTING & DAILY CHANGE */
  test("dailyChange gainers filters positive change", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    const gainersRadios = screen.getAllByRole("radio", { name: /gainers/i });
    fireEvent.click(gainersRadios[0]);

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    expect(screen.getByText("Apple Inc")).toBeInTheDocument();
    expect(screen.queryByText("Tesla Motors")).not.toBeInTheDocument();
  });

  test("dailyChange losers filters negative change", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    const losersRadios = screen.getAllByRole("radio", { name: /losers/i });
    fireEvent.click(losersRadios[0]);

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    expect(screen.getByText("Tesla Motors")).toBeInTheDocument();
    expect(screen.queryByText("Apple Inc")).not.toBeInTheDocument();
  });

  test("dailyChangePercent gainers filters positive %", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    const gainersPercent = screen.getAllByRole("radio", { name: /gainers/i });
    fireEvent.click(gainersPercent[1]);

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    expect(screen.getByText("Apple Inc")).toBeInTheDocument();
    expect(screen.queryByText("Tesla Motors")).not.toBeInTheDocument();
  });

  test("dailyChangePercent losers filters negative %", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    const losersPercent = screen.getAllByRole("radio", { name: /losers/i });
    fireEvent.click(losersPercent[1]);

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    expect(screen.getByText("Tesla Motors")).toBeInTheDocument();
    expect(screen.queryByText("Apple Inc")).not.toBeInTheDocument();
  });

  test("filters by minimum price only", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "200" },
    });

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    expect(screen.getByText("Tesla Motors")).toBeInTheDocument();
    expect(screen.queryByText("Apple Inc")).not.toBeInTheDocument();
  });

  test("filters by maximum price only", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));

    fireEvent.change(screen.getByLabelText("Upto"), {
      target: { value: "200" },
    });

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    expect(screen.getByText("Apple Inc")).toBeInTheDocument();
    expect(screen.queryByText("Tesla Motors")).not.toBeInTheDocument();
  });

  test("sort low-high by price", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    fireEvent.click(screen.getByLabelText("Low-High"));
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    const rows = document.querySelectorAll(".company-name");
    expect(rows[0]).toHaveTextContent("Tiny Corp"); // 10
    expect(rows[1]).toHaveTextContent("Apple Inc"); // 190
    expect(rows[2]).toHaveTextContent("Tesla Motors"); // 250
  });

  test("sort high-low by price", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    fireEvent.click(screen.getByLabelText("High-Low"));
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    const rows = document.querySelectorAll(".company-name");
    expect(rows[0]).toHaveTextContent("Tesla Motors"); // 250
    expect(rows[1]).toHaveTextContent("Apple Inc"); // 190
    expect(rows[2]).toHaveTextContent("Tiny Corp"); // 10
  });

  test("sort low-high percent", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    fireEvent.click(screen.getByLabelText("Low-High (%)"));
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    const rows = document.querySelectorAll(".company-name");
    expect(rows[0]).toHaveTextContent("Tesla Motors"); // -1.0%
    expect(rows[1]).toHaveTextContent("Apple Inc"); // 1.2%
    expect(rows[2]).toHaveTextContent("Tiny Corp"); // 5.0%
  });

  test("sort high-low percent", async () => {
    axios.get.mockResolvedValueOnce({ data: { watchlist: mockWatchlist } });

    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /open filters/i }));
    fireEvent.click(screen.getByLabelText("High-Low (%)"));
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    const rows = document.querySelectorAll(".company-name");
    expect(rows[0]).toHaveTextContent("Tiny Corp"); // 5.0%
    expect(rows[1]).toHaveTextContent("Apple Inc"); // 1.2%
    expect(rows[2]).toHaveTextContent("Tesla Motors"); // -1.0%
  });
});