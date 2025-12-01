import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, test, expect } from "vitest";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import DashboardHeader from "../../src/components/Dashboard-Header.jsx";
import * as AppContextModule from "../../src/context/AppContext.jsx";

// ---------------- Mock Assets ----------------
vi.mock("../assets/growthicon.svg", () => ({ default: "growth-icon.svg" }));
vi.mock("./Dashboard-Header.css", () => ({}));

// ---------------- Mock Axios ----------------
vi.mock("axios");

// ---------------- Mock Navigation ----------------
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------------- Helper: Real Time Delay ----------------
// Replaces fake timers to ensure Promises resolve correctly
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------- Test Data ----------------
const mockStocksData = [
  { symbol: "AAPL", name: "Apple", price: "150", change: "2.5", changePercent: "1.2", exchange: "NASDAQ" },
  { Symbol: "TSLA", name: "Tesla", price: "200", change: "-5.0", changePercent: "-2.5", exchange: "NASDAQ" },
  { symbol: "N/A_STK", name: null, price: "N/A", change: "0", changePercent: "0", exchange: null },
];

const mockSearchResults = [
  { symbol: "RELIANCE", longname: "Reliance Industries", shortname: "Reliance" },
  { symbol: "TATA", longname: null, shortname: "Tata Motors" },
];

// ---------------- Mock Context Logic ----------------
let contextValues = {
  isSearchActive: false,
  headerStocks: null,
  headerStocksTimestamp: null,
};

const mockSetIsSearchActive = vi.fn((val) => { contextValues.isSearchActive = val; });
const mockSetHeaderStocks = vi.fn((val) => { contextValues.headerStocks = val; });
const mockSetHeaderStocksTimestamp = vi.fn((val) => { contextValues.headerStocksTimestamp = val; });

vi.mock("../../src/context/AppContext.jsx", () => ({
  useAppContext: () => ({
    isSearchActive: contextValues.isSearchActive,
    setIsSearchActive: mockSetIsSearchActive,
    headerStocks: contextValues.headerStocks,
    setHeaderStocks: mockSetHeaderStocks,
    headerStocksTimestamp: contextValues.headerStocksTimestamp,
    setHeaderStocksTimestamp: mockSetHeaderStocksTimestamp,
  }),
}));

