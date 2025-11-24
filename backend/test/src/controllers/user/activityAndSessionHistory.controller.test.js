import { activityAndSessionHistory } from "../../../../src/controllers/user/activityAndSessionHistory.controller.js";
import * as deleteSession from "../../../../src/db/deleteActiveSession.js";
import * as getActive from "../../../../src/db/getActiveSession.js";
import * as userModel from "../../../../src/mongoModels/user.model.js";
import jwt from "jsonwebtoken";

jest.mock("../../../../src/db/deleteActiveSession.js", () => ({
    deleteActiveSessionByToken: jest.fn(),
}));

jest.mock("../../../../src/db/getActiveSession.js", () => ({
    getAllActiveSessionOfUser: jest.fn(),
}));

jest.mock("../../../../src/mongoModels/user.model.js", () => ({
    getRecentActivityHistory: jest.fn(),
    getRecentSecurityAlerts: jest.fn(),
}));

jest.mock("jsonwebtoken", () => {
    const verify = jest.fn();
    return { default: { verify }, verify };
});

describe("activityAndSessionHistory.controller.js", () => {
    let req, res;
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...OLD_ENV, JWT_SECRET: "test-secret" };

        req = {
            user: { email: "user@example.com" },
            cookies: { token: "cookie-token" },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    // ---------- NEW TEST FOR: if(!email) ----------
    it("returns 401 when req.user.email is missing", async () => {
        req.user.email = null;

        await activityAndSessionHistory(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "expected mail",
        });
    });

    // -------------- NULL DB RESPONSE ---------------
    it("returns 503 if getAllActiveSessionOfUser returns null", async () => {
        getActive.getAllActiveSessionOfUser.mockResolvedValue(null);

        await activityAndSessionHistory(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Database error while getting active session count",
        });
    });

    // -------------- JWT INVALID → DELETE SESSION --------------
    it("removes invalid sessions using deleteActiveSessionByToken", async () => {
        getActive.getAllActiveSessionOfUser.mockResolvedValue([
            { token: "bad1" },
            { token: "good1" },
            { token: "bad2" }
        ]);

        jwt.verify
            .mockImplementationOnce(() => { throw new Error("invalid"); })
            .mockImplementationOnce(() => {}) // good
            .mockImplementationOnce(() => { throw new Error("invalid"); });

        userModel.getRecentSecurityAlerts.mockResolvedValue([]);
        userModel.getRecentActivityHistory.mockResolvedValue([]);

        await activityAndSessionHistory(req, res);

        expect(deleteSession.deleteActiveSessionByToken).toHaveBeenCalledTimes(2);
        expect(deleteSession.deleteActiveSessionByToken).toHaveBeenCalledWith("bad1");
        expect(deleteSession.deleteActiveSessionByToken).toHaveBeenCalledWith("bad2");

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                activeSessions: [{ token: "good1" }]
            })
        );
    });

    // -------------- COOKIE SESSION → MOVE TO FRONT --------------
    it("moves cookie-token session to the front", async () => {
        getActive.getAllActiveSessionOfUser.mockResolvedValue([
            { token: "x1" },
            { token: "cookie-token" },
            { token: "x2" }
        ]);

        jwt.verify.mockImplementation(() => {}); // all valid

        userModel.getRecentSecurityAlerts.mockResolvedValue([]);
        userModel.getRecentActivityHistory.mockResolvedValue([]);

        await activityAndSessionHistory(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                activeSessions: [
                    { token: "cookie-token" },
                    { token: "x1" },
                    { token: "x2" },
                ],
            })
        );
    });

    // -------------- SECURITY ALERTS CLEANUP --------------
    it("cleans securityAlerts by removing token & updatedAt", async () => {
        getActive.getAllActiveSessionOfUser.mockResolvedValue([]);
        jwt.verify.mockImplementation(() => {});

        userModel.getRecentSecurityAlerts.mockResolvedValue([
            { token: "s1", updatedAt: "d1", extra: 1 },
            { token: "s2", updatedAt: "d2", extra: 2 },
        ]);

        userModel.getRecentActivityHistory.mockResolvedValue([]);

        await activityAndSessionHistory(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                securityAlerts: [
                    { token: undefined, updatedAt: undefined, extra: 1 },
                    { token: undefined, updatedAt: undefined, extra: 2 },
                ],
            })
        );
    });

    // -------------- ACTIVITY HISTORY CLEANUP --------------
    it("cleans activityHistory by removing token & updatedAt", async () => {
        getActive.getAllActiveSessionOfUser.mockResolvedValue([]);
        jwt.verify.mockImplementation(() => {});

        userModel.getRecentSecurityAlerts.mockResolvedValue([]);
        userModel.getRecentActivityHistory.mockResolvedValue([
            { token: "h1", updatedAt: "d1", act: "A" },
            { token: "h2", updatedAt: "d2", act: "B" },
        ]);

        await activityAndSessionHistory(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                activityHistory: [
                    { token: undefined, updatedAt: undefined, act: "A" },
                    { token: undefined, updatedAt: undefined, act: "B" },
                ],
            })
        );
    });

    // -------------- FULL SUCCESS CASE --------------
    it("returns 200 with all cleaned objects", async () => {
        getActive.getAllActiveSessionOfUser.mockResolvedValue([
            { token: "cookie-token" }
        ]);

        jwt.verify.mockImplementation(() => {});

        userModel.getRecentSecurityAlerts.mockResolvedValue([
            { token: "s", updatedAt: "u", ok: 1 }
        ]);

        userModel.getRecentActivityHistory.mockResolvedValue([
            { token: "a", updatedAt: "u2", ok2: 2 }
        ]);

        await activityAndSessionHistory(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            activeSessions: [{ token: "cookie-token" }],
            securityAlerts: [{ token: undefined, updatedAt: undefined, ok: 1 }],
            activityHistory: [{ token: undefined, updatedAt: undefined, ok2: 2 }],
        });
    });

    // -------------- CATCH BLOCK --------------
    it("returns 500 when unexpected exception occurs", async () => {
        getActive.getAllActiveSessionOfUser.mockRejectedValue(new Error("boom"));

        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        await activityAndSessionHistory(req, res);

        expect(spy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to get activity and session history. Please try again",
        });
    });
});
