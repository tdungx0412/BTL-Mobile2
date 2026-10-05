import { pool } from "../../config/db.js";

export class CategoryService {
  static async getAll() {
    const [rows] = await pool.query(
      "SELECT id, name, slug, icon, description, display_order FROM categories WHERE is_active = TRUE ORDER BY display_order ASC, id ASC"
    );
    return rows;
  }

  static async create({ name, slug, icon, description, display_order }) {
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const [result] = await pool.query(
      "INSERT INTO categories (name, slug, icon, description, display_order) VALUES (?, ?, ?, ?, ?)",
      [name, generatedSlug, icon || "🎁", description || "", display_order || 0]
    );
    return { id: result.insertId, name, slug: generatedSlug };
  }
}
