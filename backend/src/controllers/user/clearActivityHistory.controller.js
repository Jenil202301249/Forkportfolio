import { deleteActivityHistoryByEmail } from "../../mongoModels/user.model.js";

const clearActivityHistory = async (req, res) => {
    try {
        await deleteActivityHistoryByEmail(req.user.email);
        return res.status(200).json({
            success: true,
            message: "activity history cleared successfully",
        });
    } catch (error) {
        console.error("clear activity history error",error);
        return res.status(500).json({
            success: false,
            message: "Failed to clear activity history, please try again",
        });
    }
};

export { clearActivityHistory };
