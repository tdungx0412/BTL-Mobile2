import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "eiko_shop",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.get("/api/health", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ ok: true, database: rows[0]?.ok === 1 });
  } catch (error) {
    res
      .status(500)
      .json({
        ok: false,
        message: "MySQL connection failed",
        error: String(error),
      });
  }
});

app.get("/api/products", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        id, sku, name, price, icon, image, color, category, description, origin,
        material, dimensions, weight, stock, rating, review_count AS reviewCount,
        care_instructions AS careInstructions,
        package_contents AS packageContents, warranty,
        shipping_info AS shippingInfo, usage, tags,
        is_featured AS isFeatured
      FROM products
      ORDER BY is_featured DESC, name ASC`,
    );

    const products = rows.map((product) => ({
      ...product,
      tags: Array.isArray(product.tags)
        ? product.tags
        : JSON.parse(product.tags || "[]"),
      reviewCount: Number(product.reviewCount ?? 0),
      isFeatured: Number(product.isFeatured ?? 0),
    }));

    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: String(error) });
  }
});

app.get("/", (_req, res) => {
  res.json({ message: "EIko Shop API is running" });
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
