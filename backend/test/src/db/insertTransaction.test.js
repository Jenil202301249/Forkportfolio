import { insertTransaction } from "../../../src/db/insertTransaction.js";
import { getPrice } from "../../../src/utils/getQuotes.js";
import { PriceStore } from "../../../src/utils/stores/priceRates.js";
import { sql } from "../../../src/db/dbConnection.js";
import YahooFinance from "yahoo-finance2";

jest.mock("yahoo-finance2", () => {
    const mockQuoteSummary = jest.fn();
    const MockYahooFinance = jest.fn(() => ({
        quoteSummary: mockQuoteSummary
    }));
    MockYahooFinance.mockQuoteSummary = mockQuoteSummary;
    return MockYahooFinance;
});

jest.mock("../../../src/db/dbConnection.js", () => {
    const mockSql = jest.fn();
    mockSql.transaction = jest.fn();
    return { sql: mockSql };
});

jest.mock("../../../src/utils/getQuotes.js", () => ({
    getPrice: jest.fn(),
}));

jest.mock("../../../src/utils/stores/priceRates.js", () => ({
    PriceStore: { get: jest.fn() },
}));

describe("insertTransaction (Strong, Mutation-Proof Tests)", () => {
    const email = "test@example.com";
    const symbol = "AAPL";
    const time = "2024-01-01T00:00:00.000Z";

    beforeEach(() => {
        jest.clearAllMocks();
        PriceStore.get.mockReturnValue(1);
    });

    it("1) SELL → insufficient holdings → exact error return", async () => {
        sql.mockResolvedValueOnce([{ current_holding: 5, avg_price: 100 }]);

        const result = await insertTransaction(email, symbol, 10, "SELL", time);

        expect(result).toStrictEqual({
            success: false,
            message: "Insufficient holdings to sell."
        });

        expect(sql).toHaveBeenCalledTimes(1);
    });

    it("2) SELL → exact holdings match → success", async () => {
        sql.mockResolvedValueOnce([{ current_holding: 10, avg_price: 100 }]);
        getPrice.mockResolvedValueOnce({ current: 150 });
        sql.transaction.mockResolvedValueOnce([{ insert: true }, { update: true }]);

        const result = await insertTransaction(email, symbol, 10, "SELL", time);

        expect(result).toStrictEqual({
            success: true,
            insert: { insert: true },
            update: { update: true }
        });
    });

    it("3) SELL → getPrice returns no current → return error", async () => {
        sql.mockResolvedValueOnce([{ current_holding: 10, avg_price: 100 }]);
        getPrice.mockResolvedValueOnce({}); 

        const result = await insertTransaction(email, symbol, 5, "SELL", time);

        expect(result).toStrictEqual({
            success: false,
            message: "Unable to fetch stock price."
        });
    });

    it("4) BUY update → correct avg_price & spend computed exactly", async () => {
        sql.mockResolvedValueOnce([{ current_holding: 10, avg_price: 100 }]);
        getPrice.mockResolvedValueOnce({ current: 200 });

        sql.transaction.mockResolvedValueOnce(["insertOK", "updateOK"]);

        const result = await insertTransaction(email, symbol, 10, "BUY", time);

        expect(result).toStrictEqual({
            success: true,
            insert: "insertOK",
            update: "updateOK"
        });

        const expectedSpend = 10 * 200;
        const expectedAvg = ((100 * 10) + (200 * 10)) / 20;

        const updateCall = sql.mock.calls.find(c => c[0].join("").includes("UPDATE"));
        const params = updateCall.slice(1);

        expect(params).toContain(expectedSpend);
        expect(params).toContain(expectedAvg);
    });

    it("5) BUY update → price.current missing → return error", async () => {
        sql.mockResolvedValueOnce([{ current_holding: 5, avg_price: 100 }]);
        getPrice.mockResolvedValueOnce({}); 

        const result = await insertTransaction(email, symbol, 5, "BUY", time);

        expect(result).toStrictEqual({
            success: false,
            message: "Unable to fetch stock price."
        });
    });

    it("6) BUY new → YahooFinance used → insert stock", async () => {
        sql.mockResolvedValueOnce([]); 
        sql.mockResolvedValueOnce([]); 

        YahooFinance.mockQuoteSummary.mockResolvedValueOnce({
            price: {
                shortName: "Apple Inc.",
                longName: "Apple",
                exchange: "NASDAQ",
                currency: "USD",
                quoteType: "EQUITY",
                market: "US",
                regularMarketPrice: 150
            },
            assetProfile: { sector: "Technology" }
        });

        PriceStore.get.mockReturnValue(2);

        sql.transaction.mockResolvedValueOnce(["insert", "update"]);

        const result = await insertTransaction(email, symbol, 3, "BUY", time);

        expect(result).toStrictEqual({
            success: true,
            insert: "insert",
            update: "update"
        });

        expect(YahooFinance.mockQuoteSummary).toHaveBeenCalledTimes(1);
    });

    it("7) BUY new → Yahoo missing price → return exact error", async () => {
        sql.mockResolvedValueOnce([]);
        sql.mockResolvedValueOnce([]);

        YahooFinance.mockQuoteSummary.mockResolvedValueOnce({});

        const result = await insertTransaction(email, symbol, 1, "BUY", time);

        expect(result).toStrictEqual({
            success: false,
            message: "Unable to fetch stock details."
        });
    });

    it("8) BUY new → stock exists → use getPrice instead of Yahoo", async () => {
        sql.mockResolvedValueOnce([]);
        sql.mockResolvedValueOnce([{ symbol: "AAPL" }]);

        getPrice.mockResolvedValueOnce({ current: 99 });

        sql.transaction.mockResolvedValueOnce(["insert", "update"]);

        await insertTransaction(email, symbol, 5, "BUY", time);

        expect(YahooFinance.mockQuoteSummary).not.toHaveBeenCalled();
        expect(getPrice).toHaveBeenCalledWith("AAPL");
    });

    it("9) BUY new → convert Yahoo price using PriceStore", async () => {
        sql.mockResolvedValueOnce([]);
        sql.mockResolvedValueOnce([]);

        YahooFinance.mockQuoteSummary.mockResolvedValueOnce({
            price: { currency: "USD", regularMarketPrice: 150 },
            assetProfile: {}
        });

        PriceStore.get.mockReturnValue(3);

        sql.transaction.mockResolvedValueOnce(["ins", "upd"]);

        await insertTransaction(email, symbol, 1, "BUY", time);

        const userTxCall = sql.mock.calls.find(c => c[0].join("").includes("user_transactions"));
        const params = userTxCall.slice(1);

        expect(params).toContain(50); 
    });

    it("10) DB SELECT fails → return null", async () => {
        sql.mockRejectedValueOnce(new Error("DB DEAD"));

        const result = await insertTransaction(email, symbol, 1, "BUY", time);

        expect(result).toBeNull();
    });

    it("11) Transaction fails → return null", async () => {
        sql.mockResolvedValueOnce([]);
        sql.mockResolvedValueOnce([{ symbol: "AAPL" }]);
        getPrice.mockResolvedValueOnce({ current: 100 });

        sql.transaction.mockRejectedValueOnce(new Error("TX FAIL"));

        const result = await insertTransaction(email, symbol, 1, "BUY", time);

        expect(result).toBeNull();
    });

    it("12) BUY new → Yahoo provided no price, getPrice returns missing current → return exact error", async () => {
        sql.mockResolvedValueOnce([]); 
        sql.mockResolvedValueOnce([{symbol: "AAPL"}]); 

        getPrice.mockResolvedValueOnce({});  

        const result = await insertTransaction(email, symbol, 3, "BUY", time);

        expect(result).toStrictEqual({
            success: false,
            message: "Unable to fetch stock price."
        });

        expect(getPrice).toHaveBeenCalledTimes(1);
    });

    it("13) SELL entire holding → new_avg_price becomes NaN → sets avg_price = 0", async () => {
        sql.mockResolvedValueOnce([{ current_holding: 10, avg_price: 100 }]);
        getPrice.mockResolvedValueOnce({ current: 100 });

        sql.transaction.mockResolvedValueOnce(["ins", "upd"]);

        const result = await insertTransaction(email, symbol, 10, "SELL", time);

        expect(result.success).toBe(true);

        const updateCall = sql.mock.calls.find(c => c[0].join("").includes("UPDATE"));
        const params = updateCall.slice(1);

        expect(params).toContain(0);
    });

    it("14) SELL half holding → new_avg_price becomes NaN → sets avg_price = 0", async () => {
        sql.mockResolvedValueOnce([{ current_holding: 20, avg_price: 100 }]);
        getPrice.mockResolvedValueOnce({ current: 100 });

        sql.transaction.mockResolvedValueOnce(["ins", "upd"]);

        const result = await insertTransaction(email, symbol, 10, "SELL", time);

        expect(result.success).toBe(true);

        const updateCall = sql.mock.calls.find(c => c[0].join("").includes("UPDATE"));
        const params = updateCall.slice(1);

        expect(params).toContain(0);
    });

    it("15) invalid Transaction type", async () => {

        const result = await insertTransaction(email, symbol, 10, "Update", time);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Invalid transaction type.");
    });

    it("16) DB error", async () => {
        sql.mockResolvedValueOnce(null);

        const result = await insertTransaction(email, symbol, 10, "SELL", time);
        expect(result.success).toBe(false);
        expect(result.message).toBe("Database error while checking holdings.");
    });

    it("17) DB error", async () => {
        sql.mockResolvedValueOnce(null);

        const result = await insertTransaction(email, symbol, 10, "BUY", time);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Database error while checking holdings.");
    });

});