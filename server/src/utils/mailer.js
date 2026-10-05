import nodemailer from "nodemailer";

export async function sendResetPasswordEmail(toEmail, newPassword, username, fullName) {
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = process.env.GMAIL_PASS || process.env.SMTP_PASS;

  if (!gmailUser || !gmailPass) {
    console.log(`ℹ️ [MAILER] Chưa cấu hình GMAIL_USER/GMAIL_PASS trong server/.env.`);
    console.log(`📩 [MÔ PHỎNG EMAIL] Gửi tới: ${toEmail} cho user: ${username}`);
    console.log(`🔑 [MẬT KHẨU MỚI]: ${newPassword}`);
    return { success: false, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const mailOptions = {
      from: `"Eiko Handcraft & Gifts" <${gmailUser}>`,
      to: toEmail,
      subject: `[Eiko Shop] Cấp lại mật khẩu mới cho tài khoản ${username}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fde68a; border-radius: 16px; background-color: #fffdf5;">
          <h2 style="color: #d97706; text-align: center; margin-bottom: 6px;">Eiko Handcraft & Gifts</h2>
          <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 0;">Đồ thủ công & Quà tặng tinh hoa Việt Nam</p>
          <hr style="border: none; border-top: 1px solid #fde68a; margin: 18px 0;" />
          <p style="font-size: 15px; color: #1f2937;">Xin chào <strong>${fullName || username}</strong>,</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
            Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${username}</strong> liên kết với địa chỉ Gmail này.
          </p>
          <div style="background-color: #fef3c7; border: 1px dashed #d97706; padding: 18px; border-radius: 12px; text-align: center; margin: 22px 0;">
            <p style="margin: 0; color: #92400e; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Mật khẩu mới của bạn</p>
            <h1 style="margin: 10px 0 0 0; color: #b45309; letter-spacing: 3px; font-size: 28px;">${newPassword}</h1>
          </div>
          <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
            💡 <strong>Lưu ý:</strong> Vui lòng sử dụng mật khẩu trên để đăng nhập. Sau khi đăng nhập thành công, bạn có thể đổi lại mật khẩu cá nhân tại trang <em>Tài Khoản &gt; Chỉnh Sửa Thông Tin</em>.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 14px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Email này được gửi tự động từ hệ thống Eiko Shop. Vui lòng không trả lời thư này.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [MAILER] Đã gửi email thành công tới ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ [MAILER] Lỗi gửi email:", err.message);
    return { success: false, error: err.message };
  }
}
