import { Router } from "express";
import { upload } from "../../middlewares/upload.middleware.js";
import { ProductController } from "./product.controller.js";

const router = Router();

// Public routes
router.get("/", ProductController.getAll);
router.get("/:id", ProductController.getById);

// Admin routes (cũng mount ở /admin/products hoặc có thể dùng middleware nếu client gửi token)
router.post("/", upload.single("image"), ProductController.create);
router.put("/:id", upload.single("image"), ProductController.update);
router.delete("/:id", ProductController.delete);

export default router;
