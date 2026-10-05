// components/order/AdminOrderDetailModal.tsx
import { API_URL, BASE_URL } from "@/constants/config";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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

export interface FullOrderDetail {
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

interface AdminOrderDetailModalProps {
  visible: boolean;
  orderId: number | null;
  initialOrderSummary?: any | null;
  onClose: () => void;
  onStatusUpdated?: () => void;
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
      return { label: "Đang giao hàng", bg: "#ede9fe", text: "#6d28d9", icon: "bicycle-outline" };
    case "delivered":
    case "completed":
      return { label: "Hoàn tất", bg: "#dcfce7", text: "#15803d", icon: "checkmark-done-circle" };
    case "cancelled":
      return { label: "Đã hủy", bg: "#fee2e2", text: "#b91c1c", icon: "close-circle-outline" };
    default:
      return { label: status, bg: "#f3f4f6", text: "#4b5563", icon: "help-circle-outline" };
  }
};

export const AdminOrderDetailModal: React.FC<AdminOrderDetailModalProps> = ({
  visible,
  orderId,
  initialOrderSummary = null,
  onClose,
  onStatusUpdated,
}) => {
  const [detail, setDetail] = useState<FullOrderDetail | null>(initialOrderSummary);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (visible && orderId) {
      fetchDetail(orderId);
    } else {
      setDetail(null);
    }
  }, [visible, orderId]);

  const fetchDetail = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      } else {
        // Fallback to customer endpoint
        const fallbackRes = await fetch(`${API_URL}/orders/${id}`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setDetail(fallbackData);
        }
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết đơn hàng admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (newStatus: string, label: string) => {
    if (!detail) return;

    Alert.alert(
      "Cập nhật trạng thái đơn",
      `Bạn có chắc muốn chuyển đơn #${detail.order_code || detail.id} sang trạng thái "${label}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng Ý",
          onPress: async () => {
            setUpdatingStatus(true);
            try {
              let res;
              if (newStatus === "confirmed") {
                res = await fetch(`${API_URL}/orders/${detail.id}/confirm-payment`, {
                  method: "POST",
                });
              } else {
                res = await fetch(`${API_URL}/admin/orders/${detail.id}/status`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: newStatus }),
                });
              }

              const data = await res.json();
              if (res.ok) {
                Alert.alert("Thành công 🎉", data.message || `Đã chuyển sang "${label}"`);
                fetchDetail(detail.id);
                if (onStatusUpdated) onStatusUpdated();
              } else {
                Alert.alert("Lỗi", data.message || "Không thể cập nhật trạng thái");
              }
            } catch (err: any) {
              Alert.alert("Lỗi kết nối", err.message);
            } finally {
              setUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  const handleCallCustomer = (phone?: string) => {
    if (!phone) {
      Alert.alert("Thông báo", "Đơn hàng này không có số điện thoại khách hàng.");
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Lỗi", "Không thể thực hiện cuộc gọi trên thiết bị này.");
    });
  };

  if (!visible) return null;

  const currentOrder = detail || initialOrderSummary;
  if (!currentOrder) return null;

  const badge = getStatusBadge(currentOrder.status);
  const items = currentOrder.items || [];
  const subtotal = parseFloat(String(currentOrder.subtotal || currentOrder.total_amount)) || 0;
  const discount = parseFloat(String(currentOrder.discount_amount || 0)) || 0;
  const shipping = parseFloat(String(currentOrder.shipping_fee || 0)) || 0;
  const total = parseFloat(String(currentOrder.total_amount)) || 0;
  const isPaid =
    currentOrder.payment_status === "paid" ||
    currentOrder.status === "confirmed" ||
    currentOrder.status === "completed";
  const orderCode = currentOrder.order_code || `EIKO-${currentOrder.id}`;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="receipt" size={20} color="#d97706" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Chi Tiết Đơn Hàng</Text>
                <Text style={styles.modalSub}>{orderCode}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#4b5563" />
            </TouchableOpacity>
          </View>

          {loading && !detail ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#d97706" />
              <Text style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
                Đang tải thông tin chi tiết đơn hàng...
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* TRẠNG THÁI ĐƠN HÀNG & THỜI GIAN */}
              <View style={styles.cardBox}>
                <View style={styles.metaRow}>
                  <View>
                    <Text style={styles.metaLabel}>Trạng thái đơn:</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg, marginTop: 4 }]}>
                      <Ionicons name={badge.icon as any} size={14} color={badge.text} />
                      <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.metaLabel}>Ngày tạo đơn:</Text>
                    <Text style={styles.metaValue}>
                      {currentOrder.created_at
                        ? new Date(currentOrder.created_at).toLocaleString("vi-VN")
                        : "---"}
                    </Text>
                  </View>
                </View>

                {/* THANH THAO TÁC TRẠNG THÁI NHANH CHO ADMIN */}
                <View style={styles.adminActionBar}>
                  <Text style={styles.adminActionTitle}>⚡ Cập nhật trạng thái đơn:</Text>
                  <View style={styles.actionButtonsRow}>
                    {currentOrder.status === "pending" && (
                      <>
                        <TouchableOpacity
                          style={[styles.btnAction, { backgroundColor: "#15803d" }]}
                          disabled={updatingStatus}
                          onPress={() => handleUpdateStatus("confirmed", "Đã xác nhận")}
                        >
                          <Ionicons name="checkmark-circle" size={15} color="#fff" />
                          <Text style={styles.btnActionText}>Xác Nhận (Đã TT)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.btnAction, { backgroundColor: "#dc2626" }]}
                          disabled={updatingStatus}
                          onPress={() => handleUpdateStatus("cancelled", "Đã hủy")}
                        >
                          <Ionicons name="close-circle" size={15} color="#fff" />
                          <Text style={styles.btnActionText}>Hủy Đơn</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {currentOrder.status === "confirmed" && (
                      <>
                        <TouchableOpacity
                          style={[styles.btnAction, { backgroundColor: "#6d28d9" }]}
                          disabled={updatingStatus}
                          onPress={() => handleUpdateStatus("shipping", "Đang giao")}
                        >
                          <Ionicons name="bicycle" size={15} color="#fff" />
                          <Text style={styles.btnActionText}>Giao Hàng</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.btnAction, { backgroundColor: "#dc2626" }]}
                          disabled={updatingStatus}
                          onPress={() => handleUpdateStatus("cancelled", "Đã hủy")}
                        >
                          <Ionicons name="close-circle" size={15} color="#fff" />
                          <Text style={styles.btnActionText}>Hủy Đơn</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {currentOrder.status === "shipping" && (
                      <>
                        <TouchableOpacity
                          style={[styles.btnAction, { backgroundColor: "#0284c7" }]}
                          disabled={updatingStatus}
                          onPress={() => handleUpdateStatus("completed", "Hoàn tất")}
                        >
                          <Ionicons name="checkmark-done" size={15} color="#fff" />
                          <Text style={styles.btnActionText}>Hoàn Tất Đơn</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.btnAction, { backgroundColor: "#dc2626" }]}
                          disabled={updatingStatus}
                          onPress={() => handleUpdateStatus("cancelled", "Đã hủy")}
                        >
                          <Ionicons name="close-circle" size={15} color="#fff" />
                          <Text style={styles.btnActionText}>Hủy Đơn</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {currentOrder.status === "completed" && (
                      <View style={styles.completedNotice}>
                        <Ionicons name="checkmark-done-circle" size={18} color="#15803d" />
                        <Text style={styles.completedNoticeText}>
                          Đơn hàng đã được giao và thanh toán hoàn tất.
                        </Text>
                      </View>
                    )}

                    {currentOrder.status === "cancelled" && (
                      <View style={styles.cancelledNotice}>
                        <Ionicons name="alert-circle" size={18} color="#b91c1c" />
                        <Text style={styles.cancelledNoticeText}>
                          Đơn hàng đã bị hủy.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* THÔNG TIN KHÁCH HÀNG & GIAO HÀNG */}
              <View style={styles.cardBox}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="person-circle" size={18} color="#d97706" />
                    <Text style={styles.cardTitle}>Thông Tin Khách Hàng</Text>
                  </View>

                  {currentOrder.phone ? (
                    <TouchableOpacity
                      style={styles.btnCall}
                      onPress={() => handleCallCustomer(currentOrder.phone)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={13} color="#fff" />
                      <Text style={styles.btnCallText}>Gọi Điện</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Người nhận:</Text>
                  <Text style={styles.infoValue}>{currentOrder.customer_name || "Khách mua lẻ"}</Text>
                </View>

                <View style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Điện thoại:</Text>
                  <Text style={[styles.infoValue, { color: "#d97706", fontWeight: "700" }]}>
                    {currentOrder.phone || "---"}
                  </Text>
                </View>

                <View style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Địa chỉ:</Text>
                  <Text style={[styles.infoValue, { flex: 1, textAlign: "right" }]} numberOfLines={3}>
                    {currentOrder.address || "Chưa có địa chỉ cụ thể"}
                  </Text>
                </View>

                {currentOrder.note ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteTitle}>📝 Ghi chú từ khách hàng:</Text>
                    <Text style={styles.noteContent}>{currentOrder.note}</Text>
                  </View>
                ) : null}
              </View>

              {/* DANH SÁCH MÓN HÀNG CHI TIẾT */}
              <View style={styles.cardBox}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="cube" size={18} color="#d97706" />
                    <Text style={styles.cardTitle}>
                      Sản Phẩm Trong Đơn ({items.length || (currentOrder.details ? "Chi tiết" : 0)})
                    </Text>
                  </View>
                </View>

                {items.length === 0 && currentOrder.details ? (
                  <View style={{ paddingVertical: 8 }}>
                    <Text style={{ fontSize: 13, color: "#374151", fontStyle: "italic" }}>
                      📦 {currentOrder.details}
                    </Text>
                  </View>
                ) : (
                  items.map((it: OrderItemDetail, idx: number) => {
                    let imgUri =
                      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80";
                    if (it.image) {
                      imgUri = it.image.startsWith("http") ? it.image : `${BASE_URL}${it.image}`;
                    }
                    const itemName = it.name || it.item_name || it.product_name || "Sản phẩm Eiko";
                    const unitPrice = parseFloat(String(it.unit_price || it.price || it.price_at_purchase || 0));
                    const qty = it.quantity || 1;
                    const itemTotal = unitPrice * qty;

                    return (
                      <View key={it.id || idx} style={styles.itemRow}>
                        <Image source={{ uri: imgUri }} style={styles.itemThumb} resizeMode="cover" />
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName} numberOfLines={2}>
                            {itemName}
                          </Text>
                          <Text style={styles.itemPrice}>
                            {formatVND(unitPrice)} <Text style={{ color: "#6b7280", fontWeight: "400" }}>x {qty}</Text>
                          </Text>
                        </View>
                        <Text style={styles.itemTotalAmount}>{formatVND(itemTotal)}</Text>
                      </View>
                    );
                  })
                )}
              </View>

              {/* CHI TIẾT THANH TOÁN */}
              <View style={styles.cardBox}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="wallet" size={18} color="#d97706" />
                    <Text style={styles.cardTitle}>Thanh Toán & Cước Phí</Text>
                  </View>
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Tiền hàng (tạm tính):</Text>
                  <Text style={styles.calcValue}>{formatVND(subtotal)}</Text>
                </View>

                {discount > 0 ? (
                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: "#16a34a" }]}>Giảm giá voucher:</Text>
                    <Text style={[styles.calcValue, { color: "#16a34a" }]}>-{formatVND(discount)}</Text>
                  </View>
                ) : null}

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Phí vận chuyển:</Text>
                  <Text style={styles.calcValue}>+{formatVND(shipping)}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalRowLabel}>TỔNG CỘNG:</Text>
                  <Text style={styles.totalRowValue}>{formatVND(total)}</Text>
                </View>

                <View style={styles.payStatusRow}>
                  <Text style={{ fontSize: 13, color: "#4b5563" }}>
                    Phương thức:{" "}
                    <Text style={{ fontWeight: "700", color: "#1f2937" }}>
                      {currentOrder.payment_method === "BANKING" ? "Chuyển khoản VietQR" : "Tiền mặt (COD)"}
                    </Text>
                  </Text>

                  <View
                    style={[
                      styles.payTag,
                      { backgroundColor: isPaid ? "#dcfce7" : "#fee2e2" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.payTagText,
                        { color: isPaid ? "#15803d" : "#dc2626" },
                      ]}
                    >
                      {isPaid ? "● ĐÃ THANH TOÁN" : "○ CHƯA THANH TOÁN"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* LỊCH SỬ THAO TÁC / TIMELINE */}
              {currentOrder.logs && currentOrder.logs.length > 0 ? (
                <View style={styles.cardBox}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="time" size={18} color="#d97706" />
                      <Text style={styles.cardTitle}>Lịch Sử Xử Lý Đơn</Text>
                    </View>
                  </View>

                  <View style={{ paddingLeft: 6, marginTop: 4 }}>
                    {currentOrder.logs.map((log: OrderStatusLog, i: number) => {
                      const isLast = i === (currentOrder.logs?.length || 0) - 1;
                      return (
                        <View key={log.id || i} style={styles.timelineItem}>
                          <View style={styles.timelineDot} />
                          {!isLast && <View style={styles.timelineLine} />}
                          <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>{log.note || `Trạng thái: ${log.status}`}</Text>
                            <Text style={styles.timelineTime}>
                              {log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : ""}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <View style={{ height: 30 }} />
            </ScrollView>
          )}

          {/* FOOTER BUTTON */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnCloseFooter} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.btnCloseFooterText}>Đóng Chi Tiết</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#f9fafb",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1f2937",
  },
  modalSub: {
    fontSize: 12,
    color: "#d97706",
    fontWeight: "700",
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  centerLoading: {
    padding: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollBody: {
    padding: 16,
    gap: 12,
  },
  cardBox: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  metaLabel: {
    fontSize: 11,
    color: "#6b7280",
  },
  metaValue: {
    fontSize: 12,
    color: "#1f2937",
    fontWeight: "600",
    marginTop: 3,
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
    fontSize: 12,
    fontWeight: "700",
  },
  adminActionBar: {
    marginTop: 10,
  },
  adminActionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  btnAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  completedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dcfce7",
    padding: 10,
    borderRadius: 8,
    flex: 1,
  },
  completedNoticeText: {
    fontSize: 12,
    color: "#15803d",
    fontWeight: "600",
  },
  cancelledNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 8,
    flex: 1,
  },
  cancelledNoticeText: {
    fontSize: 12,
    color: "#b91c1c",
    fontWeight: "600",
  },
  btnCall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#059669",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnCallText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  infoLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6b7280",
    width: 90,
  },
  infoValue: {
    fontSize: 13,
    color: "#1f2937",
    fontWeight: "500",
  },
  noteBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fef3c7",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#b45309",
    marginBottom: 2,
  },
  noteContent: {
    fontSize: 12,
    color: "#92400e",
    lineHeight: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  itemPrice: {
    fontSize: 12,
    color: "#d97706",
    fontWeight: "700",
  },
  itemTotalAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937",
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  calcLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  calcValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  totalRowLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },
  totalRowValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#d97706",
  },
  payStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 8,
    borderRadius: 8,
  },
  payTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payTagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  timelineItem: {
    position: "relative",
    paddingLeft: 20,
    paddingBottom: 14,
  },
  timelineDot: {
    position: "absolute",
    left: 0,
    top: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#d97706",
  },
  timelineLine: {
    position: "absolute",
    left: 4,
    top: 13,
    width: 1,
    bottom: 0,
    backgroundColor: "#fde68a",
  },
  timelineContent: {
    gap: 1,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937",
  },
  timelineTime: {
    fontSize: 11,
    color: "#9ca3af",
  },
  modalFooter: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  btnCloseFooter: {
    backgroundColor: "#1f2937",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  btnCloseFooterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
