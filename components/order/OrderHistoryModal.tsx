// components/order/OrderHistoryModal.tsx
import { API_URL, BASE_URL } from "@/constants/config";
import { useAuthStore } from "@/src/stores/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { OrderDetail, OrderInvoiceModal } from "./OrderInvoiceModal";

interface OrderHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

const formatVND = (num: number | string) => {
  const val = typeof num === "string" ? parseFloat(num) || 0 : num;
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

type FilterStatus = "all" | "pending" | "confirmed" | "completed" | "cancelled";

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ visible, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  // Filter & Search
  const [currentFilter, setCurrentFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Order for Full Electronic Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<OrderDetail | null>(null);

  const fetchOrders = async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      let url = "";
      if (user?.id) {
        url = `${API_URL}/orders/my-orders?userId=${user.id}`;
      } else {
        const raw = await AsyncStorage.getItem("@eiko_recent_order_ids");
        const ids = raw ? JSON.parse(raw) : [];
        if (ids.length > 0) {
          url = `${API_URL}/orders/my-orders?ids=${ids.join(",")}`;
        }
      }

      if (url) {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        } else {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error("Lỗi lấy đơn hàng:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchOrders();
    }
  }, [visible, user?.id]);

  const handleCancelOrder = (orderId: number) => {
    Alert.alert("Xác nhận hủy", "Bạn có chắc chắn muốn hủy đơn hàng này? Tồn kho sẽ được hoàn lại.", [
      { text: "Đóng", style: "cancel" },
      {
        text: "Hủy đơn",
        style: "destructive",
        onPress: async () => {
          setCancellingId(orderId);
          try {
            const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user?.id }),
            });
            const data = await res.json();
            if (res.ok) {
              Alert.alert("Thành công 🎉", data.message || "Đã hủy đơn hàng");
              fetchOrders();
              if (selectedInvoice && selectedInvoice.id === orderId) {
                setSelectedInvoice({ ...selectedInvoice, status: "cancelled" });
              }
            } else {
              Alert.alert("Lỗi", data.message || "Không thể hủy đơn");
            }
          } catch (err: any) {
            Alert.alert("Lỗi kết nối", err.message);
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
  };

  const handleConfirmPayment = (orderId: number, orderCode?: string) => {
    Alert.alert(
      "Xác nhận thanh toán",
      `Bạn có chắc muốn xác nhận đã chuyển khoản cho hóa đơn ${orderCode || `#${orderId}`}?`,
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Xác Nhận",
          onPress: async () => {
            setConfirmingId(orderId);
            try {
              const res = await fetch(`${API_URL}/orders/${orderId}/confirm-payment`, {
                method: "POST",
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert("Thành công 🎉", data.message || "Đã xác nhận thanh toán!");
                fetchOrders();
                if (selectedInvoice && selectedInvoice.id === orderId) {
                  setSelectedInvoice({ ...selectedInvoice, status: "confirmed", payment_status: "paid" });
                }
              } else {
                Alert.alert("Lỗi", data.message || "Không thể xác nhận thanh toán");
              }
            } catch (err: any) {
              Alert.alert("Lỗi kết nối", err.message);
            } finally {
              setConfirmingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Filter tab
      if (currentFilter !== "all") {
        if (currentFilter === "confirmed") {
          if (ord.status !== "confirmed" && ord.status !== "processing" && ord.status !== "shipping") {
            return false;
          }
        } else if (ord.status !== currentFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (ord.order_code || `EIKO-${ord.id}`).toLowerCase();
        const matchCode = code.includes(q);
        const matchItem = (ord.items || []).some((it) =>
          (it.name || it.item_name || it.product_name || "").toLowerCase().includes(q)
        );
        return matchCode || matchItem;
      }

      return true;
    });
  }, [orders, currentFilter, searchQuery]);

  return (
    <>
      <Modal visible={visible && !selectedInvoice} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* HEADER */}
            <View style={styles.header}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="receipt" size={24} color="#d97706" />
                <View>
                  <Text style={styles.headerTitle}>Hóa Đơn & Đơn Mua</Text>
                  <Text style={styles.headerSub}>Danh sách sản phẩm bạn đã mua tại Eiko</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* SEARCH BAR */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm theo mã hóa đơn, tên sản phẩm..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* STATUS FILTER TABS */}
            <View style={styles.filterTabs}>
              <TouchableOpacity
                style={[styles.filterTab, currentFilter === "all" && styles.filterTabActive]}
                onPress={() => setCurrentFilter("all")}
              >
                <Text style={[styles.filterTabText, currentFilter === "all" && styles.filterTabTextActive]}>
                  Tất cả ({orders.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, currentFilter === "pending" && styles.filterTabActive]}
                onPress={() => setCurrentFilter("pending")}
              >
                <Text style={[styles.filterTabText, currentFilter === "pending" && styles.filterTabTextActive]}>
                  Chờ xác nhận
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, currentFilter === "confirmed" && styles.filterTabActive]}
                onPress={() => setCurrentFilter("confirmed")}
              >
                <Text style={[styles.filterTabText, currentFilter === "confirmed" && styles.filterTabTextActive]}>
                  Đang xử lý
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, currentFilter === "completed" && styles.filterTabActive]}
                onPress={() => setCurrentFilter("completed")}
              >
                <Text style={[styles.filterTabText, currentFilter === "completed" && styles.filterTabTextActive]}>
                  Hoàn tất
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, currentFilter === "cancelled" && styles.filterTabActive]}
                onPress={() => setCurrentFilter("cancelled")}
              >
                <Text style={[styles.filterTabText, currentFilter === "cancelled" && styles.filterTabTextActive]}>
                  Đã hủy
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#d97706" />
                <Text style={styles.loadingText}>Đang tải danh sách hóa đơn...</Text>
              </View>
            ) : filteredOrders.length === 0 ? (
              <View style={styles.centerContainer}>
                <Ionicons name="document-text-outline" size={60} color="#d1d5db" />
                <Text style={styles.emptyTitle}>Chưa có hóa đơn nào</Text>
                <Text style={styles.emptySub}>
                  {user?.id
                    ? "Khi bạn mua sản phẩm, hóa đơn và lịch sử đơn sẽ hiển thị đầy đủ tại đây."
                    : "Đăng nhập tài khoản khách để tự động lưu và đồng bộ toàn bộ hóa đơn của bạn."}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} colors={["#d97706"]} />
                }
                renderItem={({ item }) => {
                  const badge = getStatusBadge(item.status);
                  const isPaid =
                    item.payment_status === "paid" || item.status === "confirmed" || item.status === "completed";
                  const orderCode = item.order_code || `EIKO-${item.id}`;

                  return (
                    <View style={styles.orderCard}>
                      {/* CARD HEADER */}
                      <View style={styles.cardHeader}>
                        <View>
                          <Text style={styles.orderCode}>{orderCode}</Text>
                          <Text style={styles.orderDate}>
                            {item.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : ""}
                          </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                          <Ionicons name={badge.icon as any} size={14} color={badge.text} />
                          <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                        </View>
                      </View>

                      {/* ITEMS LIST PREVIEW */}
                      <View style={styles.itemList}>
                        {(item.items || []).map((it, idx) => {
                          let imgUri =
                            "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80";
                          if (it.image) {
                            imgUri = it.image.startsWith("http") ? it.image : `${BASE_URL}${it.image}`;
                          }
                          const itemName = it.name || it.item_name || it.product_name || "Sản phẩm thủ công";
                          const unitPrice = parseFloat(String(it.unit_price || it.price || it.price_at_purchase || 0));

                          return (
                            <View key={idx} style={styles.itemRow}>
                              <Image source={{ uri: imgUri }} style={styles.itemImg} resizeMode="cover" />
                              <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={1}>
                                  {itemName}
                                </Text>
                                <Text style={styles.itemQtyPrice}>
                                  x{it.quantity} • {formatVND(unitPrice)}
                                </Text>
                              </View>
                              <Text style={styles.itemSubtotal}>{formatVND(unitPrice * it.quantity)}</Text>
                            </View>
                          );
                        })}
                      </View>

                      {/* SUMMARY & TOTAL */}
                      <View style={styles.cardTotalRow}>
                        <View>
                          <Text style={styles.totalMethod}>
                            {item.payment_method === "BANKING" ? "Chuyển khoản VietQR" : "Tiền mặt (COD)"} •{" "}
                            <Text style={{ color: isPaid ? "#16a34a" : "#b45309", fontWeight: "700" }}>
                              {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                            </Text>
                          </Text>
                          <Text style={styles.totalValue}>{formatVND(item.total_amount)}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.btnViewBill}
                          onPress={() => setSelectedInvoice(item)}
                        >
                          <Ionicons name="receipt-outline" size={16} color="#d97706" />
                          <Text style={styles.btnViewBillText}>Xem Hóa Đơn</Text>
                        </TouchableOpacity>
                      </View>

                      {/* CARD ACTIONS */}
                      {item.status === "pending" && (
                        <View style={styles.cardActionsRow}>
                          <TouchableOpacity
                            style={styles.cancelBtn}
                            disabled={cancellingId === item.id || confirmingId === item.id}
                            onPress={() => handleCancelOrder(item.id)}
                          >
                            {cancellingId === item.id ? (
                              <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                              <Text style={styles.cancelBtnText}>Hủy Đơn</Text>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.confirmPayBtn}
                            disabled={confirmingId === item.id || cancellingId === item.id}
                            onPress={() => handleConfirmPayment(item.id, orderCode)}
                          >
                            {confirmingId === item.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                                <Text style={styles.confirmPayBtnText}>Xác Nhận Đã CK</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* FULL DETAILED INVOICE MODAL */}
      <OrderInvoiceModal
        visible={!!selectedInvoice}
        order={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onCancelOrder={handleCancelOrder}
        onConfirmPayment={handleConfirmPayment}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#f9fafb",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "88%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1f2937",
  },
  headerSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1f2937",
    padding: 0,
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterTabActive: {
    backgroundColor: "#d97706",
    borderColor: "#d97706",
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterTabTextActive: {
    color: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6b7280",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },
  orderDate: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
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
  itemList: {
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemImg: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  itemQtyPrice: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 1,
  },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  cardTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 10,
    marginTop: 4,
  },
  totalMethod: {
    fontSize: 11,
    color: "#6b7280",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#d97706",
    marginTop: 2,
  },
  btnViewBill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fffbeb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  btnViewBillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d97706",
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fee2e2",
  },
  cancelBtnText: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 12,
  },
  confirmPayBtn: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#16a34a",
  },
  confirmPayBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
});
