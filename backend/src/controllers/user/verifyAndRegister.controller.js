import { insertUser } from '../../db/insertUser.js';
import { insertActiveSession } from "../../db/insertActiveSession.js";
import jwt from 'jsonwebtoken';
import { UAParser } from "ua-parser-js";
import { otpStore } from '../../utils/registrationOtpStore.js';
export const register = async (req,res)=>{
    const userAgentString = req.headers['user-agent'];
    const parser = new UAParser(userAgentString);
    const browserDetails = parser.getBrowser();
    const osDetails = parser.getOS();

    let {email,otp} = req.body;
    if(!email||!otp){
        return res.status(401).json({success: false,message: 'No OTP found'})
    }
    email=email.toLowerCase();
    try{
        const record = otpStore.get(email);
        if(!record){
            return res.status(401).json({success: false,message: 'OTP Expired or invalid user'});
        }
        if(record.expiresAt<Date.now()){
            otpStore.remove(email);
            return res.status(401).json({success: false,message: 'OTP has been expired'})
        }
        if(record.otp!==otp){
            return res.status(401).json({success: false,message: 'Invalid OTP'})
        }
        const user = await insertUser({name:record.name,email,Password:record.hashedPassword,method:"normal"});
        if(!user){
            return res.status(500).json({success: false,message: 'Database error occurred during registration'})
        }
        otpStore.remove(email);
        const token = jwt.sign({user:user[0].id,email:user[0].email}, process.env.JWT_SECRET,{expiresIn: process.env.JWT_EXPIRE})
        let browser = (browserDetails?.name + " " + browserDetails?.version);
        if(!browser || browser === "undefined undefined") browser = "Unknown";

        let os = (osDetails?.name + " " + osDetails?.version);
        if(!os || os === "undefined undefined") os = "Unknown";

        const addActiveSessionStatus = await insertActiveSession({
            token: token,
            email: user[0].email,
            browser_type: browser,
            os_type: os,
        });
        if (!addActiveSessionStatus) {
            return res
                .status(500)
                .json({ success: false, message: "Database error while storing current session details" });
        }
        res.cookie('token',token,{
            httponly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7*24*60*60*1000,
        })
        return res.status(200).json({success: true,userID:user.id,message: 'User registered successfully'})
    } catch(error){
        console.log('User registration error:',error);
        return res.status(401).json({success: false,message: error.message})
    }
}