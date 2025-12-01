import { sql } from "./dbConnection.js";

export const getStockSummary = async (email) => {
    try {
        const result = await sql`SELECT * FROM "stock_summary" Where email=${email} and current_holding>0`;
        return result;
    } catch (error) {
        console.error('Stock details error:', error);
        return null;
    }
};

export const getPortfolioStockSummary = async (email) => {
    try {
        const result = await sql`SELECT s.short_name,s.long_name,ss.current_holding,ss.spended_amount FROM "stock_summary" as ss join "stocks" as s on ss.symbol=s.symbol Where ss.email=${email} ORDER BY s.short_name ASC`;
        return result;
    } catch (error) {
        console.error('Database error - getPortfolioStockSummary',error);
        return null;
    }
};