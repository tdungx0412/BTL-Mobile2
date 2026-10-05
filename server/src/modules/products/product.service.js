import { pool } from "../../config/db.js";

export class ProductService {
  static async getAll({ categoryId, search, minPrice, maxPrice, sort, isFeatured }) {
    let sql = `
      SELECT p.*, c.name AS category_name, c.icon AS category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
    `;
    const params = [];

    if (categoryId) {
      sql += " AND p.category_id = ?";
      params.push(categoryId);
    }

    if (search && search.trim()) {
      sql += " AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (minPrice !== undefined && !isNaN(minPrice)) {
      sql += " AND p.price >= ?";
      params.push(Number(minPrice));
    }

    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      sql += " AND p.price <= ?";
      params.push(Number(maxPrice));
    }

    if (isFeatured !== undefined) {
      sql += " AND p.is_featured = ?";
      params.push(isFeatured ? 1 : 0);
    }

    // Sorting
    switch (sort) {
      case "price_asc":
        sql += " ORDER BY p.price ASC";
        break;
      case "price_desc":
        sql += " ORDER BY p.price DESC";
        break;
      case "stock":
        sql += " ORDER BY p.stock DESC";
        break;
      case "newest":
      default:
        sql += " ORDER BY p.created_at DESC";
        break;
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.icon AS category_icon
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.is_active = TRUE`,
      [id]
    );

    if (rows.length === 0) {
      throw { status: 404, message: "Không tìm thấy sản phẩm" };
    }

    const product = rows[0];

    // Lấy thêm danh sách ảnh phụ từ product_images
    const [images] = await pool.query(
      "SELECT id, image_url, is_thumbnail, display_order FROM product_images WHERE product_id = ? ORDER BY display_order ASC",
      [id]
    );
    product.gallery = images;

    // Lấy thêm các biến thể từ product_variants
    const [variants] = await pool.query(
      "SELECT id, variant_name, sku, price_adjustment, stock FROM product_variants WHERE product_id = ?",
      [id]
    );
    product.variants = variants;

    return product;
  }

  static async create({ name, price, category, category_id, stock, description, image, sku, origin, material }) {
    const cleanPrice = parseFloat(String(price).replace(/[^0-9.-]+/g, "")) || 0;
    const cleanStock = parseInt(stock, 10) || 0;
    const cleanSku = sku ? String(sku).trim() : `EIKO-${Date.now().toString().slice(-6)}`;

    let finalCatId = category_id || null;
    if (!finalCatId && category) {
      const [catRows] = await pool.query("SELECT id FROM categories WHERE name = ? LIMIT 1", [category]);
      if (catRows.length > 0) finalCatId = catRows[0].id;
    }

    const [result] = await pool.query(
      `INSERT INTO products 
       (sku, name, price, base_price, stock, category, category_id, description, image, origin, material, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        cleanSku,
        name.trim(),
        cleanPrice,
        cleanPrice,
        cleanStock,
        category || "Đồ thủ công",
        finalCatId,
        description || "Sản phẩm thủ công Eiko Shop",
        image || "",
        origin || "Việt Nam",
        material || "Thủ công",
      ]
    );

    return {
      id: result.insertId,
      sku: cleanSku,
      name,
      price: cleanPrice,
      stock: cleanStock,
      image,
    };
  }

  static async update(id, fields) {
    const allowed = ["name", "price", "stock", "description", "image", "category", "category_id", "is_featured", "is_active"];
    const updates = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }

    if (updates.length === 0) return { message: "Không có trường nào cần cập nhật" };

    params.push(id);
    await pool.query(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, params);
    return { id, message: "Cập nhật sản phẩm thành công" };
  }

  static async softDelete(id) {
    await pool.query("UPDATE products SET is_active = FALSE WHERE id = ?", [id]);
    return { id, message: "Đã xóa sản phẩm thành công" };
  }
}
