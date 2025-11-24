import { jest } from "@jest/globals";

// ---- MOCK DB ----
jest.mock("../../../../src/mongoModels/user.model.js", () => ({
    getAllActivityHistory: jest.fn(),
}));

import { getAllActivityHistory } from "../../../../src/mongoModels/user.model.js";
import { getAllActivityHistoryController } from "../../../../src/controllers/user/getAllActivityHistory.controller.js";

describe("getAllActivityHistoryController", () => {
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
    it("returns 200 with cleaned activity history", async () => {
        const mockHistory = [
            {
                type: "login",
                message: "success",
                token: "secret-token",
                updatedAt: "2024-01-01",
                createdAt: "2024-01-01",
            },
            {
                type: "logout",
                message: "bye",
                token: "secret2",
                updatedAt: "2024-01-02",
                createdAt: "2024-01-02",
            },
        ];

        getAllActivityHistory.mockResolvedValue(mockHistory);

        await getAllActivityHistoryController(req, res);

        // DB function called with email
        expect(getAllActivityHistory).toHaveBeenCalledWith("test@example.com");

        // verify response
        expect(res.status).toHaveBeenCalledWith(200);

        const response = res.json.mock.calls[0][0];

        expect(response.success).toBe(true);
        expect(response.history).toHaveLength(2);

        // ---- Most important: token and updatedAt must be removed ----
        response.history.forEach((entry, index) => {
            expect(entry.token).toBeUndefined();
            expect(entry.updatedAt).toBeUndefined();

            // other data untouched
            expect(entry.type).toBe(mockHistory[index].type);
            expect(entry.message).toBe(mockHistory[index].message);
            expect(entry.createdAt).toBe(mockHistory[index].createdAt);
        });
    });

    // ------------------------------------------------------
    // EDGE CASE: EMPTY HISTORY
    // ------------------------------------------------------
    it("returns empty array correctly", async () => {
        getAllActivityHistory.mockResolvedValue([]);

        await getAllActivityHistoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            history: [],
        });
    });

    // ------------------------------------------------------
    // ERROR CASE
    // ------------------------------------------------------
    it("returns 500 when DB throws error", async () => {
        getAllActivityHistory.mockRejectedValue(new Error("boom"));

        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        await getAllActivityHistoryController(req, res);

        expect(spy).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Failed to fetch activity history, please try again",
        });

        spy.mockRestore();
    });

    it("removes token and updatedAt from ALL items (loop mutation killer)", async () => {
        const mockHistory = Array.from({ length: 5 }, (_, i) => ({
            type: "event-" + i,
            message: "msg",
            token: "tkn-" + i,
            updatedAt: "time",
            createdAt: "2024-01-01",
        }));

        getAllActivityHistory.mockResolvedValue(mockHistory);

        await getAllActivityHistoryController(req, res);

        const cleaned = res.json.mock.calls[0][0].history;

        cleaned.forEach(entry => {
            expect(entry.token).toBeUndefined();
            expect(entry.updatedAt).toBeUndefined();
        });
    });
});
