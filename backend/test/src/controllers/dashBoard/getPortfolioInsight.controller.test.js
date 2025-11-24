import { getPortfolioInsight } from "../../../../src/controllers/dashBoard/getPortfolioInsight.controller.js";

// Mock the external Portfolio_analysis_tool to avoid real AI/service calls
jest.mock("../../../../src/utils/chatBotTools/portfolio_analysis.js", () => ({
  Portfolio_analysis_tool: {
    invoke: jest.fn(),
  },
}));

import { Portfolio_analysis_tool } from "../../../../src/utils/chatBotTools/portfolio_analysis.js";

describe("getPortfolioInsight", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        email: "user@example.com",
        name: "Alice",
        financialGoals: "Retirement",
        investmentHorizon: "10y",
        investmentExperience: "Intermediate",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should call analysis tool with context from req.user and return 200 with reply", async () => {
    const mockResult = { insight: "Diversify more into bonds" };
    Portfolio_analysis_tool.invoke.mockResolvedValue(mockResult);

    await getPortfolioInsight(req, res);

    expect(Portfolio_analysis_tool.invoke).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        configurable: expect.objectContaining({
          thread_id: "user@example.com",
          userDetails: expect.objectContaining({
            emailId: "user@example.com",
            name: "Alice",
            financialGoals: "Retirement",
            investmentHorizon: "10y",
            investmentExperience: "Intermediate",
          }),
        }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ reply: mockResult });
  });

  it("should fall back to defaults when user fields are missing", async () => {
    const mockResult = { insight: "OK" };
    Portfolio_analysis_tool.invoke.mockResolvedValue(mockResult);

    req.user = { email: "minimal@example.com" }; // name and others missing

    await getPortfolioInsight(req, res);

    expect(Portfolio_analysis_tool.invoke).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        configurable: expect.objectContaining({
          thread_id: "minimal@example.com",
          userDetails: expect.objectContaining({
            emailId: "minimal@example.com",
            name: "User",
            financialGoals: "not specified",
            investmentHorizon: "not specified",
            investmentExperience: "not specified",
          }),
        }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ reply: mockResult });
  });

  it("should handle missing req.user entirely without throwing and pass undefined email in context", async () => {
    const mockResult = { insight: "OK" };
    Portfolio_analysis_tool.invoke.mockResolvedValue(mockResult);

    req = { user: undefined };

    await getPortfolioInsight(req, res);

    expect(Portfolio_analysis_tool.invoke).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        configurable: expect.objectContaining({
          thread_id: undefined,
          userDetails: expect.objectContaining({
            emailId: undefined,
            name: "User",
            financialGoals: "not specified",
            investmentHorizon: "not specified",
            investmentExperience: "not specified",
          }),
        }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ reply: mockResult });
  });

  it("should return 500 and error payload when analysis tool throws", async () => {
    const err = new Error("service down");
    Portfolio_analysis_tool.invoke.mockRejectedValue(err);

    await getPortfolioInsight(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error", details: "service down" });
  });

  it("should log the call with user email for observability", async () => {
    const mockResult = { insight: "Track costs" };
    Portfolio_analysis_tool.invoke.mockResolvedValue(mockResult);

    await getPortfolioInsight(req, res);

    expect(console.log).toHaveBeenCalledWith(
      "getPortfolioInsight called for user:",
      "user@example.com"
    );
  });
});
