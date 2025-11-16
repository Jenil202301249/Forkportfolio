import { searchUserByEmail } from "../../db/findUser.js";
import { updatePassword } from "../../db/updatePassword.js";
import { checkEmailSyntax , checkPasswordSyntax} from "../../utils/checkUserSyntax.js";
import { sendMail } from "../../utils/nodemailer.js";
import { otpStore } from "../../utils/registrationOtpStore.js";
import { UAParser } from "ua-parser-js";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import bcrypt from "bcrypt";
import { getOtpEmailTemplate } from "../../utils/mailOtpTemplate.js";
import { deleteActiveSessionByEmail } from "../../db/deleteActiveSession.js";
import { insertActiveSession } from "../../db/insertActiveSession.js";
import { addSecurityAlert } from "../../mongoModels/user.model.js";

const SendForgotPasswordOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({success: false,message: "Email is required."});
    }
    const validity = checkEmailSyntax(email);
    if (!validity.success) {
        return res.status(422).json({success: false,message: validity.message});
    }

    try {
        const userResult = await searchUserByEmail(email);

        if(!userResult ){
            return res.status(503).json({success: false,message: "Database error occured while getting user info. Please try again later"});
        }

        if (userResult.length === 0) {
            return res.status(410).json({success: false,message: "User not found with this email address."});
        }

        if(userResult[0].registrationmethod === "google") {
            return res.status(401).json({ success: false, message: "Google authenticated users can't use forgot password feature." });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + (5 * 60 * 1000); 

        otpStore.add(email, {otp,expiresAt,attempt:3});

        const mailOptions = {
            from: process.env.GOOGLE_USER_EMAIL,
            to: email,
            subject: "Your One-Time Password (OTP) for Insightstox",
            html: getOtpEmailTemplate(otp,"reset your password.","5 minutes"),
        }
        
        await sendMail(mailOptions);

        return res.status(200).json({success: true,message: "OTP sent to your email address. Please check your inbox."});

    } catch (error) {
        console.error('forgot password OTP not sent:', error);
        return res.status(500).json({success: false,message: "Failed to send OTP. Please try again."});
    }
};

const VerifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp ) {
        return res.status(400).json({success: false,message: "Email and OTP are required."});
    }

    try {
        let otpData = otpStore.get(email);

        if (!otpData) {
            return res.status(410).json({success: false,message: "OTP expired or invalid. Please request a new one."});
        }
        if(otpData.validated){
            return res.status(410).json({success: false,message: "OTP already verified. You can now reset your password."});
        }
        if (Date.now() > otpData.expiresAt || otpData.attempt <= 0) {
            otpStore.remove(email);
            return res.status(410).json({success: false, message: "OTP has expired. Please request a new one."});
        }

        if (otpData.otp !== otp) {
            otpData.attempt--;
            return res.status(401).json({success: false,message: `Invalid OTP.${otpData.attempt} attempts left.`});
        }
        otpData.validated = true;
        otpData.expiresAt = Date.now() + (10 * 60 * 1000);
        otpStore.add(email, otpData);

        return res.status(200).json({success: true,message: "OTP verified successfully. You can now reset your password."});

    } catch (error) {
        console.error('Verify OTP and reset password error:', error);
        return res.status(500).json({success: false,message: "Failed to Verify OTP. Please try again."});
    }
};
const setNewPassword = async (req, res) => {
    const userAgentString = req.headers["user-agent"];
    const parser = new UAParser(userAgentString);
    const browserDetails = parser.getBrowser();
    const osDetails = parser.getOS();
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        return res.status(400).json({success: false,message: "Email and new password are required."});
    }
    const validity = checkPasswordSyntax(newPassword)
    if (!validity.success) {
        return res.status(422).json({success: false,message: validity.message});
    }
    try {
        const userResult = await searchUserByEmail(email);

        if(!userResult ){
            return res.status(503).json({success: false,message: "Database error occured while getting user info. Please try again later"});
        }

        if (userResult.length === 0) {
            return res.status(401).json({success: false,message: "User not found."});
        }
        let otpData = otpStore.get(email);

        if (!otpData) {
            return res.status(410).json({success: false,message: "Password reset session expired or invalid. Please request a new one."});
        }
        if (!otpData.validated) {
            return res.status(401).json({success: false,message: "OTP not verified. Please verify OTP before resetting password."});
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await updatePassword(email, hashedPassword);
        if (user.length === 0) {
            return res.status(410).json({success: false,message: "Failed to reset password. Please try again."});
        }
        otpStore.remove(email);

        const deleteAllSessions = await deleteActiveSessionByEmail(email);

        if(!deleteAllSessions){
            return res.status(503).json({success: false,message: "Database error occured while deleting session. Please try again later"});
        }

        const token = jwt.sign(
            { user: userResult[0].id, email: userResult[0].email },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRE,
            }
        );

        let browser = browserDetails?.name;
        if (!browser || browser === "undefined") browser = "Unknown";

        let os = osDetails?.name;
        if (!os || os === "undefined") os = "Unknown";
            
        const addActiveSessionStatus = await insertActiveSession({
            token: token,
            email: userResult[0].email,
            browser_type: browser,
            os_type: os,
        });

        if (!addActiveSessionStatus) {
            return res
                .status(503)
                .json({
                    success: false,
                    message:
                        "Database error while storing current session details",
                });
        }

        if (addActiveSessionStatus.length === 0) {
            return res
                .status(410)
                .json({
                    success: false,
                    message:
                        "Database error while storing current session details",
                });
        }

        const newSecurityAlert = {
            os_type: os,
            browser_type: browser,
            type: "Login",
            message: "used forgot password and new device logged in",
            token: token,
        };

        await addSecurityAlert(user[0].email, newSecurityAlert);

        return res
        .status(200)
        .cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
        .json({success: true,message: "Password reset successfully"});

    } catch (error) {
        console.error('Set new password error:', error);
        return res.status(500).json({success: false,message: "Failed to reset password. Please try again."});
    }
};
export {SendForgotPasswordOtp, VerifyOtp, setNewPassword};