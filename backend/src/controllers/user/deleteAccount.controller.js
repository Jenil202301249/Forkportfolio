import { deleteUserByEmail } from "../../db/removeUser.js";
import { deleteActivityHistoryByEmail, deleteSecurityAlertsByEmail } from "../../mongoModels/user.model.js";
import { defaultProfileImage } from "../../../constants.js";
import { removeOldProfileImagesFromCloudionary } from "../../utils/removeOldProfile.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";
const deleteAccount = async (req, res) => {
    try {
        const profileImage = req.user.profileimage;
        const response = await deleteUserByEmail(req.user.email);
        if (!response) {
            return res
                .status(503)
                .json({
                    success: false,
                    message: "Database error while deleting account. Please try again later",
                });
        }
        
        await deleteActivityHistoryByEmail(req.user.email);

        await deleteSecurityAlertsByEmail(req.user.email);
        if ((profileImage !== defaultProfileImage) && (profileImage.startsWith("https://res.cloudinary.com"))) {
            const parts = profileImage.split("/");
            const filename = parts[parts.length - 1];
            const publicId = filename.split(".")[0];
            const deleteprofileImage = await deleteFromCloudinary(publicId);
            console.log(deleteprofileImage);
            if (!deleteprofileImage) {
                console.log(`Error deleting profile image: ${publicId}`);
                removeOldProfileImagesFromCloudionary.add(publicId);
            }
        }

        return res
            .clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
            })
            .status(200)
            .json({ success: true, message: "Account deleted successfully" });
            
    } catch (error) {
        console.error(`Error deleting account: ${req.user.email}`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: "failed to delete account, please try again",
            });
    }
};

export { deleteAccount };