import { Router } from "express";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { CategoryController } from "./category.controller.js";

const router = Router();

router.get("/", CategoryController.getAll);
router.post("/", authenticateToken, requireRole("admin"), CategoryController.create);

export default router;
