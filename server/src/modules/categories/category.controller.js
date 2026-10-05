import { sendError, sendSuccess } from "../../utils/response.js";
import { CategoryService } from "./category.service.js";

export class CategoryController {
  static async getAll(req, res) {
    try {
      const categories = await CategoryService.getAll();
      return sendSuccess(res, categories, "Lấy danh sách danh mục thành công");
    } catch (err) {
      return sendError(res, "Lỗi tải danh mục", 500, err);
    }
  }

  static async create(req, res) {
    try {
      const { name, slug, icon, description, display_order } = req.body;
      if (!name) return sendError(res, "Tên danh mục là bắt buộc", 400);

      const created = await CategoryService.create({ name, slug, icon, description, display_order });
      return sendSuccess(res, created, "Thêm danh mục thành công", 201);
    } catch (err) {
      return sendError(res, "Lỗi thêm danh mục", 500, err);
    }
  }
}
