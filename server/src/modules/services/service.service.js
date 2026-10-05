import { pool } from "../../config/db.js";

export class CraftService {
  static async getAll() {
    const [rows] = await pool.query(
      "SELECT * FROM services WHERE is_active = TRUE ORDER BY id ASC"
    );
    return rows;
  }

  static async book({
    user_id = null,
    service_id,
    customer_name,
    customer_phone,
    customer_address = "",
    appointment_date,
    customer_note = "",
    payment_method = "COD",
  }) {
    if (!service_id) {
      throw { status: 400, message: "Vui lòng chọn dịch vụ" };
    }
    if (!customer_name || !customer_name.trim()) {
      throw { status: 400, message: "Vui lòng nhập họ và tên người đặt dịch vụ" };
    }
    if (!customer_phone || !customer_phone.trim()) {
      throw { status: 400, message: "Vui lòng nhập số điện thoại liên hệ" };
    }

    let service = null;
    const [psRows] = await pool.query("SELECT * FROM personal_services WHERE id = ?", [service_id]);
    if (psRows.length > 0) {
      service = psRows[0];
    } else {
      const [sRows] = await pool.query("SELECT * FROM services WHERE id = ? AND is_active = TRUE", [service_id]);
      if (sRows.length > 0) service = sRows[0];
    }

    if (!service) {
      throw { status: 404, message: "Không tìm thấy dịch vụ được yêu cầu" };
    }

    const randNum = Math.floor(100000 + Math.random() * 900000);
    const bookingCode = `DV-${randNum}-${Date.now().toString().slice(-4)}`;

    const apptDate = appointment_date ? new Date(appointment_date) : new Date(Date.now() + 86400000);

    const [result] = await pool.query(
      `INSERT INTO service_bookings (
        booking_code, user_id, service_id, customer_name, customer_phone, customer_address, 
        appointment_date, customer_note, estimated_price, payment_method, payment_status, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending')`,
      [
        bookingCode,
        user_id || null,
        service_id,
        customer_name.trim(),
        customer_phone.trim(),
        customer_address ? customer_address.trim() : "",
        apptDate,
        customer_note ? customer_note.trim() : "",
        service.price,
        payment_method || "COD",
      ]
    );

    return {
      id: result.insertId,
      booking_code: bookingCode,
      service_id,
      service_name: service.name,
      estimated_price: service.price,
      appointment_date: apptDate,
      status: "pending",
      message: "Đặt lịch dịch vụ thành công! Eiko sẽ liên hệ xác nhận sớm nhất.",
    };
  }

  static async getUserBookings(userId, { phone, ids } = {}) {
    let whereClause = "";
    const params = [];

    if (userId) {
      whereClause = "WHERE b.user_id = ?";
      params.push(userId);
    } else if (Array.isArray(ids) && ids.length > 0) {
      whereClause = `WHERE b.id IN (${ids.map(() => "?").join(",")})`;
      params.push(...ids);
    } else if (phone) {
      whereClause = "WHERE b.customer_phone = ?";
      params.push(phone);
    } else {
      return [];
    }

    const [rows] = await pool.query(
      `SELECT b.*, 
              COALESCE(ps.name, s.name, 'Dịch vụ handmade') AS service_name, 
              COALESCE(ps.image, s.image, '') AS service_image, 
              COALESCE(ps.category, s.category, 'packaging') AS service_category, 
              COALESCE(ps.duration_minutes, s.duration_minutes, 30) AS duration_minutes
       FROM service_bookings b
       LEFT JOIN personal_services ps ON b.service_id = ps.id
       LEFT JOIN services s ON b.service_id = s.id
       ${whereClause}
       ORDER BY b.created_at DESC`,
      params
    );
    return rows;
  }

  static async confirmPayment(bookingId) {
    const [rows] = await pool.query("SELECT * FROM service_bookings WHERE id = ?", [bookingId]);
    if (rows.length === 0) {
      throw { status: 404, message: "Không tìm thấy lịch đặt dịch vụ" };
    }
    await pool.query(
      "UPDATE service_bookings SET status = 'confirmed', payment_status = 'paid' WHERE id = ?",
      [bookingId]
    );
    return { message: "Xác nhận thanh toán dịch vụ thành công! Trạng thái: Đã xác nhận." };
  }

  static async cancelBooking(bookingId) {
    const [rows] = await pool.query("SELECT * FROM service_bookings WHERE id = ?", [bookingId]);
    if (rows.length === 0) {
      throw { status: 404, message: "Không tìm thấy lịch đặt dịch vụ" };
    }
    const booking = rows[0];
    if (booking.status === "completed") {
      throw { status: 400, message: "Dịch vụ đã hoàn tất, không thể hủy" };
    }
    await pool.query("UPDATE service_bookings SET status = 'cancelled' WHERE id = ?", [bookingId]);
    return { message: "Đã hủy lịch đặt dịch vụ thành công" };
  }

  static async getAllBookings() {
    const [rows] = await pool.query(
      `SELECT b.*, 
              COALESCE(ps.name, s.name, 'Dịch vụ handmade') AS service_name, 
              COALESCE(ps.image, s.image, '') AS service_image, 
              COALESCE(ps.category, s.category, 'packaging') AS service_category, 
              COALESCE(ps.duration_minutes, s.duration_minutes, 30) AS duration_minutes
       FROM service_bookings b
       LEFT JOIN personal_services ps ON b.service_id = ps.id
       LEFT JOIN services s ON b.service_id = s.id
       ORDER BY b.created_at DESC LIMIT 50`
    );
    return rows;
  }

  static async updateBookingStatus(bookingId, status) {
    const valid = ["pending", "confirmed", "in_progress", "completed", "cancelled"];
    if (!valid.includes(status)) {
      throw { status: 400, message: "Trạng thái không hợp lệ" };
    }
    const paymentUpdate = (status === "confirmed" || status === "completed") ? ", payment_status = 'paid'" : "";
    await pool.query(`UPDATE service_bookings SET status = ? ${paymentUpdate} WHERE id = ?`, [status, bookingId]);
    return { message: "Cập nhật trạng thái dịch vụ thành công" };
  }

  static async getDueBookings(userId, { role, ids } = {}) {
    const isAdmin = role === "admin";
    let whereClause = "WHERE DATE(b.appointment_date) = CURDATE() AND b.status NOT IN ('cancelled', 'completed')";
    const params = [];

    if (!isAdmin) {
      if (userId) {
        whereClause += " AND b.user_id = ?";
        params.push(userId);
      } else if (Array.isArray(ids) && ids.length > 0) {
        whereClause += ` AND b.id IN (${ids.map(() => "?").join(",")})`;
        params.push(...ids);
      } else {
        return [];
      }
    }

    const [rows] = await pool.query(
      `SELECT b.*, 
              COALESCE(ps.name, s.name, 'Dịch vụ handmade') AS service_name, 
              COALESCE(ps.image, s.image, '') AS service_image, 
              COALESCE(ps.category, s.category, 'packaging') AS service_category, 
              COALESCE(ps.duration_minutes, s.duration_minutes, 30) AS duration_minutes
       FROM service_bookings b
       LEFT JOIN personal_services ps ON b.service_id = ps.id
       LEFT JOIN services s ON b.service_id = s.id
       ${whereClause}
       ORDER BY b.appointment_date ASC`,
      params
    );
    return rows;
  }
}

