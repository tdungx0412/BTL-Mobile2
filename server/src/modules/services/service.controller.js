import { sendError, sendSuccess } from "../../utils/response.js";
import { CraftService } from "./service.service.js";

export class ServiceController {
  static async getAll(req, res) {
    res.set("Cache-Control", "no-store, max-age=0");
    try {
      const services = await CraftService.getAll();
      return res.json(services);
    } catch (err) {
      return sendError(res, "Lỗi tải danh sách dịch vụ", 500, err);
    }
  }

  static async book(req, res) {
    try {
      const { user_id, service_id, appointment_date, customer_note } = req.body;
      const effectiveUserId = req.user ? req.user.id : user_id;

      if (!effectiveUserId) {
        return sendError(res, "Vui lòng đăng nhập để đặt lịch dịch vụ", 401);
      }
      if (!service_id) {
        return sendError(res, "Vui lòng chọn dịch vụ", 400);
      }

      const booking = await CraftService.book({
        user_id: effectiveUserId,
        service_id,
        appointment_date,
        customer_note,
      });

      return res.status(201).json(booking);
    } catch (err) {
      return sendError(res, err.message || "Lỗi đặt lịch", err.status || 500, err);
    }
  }

  static async getMyBookings(req, res) {
    try {
      const userId = req.user ? req.user.id : req.query.userId;
      if (!userId) return res.json([]);

      const bookings = await CraftService.getUserBookings(userId);
      return res.json(bookings);
    } catch (err) {
      return sendError(res, "Lỗi tải lịch sử đặt dịch vụ", 500, err);
    }
  }
}
