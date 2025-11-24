import { getStockSummary } from "../../db/stockSummary.js";
import { getPrice } from "../../utils/getQuotes.js";
export const userStockSummary = async (req, res) => {
    const email = req.user.email;
    try {
        const stockSummary = await getStockSummary(email);
        if (!stockSummary) {
            return res.status(503).json({ success: false, message: "Failed to retrieve stock summary" });
        }
        const userStockSummary = await Promise.all(
        stockSummary.filter(item => item.current_holding > 0).map(async ({ symbol, current_holding, avg_price }) => {
        avg_price = Number(avg_price);
        current_holding = Number(current_holding);
        const priceData = await getPrice(symbol);
        const currentPrice = priceData ? priceData.current : 0;
        const value = current_holding * currentPrice;
        return {
            symbol: symbol,
            shortName: priceData?.shortname||"--",
            quantity: current_holding,
            avg_price: avg_price.toFixed(2),
            current_price: currentPrice.toFixed(2),
            value: value.toFixed(2),
            marketcap: priceData?.marketcap ?? "--",
        };
    }));
    return res.status(200).json({ success: true, data: userStockSummary });
    } catch (error) {
        console.error('User stock summary error:', error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};