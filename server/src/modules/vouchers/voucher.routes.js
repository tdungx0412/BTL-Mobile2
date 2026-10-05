import { Router } from "express";
import { VoucherController } from "./voucher.controller.js";

const router = Router();

router.post("/validate", VoucherController.validate);
router.get("/available", VoucherController.getAvailable);

export default router;
