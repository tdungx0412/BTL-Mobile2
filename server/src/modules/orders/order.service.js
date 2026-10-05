import { pool } from "../../config/db.js";

export class OrderService {
  static async createOrder({
    items,
    user_id,
    customer_name,
    phone,
    address,
    payment_method,
    note,
    voucher_code,
  }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw { status: 400, message: "Giỏ hàng rỗng, không thể tạo đơn hàng" };
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      let subtotal = 0;
      const verifiedItems = [];

      // 1. Kiểm tra tồn kho & Khóa dòng từng sản phẩm (Pessimistic Locking)
      for (const it of items) {
        const pId = it.product_id || it.id || it.productId;
        const qty = parseInt(it.quantity, 10) || 1;

        const [prodRows] = await conn.query(
          "SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE",
          [pId]
        );

        if (prodRows.length === 0) {
          throw { status: 404, message: `Sản phẩm mã #${pId} không còn tồn tại trên hệ thống` };
        }

        const prod = prodRows[0];
        if (prod.stock < qty) {
          throw {
            status: 400,
            message: `Sản phẩm "${prod.name}" chỉ còn ${prod.stock} món trong kho (bạn đặt ${qty} món)`,
          };
        }

        const unitPrice = parseFloat(prod.price);
        const itemTotal = unitPrice * qty;
        subtotal += itemTotal;

        verifiedItems.push({
          product_id: prod.id,
          name: prod.name,
          quantity: qty,
          unit_price: unitPrice,
          total_price: itemTotal,
        });
      }

      // 2. Xử lý Voucher giảm giá nếu có
      let discountAmount = 0;
      let voucherId = null;
      if (voucher_code) {
        const [vRows] = await conn.query(
          "SELECT * FROM vouchers WHERE code = ? AND is_active = TRUE AND start_date <= NOW() AND end_date >= NOW()",
          [voucher_code.trim()]
        );
        if (vRows.length > 0) {
          const v = vRows[0];
          if (subtotal >= parseFloat(v.min_order_amount) && v.used_count < v.usage_limit) {
            voucherId = v.id;
            if (v.discount_type === "percentage") {
              discountAmount = (subtotal * parseFloat(v.discount_value)) / 100;
              if (v.max_discount_amount) {
                discountAmount = Math.min(discountAmount, parseFloat(v.max_discount_amount));
              }
            } else {
              discountAmount = parseFloat(v.discount_value);
            }
            await conn.query("UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?", [v.id]);
          }
        }
      }

      const shippingFee = subtotal > 300000 ? 0 : 25000;
      const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

      // 3. Tạo mã đơn hàng duy nhất
      const orderCode = `EIKO-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 4. Lưu đơn hàng vào bảng orders
      const [orderResult] = await conn.query(
        `INSERT INTO orders 
         (order_code, user_id, customer_name, phone, address, subtotal, discount_amount, shipping_fee, total_amount, payment_method, status, note, voucher_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [
          orderCode,
          user_id || null,
          customer_name || "Khách hàng",
          phone || "",
          address || "",
          subtotal,
          discountAmount,
          shippingFee,
          totalAmount,
          payment_method || "COD",
          note || "",
          voucherId,
        ]
      );

      const orderId = orderResult.insertId;

      // 5. Lưu chi tiết món và trừ tồn kho
      for (const item of verifiedItems) {
        await conn.query(
          `INSERT INTO order_items 
           (order_id, product_id, item_name, quantity, price_at_purchase, type)
           VALUES (?, ?, ?, ?, ?, 'product')`,
          [orderId, item.product_id, item.name, item.quantity, item.unit_price]
        );

        await conn.query("UPDATE products SET stock = stock - ? WHERE id = ?", [
          item.quantity,
          item.product_id,
        ]);
      }

      // 6. Ghi log trạng thái đơn hàng
      await conn.query(
        "INSERT INTO order_status_logs (order_id, status, note) VALUES (?, 'pending', 'Khách hàng đặt hàng thành công')",
        [orderId]
      );

      await conn.commit();

      return {
        id: orderId,
        order_code: orderCode,
        total_amount: totalAmount,
        subtotal,
        discount_amount: discountAmount,
        shipping_fee: shippingFee,
        payment_method: payment_method || "COD",
        customer_name: customer_name || "Khách hàng",
        phone: phone || "",
        address: address || "",
        note: note || "",
        status: "pending",
        items: verifiedItems,
        created_at: new Date(),
        message: "Đặt hàng thành công 🎉",
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getMyOrders(userId, { phone, ids } = {}) {
    let whereClause = "";
    const params = [];

    if (userId) {
      whereClause = "WHERE o.user_id = ?";
      params.push(userId);
    } else if (Array.isArray(ids) && ids.length > 0) {
      whereClause = `WHERE o.id IN (${ids.map(() => "?").join(",")})`;
      params.push(...ids);
    } else if (phone) {
      whereClause = "WHERE o.phone = ?";
      params.push(phone);
    } else {
      return [];
    }

    const [orders] = await pool.query(
      `SELECT o.*, 
              (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS total_items
       FROM orders o
       ${whereClause}
       ORDER BY o.created_at DESC`,
      params
    );

    for (const ord of orders) {
      ord.subtotal = parseFloat(ord.subtotal) || parseFloat(ord.total_amount) || 0;
      ord.total_amount = parseFloat(ord.total_amount) || 0;
      ord.discount_amount = parseFloat(ord.discount_amount) || 0;
      ord.shipping_fee = parseFloat(ord.shipping_fee) || 0;

      const [items] = await pool.query(
        `SELECT oi.*, p.image, COALESCE(oi.item_name, p.name, 'Sản phẩm thủ công') AS name, p.name AS product_name
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [ord.id]
      );
      ord.items = items.map((it) => ({
        ...it,
        unit_price: parseFloat(it.price_at_purchase) || 0,
        price: parseFloat(it.price_at_purchase) || 0,
      }));
    }

    return orders;
  }

  static async getOrderDetail(identifier) {
    const isNum = !isNaN(Number(identifier));
    const [orders] = await pool.query(
      isNum ? "SELECT * FROM orders WHERE id = ? OR order_code = ?" : "SELECT * FROM orders WHERE order_code = ?",
      isNum ? [identifier, identifier] : [identifier]
    );
    if (orders.length === 0) {
      throw { status: 404, message: "Không tìm thấy đơn hàng" };
    }

    const order = orders[0];
    order.subtotal = parseFloat(order.subtotal) || parseFloat(order.total_amount) || 0;
    order.total_amount = parseFloat(order.total_amount) || 0;
    order.discount_amount = parseFloat(order.discount_amount) || 0;
    order.shipping_fee = parseFloat(order.shipping_fee) || 0;

    const [items] = await pool.query(
      `SELECT oi.*, p.image, COALESCE(oi.item_name, p.name, 'Sản phẩm thủ công') AS name, p.name AS product_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    order.items = items.map((it) => ({
      ...it,
      unit_price: parseFloat(it.price_at_purchase) || 0,
      price: parseFloat(it.price_at_purchase) || 0,
    }));

    const [logs] = await pool.query(
      "SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY created_at ASC",
      [order.id]
    );
    order.logs = logs;

    return order;
  }

  static async cancelOrder(orderId, userId = null) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      let query = "SELECT * FROM orders WHERE id = ? FOR UPDATE";
      const params = [orderId];
      if (userId) {
        query = "SELECT * FROM orders WHERE id = ? AND user_id = ? FOR UPDATE";
        params.push(userId);
      }

      const [orders] = await conn.query(query, params);
      if (orders.length === 0) {
        throw { status: 404, message: "Không tìm thấy đơn hàng hoặc bạn không có quyền hủy đơn này" };
      }

      const order = orders[0];
      if (order.status !== "pending") {
        throw {
          status: 400,
          message: `Chỉ có thể hủy đơn khi đang ở trạng thái "Chờ xác nhận" (Đơn hiện tại: ${order.status})`,
        };
      }

      // Hoàn lại tồn kho cho sản phẩm
      const [items] = await conn.query(
        "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
        [orderId]
      );
      for (const it of items) {
        if (it.product_id) {
          await conn.query("UPDATE products SET stock = stock + ? WHERE id = ?", [
            it.quantity,
            it.product_id,
          ]);
        }
      }

      await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);
      await conn.query(
        "INSERT INTO order_status_logs (order_id, status, note) VALUES (?, 'cancelled', 'Đã hủy đơn hàng và hoàn trả lại kho')",
        [orderId]
      );

      await conn.commit();
      return { message: "Hủy đơn hàng thành công, tồn kho đã được hoàn lại" };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async adminGetAllOrders() {
    const [orders] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    for (const ord of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, p.image, p.name AS product_name
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [ord.id]
      );
      ord.items = items;
    }
    return orders;
  }

  static async adminUpdateStatus(orderId, newStatus, note, adminUserId = null) {
    const valid = ["pending", "confirmed", "processing", "shipping", "delivered", "completed", "cancelled"];
    if (!valid.includes(newStatus)) {
      throw { status: 400, message: `Trạng thái "${newStatus}" không hợp lệ` };
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [orders] = await conn.query("SELECT status FROM orders WHERE id = ? FOR UPDATE", [orderId]);
      if (orders.length === 0) {
        throw { status: 404, message: "Không tìm thấy đơn hàng" };
      }

      const oldStatus = orders[0].status;

      // Nếu chuyển từ trạng thái chưa hủy sang hủy -> hoàn kho
      if (newStatus === "cancelled" && oldStatus !== "cancelled") {
        const [items] = await conn.query("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [orderId]);
        for (const it of items) {
          if (it.product_id) {
            await conn.query("UPDATE products SET stock = stock + ? WHERE id = ?", [it.quantity, it.product_id]);
          }
        }
      }

      await conn.query("UPDATE orders SET status = ? WHERE id = ?", [newStatus, orderId]);
      await conn.query(
        "INSERT INTO order_status_logs (order_id, status, note, changed_by_user_id) VALUES (?, ?, ?, ?)",
        [orderId, newStatus, note || `Quản trị viên chuyển trạng thái sang ${newStatus}`, adminUserId]
      );

      await conn.commit();
      return { message: `Cập nhật trạng thái sang "${newStatus}" thành công` };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
