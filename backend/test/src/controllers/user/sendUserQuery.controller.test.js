import { sendUserQuery } from "../../../../src/controllers/user/sendUserQuery.controller.js";
import * as userModel from "../../../../src/mongoModels/user.model.js";
import { UserQuery } from "../../../../src/mongoModels/userQuery.model.js";
import mongoose from "mongoose";

jest.mock("../../../../src/mongoModels/user.model.js", () => ({
    addActivityHistory: jest.fn(),
}));

jest.mock("../../../../src/mongoModels/userQuery.model.js", () => ({
    UserQuery: {
        create: jest.fn(),
    },
}));

describe("sendUserQuery.controller.js", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: { email: "test@example.com" },
            body: { query: "My query" },
            activeSession: { osType: "Windows", browserType: "Chrome" },
            cookies: { token: "abc-token" }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // ------------------ 400: query required ------------------
    it("returns 400 when query is missing or empty", async () => {
        req.body.query = "   ";

        await sendUserQuery(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "query required",
        });
    });

    // ------------------ 422: query too long ------------------
    it("returns 422 when query exceeds 1000 characters", async () => {
        req.body.query = "a".repeat(1001);

        await sendUserQuery(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "query should be less than 1000 characters",
        });
    });

    // ------------------ SUCCESS ------------------
    it("successfully stores query and activity, returns 200", async () => {
        UserQuery.create.mockResolvedValue({});
        userModel.addActivityHistory.mockResolvedValue({});

        await sendUserQuery(req, res);

        expect(UserQuery.create).toHaveBeenCalledWith({
            email: "test@example.com",
            query: "My query",
        });

        expect(userModel.addActivityHistory).toHaveBeenCalledWith(
            "test@example.com",
            expect.objectContaining({
                os_type: "Windows",
                browser_type: "Chrome",
                type: "query",
                message: "Submitted a query",
                token: "abc-token",
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Query sent successfully",
        });
    });

    // ------------------ CATCH: mongoose.ValidationError ------------------
    it("returns 400 when Mongoose ValidationError is thrown", async () => {
        const validationError = new mongoose.Error.ValidationError();
        UserQuery.create.mockRejectedValue(validationError);

        await sendUserQuery(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Email and query are required",
        });
    });

    // ------------------ CATCH: duplicate query (error.code === 11000) ------------------
    it("returns 409 for duplicate query error", async () => {
        const dupError = { code: 11000 };
        UserQuery.create.mockRejectedValue(dupError);

        await sendUserQuery(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "You have already submitted this query before.",
        });
    });

    // ------------------ CATCH: general error (500) ------------------
    it("returns 500 for unexpected errors", async () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        UserQuery.create.mockRejectedValue(new Error("boom"));

        await sendUserQuery(req, res);

        expect(spy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to send query, please try again",
        });
    });

    // ------------------ VALID: exactly 1 letter ------------------
    it("returns 200 when query is exactly 1 character", async () => {
        req.body.query = "a";  // 1 letter
        UserQuery.create.mockResolvedValue({});
        userModel.addActivityHistory.mockResolvedValue({});

        await sendUserQuery(req, res);

        expect(UserQuery.create).toHaveBeenCalledWith({
            email: "test@example.com",
            query: "a",
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Query sent successfully",
        });
    });

    // ------------------ VALID: exactly 1000 letters ------------------
    it("returns 200 when query is exactly 1000 characters", async () => {
        req.body.query = "a".repeat(1000); // 1000 letters
        UserQuery.create.mockResolvedValue({});
        userModel.addActivityHistory.mockResolvedValue({});

        await sendUserQuery(req, res);

        expect(UserQuery.create).toHaveBeenCalledWith({
            email: "test@example.com",
            query: "a".repeat(1000),
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Query sent successfully",
        });
    });
});
