import { getStocksSector } from "../../db/stockSector.js";
import { getPrice } from "../../utils/getQuotes.js";

export const getStockAllocation = async (req, res) => {
    const { email } = req.user;
    try {
        const stocksSector = await getStocksSector(email);
        if (!stocksSector ) {
            return res.status(503).json({ success: false, message: "Failed to get stock from db." });
        }
        if(stocksSector.length === 0){
            return res.status(200).json({ success: false, labels: [], values: []});
        }
        let sectorAllocation = {};
        let totalPortfolioValue = 0;
        for (const stock of stocksSector) {
            const data = await getPrice(stock.symbol);
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