import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getPortfolioFundamentals, getSummaryTable, getPortfolioHoldings } from "../controllers/Portfolio/portfolio.controller.js";

const router = Router();

router.route('/portfolioSummary').get(verifyToken,getSummaryTable);
router.route('/portfolioFundamentals').get(verifyToken,getPortfolioFundamentals);
router.route('/portfolioHoldings').get(verifyToken,getPortfolioHoldings)
export default router;
