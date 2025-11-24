import { addSymbol, checkpresent, getWatchlist, removeSymbol } from "../../db/watchlist.js";
import { getPrice } from "../../utils/getQuotes.js";
import { addActivityHistory } from "../../mongoModels/user.model.js";
export const showWatchlist = async (req, res) => {
    const { email } = req.user;
    try {
        let watchlistData = [];
        const watchlist = await getWatchlist(email);
        if(!watchlist){
            return res.status(503).json({ success: false,message: "Failed to fetch watchlist."})
        }
        if(watchlist.length==0){
            return res.status(200).json({ success: true,watchlist: [] })
        }
        for (const symbol of watchlist) {
            const data = await getPrice(symbol.symbol);
            if (!data) return res.status(504).json({ success: false, message: "Failed to fetch stock prices." });
            watchlistData.push({
                symbol: symbol.symbol,
                currentPrice: data.current,
                currency: data.currency,
                percentageChange: data.percentageChange,
                currentchange: data.change,
                shortName: data.shortname,
                longName: data.longname,
                marketcap: data.marketcap,
                sector: data.sector||"others",
            });
        }
        watchlistData.sort((a, b) => b.currentPrice - a.currentPrice);
        return res.status(200).json({ success: true, watchlist: watchlistData });
    } catch (error) {
        console.error('Show watchlist error:', error);
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
            return res.status(503).json({ success: false, message: "Failed to add symbol to watchlist." });
        }
        const newActivity = {
            os_type: req?.activeSession?.osType,
            browser_type: req?.activeSession?.browserType,
            type: `add ${symbol} in Watchlist`,
            message: "Adding stock to Watchlist",
            token: req?.cookies?.token,
        };
        await addActivityHistory(email, newActivity);
        return res.status(200).json({ success: true, message: "Symbol added to watchlist." });
    } catch (error) {
        console.error('Add to watchlist error:', error);
        return res.status(500).json({ success: false, message: "An error occurred while adding to the watchlist." });
    }
};
export const removeFromWatchlist = async (req, res) => {
    const { email } = req.user;
    const { symbol } = req.query;
    try {
        if (!symbol) {
            return res.status(400).json({ success: false, message: "Stock symbol is required." });
        }
        const available = await checkpresent(email,symbol);
        if(available==undefined){
            return res.status(503).json({success:false,message: "Database Error"});
        }
        if(available<=0){
            return res.status(400).json({success:false,meaasage: "The stock is not present to be removeed."});
        }
        const success = await removeSymbol(email, symbol);
        if (!success) {
            return res.status(503).json({ success: false, message: "Failed to remove symbol from watchlist." });
        }
        const newActivity = {
            os_type: req.activeSession.osType,
            browser_type: req.activeSession.browserType,
            type: `Remove ${symbol} from Watchlist`,
            message: "Removing stock from Watchlist",
            token: req.cookies.token,
        };
        await addActivityHistory(email, newActivity);
        return res.status(200).json({ success: true, message: "Symbol removed from watchlist." });
    } catch (error) {
        console.error('Remove from watchlist error:', error);
        return res.status(500).json({ success: false, message: "An error occurred while removing from the watchlist." });
    }   
};