// ---------------- Test Suite ----------------
describe("DashboardHeader Component — FULL COVERAGE", () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset context values
    contextValues = {
      isSearchActive: false,
      headerStocks: null,
      headerStocksTimestamp: null,
    };
  });

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <DashboardHeader {...props} />
      </MemoryRouter>
    );
  };

  // =================================================================
  // 1. Initial Load & Caching Logic
  // =================================================================

  test("renders loading skeletons initially", async () => {
    axios.get.mockImplementation(() => new Promise(() => {})); // Never resolve
    renderComponent();
    const skeletons = document.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("fetches fresh data when cache is empty", async () => {
    axios.get.mockResolvedValue({ data: { data: mockStocksData } });

    renderComponent();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/starter"));
      expect(mockSetHeaderStocks).toHaveBeenCalledWith(expect.any(Array));
    });

    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  test("uses cached data if timestamp is recent (< 5 mins)", async () => {
    const recentTime = Date.now() - 1000;
    contextValues.headerStocks = mockStocksData;
    contextValues.headerStocksTimestamp = recentTime;

    renderComponent();

    // Should NOT call axios
    expect(axios.get).not.toHaveBeenCalled();
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  test("fetches fresh data if cache is expired (> 5 mins)", async () => {
    const oldTime = Date.now() - (6 * 60 * 1000); 
    contextValues.headerStocks = mockStocksData;
    contextValues.headerStocksTimestamp = oldTime;
    
    axios.get.mockResolvedValue({ data: { data: mockStocksData } });

    renderComponent();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  // =================================================================
  // 2. Stock Display Logic (Incl. Edge Cases)
  // =================================================================

  test("renders stocks with correct positive/negative styling", async () => {
    axios.get.mockResolvedValue({ data: { data: mockStocksData } });
    renderComponent();

    await waitFor(() => screen.getByText("Apple"));

    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("2.5 (1.2%)")).toBeInTheDocument();
    
    expect(screen.getByText("Tesla")).toBeInTheDocument();
    expect(screen.getByText("-5.0 (-2.5%)")).toBeInTheDocument();
  });

  test("handles N/A values and missing names gracefully", async () => {
    axios.get.mockResolvedValue({ data: { data: mockStocksData } });
    renderComponent();

    // Use getAllByText since multiple N/A might appear
    await waitFor(() => {
      const naElements = screen.getAllByText("N/A");
      expect(naElements.length).toBeGreaterThan(0);
    });
  });

  test("displays 'No active stock data available' when data array is empty", async () => {
    axios.get.mockResolvedValue({ data: { data: [] } });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("No active stock data available")).toBeInTheDocument();
    });
  });

  test("navigates to details page when clicking a stock ticker", async () => {
    axios.get.mockResolvedValue({ data: { data: mockStocksData } });
    renderComponent();

    await waitFor(() => screen.getByText("Apple"));
    fireEvent.click(screen.getByText("Apple"));
    
    expect(mockNavigate).toHaveBeenCalledWith("/stockdetails/AAPL");
    expect(mockSetIsSearchActive).toHaveBeenCalledWith(false);
  });

  // NEW TEST: Covers branch where stock symbol is missing (Lines 194, 198)
  test("does not navigate or change cursor when stock symbol is missing", async () => {
    const dataWithMissingSymbol = [
      { name: "Ghost Stock", price: "100", change: "1", changePercent: "1" } // Missing symbol
    ];
    axios.get.mockResolvedValue({ data: { data: dataWithMissingSymbol } });
    
    renderComponent();

    await waitFor(() => screen.getByText("Ghost Stock"));
    
    const stockCard = screen.getByText("Ghost Stock").closest(".d-stock-info");
    
    // Verify Style branch (cursor: default)
    expect(stockCard).toHaveStyle("cursor: default");
    
    // Verify onClick branch (short-circuit)
    fireEvent.click(stockCard);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // =================================================================
  // 3. Error Handling
  // =================================================================

  test("handles 401 Session Expired error", async () => {
    axios.get.mockRejectedValue({ response: { status: 401 } });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Session expired. Please log in again.")).toBeInTheDocument();
    });
  });

  test("handles generic API fetch failure", async () => {
    axios.get.mockRejectedValue(new Error("Network Error"));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Failed to load market data.")).toBeInTheDocument();
    });
  });

  test("handles invalid data format (non-array response)", async () => {
    axios.get.mockResolvedValue({ data: { data: "Not an array" } });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Invalid data format from server.")).toBeInTheDocument();
    });
  });

  // =================================================================
  // 4. Search Functionality
  // =================================================================

  test("activates search popup on input focus", async () => {
    axios.get.mockResolvedValue({ data: { data: [] } }); 
    renderComponent();

    const input = screen.getByPlaceholderText(/Search for a Stock/i);
    fireEvent.focus(input);

    expect(mockSetIsSearchActive).toHaveBeenCalledWith(true);
  });

  test("closes search popup when overlay is clicked", async () => {
    contextValues.isSearchActive = true;
    axios.get.mockResolvedValue({ data: { data: [] } });

    const { container } = renderComponent();
    const overlay = container.querySelector(".overlay");
    fireEvent.click(overlay);

    expect(mockSetIsSearchActive).toHaveBeenCalledWith(false);
  });

  test("closes search popup on Escape key press", async () => {
    contextValues.isSearchActive = true;
    axios.get.mockResolvedValue({ data: { data: [] } });
    renderComponent();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockSetIsSearchActive).toHaveBeenCalledWith(false);
  });

  // NEW TEST: Covers branch where non-Escape key is pressed (Line 127)
  test("does not close search popup on non-Escape key press", async () => {
    contextValues.isSearchActive = true;
    axios.get.mockResolvedValue({ data: { data: [] } });
    renderComponent();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(mockSetIsSearchActive).not.toHaveBeenCalledWith(false);
  });

  test("debounces search input and fetches suggestions", async () => {
    contextValues.isSearchActive = true;
    
    // 1. Mock Initial Load (Starter)
    axios.get.mockResolvedValueOnce({ data: { data: [] } });
    // 2. Mock Search API
    axios.get.mockResolvedValueOnce({ data: { suggestions: mockSearchResults } });

    renderComponent();

    // Wait for starter data to clear queue
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const searchInput = screen.getAllByPlaceholderText(/Search for a Stock/i)[1];
    fireEvent.change(searchInput, { target: { value: "Rel" } });

    // WAIT FOR DEBOUNCE (Real Time)
    await pause(350);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("searchStock"), expect.any(Object));
      expect(screen.getByText("Reliance Industries")).toBeInTheDocument();
    });
  });

  test("handles empty search result (No matches found)", async () => {
    contextValues.isSearchActive = true;
    axios.get.mockResolvedValueOnce({ data: { data: [] } });
    axios.get.mockResolvedValueOnce({ data: { suggestions: [] } });

    renderComponent();
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const searchInput = screen.getAllByPlaceholderText(/Search for a Stock/i)[1];
    fireEvent.change(searchInput, { target: { value: "XYZ" } });

    await pause(350);

    await waitFor(() => {
      expect(screen.getByText("No matching stocks found.")).toBeInTheDocument();
    });
  });

  test("clears results when input is empty", async () => {
    contextValues.isSearchActive = true;
    axios.get.mockResolvedValue({ data: { data: [] } });

    renderComponent();
    const searchInput = screen.getAllByPlaceholderText(/Search for a Stock/i)[1];
    
    // Type (sets results) - No mock needed here as we check clearing
    fireEvent.change(searchInput, { target: { value: "A" } });
    await pause(350);
    
    // Clear
    fireEvent.change(searchInput, { target: { value: "" } });
    await pause(350);

    // Results list should be gone
    const list = document.querySelector(".results-list");
    expect(list).not.toBeInTheDocument();
  });

  test("navigates when clicking a search result", async () => {
    contextValues.isSearchActive = true;
    axios.get.mockResolvedValueOnce({ data: { data: [] } });
    axios.get.mockResolvedValueOnce({ data: { suggestions: mockSearchResults } });

    renderComponent();
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const searchInput = screen.getAllByPlaceholderText(/Search for a Stock/i)[1];
    fireEvent.change(searchInput, { target: { value: "TATA" } });
    
    await pause(350);

    await waitFor(() => screen.getByText("Tata Motors"));
    fireEvent.click(screen.getByText("Tata Motors"));

    expect(mockNavigate).toHaveBeenCalledWith("/stockdetails/TATA");
  });

  test("handles search API error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    contextValues.isSearchActive = true;
    axios.get.mockResolvedValueOnce({ data: { data: [] } });
    axios.get.mockRejectedValueOnce(new Error("Search Failed"));

    renderComponent();
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const searchInput = screen.getAllByPlaceholderText(/Search for a Stock/i)[1];
    fireEvent.change(searchInput, { target: { value: "Error" } });
    
    await pause(350);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Search error:", expect.any(Error));
    });
    
    const list = document.querySelector(".results-list");
    expect(list).not.toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  test("handles invalid search response format", async () => {
    contextValues.isSearchActive = true;
    axios.get.mockResolvedValueOnce({ data: { data: [] } }); 
    axios.get.mockResolvedValueOnce({ data: { suggestions: "Not an array" } }); 

    renderComponent();
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const searchInput = screen.getAllByPlaceholderText(/Search for a Stock/i)[1];
    fireEvent.change(searchInput, { target: { value: "BadFormat" } });
    
    await pause(350);

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    const list = document.querySelector(".results-list");
    expect(list).not.toBeInTheDocument();
  });

  // =================================================================
  // 5. Watchlist Integration
  // =================================================================

  test("renders 'Add to Watchlist' button when props are provided", async () => {
    contextValues.isSearchActive = true;
    axios.get.mockResolvedValueOnce({ data: { data: [] } });
    axios.get.mockResolvedValueOnce({ data: { suggestions: mockSearchResults } });

    const mockAddToWatchlist = vi.fn();

    renderComponent({ 
      isWatchlistPage: true, 
      onAddToWatchlist: mockAddToWatchlist 
    });
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const searchInput = screen.getAllByPlaceholderText(/Search for a Stock/i)[1];
    fireEvent.change(searchInput, { target: { value: "Rel" } });
    
    await pause(350);

    await waitFor(() => screen.getByLabelText("Add RELIANCE to watchlist"));

    const addBtn = screen.getByLabelText("Add RELIANCE to watchlist");
    fireEvent.click(addBtn);

    expect(mockAddToWatchlist).toHaveBeenCalledWith("RELIANCE");
    
    // Use waitFor for state update assertion
    await waitFor(() => {
      expect(mockSetIsSearchActive).toHaveBeenCalledWith(false);
    });
  });

  test("does NOT render 'Add to Watchlist' button if not on watchlist page", async () => {
    contextValues.isSearchActive = true;
    axios.get.mockResolvedValueOnce({ data: { data: [] } });
    axios.get.mockResolvedValueOnce({ data: { suggestions: mockSearchResults } });

    renderComponent({ isWatchlistPage: false });
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const searchInput = screen.getAllByPlaceholderText(/Search for a Stock/i)[1];
    fireEvent.change(searchInput, { target: { value: "Rel" } });
    
    await pause(350);

    await waitFor(() => screen.getByText("Reliance Industries"));

    const addBtn = screen.queryByLabelText("Add RELIANCE to watchlist");
    expect(addBtn).not.toBeInTheDocument();
  });

});