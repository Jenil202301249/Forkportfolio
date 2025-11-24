import {
    updateProfileNameController,
    updateProfileInvestmentExperienceController,
    updateProfileRiskProfileController,
    updateProfileFinancialGoalsController,
    updateProfileInvestmentHorizonController,
} from "../../../../src/controllers/user/updateProfileInfo.controller.js";

import * as syntax from "../../../../src/utils/checkUserSyntax.js";
import * as dbInfo from "../../../../src/db/updateProfileInfo.js";
import * as userModel from "../../../../src/mongoModels/user.model.js";

// ------------------ MOCK MODULES ------------------
jest.mock("../../../../src/utils/checkUserSyntax.js", () => ({
    checkNameSyntax: jest.fn(),
}));

jest.mock("../../../../src/db/updateProfileInfo.js", () => ({
    updateProfileName: jest.fn(),
    updateProfileInvestmentExperience: jest.fn(),
    updateProfileRiskProfile: jest.fn(),
    updateProfileFinancialGoals: jest.fn(),
    updateProfileInvestmentHorizon: jest.fn(),
}));

jest.mock("../../../../src/mongoModels/user.model.js", () => ({
    addActivityHistory: jest.fn(),
}));

// ---------------------------------------------------
describe("updateProfileNameController", () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            user: { email: "test@example.com", name: "Old Name" },
            activeSession: { osType: "Windows", browserType: "Chrome" },
            cookies: { token: "abc123" },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.clearAllMocks();
    });

    // ---------- Missing name ----------
    test("should return 400 when name is missing", async () => {
        req.body = {};

        await updateProfileNameController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "name is required.",
        });
    });

    // ---------- Invalid name syntax ----------
    test("should return 422 when name syntax is invalid", async () => {
        req.body.name = "Invalid@Name";

        syntax.checkNameSyntax.mockReturnValue({ success: false, message: "Invalid name" });

        await updateProfileNameController(req, res);

        expect(syntax.checkNameSyntax).toHaveBeenCalledWith("Invalid@Name");
        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to update profile name, please try again",
        });
    });

    // ---------- Same name as previous ----------
    test("should return 200 when name is same as previous", async () => {
        req.body.name = "Old Name"; // same as req.user.name

        syntax.checkNameSyntax.mockReturnValue({ success: true });

        await updateProfileNameController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Nothing to update.",
        });
    });

    // ---------- Database error: null ----------
    test("should return 503 when updateProfileName returns null", async () => {
        req.body.name = "New Name";

        syntax.checkNameSyntax.mockReturnValue({ success: true });
        dbInfo.updateProfileName.mockResolvedValue(null);

        await updateProfileNameController(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Database error occurred while updating profile name.",
        });
    });

    // ---------- Database error: empty array ----------
    test("should return 400 when updateProfileName returns empty array", async () => {
        req.body.name = "New Name";

        syntax.checkNameSyntax.mockReturnValue({ success: true });
        dbInfo.updateProfileName.mockResolvedValue([]);

        await updateProfileNameController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Error updating profile name.",
        });
    });

    // ---------- Successful update ----------
    test("should update name and create activity history", async () => {
        req.body.name = "Updated Name";

        syntax.checkNameSyntax.mockReturnValue({ success: true });
        dbInfo.updateProfileName.mockResolvedValue([{ acknowledged: true }]);
        userModel.addActivityHistory.mockResolvedValue(true);

        await updateProfileNameController(req, res);

        expect(dbInfo.updateProfileName).toHaveBeenCalledWith(
            "test@example.com",
            "Updated Name"
        );

        expect(userModel.addActivityHistory).toHaveBeenCalledWith(
            "test@example.com",
            expect.objectContaining({
                type: "name",
                message: "Updated profile name from Old Name to Updated Name",
                token: "abc123",
                os_type: "Windows",
                browser_type: "Chrome",
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Profile name updated successfully.",
        });
    });

    // ---------- Should catch exception ----------
    test("should return 500 when controller throws error", async () => {
        req.body.name = "New Name";

        syntax.checkNameSyntax.mockImplementation(() => {
            throw new Error("Test error");
        });

        await updateProfileNameController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to update profile name, please try again",
        });
    });
});

