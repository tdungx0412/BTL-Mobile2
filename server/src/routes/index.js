import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import categoryRoutes from "../modules/categories/category.routes.js";
import orderRoutes from "../modules/orders/order.routes.js";
import productRoutes from "../modules/products/product.routes.js";
import serviceRoutes from "../modules/services/service.routes.js";
import voucherRoutes from "../modules/vouchers/voucher.routes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/categories", categoryRoutes);
apiRouter.use("/products", productRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/services", serviceRoutes);
apiRouter.use("/personal-services", serviceRoutes); // Backward compatibility
apiRouter.use("/vouchers", voucherRoutes);

export default apiRouter;
