import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { sendMessage } from "../controllers/aiInsight/chatbox.controller.js";

const router = Router();

router.route("/sendMessage").post(verifyToken,sendMessage);

export default router;