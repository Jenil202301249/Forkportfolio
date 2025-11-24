import { updateProfileImageController } from "../../../../src/controllers/user/updateProfileImage.controller.js";
import * as cloudinary from "../../../../src/utils/cloudinary.js";
import * as dbProfile from "../../../../src/db/updateProfileImage.js";
import { defaultProfileImage } from "../../../../constants.js";
import * as removeOldProfile from "../../../../src/utils/removeOldProfile.js";
import * as userModel from "../../../../src/mongoModels/user.model.js";

jest.mock("../../../../src/utils/cloudinary.js", () => ({
    uploadOnCloudinary: jest.fn(),
    deleteFromCloudinary: jest.fn(),
}));

jest.mock("../../../../src/db/updateProfileImage.js", () => ({
    updateProfileImage: jest.fn(),
}));

jest.mock("../../../../constants.js", () => ({
    defaultProfileImage: "DEFAULT_PROFILE_URL",
}));

jest.mock("../../../../src/utils/removeOldProfile.js", () => ({
    removeOldProfileImagesFromCloudionary: {
        add: jest.fn(),
    },
}));

jest.mock("../../../../src/mongoModels/user.model.js", () => ({
    addActivityHistory: jest.fn(),
}));

describe("updateProfileImageController.js", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: {
                email: "user@example.com",
                profileimage: "DEFAULT_PROFILE_URL",
            },
            file: {
                path: "/tmp/uploaded-file.jpg",
            },
            activeSession: {
                osType: "Windows",
                browserType: "Chrome",
            },
            cookies: {
                token: "jwt-token",
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // ---------- 400: No image path ----------
    it("returns 400 when no image file is provided", async () => {
        req.file = undefined;

        await updateProfileImageController(req, res);

        expect(cloudinary.uploadOnCloudinary).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Please provide a valid image.",
        });
    });

    // ---------- 503: Cloudinary upload failed ----------
    it("returns 503 when cloudinary upload returns secure_url null", async () => {
        cloudinary.uploadOnCloudinary.mockResolvedValue({
            secure_url: null,
            public_id: "new_public_id",
        });

        await updateProfileImageController(req, res);

        expect(cloudinary.uploadOnCloudinary).toHaveBeenCalledWith(
            "/tmp/uploaded-file.jpg"
        );
        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Failed to upload profile image.",
        });
    });

    // ---------- 500: DB update fails, deleteFromCloudinary succeeds ----------
    it("returns 500 when DB update fails and new image is deleted successfully from cloudinary", async () => {
        cloudinary.uploadOnCloudinary.mockResolvedValue({
            secure_url: "https://res.cloudinary.com/demo/image/upload/v1/new_img.jpg",
            public_id: "new_img",
        });

        dbProfile.updateProfileImage.mockResolvedValue(null);
        cloudinary.deleteFromCloudinary.mockResolvedValue(true);

        await updateProfileImageController(req, res);

        expect(dbProfile.updateProfileImage).toHaveBeenCalledWith(
            "user@example.com",
            "https://res.cloudinary.com/demo/image/upload/v1/new_img.jpg"
        );
        expect(cloudinary.deleteFromCloudinary).toHaveBeenCalledWith("new_img");
        expect(removeOldProfile.removeOldProfileImagesFromCloudionary.add).not.toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Failed to update profile image.",
        });
    });

    // ---------- 500: DB update fails, deleteFromCloudinary fails → queue cleanup ----------
    it("returns 500 and queues new image for later deletion when DB update fails and cloudinary delete fails", async () => {
        cloudinary.uploadOnCloudinary.mockResolvedValue({
            secure_url: "https://res.cloudinary.com/demo/image/upload/v1/new_img.jpg",
            public_id: "new_img",
        });

        dbProfile.updateProfileImage.mockResolvedValue([]);
        cloudinary.deleteFromCloudinary.mockResolvedValue(false);

        await updateProfileImageController(req, res);

        expect(cloudinary.deleteFromCloudinary).toHaveBeenCalledWith("new_img");
        expect(removeOldProfile.removeOldProfileImagesFromCloudionary.add).toHaveBeenCalledWith("new_img");

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Failed to update profile image.",
        });
    });

    // ---------- 200: success, old image is default → no old delete ----------
    it("updates profile image successfully when old image is default (no old delete)", async () => {
        req.user.profileimage = defaultProfileImage; // same as mock

        cloudinary.uploadOnCloudinary.mockResolvedValue({
            secure_url: "https://res.cloudinary.com/demo/image/upload/v1/new_profile.jpg",
            public_id: "new_profile",
        });

        dbProfile.updateProfileImage.mockResolvedValue([1]);
        userModel.addActivityHistory.mockResolvedValue({});

        await updateProfileImageController(req, res);

        // old image condition should be false -> no deleteFromCloudinary
        expect(cloudinary.deleteFromCloudinary).not.toHaveBeenCalled();

        // profile updated
        expect(req.user.profileimage).toBe(
            "https://res.cloudinary.com/demo/image/upload/v1/new_profile.jpg"
        );

        expect(userModel.addActivityHistory).toHaveBeenCalledWith(
            "user@example.com",
            expect.objectContaining({
                os_type: "Windows",
                browser_type: "Chrome",
                type: "profileimage",
                message: "Updated profile image",
                token: "jwt-token",
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Profile image updated successfully.",
        });
    });

    // ---------- 200: success, old cloudinary image deleted successfully ----------
    it("updates profile image and deletes old cloudinary image successfully", async () => {
        req.user.profileimage =
            "https://res.cloudinary.com/demo/image/upload/v12345/old_public_id.jpg";

        cloudinary.uploadOnCloudinary.mockResolvedValue({
            secure_url: "https://res.cloudinary.com/demo/image/upload/v1/new_profile.jpg",
            public_id: "new_profile",
        });

        dbProfile.updateProfileImage.mockResolvedValue([1]);
        cloudinary.deleteFromCloudinary.mockResolvedValue(true);
        userModel.addActivityHistory.mockResolvedValue({});

        await updateProfileImageController(req, res);

        // delete old public id
        expect(cloudinary.deleteFromCloudinary).toHaveBeenCalledWith("old_public_id");
        expect(removeOldProfile.removeOldProfileImagesFromCloudionary.add).not.toHaveBeenCalled();

        expect(req.user.profileimage).toBe(
            "https://res.cloudinary.com/demo/image/upload/v1/new_profile.jpg"
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Profile image updated successfully.",
        });
    });

    // ---------- 200: success, old cloudinary delete fails → queue cleanup ----------
    it("updates profile image and queues old cloudinary image when delete fails", async () => {
        req.user.profileimage =
            "https://res.cloudinary.com/demo/image/upload/v12345/old_public_id.jpg";

        cloudinary.uploadOnCloudinary.mockResolvedValue({
            secure_url: "https://res.cloudinary.com/demo/image/upload/v1/new_profile.jpg",
            public_id: "new_profile",
        });

        dbProfile.updateProfileImage.mockResolvedValue([1]);
        cloudinary.deleteFromCloudinary.mockResolvedValue(false);
        userModel.addActivityHistory.mockResolvedValue({});

        await updateProfileImageController(req, res);

        expect(cloudinary.deleteFromCloudinary).toHaveBeenCalledWith("old_public_id");
        expect(removeOldProfile.removeOldProfileImagesFromCloudionary.add).toHaveBeenCalledWith(
            "old_public_id"
        );

        expect(req.user.profileimage).toBe(
            "https://res.cloudinary.com/demo/image/upload/v1/new_profile.jpg"
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Profile image updated successfully.",
        });
    });

    // ---------- 500: catch block ----------
    it("returns 500 when unexpected error occurs", async () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        // force crash inside try (req.user null -> accessing profileimage throws)
        req.user = null;

        await updateProfileImageController(req, res);

        expect(spy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Failed to update profile image. Please try again later.",
        });
    });
});
