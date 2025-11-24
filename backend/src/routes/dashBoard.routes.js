import { Router } from "express";
import { graphFormetData } from "../controllers/dashBoard/graphDataFromet.js";
import { getNews,starter,searchStock, calculatePortfolio, addTransaction, showWatchlist, addToWatchlist, removeFromWatchlist, getStockAllocation, getMarketGainers, getMarketLosers, getMarketactiveStocks, userStockSummary, getUserPortfolioValuations, stockDetails ,getPortfolioInsight} from "../controllers/dashBoard/dashBoard.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/searchStock").get(verifyToken,searchStock);
router.route("/starter").get(verifyToken,starter);
router.route("/graph").get(verifyToken,graphFormetData);
router.route("/news/:query").get(verifyToken,getNews);
router.route("/Valuation").get(verifyToken,calculatePortfolio);
router.route("/addTransaction").post(verifyToken,addTransaction);
router.route("/displayWatchlist").get(verifyToken,showWatchlist);
router.route("/addToWatchlist").post(verifyToken,addToWatchlist);
router.route("/removeFromWatchlist").delete(verifyToken,removeFromWatchlist);
router.route("/stockAllocation").get(verifyToken,getStockAllocation);
router.route("/marketGainers").get(verifyToken,getMarketGainers);
router.route("/marketActiveStocks").get(verifyToken,getMarketactiveStocks);
router.route("/marketLosers").get(verifyToken,getMarketLosers);
router.route("/stockSummary").get(verifyToken,userStockSummary);
router.route("/userPortfolioValuation").get(verifyToken,getUserPortfolioValuations)
router.route("/stockDetails").get(verifyToken,stockDetails)
router.route("/getPortfolioInsight").get(verifyToken,getPortfolioInsight);
export default router;
