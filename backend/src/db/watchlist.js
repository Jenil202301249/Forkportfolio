// @ts-nocheck
import { sql } from "./dbConnection.js";
import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
export const addSymbol = async (email, symbol) => {
    try {
        const check = await sql`SELECT * FROM "stocks" WHERE symbol=${symbol}`;
        if (check.length === 0) {
            const time = new Date();
            const quoteSummary = await yahooFinance.quoteSummary(symbol, { modules: ['assetProfile', 'price'] });
            //console.log(quoteSummary)
            if (!quoteSummary.price) {
                //console.log('No data found for symbol:', symbol);   
                return { success: false, message: "Unable to fetch stock details." };
            }
            const {
                shortName,
                longName,
                exchange,
                currency,
                quoteType: type,
                market: country,
            } = quoteSummary.price;
            const { sector } = quoteSummary.assetProfile || "N/A";
            await sql`INSERT INTO "stocks" (symbol,short_name,long_name,sector,currency,type,country,exchange,created_at) VALUES (${symbol},${shortName},${longName},${sector},${currency},${type},${country},${exchange},${time}) RETURNING *;`;
        }
        const result = await sql`INSERT INTO "user_watchlist" (email, symbol) VALUES (${email}, ${symbol}) ON CONFLICT (email, symbol) DO NOTHING`;
        if (!result) {
            return false;
        }
        return true;
    } catch (error) {
        console.error('Add to watchlist DB error:', error);
        return false;
    }
};
export const removeSymbol = async (email, symbol) => {
    try {
        const result = await sql`DELETE FROM "user_watchlist" WHERE email=${email} AND symbol=${symbol}`;
        if (!result) {
            return false;
        }
        return true;
    } catch (error) {
        console.error('Remove from watchlist DB error:', error);
        return false;
    }
};
export const getWatchlist = async (email) => {
    try {
        const result = await sql`SELECT symbol FROM "user_watchlist" WHERE email=${email}`;
        if (!result) {
            return null;
        }
        return result;
    } catch (error) {
        console.error('get watchlist DB error:', error);
        return null;
    }
}
export const checkpresent = async (email, symbol) => {
    try {
        const result = await sql`SELECT symbol FROM "user_watchlist" WHERE email=${email} AND symbol=${symbol}`;
        if (!result) {
            return null;
        }
        return result.length;
    } catch (error) {
        console.error('get watchlist DB error:', error);
        return null;
    }
}