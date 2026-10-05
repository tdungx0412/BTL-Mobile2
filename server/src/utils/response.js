/**
 * Chuẩn hóa cấu trúc phản hồi API
 */
export const sendSuccess = (res, data = null, message = "Thành công", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = "Đã có lỗi xảy ra", statusCode = 500, error = null) => {
  if (statusCode >= 500 && error) {
    console.error("❌ Internal Server Error:", error);
  }
  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && error ? { debug: error.message } : {}),
  });
};
