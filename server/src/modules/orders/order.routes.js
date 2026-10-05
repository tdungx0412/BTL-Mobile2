import { Router } from "express";
import { OrderController } from "./order.controller.js";

const router = Router();

// Hỗ trợ cả routes có hoặc không có middleware để tương thích ngược
router.post("/create", OrderController.create);
router.get("/my-orders", OrderController.getMyOrders);
router.post("/:id/cancel", OrderController.cancel);
router.get("/:id", OrderController.getDetail);

// Admin endpoints
router.get("/admin/all", OrderController.adminGetAll);
router.put("/admin/:id/status", OrderController.adminUpdateStatus);

export default router;
