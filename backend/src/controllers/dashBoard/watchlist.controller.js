import { addSymbol, getWatchlist, removeSymbol } from "../../db/watchlist.js";
import { getPrice } from "../../utils/getQuotes.js";
import { stockPriceStore } from "../../utils/stockPriceStore.js";

export const showWatchlist = async (req, res) => {
    const { email } = req.user;
    try {
        let watchlistData = [];
        let priceData = stockPriceStore;
        const watchlist = await getWatchlist(email);
        if(!watchlist){
            return res.status(500).json({ success: false,message: "Failed to fetch watchlist."})
        }
        if(watchlist.length==0){
            return res.status(500).json({ success: false,message: "User Doesn't have a watchlist."})
        }
        for (const symbol of watchlist) {
            if(!priceData.get(symbol)){
                const q = await getPrice(symbol);
                if (!q) {
                    return res.status(500).json({ success: false, message: "Failed to fetch stock prices." });
                }
                priceData.add(symbol,{...q,expiresAt: Date.now()+60*1000});
            }
            const data = priceData.get(symbol);
            if (!data) continue;
            watchlistData.push({
                symbol: symbol,
                currentPrice: data.MarketPrice,
                currency: data.currency,
                percentageChange: data.percentageChange,
                shortName: data.shortname,
                longName: data.longname,
            });
        }
        return res.status(200).json({ success: true, watchlist: watchlistData });
    } catch (error) {
        console.log('Show watchlist error:', error);
        return res.status(500).json({ success: false, message: "An error occurred while fetching the watchlist." });
    }
};
export const addToWatchlist = async (req, res) => {
    const { email } = req.user;
    const { symbol } = req.body;
    try {
        if (!symbol) {
            return res.status(400).json({ success: false, message: "Stock symbol is required." });
        }
        const success = await addSymbol(email, symbol);
        if (!success) {
            return res.status(500).json({ success: false, message: "Failed to add symbol to watchlist." });
        }
        return res.status(200).json({ success: true, message: "Symbol added to watchlist." });
    } catch (error) {
        console.log('Add to watchlist error:', error);
        return res.status(500).json({ success: false, message: "An error occurred while adding to the watchlist." });
    }
};
export const removeFromWatchlist = async (req, res) => {
    const { email } = req.user;
    const { symbol } = req.body;
    try {
        if (!symbol) {
            return res.status(400).json({ success: false, message: "Stock symbol is required." });
        }
        const success = await removeSymbol(email, symbol);
        if (!success) {
            return res.status(500).json({ success: false, message: "Failed to remove symbol from watchlist." });
        }
        return res.status(200).json({ success: true, message: "Symbol removed from watchlist." });
    } catch (error) {
        console.log('Remove from watchlist error:', error);
        return res.status(500).json({ success: false, message: "An error occurred while removing from the watchlist." });
    }   
};