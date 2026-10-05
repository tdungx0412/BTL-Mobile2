import { sendError, sendSuccess } from "../../utils/response.js";
import { OrderService } from "./order.service.js";

export class OrderController {
  static async create(req, res) {
    try {
      const { items, user_id, customer_name, phone, address, payment_method, note, voucher_code } = req.body;
      const effectiveUserId = req.user ? req.user.id : user_id;

      const order = await OrderService.createOrder({
        items,
        user_id: effectiveUserId,
        customer_name,
        phone,
        address,
        payment_method,
        note,
        voucher_code,
      });

      return res.status(201).json(order);
    } catch (err) {
      return sendError(res, err.message || "Lỗi tạo đơn hàng", err.status || 500, err);
    }
  }

  static async getMyOrders(req, res) {
    try {
      const userId = req.user ? req.user.id : req.query.userId;
      if (!userId) {
        return res.json([]);
      }
      const orders = await OrderService.getMyOrders(userId);
      return res.json(orders);
    } catch (err) {
      return sendError(res, "Lỗi lấy danh sách đơn hàng", 500, err);
    }
  }

  static async getDetail(req, res) {
    try {
      const order = await OrderService.getOrderDetail(req.params.id);
      return res.json(order);
    } catch (err) {
      return sendError(res, err.message || "Lỗi tải chi tiết đơn hàng", err.status || 500, err);
    }
  }

  static async cancel(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const result = await OrderService.cancelOrder(req.params.id, userId);
      return res.json(result);
    } catch (err) {
      return sendError(res, err.message || "Lỗi hủy đơn hàng", err.status || 500, err);
    }
  }

  static async adminGetAll(req, res) {
    try {
      const orders = await OrderService.adminGetAllOrders();
      return res.json(orders);
    } catch (err) {
      return sendError(res, "Lỗi tải danh sách đơn hàng admin", 500, err);
    }
  }

  static async adminUpdateStatus(req, res) {
    try {
      const { status, note } = req.body;
      const adminId = req.user ? req.user.id : null;
      const result = await OrderService.adminUpdateStatus(req.params.id, status, note, adminId);
      return res.json(result);
    } catch (err) {
      return sendError(res, err.message || "Lỗi cập nhật trạng thái", err.status || 500, err);
    }
  }
}
