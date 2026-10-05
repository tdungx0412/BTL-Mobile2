import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db.js";
import { ENV } from "../../config/env.js";
import { sendResetPasswordEmail } from "../../utils/mailer.js";

export class AuthService {
  static async login(username, password) {
    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? OR LOWER(username) = LOWER(?)",
      [cleanUsername, cleanUsername]
    );

    // 🌟 Nếu chưa có tài khoản: Tự động tạo tài khoản khách hàng mới
    if (rows.length === 0) {
      if (cleanUsername.length < 3) {
        throw { status: 400, message: "Tên đăng nhập phải có ít nhất 3 ký tự" };
      }
      if (cleanPassword.length < 4) {
        throw { status: 400, message: "Mật khẩu phải có ít nhất 4 ký tự" };
      }

      const hashedPassword = await bcrypt.hash(cleanPassword, 10);
      const fullName = cleanUsername.toLowerCase().startsWith("khach")
        ? cleanUsername
        : `Khách hàng ${cleanUsername}`;

      const [newResult] = await pool.query(
        "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, 'user')",
        [cleanUsername, hashedPassword, fullName]
      );
      const newUserId = newResult.insertId;

      const tokenPayload = {
        id: newUserId,
        user_id: newUserId,
        username: cleanUsername,
        role: "user",
        full_name: fullName,
      };
      const token = jwt.sign(tokenPayload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });

