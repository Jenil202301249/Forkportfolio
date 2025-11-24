import jwt from 'jsonwebtoken';
import { UAParser } from "ua-parser-js";
import { searchUserByEmail } from '../../db/findUser.js';
import { insertUser } from '../../db/insertUser.js';
import { insertActiveSession } from "../../db/insertActiveSession.js";
import axios from 'axios';
import { updateProfileImage } from '../../db/updateProfileImage.js';
import bcrypt from 'bcrypt'
const registerWithGoogle = async (req, res) => {
    try {
        const userAgentString = req.headers['user-agent'];
        const parser = new UAParser(userAgentString);
        const browserDetails = parser.getBrowser();
        const osDetails = parser.getOS();

        const { access_token } = req.body;
        if (!access_token) {
            return res.status(400).json({ success: false, message: "Missing Google token" });
        }
        const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`);
        if(!googleRes?.data){
            return res.status(504).json({success:false,message: "Failed to get data from google oauth"});
        }
        const payload = googleRes.data;
        const { name, email, picture, id } = payload;

        const existingUser = await searchUserByEmail(email);
        if(!existingUser){
            return res.status(503).json({ success: false, message: "Database error occurred." });
        }
        if (existingUser.length > 0) {
            if(existingUser[0].registrationmethod==="normal"){
                return res.status(409).json({ success: false, message: "User already exists with this email. Please login using email and password." });
            }
            const token = jwt.sign({user:existingUser[0].id,email:existingUser[0].email}, process.env.JWT_SECRET,{expiresIn: process.env.JWT_EXPIRE});
            
            let browser = (browserDetails?.name);
            if(!browser || browser === "undefined") browser = "Unknown";

            let os = (osDetails?.name);
            if(!os || os === "undefined") os = "Unknown";

            const addActiveSessionStatus = await insertActiveSession({
                token: token,
                email: existingUser[0].email,
                browser_type: browser,
                os_type: os,
            });

            if (!addActiveSessionStatus) {
                return res
                    .status(503)
                    .json({ success: false, message: "Database error while storing current session details" });
            }

            return res.status(201).cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          }).json({ success: true, message: "Login Successfully" });
        } else {
            const hashedPassword = await bcrypt.hash(id,10);
            const newUser = await insertUser({ name, email, Password:hashedPassword,method:"google" });
            if(!newUser){
                return res.status(503).json({ success: false, message: "Database error occurred during user creation." });
            }
            const profilePicture = await updateProfileImage(email, picture);
            if(!profilePicture){
                console.log("Failed to update profile Image for: ",email)
            }
            const token = jwt.sign({ user: newUser[0].id, email: newUser[0].email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

            let browser = (browserDetails?.name);
            if(!browser || browser === "undefined") browser = "Unknown";

            let os = (osDetails?.name);
            if(!os || os === "undefined") os = "Unknown";

            const addActiveSessionStatus = await insertActiveSession({
                token: token,
                email: email,
                browser_type: browser,
                os_type: os,
            });

            if (!addActiveSessionStatus) {
                return res
                    .status(503)
                    .json({ success: false, message: "Database error while storing current session details" });
            }

            return res.status(200).cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          .json({ success: true, message: "user regestered successfully." });
        }
    } catch (error) {
        console.log("Google auth error:", error);
        res.status(500).json({ success: false, message: "Google authentication failed." });
    }
}

export { registerWithGoogle }; 
