import { sendError, sendSuccess } from "../../utils/response.js";
import { AuthService } from "./auth.service.js";

export class AuthController {
  static async login(req, res) {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return sendError(res, "Vui lòng nhập tên đăng nhập và mật khẩu", 400);
    }

    try {
      const data = await AuthService.login(username, password);
      // Đảm bảo tương thích ngược trực tiếp cho client cũ
      return res.status(200).json(data);
    } catch (err) {
      return sendError(res, err.message || "Lỗi khi đăng nhập", err.status || 500, err);
    }
  }

  static async guestLogin(req, res) {
    try {
      const data = await AuthService.guestLogin();
      return res.status(200).json(data);
    } catch (err) {
      return sendError(res, err.message || "Lỗi khi tạo tài khoản khách", err.status || 500, err);
    }
  }

  static async register(req, res) {
    const { username, password, full_name, email, phone } = req.body || {};
    if (!username || !password) {
      return sendError(res, "Vui lòng điền đầy đủ tên đăng nhập và mật khẩu", 400);
    }

    try {
      const user = await AuthService.register({ username, password, full_name, email, phone });
      return res.status(201).json({
        id: user.id,
        message: "Đăng ký thành công",
        user,
      });
    } catch (err) {
      return sendError(res, err.message || "Lỗi khi đăng ký", err.status || 500, err);
    }
  }

  static async getMe(req, res) {
    try {
      const user = await AuthService.getProfile(req.user.id);
      return sendSuccess(res, user, "Lấy thông tin tài khoản thành công");
    } catch (err) {
      return sendError(res, err.message || "Lỗi tải thông tin", err.status || 500, err);
    }
  }
}