      return {
        id: newUserId,
        user_id: newUserId,
        token,
        username: cleanUsername,
        full_name: fullName,
        role: "user",
        is_new_customer: true,
        message: "Tài khoản khách hàng mới đã được tạo tự động thành công 🎉",
      };
    }

    const user = rows[0];
    if (user.is_active === 0 || user.is_active === false) {
      throw { status: 403, message: "Tài khoản của bạn đã bị tạm khóa" };
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      throw { status: 401, message: "Tên đăng nhập đã tồn tại nhưng mật khẩu không chính xác" };
    }

    // Tạo JWT token tiêu chuẩn
    const tokenPayload = {
      id: user.id,
      user_id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
    };
    const token = jwt.sign(tokenPayload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });

    return {
      id: user.id,
      user_id: user.id,
      token,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
    };
  }

  static async guestLogin() {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUsername = `khach_${Date.now().toString().slice(-4)}_${randomSuffix}`;
    const hashedPassword = await bcrypt.hash("123456", 10);
    const fullName = `Khách Hàng #${randomSuffix}`;

    const [result] = await pool.query(
      "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, 'user')",
      [guestUsername, hashedPassword, fullName]
    );

    const userId = result.insertId;
    const tokenPayload = {
      id: userId,
      user_id: userId,
      username: guestUsername,
      role: "user",
      full_name: fullName,
    };
    const token = jwt.sign(tokenPayload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });

    return {
      id: userId,
      user_id: userId,
      token,
      username: guestUsername,
      full_name: fullName,
      role: "user",
      is_guest: true,
      message: "Đăng nhập với tư cách Khách Hàng thành công 🎉",
    };
  }

  static async register({ username, password, full_name, email, phone }) {
    const cleanUsername = String(username || "").trim();
    const cleanPassword = String(password || "").trim();
    const cleanFullName = full_name ? String(full_name).trim() : cleanUsername;
    const cleanEmail = email ? String(email).trim().toLowerCase() : "";
    const cleanPhone = phone ? String(phone).trim() : null;

    if (cleanUsername.length < 4) {
      throw { status: 400, message: "Tên đăng nhập phải có ít nhất 4 ký tự" };
    }
    if (cleanPassword.length < 6) {
      throw { status: 400, message: "Mật khẩu phải có ít nhất 6 ký tự" };
    }

    // Bắt buộc phải có Gmail/Email
    if (!cleanEmail) {
      throw { status: 400, message: "Vui lòng nhập địa chỉ Gmail/Email để đăng ký" };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw { status: 400, message: "Địa chỉ Gmail không đúng định dạng (VD: example@gmail.com)" };
    }

    const [existingUser] = await pool.query(
      "SELECT id FROM users WHERE username = ? OR LOWER(username) = LOWER(?)",
      [cleanUsername, cleanUsername]
    );
    if (existingUser.length > 0) {
      throw { status: 409, message: "Tên đăng nhập đã tồn tại, vui lòng chọn tên khác" };
    }

    const [existingEmail] = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
      [cleanEmail]
    );
    if (existingEmail.length > 0) {
      throw { status: 409, message: "Địa chỉ Gmail này đã được sử dụng cho tài khoản khác" };
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    const [result] = await pool.query(
      "INSERT INTO users (username, password, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, 'user')",
      [cleanUsername, hashedPassword, cleanFullName, cleanEmail, cleanPhone]
    );

    return {
      id: result.insertId,
      username: cleanUsername,
      full_name: cleanFullName,
      email: cleanEmail,
      phone: cleanPhone,
    };
  }

  static async forgotPassword(email) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail) {
      throw { status: 400, message: "Vui lòng nhập địa chỉ Gmail" };
    }

    const [rows] = await pool.query(
      "SELECT id, username, full_name, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [cleanEmail]
    );

    if (rows.length === 0) {
      throw {
        status: 404,
        message: `Không tìm thấy tài khoản nào khớp với Gmail: ${cleanEmail}. Vui lòng kiểm tra lại!`,
      };
    }

    const user = rows[0];
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const newPassword = `Eiko${randomSuffix}`;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id]);

    const mailResult = await sendResetPasswordEmail(cleanEmail, newPassword, user.username, user.full_name);

    return {
      success: true,
      message: "Mật khẩu mới đã được khởi tạo thành công!",
      newPassword,
      emailSent: mailResult.success,
      email: cleanEmail,
      username: user.username,
    };
  }

  static async updateProfile(userId, { full_name, email, phone, avatar, new_password }) {
    if (!userId) {
      throw { status: 400, message: "Thiếu thông tin người dùng" };
    }

    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      throw { status: 404, message: "Không tìm thấy thông tin tài khoản" };
    }
    const current = users[0];

    const cleanFullName = full_name !== undefined ? String(full_name).trim() : current.full_name;
    const cleanEmail = email !== undefined ? String(email).trim().toLowerCase() : current.email;
    const cleanPhone = phone !== undefined ? String(phone).trim() : current.phone;
    const cleanAvatar = avatar !== undefined ? String(avatar).trim() : current.avatar;

    if (!cleanFullName) {
      throw { status: 400, message: "Họ và tên không được để trống" };
    }

    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw { status: 400, message: "Địa chỉ Gmail không đúng định dạng" };
      }

      const [dup] = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?",
        [cleanEmail, userId]
      );
      if (dup.length > 0) {
        throw { status: 409, message: "Địa chỉ Gmail này đã được người dùng khác sử dụng" };
      }
    }

    let passwordClause = "";
    let params = [cleanFullName, cleanEmail || null, cleanPhone || null, cleanAvatar || null];

    if (new_password && String(new_password).trim().length > 0) {
      const cleanNewPassword = String(new_password).trim();
      if (cleanNewPassword.length < 4) {
        throw { status: 400, message: "Mật khẩu mới phải có ít nhất 4 ký tự" };
      }
      const hashed = await bcrypt.hash(cleanNewPassword, 10);
      passwordClause = ", password = ?";
      params.push(hashed);
    }

    params.push(userId);
    await pool.query(
      `UPDATE users SET full_name = ?, email = ?, phone = ?, avatar = ? ${passwordClause} WHERE id = ?`,
      params
    );

    const [updated] = await pool.query(
      "SELECT id, username, full_name, email, phone, avatar, role, created_at FROM users WHERE id = ?",
      [userId]
    );

    return updated[0];
  }

  static async getProfile(userId) {
    const [rows] = await pool.query(
      "SELECT id, username, full_name, email, phone, avatar, role, created_at FROM users WHERE id = ?",
      [userId]
    );
    if (rows.length === 0) {
      throw { status: 404, message: "Không tìm thấy thông tin tài khoản" };
    }
    return rows[0];
  }
}

