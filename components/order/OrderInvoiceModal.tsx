// components/order/OrderInvoiceModal.tsx
import { BASE_URL } from "@/constants/config";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface OrderItemDetail {
  id?: number;
  product_id?: number;
  name?: string;
  item_name?: string;
  product_name?: string;
  quantity: number;
  price?: number | string;
  unit_price?: number | string;
  price_at_purchase?: number | string;
  image?: string;
}

export interface OrderStatusLog {
  id: number;
  status: string;
  note?: string;
  created_at?: string;
}

export interface OrderDetail {
  id: number;
  order_code?: string;
  customer_name?: string;
  phone?: string;
  address?: string;
  note?: string;
  subtotal?: number | string;
  discount_amount?: number | string;
  shipping_fee?: number | string;
  total_amount: number | string;
  payment_method?: string;
  payment_status?: string;
  status: string;
  created_at?: string;
  items?: OrderItemDetail[];
  logs?: OrderStatusLog[];
}

interface OrderInvoiceModalProps {
  visible: boolean;
  order: OrderDetail | null;
  onClose: () => void;
  onCancelOrder?: (orderId: number) => void;
  onConfirmPayment?: (orderId: number, orderCode?: string) => void;
}

const formatVND = (num: number | string | undefined) => {
  const val = typeof num === "string" ? parseFloat(num) || 0 : num || 0;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return { label: "Chờ xác nhận", bg: "#fef3c7", text: "#b45309", icon: "time-outline" };
    case "confirmed":
      return { label: "Đã xác nhận", bg: "#dcfce7", text: "#15803d", icon: "checkmark-circle" };
    case "processing":
      return { label: "Đang đóng gói", bg: "#f3e8ff", text: "#7e22ce", icon: "cube-outline" };
    case "shipping":
      return { label: "Đang giao", bg: "#ede9fe", text: "#6d28d9", icon: "bicycle-outline" };
    case "delivered":
    case "completed":
      return { label: "Hoàn tất", bg: "#dcfce7", text: "#15803d", icon: "checkmark-done-circle" };
    case "cancelled":
      return { label: "Đã hủy", bg: "#fee2e2", text: "#b91c1c", icon: "close-circle-outline" };
    default:
      return { label: status, bg: "#f3f4f6", text: "#4b5563", icon: "help-circle-outline" };
  }
};

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({
  visible,
  order,
  onClose,
  onCancelOrder,
  onConfirmPayment,
}) => {
  if (!order) return null;

  const badge = getStatusBadge(order.status);
  const items = order.items || [];
  const subtotal = parseFloat(String(order.subtotal || order.total_amount)) || 0;
  const discount = parseFloat(String(order.discount_amount || 0)) || 0;
  const shipping = parseFloat(String(order.shipping_fee || 0)) || 0;
  const total = parseFloat(String(order.total_amount)) || 0;

  const isBanking = (order.payment_method || "").toUpperCase().includes("BANK");
  const isPaid = order.payment_status === "paid" || order.status === "confirmed" || order.status === "completed";
  const orderCode = order.order_code || `EIKO-${order.id}`;

  // VietQR URL
  const qrUrl = `https://img.vietqr.io/image/MB-0971410870-compact2.png?amount=${Math.round(total)}&addInfo=${encodeURIComponent(orderCode)}`;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="receipt" size={24} color="#d97706" />
              <View>
                <Text style={styles.headerTitle}>HÓA ĐƠN BÁN HÀNG</Text>
                <Text style={styles.headerSubtitle}>Eiko Handcraft Shop</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* THÔNG TIN CHUNG HÓA ĐƠN */}
            <View style={styles.invoiceMetaCard}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Mã hóa đơn:</Text>
                <Text style={styles.metaCode}>{orderCode}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Thời gian lập:</Text>
                <Text style={styles.metaValue}>
                  {order.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : "Hôm nay"}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Trạng thái đơn:</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Ionicons name={badge.icon as any} size={13} color={badge.text} />
                  <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Thanh toán:</Text>
                <View style={[styles.payStatusBadge, isPaid ? styles.paidBadge : styles.unpaidBadge]}>
                  <Text style={[styles.payStatusText, isPaid ? styles.paidText : styles.unpaidText]}>
                    {isPaid ? "ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN"}
                  </Text>
                </View>
              </View>
            </View>

            {/* THÔNG TIN NGƯỜI NHẬN */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="person-outline" size={18} color="#d97706" />
                <Text style={styles.sectionTitle}>Thông Tin Nhận Hàng</Text>
              </View>
              <View style={styles.infoLine}>
                <Text style={styles.infoLabel}>Khách hàng:</Text>
                <Text style={styles.infoValue}>{order.customer_name || "Khách hàng"}</Text>
              </View>
              {!!order.phone && (
                <View style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Số điện thoại:</Text>
                  <Text style={styles.infoValue}>{order.phone}</Text>
                </View>
              )}
              {!!order.address && (
                <View style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Địa chỉ giao:</Text>
                  <Text style={[styles.infoValue, { flex: 1, textAlign: "right" }]}>{order.address}</Text>
                </View>
              )}
              {!!order.note && (
                <View style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Ghi chú:</Text>
                  <Text style={[styles.infoValue, { fontStyle: "italic", color: "#6b7280" }]}>{order.note}</Text>
                </View>
              )}
            </View>

            {/* DANH SÁCH SẢN PHẨM */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="bag-handle-outline" size={18} color="#d97706" />
                <Text style={styles.sectionTitle}>Sản Phẩm Đã Mua ({items.length})</Text>
              </View>

              {items.map((it, idx) => {
                const itemName = it.name || it.item_name || it.product_name || "Sản phẩm thủ công";
                const unitPrice = parseFloat(String(it.unit_price || it.price || it.price_at_purchase || 0));
                const itemQty = it.quantity || 1;
                const itemTotal = unitPrice * itemQty;

                let imgUri = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80";
                if (it.image) {
                  imgUri = it.image.startsWith("http") ? it.image : `${BASE_URL}${it.image}`;
                }

                return (
                  <View key={idx} style={styles.productRow}>
                    <Image source={{ uri: imgUri }} style={styles.productThumb} resizeMode="cover" />
                    <View style={styles.productDetails}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {itemName}
                      </Text>
                      <Text style={styles.productUnitPrice}>
                        Đơn giá: {formatVND(unitPrice)} × {itemQty}
                      </Text>
                    </View>
                    <Text style={styles.productTotal}>{formatVND(itemTotal)}</Text>
                  </View>
                );
              })}
            </View>

            {/* CHI TIẾT THANH TOÁN */}
            <View style={styles.pricingCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tiền hàng (Tạm tính):</Text>
                <Text style={styles.priceVal}>{formatVND(subtotal)}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: "#16a34a" }]}>Giảm giá voucher:</Text>
                  <Text style={[styles.priceVal, { color: "#16a34a" }]}>-{formatVND(discount)}</Text>
                </View>
              )}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Phí vận chuyển:</Text>
                <Text style={styles.priceVal}>{shipping === 0 ? "Miễn phí" : formatVND(shipping)}</Text>
              </View>
              <View style={[styles.priceRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>TỔNG THANH TOÁN:</Text>
                <Text style={styles.grandTotalVal}>{formatVND(total)}</Text>
              </View>
              <View style={styles.payMethodRow}>
                <Text style={styles.payMethodLabel}>Phương thức:</Text>
                <Text style={styles.payMethodVal}>
                  {order.payment_method === "BANKING"
                    ? "Chuyển khoản Ngân hàng (VietQR)"
                    : "Tiền mặt khi nhận hàng (COD)"}
                </Text>
              </View>
            </View>

            {/* KHUNG THANH TOÁN QR NẾU BANKING VÀ CHƯA TRẢ */}
            {isBanking && !isPaid && (
              <View style={styles.bankingCard}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="qr-code-outline" size={18} color="#0284c7" />
                  <Text style={[styles.sectionTitle, { color: "#0369a1" }]}>Quét Mã VietQR Thanh Toán</Text>
                </View>
                <Text style={styles.bankingSub}>
                  Mở ứng dụng ngân hàng bất kỳ để quét mã và chuyển tiền nhanh:
                </Text>

                <View style={styles.qrContainer}>
                  <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
                </View>

                <View style={styles.bankInfoBox}>
                  <Text style={styles.bankInfoText}>
                    Ngân hàng: <Text style={{ fontWeight: "700" }}>MB Bank (Quân Đội)</Text>
                  </Text>
                  <Text style={styles.bankInfoText}>
                    Số tài khoản: <Text style={{ fontWeight: "700", color: "#d97706" }}>0971410870</Text>
                  </Text>
                  <Text style={styles.bankInfoText}>
                    Chủ tài khoản: <Text style={{ fontWeight: "700" }}>TRAN TRUNG DUNG</Text>
                  </Text>
                  <Text style={styles.bankInfoText}>
                    Nội dung: <Text style={{ fontWeight: "700", color: "#0369a1" }}>{orderCode}</Text>
                  </Text>
                </View>

                {onConfirmPayment && (
                  <TouchableOpacity
                    style={styles.confirmPaidBtn}
                    onPress={() => onConfirmPayment(order.id, orderCode)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.confirmPaidText}>Tôi Đã Chuyển Khoản Xong</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* NHẬT KÝ XỬ LÝ (ORDER LOGS) */}
            {order.logs && order.logs.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="git-commit-outline" size={18} color="#d97706" />
                  <Text style={styles.sectionTitle}>Lịch Trình Đơn Hàng</Text>
                </View>
                {order.logs.map((lg, i) => (
                  <View key={i} style={styles.logRow}>
                    <View style={styles.logDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logNote}>{lg.note || lg.status}</Text>
                      {lg.created_at && (
                        <Text style={styles.logTime}>{new Date(lg.created_at).toLocaleString("vi-VN")}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* LỜI CẢM ƠN */}
            <View style={styles.thankyouBox}>
              <Text style={styles.thankyouText}>
                ❤️ Cảm ơn bạn đã ủng hộ các sản phẩm thủ công tinh hoa Việt Nam tại Eiko Handcraft!
              </Text>
            </View>
          </ScrollView>

          {/* FOOTER ACTIONS */}
          <View style={styles.footer}>
            {order.status === "pending" && onCancelOrder && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancelOrder(order.id)}>
                <Text style={styles.cancelBtnText}>Hủy Đơn</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
              <Text style={styles.closeActionText}>Đóng Hóa Đơn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "#f9fafb",
    width: "100%",
    maxHeight: "92%",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#d97706",
    fontWeight: "600",
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  invoiceMetaCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  metaCode: {
    fontSize: 14,
    fontWeight: "800",
    color: "#d97706",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  payStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidBadge: {
    backgroundColor: "#dcfce7",
  },
  unpaidBadge: {
    backgroundColor: "#fef3c7",
  },
  payStatusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  paidText: {
    color: "#15803d",
  },
  unpaidText: {
    color: "#b45309",
  },
  sectionCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  infoLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    marginRight: 10,
  },
  productDetails: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  productUnitPrice: {
    fontSize: 12,
    color: "#6b7280",
  },
  productTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#d97706",
  },
  pricingCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: "#4b5563",
  },
  priceVal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#b45309",
  },
  grandTotalVal: {
    fontSize: 17,
    fontWeight: "900",
    color: "#d97706",
  },
  payMethodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fdf8f6",
    padding: 8,
    borderRadius: 8,
  },
  payMethodLabel: {
    fontSize: 12,
    color: "#78350f",
  },
  payMethodVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#78350f",
  },
  bankingCard: {
    backgroundColor: "#f0f9ff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  bankingSub: {
    fontSize: 12,
    color: "#0369a1",
    marginBottom: 10,
  },
  qrContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0f2fe",
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  bankInfoBox: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  bankInfoText: {
    fontSize: 12,
    color: "#334155",
    marginBottom: 4,
  },
  confirmPaidBtn: {
    backgroundColor: "#0284c7",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  confirmPaidText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  logRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d97706",
    marginTop: 5,
  },
  logNote: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  logTime: {
    fontSize: 11,
    color: "#9ca3af",
  },
  thankyouBox: {
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  thankyouText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    padding: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#fee2e2",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 14,
  },
  closeActionBtn: {
    flex: 2,
    backgroundColor: "#d97706",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeActionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
