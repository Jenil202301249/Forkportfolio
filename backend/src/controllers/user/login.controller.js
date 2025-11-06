import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { UAParser } from "ua-parser-js";
import { searchUserByEmail } from "../../db/findUser.js";
import { checkEmailSyntax } from "../../utils/checkUserSyntax.js";
import { checkPasswordSyntax } from "../../utils/checkUserSyntax.js";
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

        if (!checkEmailSyntax(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        }

        if (!checkPasswordSyntax(password)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one special character and one number",
            });
        }

        const user = await searchUserByEmail(email);

        if (!user) {
            return res
                .status(500)
                .json({ success: false, message: "Database error" });
        }

        if (user.length == 0) {
            return res
                .status(400)
                .json({ success: false, message: "User is not registered" });
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

        let browser = browserDetails?.name + " " + browserDetails?.version;
        if (!browser || browser === "undefined undefined") browser = "Unknown";

        let os = osDetails?.name + " " + osDetails?.version;
        if (!os || os === "undefined undefined") os = "Unknown";

        const addActiveSessionStatus = await insertActiveSession({
            token: token,
            email: user[0].email,
            browser_type: browser,
            os_type: os,
        });

        if (!addActiveSessionStatus) {
            return res
                .status(500)
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
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export { loginUser };
