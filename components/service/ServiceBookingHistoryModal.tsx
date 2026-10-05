// components/service/ServiceBookingHistoryModal.tsx
import { API_URL } from "@/constants/config";
import { useAuthStore } from "@/src/stores/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ServiceBookingHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

const formatVND = (num: number | string) => {
  const val = typeof num === "string" ? parseFloat(num) || 0 : num;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return { label: "Chờ xác nhận", bg: "#fef3c7", text: "#b45309", icon: "time-outline" as const };
    case "confirmed":
      return { label: "Đã xác nhận", bg: "#dcfce7", text: "#15803d", icon: "checkmark-circle" as const };
    case "in_progress":
      return { label: "Đang thực hiện", bg: "#e0e7ff", text: "#4338ca", icon: "brush-outline" as const };
    case "completed":
      return { label: "Hoàn tất", bg: "#dcfce7", text: "#15803d", icon: "checkmark-done-circle" as const };
    case "cancelled":
      return { label: "Đã hủy", bg: "#fee2e2", text: "#b91c1c", icon: "close-circle-outline" as const };
    default:
      return { label: status, bg: "#f3f4f6", text: "#4b5563", icon: "help-circle-outline" as const };
  }
};

export const ServiceBookingHistoryModal: React.FC<ServiceBookingHistoryModalProps> = ({
  visible,
  onClose,
}) => {
  const user = useAuthStore((state) => state.user);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const fetchBookings = async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      let url = "";
      if (user?.id) {
        url = `${API_URL}/service-bookings/my-bookings?userId=${user.id}`;
      } else {
        const raw = await AsyncStorage.getItem("@eiko_recent_service_booking_ids");
        const ids = raw ? JSON.parse(raw) : [];
        if (ids.length > 0) {
          url = `${API_URL}/service-bookings/my-bookings?ids=${ids.join(",")}`;
        }
      }

      if (url) {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setBookings(Array.isArray(data) ? data : []);
        } else {
          setBookings([]);
        }
      } else {
        setBookings([]);
      }
    } catch (e) {
      console.error("Lỗi lấy lịch sử đặt dịch vụ:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchBookings();
    }
  }, [visible, user?.id]);

  const handleCancelBooking = (bookingId: number, code: string) => {
    Alert.alert(
      "Xác nhận hủy lịch",
      `Bạn có chắc chắn muốn hủy lịch hẹn dịch vụ #${code || bookingId}?`,
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Hủy Lịch",
          style: "destructive",
          onPress: async () => {
            setCancellingId(bookingId);
            try {
              const res = await fetch(`${API_URL}/service-bookings/${bookingId}/cancel`, {
                method: "POST",
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert("Thành công 🎉", data.message || "Đã hủy lịch hẹn");
                fetchBookings();
              } else {
                Alert.alert("Lỗi", data.message || "Không thể hủy lịch hẹn");
              }
            } catch (err: any) {
              Alert.alert("Lỗi kết nối", err.message);
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const handleConfirmPayment = (bookingId: number, code: string) => {
    Alert.alert(
      "Xác nhận thanh toán dịch vụ",
      `Bạn có chắc chắn muốn xác nhận đã thanh toán cho mã dịch vụ ${code || `#${bookingId}`}?\nTrạng thái sẽ chuyển từ "Chờ xác nhận" sang "Đã xác nhận".`,
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Xác Nhận",
          onPress: async () => {
            setConfirmingId(bookingId);
            try {
              const res = await fetch(`${API_URL}/service-bookings/${bookingId}/confirm-payment`, {
                method: "POST",
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert("Thành công 🎉", data.message || "Đã xác nhận thanh toán dịch vụ!");
                fetchBookings();
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

  const renderBookingItem = ({ item }: { item: any }) => {
    const badge = getStatusBadge(item.status);
    const isPending = item.status === "pending";
    const isCancelling = cancellingId === item.id;
    const isConfirming = confirmingId === item.id;

    return (
      <View style={styles.card}>
        {/* TOP ROW: CODE & STATUS */}
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="sparkles-outline" size={16} color="#be185d" />
            <Text style={styles.bookingCode}>{item.booking_code || `DV-${item.id}`}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.icon} size={13} color={badge.text} />
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* SERVICE INFO ROW */}
        <View style={styles.serviceRow}>
          <Image
            source={{
              uri:
                item.service_image ||
                "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80",
            }}
            style={styles.serviceImg}
            resizeMode="cover"
          />
          <View style={styles.serviceMeta}>
            <Text style={styles.serviceName} numberOfLines={2}>
              {item.service_name || "Dịch vụ thủ công Eiko"}
            </Text>
            <View style={styles.infoLine}>
              <Ionicons name="calendar-outline" size={13} color="#6b7280" />
              <Text style={styles.infoText}>Ngày hẹn: {formatDate(item.appointment_date)}</Text>
            </View>
            <View style={styles.infoLine}>
              <Ionicons name="person-outline" size={13} color="#6b7280" />
              <Text style={styles.infoText}>
                {item.customer_name} ({item.customer_phone})
              </Text>
            </View>
          </View>
        </View>

        {/* NOTE OR ADDRESS IF ANY */}
        {item.customer_note ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>Ghi chú:</Text>
            <Text style={styles.noteContent}>{item.customer_note}</Text>
          </View>
        ) : null}

        {item.customer_address ? (
          <View style={styles.addressBox}>
            <Ionicons name="location-outline" size={13} color="#6b7280" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.customer_address}
            </Text>
          </View>
        ) : null}

        {/* FOOTER ROW: PRICE & ACTION */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>Giá dịch vụ</Text>
            <Text style={styles.priceValue}>{formatVND(item.estimated_price)}</Text>
            <Text
              style={[
                styles.payStatus,
                { color: item.payment_status === "paid" ? "#15803d" : "#b45309" },
              ]}
            >
              {item.payment_status === "paid" ? "● Đã thanh toán" : "○ Chưa thanh toán"}
            </Text>
          </View>

          {isPending && (
            <View style={styles.actionButtonGroup}>
              <TouchableOpacity
                style={styles.confirmPayBtn}
                onPress={() => handleConfirmPayment(item.id, item.booking_code)}
                disabled={isConfirming || isCancelling}
              >
                {isConfirming ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={14} color="#fff" />
                    <Text style={styles.confirmPayText}>Xác Nhận Đã Trả Tiền</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancelBooking(item.id, item.booking_code)}
                disabled={isConfirming || isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <Text style={styles.cancelText}>Hủy Lịch</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="calendar" size={24} color="#be185d" />
              <Text style={styles.headerTitle}>Lịch Đặt Dịch Vụ Của Bạn</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#be185d" />
              <Text style={styles.loadingText}>Đang tải lịch hẹn dịch vụ...</Text>
            </View>
          ) : bookings.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="calendar-outline" size={60} color="#d1d5db" />
              <Text style={styles.emptyTitle}>Chưa có lịch đặt dịch vụ nào</Text>
              <Text style={styles.emptySub}>
                {user?.id
                  ? "Khi bạn đặt các dịch vụ như Gói quà, DIY Kit, Thư pháp..., lịch hẹn sẽ hiển thị tại đây."
                  : "Bạn chưa đăng nhập. Hãy đăng nhập để lưu trữ và quản lý đồng bộ tất cả lịch hẹn dịch vụ của bạn."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={bookings}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => fetchBookings(true)}
                  colors={["#be185d"]}
                />
              }
              renderItem={renderBookingItem}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#f9fafb",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#be185d",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
    paddingBottom: 10,
    marginBottom: 10,
  },
  bookingCode: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#be185d",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  serviceRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  serviceImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  serviceMeta: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  infoText: {
    fontSize: 12,
    color: "#6b7280",
  },
  noteBox: {
    backgroundColor: "#fdf2f8",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#be185d",
  },
  noteTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#be185d",
    marginBottom: 2,
  },
  noteContent: {
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 16,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  addressText: {
    fontSize: 12,
    color: "#6b7280",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  priceLabel: {
    fontSize: 11,
    color: "#9ca3af",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#dc2626",
    marginTop: 2,
  },
  payStatus: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  actionButtonGroup: {
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-end",
  },
  confirmPayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#15803d",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confirmPayText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fee2e2",
    backgroundColor: "#fff",
  },
  cancelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#dc2626",
  },
});
