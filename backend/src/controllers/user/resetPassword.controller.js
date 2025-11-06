import { searchUserByEmail } from "../../db/findUser.js";
import { updatePassword } from "../../db/updatePassword.js";
import { checkEmailSyntax , checkPasswordSyntax} from "../../utils/checkUserSyntax.js";
import { transporter } from "../../utils/nodemailer.js";
import { otpStore } from "../../utils/registrationOtpStore.js";
import crypto from 'crypto';
import bcrypt from "bcrypt";
import { getOtpEmailTemplate } from "../../utils/mailOtpTemplate.js";

const SendResetPasswordOtp = async (req, res) => {
    const { password , newPassword } = req.body;
    const email = req.user.email
    if (!password) {
        return res.status(401).json({success: false,message: "password is required."});
    }
    
    if (!checkPasswordSyntax(newPassword)) {
        return res.status(401).json({success: false,message: "New password must be at least according to the our conditoins characters long."});
    }
    try {
        const userResult = await searchUserByEmail(email);

        if (!userResult || userResult.length === 0) {
            return res.status(401).json({success: false,message: "User not found with this email address."});
        }
        if(!(await bcrypt.compare(password,userResult[0].password))){
            return res.status(401).json({success: false,message: "password doesn't match."});
        }
        
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + (5 * 60 * 1000); 

        otpStore.add(email, {otp,expiresAt});

        const mailOptions = {
            from: process.env.GOOGLE_USER_EMAIL,
            to: email,
            subject: "Your One-Time Password (OTP) for Insightstox",
            html: getOtpEmailTemplate(otp,"reset your password.","5 minutes"),
        }
        
        await transporter.sendMail(mailOptions);

        return res.status(200).json({success: true,message: "OTP sent to your email address. Please check your inbox."});

    } catch (error) {
        console.error('Send forgot password OTP error:', error);
        return res.status(401).json({success: false,message: "Failed to send OTP. Please try again."});
    }
};

const VerifyOtp = async (req, res) => {
    const { otp } = req.body;
    const email = req.user.email
    console.log(email,otp);
    if ( !otp ) {
        return res.status(401).json({success: false,message: "OTP are required."});
    }

    try {
        let otpData = otpStore.get(email);
        console.log(otpData);

        if (!otpData) {
            return res.status(401).json({success: false,message: "OTP expired or invalid. Please request a new one."});
        }
        if(otpData.validated){
            return res.status(401).json({success: false,message: "OTP already verified. You can now reset your password."});
        }
        if (Date.now() > otpData.expiresAt) {
            otpStore.remove(email);
            return res.status(401).json({success: false, message: "OTP has expired. Please request a new one."});
        }

        if (otpData.otp !== otp) {
            return res.status(401).json({success: false,message: "Invalid OTP."});
        }
        otpData.validated = true;
        otpData.expiresAt = Date.now() + (10 * 60 * 1000);
        otpStore.add(email, otpData);

        return res.status(200).json({success: true,message: "OTP verified successfully. You can now reset your password."});

    } catch (error) {
        console.error('Verify OTP and reset password error:', error);
        return res.status(401).json({success: false,message: "Failed to Verify OTP. Please try again."});
    }
};
const setNewPassword = async (req, res) => {
    const { newPassword } = req.body;
    const email = req.user.email
    if (!newPassword) {
        return res.status(401).json({success: false,message: "Email and new password are required."});
    }
    console.log(newPassword);
    try {
        const userResult = await searchUserByEmail(email)

        if (userResult.length === 0) {
            return res.status(401).json({success: false,message: "User not found."});
        }
        let otpData = otpStore.get(email);

        if (!otpData) {
            return res.status(401).json({success: false,message: "Password reset session expired or invalid. Please request a new one."});
        }
        if (!otpData.validated) {
            return res.status(401).json({success: false,message: "OTP not verified. Please verify OTP before resetting password."});
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const user = await updatePassword(email, hashedNewPassword);
        if (user.length === 0) {
            return res.status(401).json({success: false,message: "Failed to reset password. Please try again."});
        }
        otpStore.remove(email);
        console.log('Password reset successfully for user:', email);
        return res.status(200).json({success: true,message: "Password reset successfully. You can now login with your new password."});

    } catch (error) {
        console.error('Set new password error:', error);
        return res.status(401).json({success: false,message: "Failed to reset password. Please try again."});
    }
};
export {SendResetPasswordOtp, VerifyOtp, setNewPassword};