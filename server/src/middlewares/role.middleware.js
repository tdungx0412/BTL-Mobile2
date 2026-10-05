import { sendError } from "../utils/response.js";

/**
 * Middleware phân quyền (RBAC)
 * @param  {...string} roles Danh sách các role được phép (vd: 'admin', 'staff')
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Chưa xác thực người dùng", 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        "Bạn không có quyền thực hiện thao tác này (yêu cầu quyền quản trị)",
        403
      );
    }

    next();
  };
};
