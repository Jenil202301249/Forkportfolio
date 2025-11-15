import { UserPortfolioValuationdaily } from "../../mongoModels/userPortfolioValuation.model.js";

export const getUserPortfolioValuations = async (req, res) => {
  try {
    const email = req.user.email
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // ---------- DAILY DATA (Last 365 days) ----------
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    let oneYearAgo = new Date(startOfToday);
    oneYearAgo.setDate(oneYearAgo.getDate() - 364); 
    // Get actual records
    const dailyRecords = await UserPortfolioValuationdaily
      .find({ email, date: { $gte: oneYearAgo,$lte: startOfToday } })
      .sort({ date: 1 })
      .lean();
    // Map existing daily data into a dictionary for quick lookup
    const dailyMap = new Map(
      dailyRecords.map(d => [new Date(d.date).setHours(0, 0, 0, 0), d.portfolioValuation])
    );

    // Generate full 365-day data with missing days = 0
    const fullDaily = [];
    for (let i = 0; i < 365; i++) {
      const date = new Date(oneYearAgo);
      date.setDate(oneYearAgo.getDate() + i);
      const dayKey = date.setHours(0, 0, 0, 0);
      fullDaily.push({
        date: new Date(dayKey).toISOString().split("T")[0],
        valuation: dailyMap.get(dayKey) || 0,
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        daily: fullDaily,
      },
    });
  } catch (error) {
    console.error("Error fetching valuations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
