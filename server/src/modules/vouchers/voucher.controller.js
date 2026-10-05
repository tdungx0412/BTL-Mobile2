import { sendError, sendSuccess } from "../../utils/response.js";
import { VoucherService } from "./voucher.service.js";

export class VoucherController {
  static async validate(req, res) {
    try {
      const { code, order_amount } = req.body;
      const result = await VoucherService.validate(code, parseFloat(order_amount) || 0);
      return sendSuccess(res, result, "Mã giảm giá hợp lệ");
    } catch (err) {
      return sendError(res, err.message || "Mã không hợp lệ", err.status || 400, err);
    }
  }

  static async getAvailable(req, res) {
    try {
      const vouchers = await VoucherService.getAvailable();
      return sendSuccess(res, vouchers, "Lấy danh sách mã giảm giá thành công");
    } catch (err) {
      return sendError(res, "Lỗi tải mã giảm giá", 500, err);
    }
  }
}
