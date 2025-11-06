import mongoose, { Schema } from "mongoose";
const userPortfolioValuationdailySchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    portfolioValuation: {
      type: Number,
      required: [true, "Portfolio Valuation is required"],
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date().setHours(0, 0, 0, 0), // stores only date part
    },
  },
  {
    timestamps: true, // keeps createdAt and updatedAt
  }
);
userPortfolioValuationdailySchema.index({ email: 1, date: 1 }, { unique: true });

export const UserPortfolioValuationdaily = mongoose.model(
  "userPortfolioValuationdaily",
  userPortfolioValuationdailySchema
);

const userPortfolioValuationHourlySchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    portfolioValuation: {
      type: Number,
      required: [true, "Portfolio Valuation is required"],
    },
    timestamp: {
      type: Date,
      required: true,
      default: () => {
        const now = new Date();
        now.setMinutes(0, 0, 0);
        return now;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Unique index for each user per hour snapshot
userPortfolioValuationHourlySchema.index({ email: 1, timestamp: 1 }, { unique: true });

export const UserPortfolioValuationHourly = mongoose.model(
  "userPortfolioValuationHourly",
  userPortfolioValuationHourlySchema
);
