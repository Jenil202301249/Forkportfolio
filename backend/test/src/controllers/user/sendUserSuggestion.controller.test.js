import { sendUserSuggestion } from "../../../../src/controllers/user/sendUserSuggestion.controller.js";
import * as userModel from "../../../../src/mongoModels/user.model.js";
import { UserSuggestion } from "../../../../src/mongoModels/userSuggestion.model.js";
import mongoose from "mongoose";

jest.mock("../../../../src/mongoModels/user.model.js", () => ({
    addActivityHistory: jest.fn(),
}));

jest.mock("../../../../src/mongoModels/userSuggestion.model.js", () => ({
    UserSuggestion: {
        create: jest.fn(),
    },
}));

describe("sendUserSuggestion.controller.js", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: { email: "test@example.com" },
            body: { suggestion: "Nice feature!" },
            activeSession: { osType: "Windows", browserType: "Chrome" },
            cookies: { token: "jwt-token-123" },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // -------------------- 400: suggestion required --------------------
    it("returns 400 when suggestion is missing or empty", async () => {
        req.body.suggestion = "   ";

        await sendUserSuggestion(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "suggestion required",
        });
    });

    // -------------------- 422: suggestion > 1000 chars --------------------
    it("returns 422 when suggestion exceeds 1000 characters", async () => {
        req.body.suggestion = "a".repeat(1001);

        await sendUserSuggestion(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "suggestion should be less than 1000 characters",
        });
    });

    // -------------------- VALID: exactly 1 character --------------------
    it("returns 200 when suggestion is exactly 1 character", async () => {
        req.body.suggestion = "a";

        UserSuggestion.create.mockResolvedValue({});
        userModel.addActivityHistory.mockResolvedValue({});

        await sendUserSuggestion(req, res);

        expect(UserSuggestion.create).toHaveBeenCalledWith({
            email: "test@example.com",
            suggestion: "a",
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "suggestion sent successfully",
        });
    });

    // -------------------- VALID: exactly 1000 characters --------------------
    it("returns 200 when suggestion is exactly 1000 characters", async () => {
        req.body.suggestion = "a".repeat(1000);

        UserSuggestion.create.mockResolvedValue({});
        userModel.addActivityHistory.mockResolvedValue({});

        await sendUserSuggestion(req, res);

        expect(UserSuggestion.create).toHaveBeenCalledWith({
            email: "test@example.com",
            suggestion: "a".repeat(1000),
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "suggestion sent successfully",
        });
    });

    // -------------------- SUCCESS PATH --------------------
    it("successfully stores suggestion and activity, returns 200", async () => {
        UserSuggestion.create.mockResolvedValue({});
        userModel.addActivityHistory.mockResolvedValue({});

        await sendUserSuggestion(req, res);

        expect(UserSuggestion.create).toHaveBeenCalledWith({
            email: "test@example.com",
            suggestion: "Nice feature!",
        });

        expect(userModel.addActivityHistory).toHaveBeenCalledWith(
            "test@example.com",
            expect.objectContaining({
                os_type: "Windows",
                browser_type: "Chrome",
                type: "suggestion",
                message: "Submitted a suggestion",
                token: "jwt-token-123",
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "suggestion sent successfully",
        });
    });

    // -------------------- CATCH: mongoose.ValidationError --------------------
    it("returns 400 when Mongoose ValidationError occurs", async () => {
        const valErr = new mongoose.Error.ValidationError();
        UserSuggestion.create.mockRejectedValue(valErr);

        await sendUserSuggestion(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Email and suggestion are required",
        });
    });

    // -------------------- CATCH: Duplicate suggestion (11000) --------------------
    it("returns 409 when duplicate suggestion error (11000)", async () => {
        UserSuggestion.create.mockRejectedValue({ code: 11000 });

        await sendUserSuggestion(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "You have already submitted this suggestion before.",
        });
    });

    // -------------------- CATCH: Unknown error → 500 --------------------
    it("returns 500 when unknown error happens", async () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        UserSuggestion.create.mockRejectedValue(new Error("unknown"));

        await sendUserSuggestion(req, res);

        expect(spy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to send suggestion, please try again",
        });
    });
});
