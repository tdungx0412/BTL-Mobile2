// components/product/ProductDetailModal.tsx
import { BASE_URL } from "@/constants/config";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface ProductDetailItem {
  id: number;
  sku?: string;
  name: string;
  price: number | string;
  stock: number;
  image?: string | null;
  category?: string;
  category_name?: string;
  description?: string;
  rating?: number | string;
  review_count?: number;
  origin?: string;
  material?: string;
}

interface ProductDetailModalProps {
  visible: boolean;
  product: ProductDetailItem | null;
  onClose: () => void;
  onAddToCart?: (product: ProductDetailItem, quantity: number) => void;
  onBuyNow?: (product: ProductDetailItem, quantity: number) => void;
}

const defaultFallbackImg =
  "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80";

export const resolveProductImage = (img?: string | null): string => {
  if (!img || img === "null" || img === "undefined") return defaultFallbackImg;
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) {
    return img;
  }
  const cleanPath = img.startsWith("/") ? img : `/${img}`;
  return `${BASE_URL}${cleanPath}`;
};

export const formatVND = (num: number | string | undefined | null): string => {
  const val = typeof num === "string" ? parseFloat(num) || 0 : num || 0;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  visible,
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (visible) {
      setQuantity(1);
    }
  }, [visible, product?.id]);

  if (!product) return null;

  const isOutOfStock = (product.stock ?? 0) <= 0;
  const maxStock = Math.max(1, product.stock ?? 1);
  const displayImageUri = resolveProductImage(product.image);
  const categoryName = product.category_name || product.category || "Đồ thủ công Eiko";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop: Chạm ra ngoài để đóng modal */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Khung nội dung chi tiết */}
        <View style={styles.sheet}>
          {/* Nút đóng */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={22} color="#1f2937" />
          </TouchableOpacity>

          {/* Vùng cuộn nội dung chi tiết */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Ảnh sản phẩm */}
            <View style={styles.imageBox}>
              <Image source={{ uri: displayImageUri }} style={styles.productImg} resizeMode="cover" />
              {isOutOfStock ? (
                <View style={styles.outOfStockBadge}>
                  <Text style={styles.outOfStockText}>TẠM HẾT HÀNG</Text>
                </View>
              ) : (
                <View style={styles.inStockBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#fff" />
                  <Text style={styles.inStockText}>Còn {product.stock} sản phẩm</Text>
                </View>
              )}
            </View>

            {/* Thông tin chính */}
            <View style={styles.body}>
              <View style={styles.catRow}>
                <Text style={styles.categoryBadge}>{categoryName}</Text>
                {product.sku ? <Text style={styles.skuText}>SKU: {product.sku}</Text> : null}
              </View>

              <Text style={styles.title}>{product.name}</Text>
              <Text style={styles.price}>{formatVND(product.price)}</Text>

              {/* Đánh giá & uy tín */}
              <View style={styles.ratingRow}>
                <View style={styles.stars}>
                  <Ionicons name="star" size={15} color="#f59e0b" />
                  <Text style={styles.ratingVal}>{product.rating || "5.0"}</Text>
                </View>
                <Text style={styles.reviewCount}>({product.review_count || 128} lượt đánh giá hài lòng)</Text>
              </View>

              <View style={styles.divider} />

              {/* Mô tả sản phẩm */}
              <Text style={styles.sectionTitle}>Mô Tả Sản Phẩm</Text>
              <Text style={styles.description}>
                {product.description ||
                  "Sản phẩm thủ công mỹ nghệ tinh tế, được tạo tác công phu từ nguồn vật liệu tự nhiên tuyển chọn. Mang đậm dấu ấn văn hóa làng nghề truyền thống và thân thiện với người dùng."}
              </Text>

              {/* Chi tiết xuất xứ & chất liệu nếu có */}
              {(product.origin || product.material) && (
                <View style={styles.extraBox}>
                  {product.origin ? (
                    <View style={styles.extraRow}>
                      <Ionicons name="location-outline" size={15} color="#d97706" />
                      <Text style={styles.extraLabel}>Xuất xứ:</Text>
                      <Text style={styles.extraVal}>{product.origin}</Text>
                    </View>
                  ) : null}
                  {product.material ? (
                    <View style={styles.extraRow}>
                      <Ionicons name="leaf-outline" size={15} color="#16a34a" />
                      <Text style={styles.extraLabel}>Chất liệu:</Text>
                      <Text style={styles.extraVal}>{product.material}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Bộ chọn số lượng đặt mua */}
              {!isOutOfStock && (
                <View style={styles.quantitySection}>
                  <Text style={styles.quantityLabel}>Số lượng đặt mua:</Text>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      disabled={quantity <= 1}
                      onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <Ionicons
                        name="remove"
                        size={18}
                        color={quantity <= 1 ? "#d1d5db" : "#374151"}
                      />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      disabled={quantity >= maxStock}
                      onPress={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color={quantity >= maxStock ? "#d1d5db" : "#374151"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Thanh hành động chân Modal */}
          <View style={styles.footer}>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.btnAddToCart, isOutOfStock && styles.btnDisabled]}
                disabled={isOutOfStock}
                activeOpacity={0.85}
                onPress={() => {
                  if (onAddToCart) {
                    onAddToCart(product, quantity);
                  }
                  onClose();
                }}
              >
                <Ionicons name="cart-outline" size={20} color="#fff" />
                <Text style={styles.btnAddToCartText}>
                  {isOutOfStock ? "Tạm Hết Hàng" : "Thêm Vào Giỏ"}
                </Text>
              </TouchableOpacity>

              {!isOutOfStock && onBuyNow && (
                <TouchableOpacity
                  style={styles.btnBuyNow}
                  activeOpacity={0.85}
                  onPress={() => {
                    onBuyNow(product, quantity);
                    onClose();
                  }}
                >
                  <Ionicons name="flash-outline" size={20} color="#fff" />
                  <Text style={styles.btnBuyNowText}>Mua Ngay</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: Math.min(SCREEN_HEIGHT * 0.88, 760),
    height: Math.min(SCREEN_HEIGHT * 0.85, 720),
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageBox: {
    width: "100%",
    height: 270,
    backgroundColor: "#f3f4f6",
    position: "relative",
  },
  productImg: {
    width: "100%",
    height: "100%",
  },
  inStockBadge: {
    position: "absolute",
    bottom: 12,
    left: 14,
    backgroundColor: "rgba(16, 185, 129, 0.92)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inStockText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  outOfStockBadge: {
    position: "absolute",
    bottom: 12,
    left: 14,
    backgroundColor: "rgba(239, 68, 68, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  outOfStockText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d97706",
    textTransform: "uppercase",
    backgroundColor: "#fffbeb",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skuText: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
    lineHeight: 26,
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: "900",
    color: "#d97706",
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4b5563",
  },
  reviewCount: {
    fontSize: 12,
    color: "#9ca3af",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 12,
  },
  extraBox: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 14,
  },
  extraRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  extraLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    width: 65,
  },
  extraVal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fffbeb",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginTop: 6,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400e",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  qtyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1f2937",
    minWidth: 28,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  btnAddToCart: {
    flex: 1,
    backgroundColor: "#f59e0b",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  btnAddToCartText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  btnBuyNow: {
    flex: 1,
    backgroundColor: "#d97706",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnBuyNowText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  btnDisabled: {
    backgroundColor: "#9ca3af",
  },
});
