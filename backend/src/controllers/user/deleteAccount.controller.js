import e from "cors";
import { deleteUserByEmail } from "../../db/removeUser.js";
import { deleteActivityHistoryByEmail, deleteSecurityAlertsByEmail } from "../../mongoModels/user.model.js";

const deleteAccount = async (req, res) => {
    try {
        const response = await deleteUserByEmail(req.user.email);

        if (!response) {
            return res
                .status(500)
                .json({
                    success: false,
                    message: "Database error while deleting account. Please try again later",
                });
        }
        
        await deleteActivityHistoryByEmail(req.user.email);

        await deleteSecurityAlertsByEmail(req.user.email);

        return res
            .status(200)
            .json({ success: true, message: "Account deleted successfully" });
            
    } catch (error) {
        console.log(`Error deleting account: ${req.user.email}`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: error.message
            });
    }
};

export { deleteAccount };