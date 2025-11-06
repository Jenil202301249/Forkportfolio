import { UserPortfolioValuationdaily, UserPortfolioValuationHourly } from "../../mongoModels/userPortfolioValuation.model.js";

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
      .find({ email, date: { $gte: startOfToday } })
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

    // ---------- HOURLY DATA (Last 168 hours = 7 days) ----------
    const oneWeekAgo = new Date();
    oneWeekAgo.setHours(oneWeekAgo.getHours() - 167);
    oneWeekAgo.setMinutes(0, 0, 0);

    // Fetch actual hourly records
    const hourlyRecords = await UserPortfolioValuationHourly
    .find({ email, timestamp: { $gte: oneWeekAgo } })
    .sort({ timestamp: 1 })
    .lean();
    // Build a map using ISO strings (safe key type)
    const hourlyMap = new Map(
    hourlyRecords.map(h => [new Date(h.timestamp).toISOString(), h.portfolioValuation])
    );
    const fullHourly = [];
    for (let i = 0; i < 168; i++) {
    const date = new Date(oneWeekAgo.getTime() + i * 60 * 60 * 1000);
    date.setMinutes(0, 0, 0);
    const key = date.toISOString();

    fullHourly.push({
        time: key,
        valuation: hourlyMap.get(key) || 0,
    });
    }
    return res.status(200).json({
      success: true,
      data: {
        daily: fullDaily,
        hourly: fullHourly,
      },
    });
  } catch (error) {
    console.error("Error fetching valuations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