describe("updateProfileInvestmentExperienceController", () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            user: {
                email: "test@example.com",
                investmentexperience: "Beginner",
            },
            activeSession: {
                osType: "Windows",
                browserType: "Chrome"
            },
            cookies: {
                token: "abc123"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    // ------------------ Missing investmentExperience ------------------
    test("should return 400 when investmentExperience is missing", async () => {
        await updateProfileInvestmentExperienceController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "investment experience is required.",
        });
    });

    // ------------------ Same value as previous ------------------
    test("should return 200 when value is same as previous", async () => {
        req.body.investmentExperience = "Beginner";

        await updateProfileInvestmentExperienceController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Nothing to update.",
        });
    });

    // ------------------ DB returns null ------------------
    test("should return 503 when updateProfileInvestmentExperience returns null", async () => {
        req.body.investmentExperience = "Intermediate";

        dbInfo.updateProfileInvestmentExperience.mockResolvedValue(null);

        await updateProfileInvestmentExperienceController(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Error updating profile investment experience.",
        });
    });

    // ------------------ DB returns empty array ------------------
    test("should return 410 when updateProfileInvestmentExperience returns empty array", async () => {
        req.body.investmentExperience = "Intermediate";

        dbInfo.updateProfileInvestmentExperience.mockResolvedValue([]);

        await updateProfileInvestmentExperienceController(req, res);

        expect(res.status).toHaveBeenCalledWith(410);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Error updating profile investment experience.",
        });
    });

    // ------------------ Success case ------------------
    test("should update investmentExperience and log activity", async () => {
        req.body.investmentExperience = "Intermediate";

        dbInfo.updateProfileInvestmentExperience.mockResolvedValue([{ ok: 1 }]);
        userModel.addActivityHistory.mockResolvedValue(true);

        await updateProfileInvestmentExperienceController(req, res);

        expect(dbInfo.updateProfileInvestmentExperience).toHaveBeenCalledWith(
            "test@example.com",
            "Intermediate"
        );

        expect(userModel.addActivityHistory).toHaveBeenCalledWith(
            "test@example.com",
            expect.objectContaining({
                type: "investmentExperience",
                os_type: "Windows",
                browser_type: "Chrome",
                token: "abc123",
                message:
                    "Updated profile investment experience from Beginner to Intermediate",
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Profile investment experience updated successfully.",
        });
    });

    // ------------------ Exception thrown ------------------
    test("should return 500 when controller throws error", async () => {
        req.body.investmentExperience = "New Value";

        dbInfo.updateProfileInvestmentExperience.mockImplementation(() => {
            throw new Error("Test error");
        });

        await updateProfileInvestmentExperienceController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message:
                "failed to update profile investment experience, please try again",
        });
    });
});

describe("updateProfileRiskProfileController", () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            user: {
                email: "test@example.com",
                riskprofile: "Low",
            },
            activeSession: {
                osType: "Windows",
                browserType: "Chrome"
            },
            cookies: {
                token: "abc123"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    // ---------- Missing field ----------
    test("should return 400 when riskProfile is missing", async () => {
        await updateProfileRiskProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "riskProfile is required.",
        });
    });

    // ---------- Same as previous ----------
    test("should return 200 when riskProfile is same as previous", async () => {
        req.body.riskProfile = "Low";

        await updateProfileRiskProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Nothing to update.",
        });
    });

    // ---------- DB returned null ----------
    test("should return 503 when updateProfileRiskProfile returns null", async () => {
        req.body.riskProfile = "Medium";

        dbInfo.updateProfileRiskProfile.mockResolvedValue(null);

        await updateProfileRiskProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Database error occurred while updating risk profile.",
        });
    });

    // ---------- DB returned empty array ----------
    test("should return 410 when updateProfileRiskProfile returns empty array", async () => {
        req.body.riskProfile = "Medium";

        dbInfo.updateProfileRiskProfile.mockResolvedValue([]);

        await updateProfileRiskProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(410);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Error updating risk profile.",
        });
    });

    // ---------- Successful update ----------
    test("should update riskProfile and log activity", async () => {
        req.body.riskProfile = "High";

        dbInfo.updateProfileRiskProfile.mockResolvedValue([{ acknowledged: true }]);
        userModel.addActivityHistory.mockResolvedValue(true);

        await updateProfileRiskProfileController(req, res);

        expect(dbInfo.updateProfileRiskProfile).toHaveBeenCalledWith(
            "test@example.com",
            "High"
        );

        expect(userModel.addActivityHistory).toHaveBeenCalledWith(
            "test@example.com",
            expect.objectContaining({
                type: "riskProfile",
                os_type: "Windows",
                browser_type: "Chrome",
                token: "abc123",
                message: "Updated profile risk profile from Low to High",
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "risk profile updated successfully.",
        });
    });

    // ---------- Thrown exception ----------
    test("should return 500 when controller throws an error", async () => {
        req.body.riskProfile = "High";

        dbInfo.updateProfileRiskProfile.mockImplementation(() => {
            throw new Error("Test error");
        });

        await updateProfileRiskProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to update risk profile, please try again",
        });
    });
});

