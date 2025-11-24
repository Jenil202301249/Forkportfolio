import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { UAParser } from "ua-parser-js";
import { searchUserByEmail } from "../../db/findUser.js";
import { checkEmailSyntax } from "../../utils/checkUserSyntax.js";
import { insertActiveSession } from "../../db/insertActiveSession.js";
import { addSecurityAlert } from "../../mongoModels/user.model.js";

const loginUser = async (req, res) => {
    try {
        const userAgentString = req.headers["user-agent"];
        const parser = new UAParser(userAgentString);
        const browserDetails = parser.getBrowser();
        const osDetails = parser.getOS();

        let { email, password } = req.body;
        email = email?.toLowerCase();

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password",
            });
        }

        const emailValidity = checkEmailSyntax(email);
        if (!emailValidity.success) {
            return res.status(422).json({
                success: false,
                message: emailValidity.message,
            });
        }

        const user = await searchUserByEmail(email);

        if (!user) {
            return res
                .status(503)
                .json({ success: false, message: "Database error occured while getting user info" });
        }

        if (user.length == 0) {
            return res
                .status(410)
                .json({ success: false, message: "User is not registered" });
        }

        if(user[0].registrationmethod === "google") {
            return res.status(401).json({ success: false, message: "Please login using google" });
        }

        const isMatch = await bcrypt.compare(password, user[0].password);

        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid user credentials" });
        }

        const token = jwt.sign(
            { user: user[0].id, email: user[0].email },
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
            email: user[0].email,
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

        const newAlert = {
            os_type: os,
            browser_type: browser,
            type: "Login",
            message: "new device logged in",
            token: token,
        };

        await addSecurityAlert(user[0].email, newAlert);

        return res
            .status(200)
            .cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            .json({ success: true, message: "User logged in successfully" });
    } catch (error) {
        console.error("login user error",error);
        return res.status(500).json({ success: false, message: "failed to login, please try again" });
    }
};

export { loginUser };
