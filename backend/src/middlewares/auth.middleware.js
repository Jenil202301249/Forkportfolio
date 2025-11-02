import { searchUserByEmail } from "../db/findUser.js";
import jwt from "jsonwebtoken";

const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        console.log("token: ",token);
        console.log("request: ",req);
        if(!token){
            
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized request" });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await searchUserByEmail(decodedToken.email);
        
        if(!user) {
            return res
            .status(500)
            .json({ success: false, message: "Database error while verifying token" });
        }
        
        if (user.length == 0 || user[0].tokenversion!==decodedToken.tokenversion) {
            return res
                .clearCookie("token")
                .status(401)
                .json({ success: false, message: "invalid token" });
        }
       
        req.user = {
            id:user[0].id,
            name:user[0].name,
            email:user[0].email,
            registrationmethod:user[0].registrationmethod,
            profileimage:user[0].profileimage,
            investmentexperience:user[0].investmentexperience,
            riskprofile:user[0].riskprofile,
            theme:user[0].theme,
            aisuggestion:user[0].aisuggestion,
            financialgoals:user[0].financialgoals,
            investmenthorizon:user[0].investmenthorizon,
            dashboardlayout:user[0].dashboardlayout,
            tokenversion:user[0].tokenversion
        }
        next();
    }
    catch (error) 
    {
        return res.status(401).json({ success: false, message: error.message });
    }
};

export { verifyToken };
