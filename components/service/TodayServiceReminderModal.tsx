// components/service/TodayServiceReminderModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TodayServiceReminderModalProps {
  visible: boolean;
  onClose: () => void;
  bookings: any[];
  isAdmin?: boolean;
  onOpenHistory?: () => void;
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

export const TodayServiceReminderModal: React.FC<TodayServiceReminderModalProps> = ({
  visible,
  onClose,
  bookings,
  isAdmin = false,
  onOpenHistory,
}) => {
  if (!bookings || bookings.length === 0) return null;

  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications" size={26} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.badgeText}>THÔNG BÁO TỚI NGÀY HẸN</Text>
                <View style={styles.badgePulse} />
              </View>
              <Text style={styles.title}>
                {isAdmin
                  ? `Hôm nay có ${bookings.length} lịch hẹn dịch vụ!`
                  : `Hôm nay bạn có ${bookings.length} lịch hẹn dịch vụ!`}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.btnClose}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            {isAdmin
              ? "Dưới đây là danh sách khách hàng đặt lịch dịch vụ có ngày hẹn là hôm nay. Vui lòng chuẩn bị nhân sự và đồ nghề để phục vụ chu đáo:"
              : "Hôm nay đã đến ngày hẹn thực hiện dịch vụ của bạn tại Eiko Handcraft. Chúc bạn có trải nghiệm thật tuyệt vời!"}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
            {bookings.map((item, index) => (
              <View key={item.id || index} style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    {item.service_image ? (
                      <Image source={{ uri: item.service_image }} style={styles.serviceThumb} />
                    ) : (
                      <View style={styles.servicePlaceholder}>
                        <Ionicons name="sparkles" size={18} color="#d97706" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName} numberOfLines={1}>
                        {item.service_name || "Dịch vụ thủ công"}
                      </Text>
                      <Text style={styles.bookingCode}>Mã: {item.booking_code || `#${item.id}`}</Text>
                    </View>
                  </View>
                  <View style={styles.todayPill}>
                    <Ionicons name="calendar" size={12} color="#b45309" />
                    <Text style={styles.todayPillText}>HÔM NAY</Text>
                  </View>
                </View>

                {/* DETAILS */}
                <View style={styles.detailsBox}>
                  {isAdmin && (
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={15} color="#6b7280" />
                      <Text style={styles.detailLabel}>Khách hàng:</Text>
                      <Text style={styles.detailValBold}>
                        {item.customer_name} ({item.customer_phone})
                      </Text>
                      {item.customer_phone ? (
                        <TouchableOpacity
                          onPress={() => handleCall(item.customer_phone)}
                          style={styles.btnCall}
                        >
                          <Ionicons name="call" size={13} color="#fff" />
                          <Text style={styles.btnCallText}>Gọi</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={15} color="#6b7280" />
                    <Text style={styles.detailLabel}>Ngày hẹn:</Text>
                    <Text style={styles.detailValHighlight}>
                      Hôm nay ({formatDate(item.appointment_date)})
                    </Text>
                  </View>

                  {item.customer_note ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text-outline" size={15} color="#6b7280" />
                      <Text style={styles.detailLabel}>Chi tiết / Khung giờ:</Text>
                      <Text style={styles.detailVal} numberOfLines={2}>
                        {item.customer_note}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={15} color="#6b7280" />
                    <Text style={styles.detailLabel}>Tạm tính:</Text>
                    <Text style={styles.priceVal}>{formatVND(item.estimated_price)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* ACTIONS */}
          <View style={styles.actionRow}>
            {onOpenHistory && (
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => {
                  onClose();
                  onOpenHistory();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.btnSecondaryText}>Xem Tất Cả Lịch Hẹn</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.btnPrimary} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.btnPrimaryText}>Đã Nhận Thông Báo</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    width: "100%",
    maxWidth: 440,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fffbeb",
    borderWidth: 2,
    borderColor: "#fde68a",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#b45309",
    letterSpacing: 0.5,
  },
  badgePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ea580c",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1f2937",
    marginTop: 2,
  },
  btnClose: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  subtitle: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
    marginBottom: 16,
  },
  bookingCard: {
    backgroundColor: "#fffdf5",
    borderWidth: 1.5,
    borderColor: "#fde68a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#fef3c7",
  },
  serviceThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  servicePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },
  bookingCode: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  todayPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  todayPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#b45309",
  },
  detailsBox: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  detailValBold: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1f2937",
  },
  detailValHighlight: {
    fontSize: 12,
    fontWeight: "800",
    color: "#b45309",
  },
  detailVal: {
    fontSize: 12,
    color: "#4b5563",
    flex: 1,
  },
  priceVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#15803d",
  },
  btnCall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#16a34a",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  btnCallText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  btnSecondaryText: {
    color: "#4b5563",
    fontSize: 13,
    fontWeight: "700",
  },
  btnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#d97706",
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
});
