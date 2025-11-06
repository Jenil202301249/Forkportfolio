import axios from "axios";
import { validateNameStrength } from "./validation.js";

export const MyProfileHandlers = ({ setUserInfo, setIsEditingInfo, editedName, resendCountdown,
    currPass, newPass, confirmPass, setIsSendingOtp, setOtp, setOtpError, setResendCountdown,
    setIsVerifyingOtp, setConfirmPass, setCurrPass, setNewPass, setShowOtpModal, otp, setIsEditingPass
}) => {

    axios.defaults.withCredentials = true;

    const handlePicChange = async (event) => {
        const filePath = event.target.files[0];

        if (filePath && filePath.type.startsWith("image/")) {

            const profilePicURL = URL.createObjectURL(filePath);
            const picData = new FormData();
            picData.append("profileImage", filePath);

            try {
                await axios.patch(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/updateProfileImage", picData,
                    { withCredentials: true, headers: { "Content-Type": "multipart/form-data" }, });
                setUserInfo((prev) => ({
                    ...prev,
                    profimg: profilePicURL
                }));
                setIsEditingInfo(false);

            } catch (err) {
                console.error("Error updating profile image:", err.response?.data?.message || err.message);
                alert(err.response?.data?.message || "Failed to update profile image. Try again later.");
                return;
            }
        }
        else {
            alert("Invalid file, Please select a valid file!")
        }
    };

    const handleSaveName = async () => {

        const testName = validateNameStrength(editedName);
        console.log("Valid Name", editedName);
        if (testName) {
            try {
                await axios.patch(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/updateProfileName", { name: editedName }, { withCredentials: true });
                setUserInfo((prev) => ({
                    ...prev,
                    name: editedName
                }));
                setIsEditingInfo(false);

            } catch (err) {
                console.error("Error updating name:", err.response?.data?.message || err.message);
                alert(err.response?.data?.message || "Failed to update name. Try again later.");
                return;
            }
        }
        else {
            alert("Invalid Name!");
        }

    };

    const handleSavePass = async () => {
        if (confirmPass === newPass) {
            try {
                setIsSendingOtp(true);
                await axios.patch(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/resetPassword", { password: currPass, newPassword: newPass }, { withCredentials: true });
                setShowOtpModal(true);
                setOtp("");
                setOtpError("");
                setResendCountdown(30);
            } catch (err) {
                console.error("Error sending OTP:", err.response?.data?.message || err.message);
                alert(err.response?.data?.message || "Failed to send OTP. Try again later.");
            } finally {
                setIsSendingOtp(false);
            }
        }
        else {
            console.log("new password and confirm password does not match!");
        }
    };

    const resendOtp = async () => {
        if (resendCountdown > 0) return;
        try {
            setIsSendingOtp(true);
            await axios.patch(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/resetPassword", { password: currPass, newPassword: newPass }, { withCredentials: true });
            setResendCountdown(30);
        } catch (err) {
            console.error("Error resending OTP:", err.response?.data?.message || err.message);
            setOtpError("Failed to resend OTP. Try again.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const verifyOtpAndReset = async () => {
        if (!otp.trim()) {
            setOtpError("Please enter the OTP");
            return;
        }

        try {
            setIsVerifyingOtp(true);
            setOtpError("");
            await axios.post(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/verifyOtpForProfile", { otp: otp }, { withCredentials: true });
            setShowOtpModal(false);
            await axios.patch(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/setNewPasswordForProfile", { newPassword: newPass }, { withCredentials: true });
            setIsEditingPass(false);
            setCurrPass("");
            setNewPass("");
            setConfirmPass("");
            setOtp("");
            setOtpError("");
            console.log("Password changed successfully after OTP verification.");
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            console.error("OTP verify/reset error:", msg);
            setOtpError(msg.includes("OTP") ? msg : "Wrong OTP or verification failed");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleInvExp = async (event) => {

        if (event.target.value === "") {
            alert("Please select a valid option!");
        }
        else {

            try {
                axios.patch(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/updateProfileInvestmentExperience",
                    { investmentExperience: event.target.value },
                    { withCredentials: true });
                setUserInfo((prev) => ({
                    ...prev,
                    investmentExp: event.target.value
                }))
            }
            catch (err) {
                console.error("Error updating investment experience:", err.response?.data?.message || err.message);
                alert(err.response?.data?.message || "Failed to update investment experience. Try again later.");
                return;
            }
        }
    }

    const handleRiskProf = async (event) => {

        if (event.target.value === "") {
            alert("Please select a valid option!");
        }
        else {
            try {
                axios.patch(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/updateProfileRiskProfile",
                    { riskProfile: event.target.value },
                    { withCredentials: true })
                setUserInfo((prev) => ({
                    ...prev,
                    riskProfile: event.target.value
                }))
            }
            catch (err) {
                console.error("Error updating risk profile:", err.response?.data?.message || err.message);
                alert(err.response?.data?.message || "Failed to update risk profile. Try again later.");
                return;
            }
        }
    }

    const handleFinGoals = async (event) => {

        if (event.target.value === "") {
            alert("Please select a valid option!");
        }
        else {
            try {
                axios.patch(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/updateProfileFinancialGoal",
                    { financialGoals: event.target.value },
                    { withCredentials: true })
                setUserInfo((prev) => ({
                    ...prev,
                    FinGoal: event.target.value
                }))
            }
            catch (err) {
                console.error("Error updating financial goal:", err.response?.data?.message || err.message);
                alert(err.response?.data?.message || "Failed to update financial goal. Try again later.");
                return;
            }
        }
    }

    const handleInvHorizon = async (event) => {

        if (event.target.value === "") {
            alert("Please select a valid option!");
        }
        else {
            try {
                axios.patch(import.meta.env.VITE_BACKEND_LINK + "/api/v1/users/updateProfileInvestmentHorizon",
                    { investmentHorizon: event.target.value },
                    { withCredentials: true })
                setUserInfo((prev) => ({
                    ...prev,
                    InvHorizon: event.target.value
                }))
            }
            catch (err) {
                console.error("Error updating investment horizon:", err.response?.data?.message || err.message);
                alert(err.response?.data?.message || "Failed to update investment horizon. Try again later.");
                return;
            }
        }
    }

    return { handlePicChange, handleSaveName, handleSavePass, resendOtp, verifyOtpAndReset, handleInvExp, handleRiskProf, handleFinGoals, handleInvHorizon };
};
