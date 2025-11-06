import { loginUser } from "./login.controller.js";
import { logoutUser, logoutUserSession , logoutAllUserSessions } from "./logout.controller.js";
import { registerOtpGeneration } from "./registerOtpGeneration.controller.js";
import { register } from "./verifyAndRegister.controller.js";
import { loginWithGoogle } from "./loginWithGoogle.controller.js";
import { updateProfileImageController } from "./updateProfileImage.controller.js";
import {
    updateProfileNameController,
    updateProfileInvestmentExperienceController,
    updateProfileRiskProfileController,
    updateProfileFinancialGoalsController,
    updateProfileInvestmentHorizonController,
} from "./updateProfileInfo.controller.js";
import { getProfile } from "./getProfile.controller.js";
import { dataAndPrivacy } from "./dataAndPrivacy.controller.js";
import { toggleAiSuggestionController } from "./toggleAiSuggestion.controller.js";
import {
    SendForgotPasswordOtp,
    VerifyOtp,
    setNewPassword,
} from "./forgotPassword.controller.js";
import { SendResetPasswordOtp, setNewPassword as setNewPasswordForProfile, VerifyOtp as VerifyOtpForProfile } from "./resetPassword.controller.js";
import { registerWithGoogle } from "./registerWithGoogle.controller.js";
import { createExcel } from "./downloadPortfolioData.controller.js";
import { deleteAccount } from "./deleteAccount.controller.js";
import { getPreferencesAndPersonalisation } from "./getPreferencesAndPersonalisation.controller.js";
import { updateThemeController } from "./updatePreferencesAndPersonalisation.controller.js";
import { updateDashboardLayoutController } from "./updatePreferencesAndPersonalisation.controller.js";
import { sendUserQuery } from "./sendUserQuery.controller.js";
import { sendUserSuggestion } from "./sendUserSuggestion.controller.js";
import { checkToken } from "./checkToken.controller.js";
import { activityAndSessionHistory } from "./activityAndSessionHistory.controller.js";
import { getAllActivityHistoryController } from "./getAllActivityHistory.controller.js";
import { getAllSecurityAlertsController } from "./getAllSecurityAlerts.controller.js";
import { getActivityAndSessionByToken } from "./getActivityAndSessionByToken.controller.js";
import { downloadActivityHistoryReport } from "./downloadActivityHistoryReport.controller.js";
import { clearActivityHistory } from "./clearActivityHistory.controller.js";
export {
    loginUser,
    logoutUser,
    logoutUserSession,
    logoutAllUserSessions,
    registerOtpGeneration,
    register,
    loginWithGoogle,
    updateProfileImageController,
    updateProfileNameController,
    updateProfileInvestmentExperienceController,
    updateProfileRiskProfileController,
    updateProfileFinancialGoalsController,
    updateProfileInvestmentHorizonController,
    getProfile,
    dataAndPrivacy,
    toggleAiSuggestionController,
    SendForgotPasswordOtp,
    VerifyOtp,
    setNewPassword,
    SendResetPasswordOtp,
    VerifyOtpForProfile,
    setNewPasswordForProfile,
    registerWithGoogle,
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
};
