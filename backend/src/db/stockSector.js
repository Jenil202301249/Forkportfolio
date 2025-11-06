import { sql } from "./dbConnection.js";

export const getStocksSector = async(email) => {
    try {
        const result = await sql`SELECT 
    ss.symbol,
    ss.current_holding,
    COALESCE(s.sector, 'Others') AS sector
FROM 
    stock_summary ss
LEFT JOIN 
    stocks s 
    ON ss.symbol = s.symbol
WHERE 
    ss.email = ${email}`;
        return result;
    } catch (error) {
        console.log('Stock sector fetch error:', error);
        return null;
    }
};