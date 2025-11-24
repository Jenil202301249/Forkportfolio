import { toggleAiSuggestionController } from "../../../../src/controllers/user/toggleAiSuggestion.controller.js";
import * as toggleDB from "../../../../src/db/toggleAiSuggestion.js";
import * as userModel from "../../../../src/mongoModels/user.model.js";

jest.mock("../../../../src/db/toggleAiSuggestion.js", () => ({
    toggleAiSuggestion: jest.fn(),
}));

jest.mock("../../../../src/mongoModels/user.model.js", () => ({
    addActivityHistory: jest.fn(),
}));

describe("toggleAiSuggestion.controller.js", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: {
                email: "user@example.com",
                aisuggestion: true,
            },
            activeSession: { osType: "Windows", browserType: "Chrome" },
            cookies: { token: "abc-token" },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // ----------------- 401: Missing Email -----------------
    it("returns 401 when email is missing", async () => {
        req.user.email = null;

        await toggleAiSuggestionController(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Email expected",
        });
    });

    // ----------------- 503: toggleAiSuggestion returns null -----------------
    it("returns 503 when toggleAiSuggestion returns null", async () => {
        toggleDB.toggleAiSuggestion.mockResolvedValue(null);

        await toggleAiSuggestionController(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Database error while toggling ai suggestion",
        });
    });

    // ----------------- 410: User not found (empty array) -----------------
    it("returns 410 when user not found", async () => {
        toggleDB.toggleAiSuggestion.mockResolvedValue([]);

        await toggleAiSuggestionController(req, res);

        expect(res.status).toHaveBeenCalledWith(410);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "User not found",
        });
    });

    // ----------------- SUCCESS PATH -----------------
    it("successfully toggles ai suggestion, logs activity, returns 200", async () => {
        toggleDB.toggleAiSuggestion.mockResolvedValue([1]); // any non-empty success response
        userModel.addActivityHistory.mockResolvedValue({});

        req.user.aisuggestion = false; // Just for variation

        await toggleAiSuggestionController(req, res);

        // aisuggestion toggled
        expect(req.user.aisuggestion).toBe(true);

        // activity history logged
        expect(userModel.addActivityHistory).toHaveBeenCalledWith(
            "user@example.com",
            expect.objectContaining({
                os_type: "Windows",
                browser_type: "Chrome",
                type: "aisuggestion",
                message: "Toggled ai suggestion",
                token: "abc-token",
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "ai suggestion toggled,current value: true",
        });
    });

    // ----------------- CATCH BLOCK (Unexpected error) -----------------
    it("returns 500 when an unexpected error occurs", async () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        toggleDB.toggleAiSuggestion.mockRejectedValue(new Error("boom"));

        await toggleAiSuggestionController(req, res);

        expect(spy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Failed to toggle ai suggestion, please try again",
        });
    });
});
