import { pool } from "../../config/db.js";

export class VoucherService {
  static async validate(code, orderAmount = 0) {
    if (!code) throw { status: 400, message: "Vui lòng nhập mã giảm giá" };

    const [rows] = await pool.query(
      `SELECT * FROM vouchers 
       WHERE code = ? AND is_active = TRUE AND start_date <= NOW() AND end_date >= NOW()`,
      [code.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      throw { status: 404, message: "Mã giảm giá không tồn tại hoặc đã hết hạn" };
    }

    const voucher = rows[0];
    if (voucher.used_count >= voucher.usage_limit) {
      throw { status: 400, message: "Mã giảm giá đã hết lượt sử dụng" };
    }

    if (orderAmount < parseFloat(voucher.min_order_amount)) {
      throw {
        status: 400,
        message: `Đơn hàng tối thiểu phải từ ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(voucher.min_order_amount)} để dùng mã này`,
      };
    }

    let discount = 0;
    if (voucher.discount_type === "percentage") {
      discount = (orderAmount * parseFloat(voucher.discount_value)) / 100;
      if (voucher.max_discount_amount) {
        discount = Math.min(discount, parseFloat(voucher.max_discount_amount));
      }
    } else {
      discount = parseFloat(voucher.discount_value);
    }

    return {
      id: voucher.id,
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_amount: discount,
      message: "Áp dụng mã giảm giá thành công!",
    };
  }

  static async getAvailable() {
    const [rows] = await pool.query(
      `SELECT id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, end_date
       FROM vouchers
       WHERE is_active = TRUE AND start_date <= NOW() AND end_date >= NOW() AND used_count < usage_limit
       ORDER BY discount_value DESC`
    );
    return rows;
  }
}