describe("updateProfileFinancialGoalsController", () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            user: {
                email: "test@example.com",
                financialgoals: "Long Term Growth"
            },
            activeSession: {
                osType: "Windows",
                browserType: "Chrome"
            },
            cookies: {
                token: "abc123"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    // -------- Missing financialGoals --------
    test("should return 400 when financialGoals is missing", async () => {
        await updateProfileFinancialGoalsController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "financialGoals field is required.",
        });
    });

    // -------- Same as previous --------
    test("should return 200 when financialGoals is same as previous", async () => {
        req.body.financialGoals = "Long Term Growth";

        await updateProfileFinancialGoalsController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Nothing to update.",
        });
    });

    // -------- DB returns null --------
    test("should return 503 when updateProfileFinancialGoals returns null", async () => {
        req.body.financialGoals = "Short Term Trading";

        dbInfo.updateProfileFinancialGoals.mockResolvedValue(null);

        await updateProfileFinancialGoalsController(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Database error occurred while updating financial goals.",
        });
    });

    // -------- DB returns empty array --------
    test("should return 410 when updateProfileFinancialGoals returns empty array", async () => {
        req.body.financialGoals = "Short Term Trading";

        dbInfo.updateProfileFinancialGoals.mockResolvedValue([]);

        await updateProfileFinancialGoalsController(req, res);

        expect(res.status).toHaveBeenCalledWith(410);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Error updating financial goals.",
        });
    });

    // -------- Successful update --------
    test("should update financialGoals and log activity", async () => {
        req.body.financialGoals = "Short Term Trading";

        dbInfo.updateProfileFinancialGoals.mockResolvedValue([{ ok: 1 }]);
        userModel.addActivityHistory.mockResolvedValue(true);

        await updateProfileFinancialGoalsController(req, res);

        expect(dbInfo.updateProfileFinancialGoals).toHaveBeenCalledWith(
            "test@example.com",
            "Short Term Trading"
        );

        expect(userModel.addActivityHistory).toHaveBeenCalledWith(
            "test@example.com",
            expect.objectContaining({
                type: "financialGoals",
                os_type: "Windows",
                browser_type: "Chrome",
                token: "abc123",
                message:
                    "Updated profile financial goals from Long Term Growth to Short Term Trading",
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "financial goals updated successfully.",
        });
    });

    // -------- Exception thrown --------
    test("should return 500 when controller throws an error", async () => {
        req.body.financialGoals = "New Value";

        dbInfo.updateProfileFinancialGoals.mockImplementation(() => {
            throw new Error("Test error");
        });

        await updateProfileFinancialGoalsController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to update financial goals, please try again",
        });
    });
});

describe("updateProfileInvestmentHorizonController", () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            user: {
                email: "test@example.com",
                investmenthorizon: "1-3 years"
            },
            activeSession: {
                osType: "Windows",
                browserType: "Chrome"
            },
            cookies: {
                token: "abc123"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.clearAllMocks();
    });

    // -------- Missing investmentHorizon --------
    test("should return 400 when investmentHorizon is missing", async () => {
        await updateProfileInvestmentHorizonController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "investmentHorizon field is required.",
        });
    });

    // -------- Same value as previous --------
    test("should return 200 when investmentHorizon is same as previous", async () => {
        req.body.investmentHorizon = "1-3 years";

        await updateProfileInvestmentHorizonController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Nothing to update.",
        });
    });

    // -------- DB returned null --------
    test("should return 503 when updateProfileInvestmentHorizon returns null", async () => {
        req.body.investmentHorizon = "5+ years";

        dbInfo.updateProfileInvestmentHorizon.mockResolvedValue(null);

        await updateProfileInvestmentHorizonController(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message:
                "Database error occurred while updating investment horizon.",
        });
    });

    // -------- DB returned empty array --------
    test("should return 410 when updateProfileInvestmentHorizon returns empty array", async () => {
        req.body.investmentHorizon = "5+ years";

        dbInfo.updateProfileInvestmentHorizon.mockResolvedValue([]);

        await updateProfileInvestmentHorizonController(req, res);

        expect(res.status).toHaveBeenCalledWith(410);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Error updating investment horizon.",
        });
    });

    // -------- Successful update --------
    test("should update investment horizon and log activity", async () => {
        req.body.investmentHorizon = "5+ years";

        dbInfo.updateProfileInvestmentHorizon.mockResolvedValue([{ ok: 1 }]);
        userModel.addActivityHistory.mockResolvedValue(true);

        await updateProfileInvestmentHorizonController(req, res);

        expect(dbInfo.updateProfileInvestmentHorizon).toHaveBeenCalledWith(
            "test@example.com",
            "5+ years"
        );

        expect(userModel.addActivityHistory).toHaveBeenCalledWith(
            "test@example.com",
            expect.objectContaining({
                type: "investmentHorizon",
                os_type: "Windows",
                browser_type: "Chrome",
                token: "abc123",
                message:
                    "Updated profile investment horizon from 1-3 years to 5+ years",
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "investment horizon updated successfully.",
        });
    });

    // -------- Exception thrown --------
    test("should return 500 when controller throws error", async () => {
        req.body.investmentHorizon = "5+ years";

        dbInfo.updateProfileInvestmentHorizon.mockImplementation(() => {
            throw new Error("Test error");
        });

        await updateProfileInvestmentHorizonController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message:
                "failed to update investment horizon, please try again",
        });
    });
});