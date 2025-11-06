import jwt from 'jsonwebtoken';
import { UAParser } from "ua-parser-js";
import { searchUserByEmail } from '../../db/findUser.js';
import { insertActiveSession } from "../../db/insertActiveSession.js";
import axios from 'axios';
import { registerWithGoogle } from './registerWithGoogle.controller.js';
const loginWithGoogle = async (req, res) => {

  try {
    const userAgentString = req.headers['user-agent'];
    const parser = new UAParser(userAgentString);
    const browserDetails = parser.getBrowser();
    const osDetails = parser.getOS();

    const { access_token } = req.body; //The access token for user profile

    if (!access_token) {
      return res.status(400).json({ message: 'Missing Google Access token.' });
    }
    const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`);
    const payload = googleRes.data;
    console.log(payload);
    let { email } = payload;
    email = email.toLowerCase();
    let user = await searchUserByEmail(email);
    if (user.length === 0) {
      return registerWithGoogle(req, res);
    }
    user = user[0];
    if(user.registrationmethod==="normal"){
        return res.status(401).json({ success: false, message: "User already exists with this email. Please login using email and password." });
    }
    const token = jwt.sign(
      { user: user.id, email: user.email },
        process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE,
      }
    );

    let browser = (browserDetails?.name + " " + browserDetails?.version);
    if(!browser || browser === "undefined undefined") browser = "Unknown";

    let os = (osDetails?.name + " " + osDetails?.version);
    if(!os || os === "undefined undefined") os = "Unknown";

    const addActiveSessionStatus = await insertActiveSession({
        token: token,
        email: user.email,
        browser_type: browser,
        os_type: os,
    });

    if (!addActiveSessionStatus) {
        return res
            .status(500)
            .json({ success: false, message: "Database error while storing current session details" });
    }
    return res
          .status(200)
          .cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          .json({ success: true, message: "User logged in successfully"});
  } catch (error) {
    console.log('Google login error:', error);
    res.status(401).json({ message: 'Invalid Google token.' });
  }
};
export { loginWithGoogle };
