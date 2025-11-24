import {getAllActiveSessionOfUser } from "../db/getActiveSession.js";
import { updateActiveTime } from "../db/updateActiveTime.js";
import { deleteActiveSessionByToken } from "../db/deleteActiveSession.js";
import jwt from "jsonwebtoken";
import axios from "axios";
const verifyUserLoginStatusGoogle = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        
        let { access_token } = req.body;

        if(!access_token)return res.status(400).json({ success: false, message: "access token is required" });

        const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`);
        if(!googleRes.data){
          return res.status(504).json({success:false,message: "Unable to get details from google ouauth"})
        }
        const payload = googleRes.data;
        let { email } = payload;
        email = email.toLowerCase();
        //array of active sessions(object)
        const activeSessions = await getAllActiveSessionOfUser(email);
        if(!activeSessions) {
            return res.status(503).json({ success: false, message: "Database error while getting active session count" });
        }

        // remove expired sessions manually
        for(let i=0;i<activeSessions.length;i++)
        {
            try {
                jwt.verify(activeSessions[i].token, process.env.JWT_SECRET);
            } catch (error) {
                await deleteActiveSessionByToken(activeSessions[i].token);
                activeSessions.splice(i,1);
                i--;
            }
        }

        if(!token)
        {
            if(activeSessions.length>=5)
            {
                return res.status(409).json({ success: false, message: "You have reached your limit of 5 active sessions. Please close one of your active sessions to continue." });
            }
            return next();
        }

        for(let i=0;i<activeSessions.length;i++)
        {
            if(activeSessions[i].token==token)
            {
                const updateActiveSessionTimeStatus = await updateActiveTime(token);
                if(!updateActiveSessionTimeStatus) {
                    return res.status(503).json({ success: false, message: "Database error while updating active session time" });
                }
                return res.status(200).json({ success: true, message: "User is already logged in" });
            }
        }
        return next();
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "error while verifying user login status" });
    }
};

export { verifyUserLoginStatusGoogle };
