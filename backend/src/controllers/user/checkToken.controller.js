import { searchUserByEmail } from "../../db/findUser.js";
import jwt from "jsonwebtoken";

const checkToken = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res
                .status(401)
                .json({ success: false, message: "token is not present" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await searchUserByEmail(decoded.email);

        if (user.length == 0) {
            return res
                .status(409)
                .json({ success: false, message: "user not found" });
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
        }
        return res.status(200).json({success: true,message:"already logged in"})
    } catch (error) {
        console.error('Check token error:', error);
        return res.status(500).json({ success: false, message: "failed to check token, please try again" });
    }
};

export { checkToken };
