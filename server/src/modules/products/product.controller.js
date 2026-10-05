import { sendError, sendSuccess } from "../../utils/response.js";
import { ProductService } from "./product.service.js";

export class ProductController {
  static async getAll(req, res) {
    res.set("Cache-Control", "no-store, max-age=0");
    try {
      const { categoryId, search, minPrice, maxPrice, sort, isFeatured } = req.query;
      const products = await ProductService.getAll({
        categoryId,
        search,
        minPrice,
        maxPrice,
        sort,
        isFeatured: isFeatured === "true" ? true : isFeatured === "false" ? false : undefined,
      });

      // Trả về trực tiếp array để tương thích hoàn toàn với frontend cũ đang dùng
      return res.json(products);
    } catch (err) {
      return sendError(res, "Lỗi tải danh sách sản phẩm", 500, err);
    }
  }

  static async getById(req, res) {
    try {
      const product = await ProductService.getById(req.params.id);
      return sendSuccess(res, product, "Lấy chi tiết sản phẩm thành công");
    } catch (err) {
      return sendError(res, err.message || "Lỗi tải chi tiết sản phẩm", err.status || 500, err);
    }
  }

  static async create(req, res) {
    try {
      const { name, price, category, category_id, stock, description, sku } = req.body;
      if (!name || !price) {
        return sendError(res, "Vui lòng nhập tên và giá sản phẩm", 400);
      }

      let image = req.body.image || "";
      if (req.file) {
        image = `/uploads/${req.file.filename}`;
      }

      const product = await ProductService.create({
        name,
        price,
        category,
        category_id,
        stock,
        description,
        image,
        sku,
      });

      return res.status(201).json({
        message: "Tạo sản phẩm thành công 🎉",
        product,
      });
    } catch (err) {
      return sendError(res, "Lỗi tạo sản phẩm", 500, err);
    }
  }

  static async update(req, res) {
    try {
      const fields = { ...req.body };
      if (req.file) {
        fields.image = `/uploads/${req.file.filename}`;
      }

      const result = await ProductService.update(req.params.id, fields);
      return res.json(result);
    } catch (err) {
      return sendError(res, "Lỗi cập nhật sản phẩm", 500, err);
    }
  }

  static async delete(req, res) {
    try {
      const result = await ProductService.softDelete(req.params.id);
      return res.json(result);
    } catch (err) {
      return sendError(res, "Lỗi xóa sản phẩm", 500, err);
    }
  }
}
