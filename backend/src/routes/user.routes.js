import { Router } from "express";
import {
    loginUser,
    loginWithGoogle,
    logoutUser,
    logoutUserSession,
    logoutAllUserSessions,
    register,
    registerOtpGeneration,
    updateProfileImageController,
    updateProfileNameController,
    updateProfileInvestmentExperienceController,
    updateProfileRiskProfileController,
    updateProfileFinancialGoalsController,
    updateProfileInvestmentHorizonController,
    getProfile,
    registerWithGoogle,
    SendForgotPasswordOtp,
    VerifyOtp,
    setNewPassword,
    setNewPasswordForProfile,
    SendResetPasswordOtp,
    VerifyOtpForProfile,
    dataAndPrivacy,
    toggleAiSuggestionController,
    createExcel,
    deleteAccount,
    getPreferencesAndPersonalisation,
    updateThemeController,
    updateDashboardLayoutController,
    sendUserQuery,
    sendUserSuggestion,
    checkToken,
    activityAndSessionHistory,
    getAllActivityHistoryController,
    getAllSecurityAlertsController,
    getActivityAndSessionByToken,
    downloadActivityHistoryReport,
    clearActivityHistory,
} from "../controllers/user/user.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyUserLoginStatus } from "../middlewares/verifyUserLoginStatus.middleware.js";

const router = Router();

router.route("/login").post(verifyUserLoginStatus,loginUser);
router.route("/logout").post(verifyToken, logoutUser);
router.route("/logoutSession").post(verifyToken, logoutUserSession);
router.route("/logoutAllSessions").post(verifyToken, logoutAllUserSessions);
router.route("/registerOtpGeneration").post(verifyUserLoginStatus,registerOtpGeneration);
router.route("/register").post(verifyUserLoginStatus,register);
router.route("/googleLogin").post(verifyUserLoginStatus,loginWithGoogle);
router.route("/updateProfileName").patch(verifyToken, updateProfileNameController);
router.route("/updateProfileInvestmentExperience").patch(verifyToken, updateProfileInvestmentExperienceController);
router.route("/updateProfileRiskProfile").patch(verifyToken, updateProfileRiskProfileController);
router.route("/updateProfileFinancialGoal").patch(verifyToken, updateProfileFinancialGoalsController)
router.route("/updateProfileInvestmentHorizon").patch(verifyToken, updateProfileInvestmentHorizonController);
router.route("/myProfile").get(verifyToken, getProfile);
router.route("/registerWithGoogle").post(registerWithGoogle);
router.route("/forgotPasswordOtpGeneration").post(SendForgotPasswordOtp);
router.route("/verifyOtp").post(VerifyOtp);
router.route("/verifyOtpForProfile").post(verifyToken, VerifyOtpForProfile);
router.route("/setNewPassword").patch(setNewPassword);
router.route("/resetPassword").patch(verifyToken, SendResetPasswordOtp); 
router.route("/setNewPasswordForProfile").patch(verifyToken, setNewPasswordForProfile);
router.route("/getDataAndPrivacy").get(verifyToken, dataAndPrivacy);
router.route("/getEmailForgotPassword").post(SendForgotPasswordOtp);
router.route("/updateProfileImage").patch(verifyToken, 
    (req, res) => {
    upload.single("profileImage")(req, res, (err) => {
        if (err) {
            return res
                .status(400)
                .json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid image.",
            });
        }
        updateProfileImageController(req, res);
    });
});
router.route("/toggleAiSuggestion").patch(verifyToken, toggleAiSuggestionController);
router.route("/downloadPortfolioData").get(verifyToken, createExcel);
router.route("/deleteAccount").delete(verifyToken, deleteAccount, logoutUser);
router.route("/getPreferencesAndPersonalisation").get(verifyToken, getPreferencesAndPersonalisation);
router.route("/updateTheme").patch(verifyToken, updateThemeController);
router.route("/updateDashboardLayout").patch(verifyToken, updateDashboardLayoutController);
router.route("/sendUserQuery").post(verifyToken, sendUserQuery);
router.route("/sendUserSuggestion").post(verifyToken, sendUserSuggestion);
router.route("/checkToken").get(checkToken);
router.route("/activityAndSessionHistory").get(verifyToken, activityAndSessionHistory);
router.route("/getAllActivityHistory").get(verifyToken, getAllActivityHistoryController);
router.route("/getAllSecurityAlerts").get(verifyToken, getAllSecurityAlertsController);
router.route("/getActivityAndSessionByToken").get(verifyToken, getActivityAndSessionByToken);
router.route("/downloadActivityHistoryReport").get(verifyToken, downloadActivityHistoryReport);
router.route("/clearActivityHistory").delete(verifyToken,clearActivityHistory);
export default router;
