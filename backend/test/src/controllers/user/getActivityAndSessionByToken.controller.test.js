import { jest } from "@jest/globals";

// ---------------- MOCK DB FUNCTIONS ----------------
jest.mock("../../../../src/mongoModels/user.model.js", () => ({
    getActivityHistoryByToken: jest.fn(),
    getSecurityAlertsByToken: jest.fn(),
}));

import {
    getActivityHistoryByToken,
    getSecurityAlertsByToken,
} from "../../../../src/mongoModels/user.model.js";

import { getActivityAndSessionByToken } from "../../../../src/controllers/user/getActivityAndSessionByToken.controller.js";

// ---------------- START TESTS ----------------
describe("getActivityAndSessionByToken.controller.js", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {
                token: "abc123",
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // ---------------- Missing Token ----------------
    it("returns 400 when token is missing", async () => {
        req.body.token = null;

        await getActivityAndSessionByToken(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "token is required.",
        });
    });

    // ---------------- Success Case ----------------
    it("returns 200 with activityHistory and securityAlerts", async () => {
        const mockActivity = [{ type: "login", message: "success" }];
        const mockAlerts = [{ type: "security", message: "alert" }];

        getActivityHistoryByToken.mockResolvedValue(mockActivity);
        getSecurityAlertsByToken.mockResolvedValue(mockAlerts);

        await getActivityAndSessionByToken(req, res);

        expect(getActivityHistoryByToken).toHaveBeenCalledWith("abc123");
        expect(getSecurityAlertsByToken).toHaveBeenCalledWith("abc123");

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            activityHistory: mockActivity,
            securityAlerts: mockAlerts,
        });
    });

    // ---------------- Error Case ----------------
    it("returns 500 on exception", async () => {
        getActivityHistoryByToken.mockRejectedValue(new Error("DB error"));

        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        await getActivityAndSessionByToken(req, res);

        expect(spy).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to fetch activity and session, please try again",
        });

        spy.mockRestore();
    });
});
