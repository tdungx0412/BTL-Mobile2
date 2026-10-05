import { Router } from "express";
import { ServiceController } from "./service.controller.js";

const router = Router();

router.get("/", ServiceController.getAll);
router.post("/book", ServiceController.book);
router.get("/my-bookings", ServiceController.getMyBookings);

export default router;
