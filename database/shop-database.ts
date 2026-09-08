import type { SQLiteDatabase } from "expo-sqlite";

import { PRODUCTS, type Product } from "@/constants/shop-data";

export async function initializeShopDatabase(database: SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      price TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      origin TEXT NOT NULL,
      material TEXT NOT NULL,
      dimensions TEXT NOT NULL,
      weight TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0,
      care_instructions TEXT NOT NULL,
      package_contents TEXT NOT NULL DEFAULT '',
      warranty TEXT NOT NULL DEFAULT '',
      shipping_info TEXT NOT NULL DEFAULT '',
      usage TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL,
      is_featured INTEGER NOT NULL DEFAULT 0
    );
  `);

  const columns = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(products)",
  );
  const existingColumns = new Set(columns.map((column) => column.name));
  for (const [name, definition] of [
    ["package_contents", "TEXT NOT NULL DEFAULT ''"],
    ["warranty", "TEXT NOT NULL DEFAULT ''"],
    ["shipping_info", "TEXT NOT NULL DEFAULT ''"],
    ["usage", "TEXT NOT NULL DEFAULT ''"],
  ] as const) {
    if (!existingColumns.has(name)) {
      await database.execAsync(
        `ALTER TABLE products ADD COLUMN ${name} ${definition}`,
      );
    }
  }

  await database.runAsync(
    "DELETE FROM products WHERE category = ? OR category = ?",
    "Đặc sản",
    "Đặc sản Việt",
  );

  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM products",
  );

  if (!result) return;

  for (const product of PRODUCTS) {
    const values = [
      product.sku,
      product.name,
      product.price,
      product.icon,
      product.color,
      product.category,
      product.description,
      product.origin,
      product.material,
      product.dimensions,
      product.weight,
      product.stock,
      product.rating,
      product.reviewCount,
      product.careInstructions,
      product.packageContents ?? "",
      product.warranty ?? "",
      product.shippingInfo ?? "",
      product.usage ?? "",
      product.tags.join(","),
      product.isFeatured,
    ];

    await database.runAsync(
      `INSERT OR IGNORE INTO products (
        sku, name, price, icon, color, category, description, origin,
        material, dimensions, weight, stock, rating, review_count,
        care_instructions, package_contents, warranty, shipping_info,
        usage, tags, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ...values,
    );
    await database.runAsync(
      `UPDATE products SET
        name = ?, price = ?, icon = ?, color = ?, category = ?, description = ?,
        origin = ?, material = ?, dimensions = ?, weight = ?, stock = ?,
        rating = ?, review_count = ?, care_instructions = ?, package_contents = ?,
        warranty = ?, shipping_info = ?, usage = ?, tags = ?, is_featured = ?
      WHERE sku = ?`,
      product.name,
      product.price,
      product.icon,
      product.color,
      product.category,
      product.description,
      product.origin,
      product.material,
      product.dimensions,
      product.weight,
      product.stock,
      product.rating,
      product.reviewCount,
      product.careInstructions,
      product.packageContents ?? "",
      product.warranty ?? "",
      product.shippingInfo ?? "",
      product.usage ?? "",
      product.tags.join(","),
      product.isFeatured,
      product.sku,
    );
  }
}

export async function getProducts(
  database: SQLiteDatabase,
): Promise<Product[]> {
  const rows = await database.getAllAsync<Product & { tags: string }>(
    `SELECT
      id, sku, name, price, icon, color, category, description, origin,
      material, dimensions, weight, stock, rating, review_count AS reviewCount,
      care_instructions AS careInstructions,
      package_contents AS packageContents, warranty,
      shipping_info AS shippingInfo, usage, tags,
      is_featured AS isFeatured
    FROM products
    ORDER BY is_featured DESC, name ASC`,
  );

  return rows.map((product) => ({
    ...product,
    tags: product.tags.split(",").filter(Boolean),
  }));
}
