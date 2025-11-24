import { clearActivityHistory } from "../../../../src/controllers/user/clearActivityHistory.controller.js";
import * as userModel from "../../../../src/mongoModels/user.model.js";

jest.mock("../../../../src/mongoModels/user.model.js", () => ({
    deleteActivityHistoryByEmail: jest.fn(),
}));

describe("clearActivityHistory.controller.js", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: { email: "user@example.com" },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // -------- NEW CASE: email missing --------
    it("returns 500 when req.user.email is missing", async () => {
        req.user.email = null;

        await clearActivityHistory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Expected email",
        });

        expect(userModel.deleteActivityHistoryByEmail).not.toHaveBeenCalled();
    });

    // -------- SUCCESS PATH --------
    it("returns 200 and clears activity history successfully", async () => {
        userModel.deleteActivityHistoryByEmail.mockResolvedValue(true);

        await clearActivityHistory(req, res);

        expect(userModel.deleteActivityHistoryByEmail).toHaveBeenCalledWith(
            "user@example.com"
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "activity history cleared successfully",
        });
    });

    // -------- CATCH BLOCK --------
    it("returns 500 when deleteActivityHistoryByEmail throws error", async () => {
        userModel.deleteActivityHistoryByEmail.mockRejectedValue(
            new Error("boom")
        );

        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        await clearActivityHistory(req, res);

        expect(spy).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message:
                "Failed to clear activity history, please try again",
        });
    });
});
