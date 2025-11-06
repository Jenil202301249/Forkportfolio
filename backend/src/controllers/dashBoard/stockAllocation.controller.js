import { getStocksSector } from "../../db/stockSector.js";
import { getPrice } from "../../utils/getQuotes.js";
import { stockPriceStore } from "../../utils/stockPriceStore.js";

export const getStockAllocation = async (req, res) => {
    const { email } = req.user;
    try {
        const stocksSector = await getStocksSector(email);
        if (!stocksSector || stocksSector.length === 0) {
            return res.status(404).json({ success: false, message: "No stocks found for the user." });
        }
        let priceData = stockPriceStore;
        let sectorAllocation = {};
        let totalPortfolioValue = 0;
        for (const stock of stocksSector) {
            if(!priceData.get(stock.symbol)){
                const q = await getPrice(stock.symbol);
                if (!q) {
                    continue;
                }
                priceData.add(stock.symbol,{...q,expiresAt: Date.now()+60*1000});
            }
            const data = priceData.get(stock.symbol);
            if (!data) continue;
            const currentValue = stock.current_holding * data.current;
            totalPortfolioValue += currentValue;
            if (sectorAllocation[stock.sector]) {
                sectorAllocation[stock.sector] += currentValue;
            } else {
                sectorAllocation[stock.sector] = currentValue;
            }
        }
        const labels = Object.keys(sectorAllocation);
        const values = labels.map(label => ((sectorAllocation[label] / totalPortfolioValue) * 100).toFixed(2));

        return res.status(200).json({ success: true, labels: labels, values: values });
    } catch (error) {
        console.log('Stock allocation error:', error);
        return res.status(500).json({ success: false, message: "An error occurred while calculating stock allocation." });
    }
};