import bcrypt from 'bcrypt'
import crypto from 'crypto';
import { otpStore } from '../../utils/registrationOtpStore.js';
import { searchUserByEmail } from '../../db/findUser.js';
import { checkUserSyntax } from '../../utils/checkUserSyntax.js';
import { getOtpEmailTemplate } from '../../utils/mailOtpTemplate.js';
import { sendMail } from '../../utils/nodemailer.js';
const registerOtpGeneration = async (req, res)=>{
    let {name,email,password} = req.body;
    if(!name||!email||!password){
        return res.status(400).json({success: false,message: 'Missing Details'})
    }
    email=email.toLowerCase();
    try{
        const existinguser = await searchUserByEmail(email);
        if(!existinguser){
            return res.status(503).json({success: false,message: 'Database error occurred.'})
        }
        if(existinguser.length>0){
            return res.status(409).json({success: false,message: "User Already exists"});
        }
        const validity = checkUserSyntax(req.body);
        if(!validity.success){
            return res.status(422).json({success: false,message: "Invalid user details Format"});
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const otp = crypto.randomInt(100000, 999999).toString();
        const expirationTime = Date.now()+5*60*1000;


        otpStore.add(email, {
            name,
            hashedPassword,
            otp,
            expiresAt: expirationTime,
            attempt: 3,
        });
        const mailOptions = {
            from: process.env.GOOGLE_USER_EMAIL,
            to: email,
            subject: "Your One-Time Password (OTP) for Insightstox",
            html: getOtpEmailTemplate(otp,"complete your registration on InsightStox.","5 minutes."),};
        if(await sendMail(mailOptions)){
            return res.status(200).json({success: true});
        }
        else{
            return res.status(502).json({success: false,message: "Failed to send OTP email."});
        }
    } catch(error){
        console.log('OTP generation error:',error);
        res.status(401).json({success: false,message: error.message})
    }
}

export { registerOtpGeneration };