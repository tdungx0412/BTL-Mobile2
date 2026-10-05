import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import { AuthController } from "./auth.controller.js";

const router = Router();

router.post("/login", AuthController.login);
router.post("/guest", AuthController.guestLogin);
router.post("/register", AuthController.register);
router.post("/forgot-password", AuthController.forgotPassword);
router.put("/profile", AuthController.updateProfile);
router.get("/me", authenticateToken, AuthController.getMe);

export default router;

