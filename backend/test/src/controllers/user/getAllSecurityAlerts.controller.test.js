import { jest } from "@jest/globals";

// ---- MOCK DB ----
jest.mock("../../../../src/mongoModels/user.model.js", () => ({
    getAllSecurityAlerts: jest.fn(),
}));

import { getAllSecurityAlerts } from "../../../../src/mongoModels/user.model.js";
import { getAllSecurityAlertsController } from "../../../../src/controllers/user/getAllSecurityAlerts.controller.js";

describe("getAllSecurityAlertsController", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: {
                email: "test@example.com",
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // ------------------------------------------------------
    // SUCCESS CASE
    // ------------------------------------------------------
    it("returns 200 with cleaned security alerts", async () => {
        const mockAlerts = [
            {
                type: "unauthorized",
                message: "blocked login",
                token: "abc",
                updatedAt: "2024-01-01",
                createdAt: "2024-01-01",
            },
            {
                type: "login",
                message: "success",
                token: "xyz",
                updatedAt: "2024-01-02",
                createdAt: "2024-01-02",
            },
        ];

        getAllSecurityAlerts.mockResolvedValue(mockAlerts);

        await getAllSecurityAlertsController(req, res);

        expect(getAllSecurityAlerts).toHaveBeenCalledWith("test@example.com");
        expect(res.status).toHaveBeenCalledWith(200);

        const response = res.json.mock.calls[0][0];

        expect(response.success).toBe(true);
        expect(response.alerts).toHaveLength(2);

        response.alerts.forEach((alert, index) => {
            expect(alert.token).toBeUndefined();
            expect(alert.updatedAt).toBeUndefined();

            expect(alert.type).toBe(mockAlerts[index].type);
            expect(alert.message).toBe(mockAlerts[index].message);
            expect(alert.createdAt).toBe(mockAlerts[index].createdAt);
        });
    });

    // ------------------------------------------------------
    // EDGE CASE: EMPTY ALERTS
    // ------------------------------------------------------
    it("returns empty array correctly", async () => {
        getAllSecurityAlerts.mockResolvedValue([]);

        await getAllSecurityAlertsController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            alerts: [],
        });
    });

    // ------------------------------------------------------
    // ERROR CASE
    // ------------------------------------------------------
    it("returns 500 on exception", async () => {
        getAllSecurityAlerts.mockRejectedValue(new Error("boom"));

        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        await getAllSecurityAlertsController(req, res);

        expect(spy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Failed to fetch security alerts, please try again",
        });

        spy.mockRestore();
    });

    // ------------------------------------------------------
    // MUTATION-KILLER: ensure loop updates EVERY alert
    // ------------------------------------------------------
    it("removes token and updatedAt from ALL alerts (loop mutation killer)", async () => {
        const mockAlerts = Array.from({ length: 5 }, (_, i) => ({
            type: "alert-" + i,
            message: "m",
            token: "token-" + i,
            updatedAt: "time",
            createdAt: "2024-01-01",
        }));

        getAllSecurityAlerts.mockResolvedValue(mockAlerts);

        await getAllSecurityAlertsController(req, res);

        const cleaned = res.json.mock.calls[0][0].alerts;

        cleaned.forEach(alert => {
            expect(alert.token).toBeUndefined();
            expect(alert.updatedAt).toBeUndefined();
        });
    });
});
