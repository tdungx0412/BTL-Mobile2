import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { ENV } from "../config/env.js";
import { sendError } from "../utils/response.js";

/**
 * Middleware xác thực người dùng bằng JWT hoặc Token phiên
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

  if (!token) {
    return sendError(res, "Vui lòng đăng nhập để tiếp tục", 401);
  }

  try {
    // 1. Thử giải mã bằng chuẩn JWT
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (jwtErr) {
      // 2. Hỗ trợ tương thích ngược token dạng: token_<userId>_<timestamp>
      if (token.startsWith("token_")) {
        const parts = token.split("_");
        const userId = parseInt(parts[1], 10);
        if (userId) {
          const [rows] = await pool.query(
            "SELECT id, username, full_name, email, role, is_active FROM users WHERE id = ?",
            [userId]
          );
          if (rows.length > 0 && rows[0].is_active) {
            req.user = rows[0];
            return next();
          }
        }
      }
      return sendError(res, "Phiên đăng nhập đã hết hạn hoặc không hợp lệ", 401);
    }
  } catch (error) {
    return sendError(res, "Lỗi kiểm tra phiên đăng nhập", 500, error);
  }
};
