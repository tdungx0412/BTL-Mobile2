// components/service/ServiceBookingModal.tsx
import { API_URL } from "@/constants/config";
import { useAuthStore } from "@/src/stores/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface ServiceItemData {
  id: number;
  name: string;
  price: number | string;
  image: string;
  description: string;
  category: string;
  duration_minutes?: number;
}

interface ServiceBookingModalProps {
  visible: boolean;
  service: ServiceItemData | null;
  onClose: () => void;
  onSuccess: (bookingCode: string) => void;
}

const formatVND = (num: number | string) => {
  const val = typeof num === "string" ? parseFloat(num) || 0 : num;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
};

export const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
  visible,
  service,
  onClose,
  onSuccess,
}) => {
  const user = useAuthStore((state) => state.user);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string>("Sáng mai (09:00 - 11:30)");
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANKING">("COD");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (user) {
        setCustomerName(user.full_name || "");
        setCustomerPhone(user.phone || "");
      }
      // Khởi tạo ngày hẹn mặc định là ngày mai
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      setAppointmentDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [visible, user]);

  if (!service) return null;

  const quickSlots = [
    "Hôm nay (Chiều 14:00 - 17:00)",
    "Sáng mai (09:00 - 11:30)",
    "Chiều mai (14:00 - 17:30)",
    "Tối mai (18:30 - 20:30)",
    "Cuối tuần này (Thứ 7 / CN)",
  ];

  const handleBooking = async () => {
    if (!customerName.trim()) {
      return Alert.alert("Thiếu thông tin", "Vui lòng nhập họ và tên của bạn");
    }
    if (!customerPhone.trim()) {
      return Alert.alert("Thiếu thông tin", "Vui lòng nhập số điện thoại để Eiko liên hệ xác nhận");
    }

    setSubmitting(true);
    try {
      const fullNote = [
        customerNote.trim() ? `Yêu cầu: ${customerNote.trim()}` : "",
        `Khung giờ mong muốn: ${selectedSlot}`,
      ]
        .filter(Boolean)
        .join(" | ");

      const payload = {
        user_id: user?.id || null,
        service_id: service.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim(),
        appointment_date: appointmentDate || new Date().toISOString(),
        customer_note: fullNote,
        payment_method: paymentMethod,
      };

      const res = await fetch(`${API_URL}/service-bookings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Lỗi đặt lịch (${res.status})`);
      }

      // Lưu booking ID vào local storage cho khách vãng lai
      if (data.id) {
        try {
          const raw = await AsyncStorage.getItem("@eiko_recent_service_booking_ids");
          const existing = raw ? JSON.parse(raw) : [];
          const updated = [data.id, ...existing.filter((x: number) => x !== data.id)].slice(0, 20);
          await AsyncStorage.setItem("@eiko_recent_service_booking_ids", JSON.stringify(updated));
        } catch (storageErr) {
          console.error("Lỗi lưu AsyncStorage booking id:", storageErr);
        }
      }

      onSuccess(data.booking_code || `DV-${data.id}`);
    } catch (err: any) {
      console.error("Lỗi đặt lịch dịch vụ:", err);
      Alert.alert("Đặt lịch thất bại", err.message || "Không thể kết nối đến máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="sparkles" size={24} color="#be185d" />
              <Text style={styles.headerTitle}>Đặt Dịch Vụ Handmade</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* SERVICE CARD SUMMARY */}
            <View style={styles.serviceCard}>
              <Image
                source={{
                  uri:
                    service.image ||
                    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80",
                }}
                style={styles.serviceThumb}
                resizeMode="cover"
              />
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName} numberOfLines={2}>
                  {service.name}
                </Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {service.description || "Dịch vụ thủ công theo yêu cầu riêng của quý khách"}
                </Text>
                <View style={styles.serviceMetaRow}>
                  <Text style={styles.servicePrice}>{formatVND(service.price)}</Text>
                  {service.duration_minutes ? (
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color="#be185d" />
                      <Text style={styles.durationText}>{service.duration_minutes} phút</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* CUSTOMER INFO */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Thông Tin Liên Hệ</Text>

              <Text style={styles.label}>Họ và tên người đặt *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Nguyễn Thị Hoa"
                placeholderTextColor="#9ca3af"
                value={customerName}
                onChangeText={setCustomerName}
              />

              <Text style={styles.label}>Số điện thoại nhận tư vấn & xác nhận *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 0987654321"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={customerPhone}
                onChangeText={setCustomerPhone}
              />

              <Text style={styles.label}>Địa chỉ giao nhận thành phẩm (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                placeholderTextColor="#9ca3af"
                value={customerAddress}
                onChangeText={setCustomerAddress}
              />
            </View>

            {/* TIME & SLOT SELECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏰ Thời Gian Mong Muốn</Text>

              <Text style={styles.label}>Ngày hẹn (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-10-05"
                placeholderTextColor="#9ca3af"
                value={appointmentDate}
                onChangeText={setAppointmentDate}
              />

              <Text style={styles.label}>Khung giờ thực hiện thuận tiện</Text>
              <View style={styles.slotGrid}>
                {quickSlots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotItem, isSelected && styles.slotItemActive]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "time-outline"}
                        size={15}
                        color={isSelected ? "#be185d" : "#6b7280"}
                      />
                      <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SPECIAL REQUESTS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Ghi Chú & Yêu Cầu Riêng</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ví dụ: Gói quà tone màu pastel, đính kèm thiệp chúc mừng sinh nhật, khắc tên 'Minh Thảo'..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={customerNote}
                onChangeText={setCustomerNote}
              />
            </View>

            {/* PAYMENT METHOD */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💳 Hình Thức Thanh Toán</Text>

              <TouchableOpacity
                style={[styles.paymentOption, paymentMethod === "COD" && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod("COD")}
              >
                <View style={styles.paymentRadio}>
                  {paymentMethod === "COD" && <View style={styles.radioDot} />}
                </View>
                <Ionicons name="cash-outline" size={24} color="#15803d" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentTitle}>Thanh toán khi nhận thành phẩm (COD)</Text>
                  <Text style={styles.paymentDesc}>Nhận hàng, kiểm tra sản phẩm ưng ý rồi thanh toán</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentOption, paymentMethod === "BANKING" && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod("BANKING")}
              >
                <View style={styles.paymentRadio}>
                  {paymentMethod === "BANKING" && <View style={styles.radioDot} />}
                </View>
                <Ionicons name="qr-code-outline" size={24} color="#be185d" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentTitle}>Chuyển khoản QR Ngân Hàng</Text>
                  <Text style={styles.paymentDesc}>Quét mã QR thanh toán nhanh chóng & tiện lợi</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* PRICE SUMMARY */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giá dịch vụ ước tính</Text>
                <Text style={styles.summaryValue}>{formatVND(service.price)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí tư vấn & thiết kế</Text>
                <Text style={[styles.summaryValue, { color: "#15803d" }]}>Miễn phí</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.totalValue}>{formatVND(service.price)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* FOOTER ACTION */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleBooking}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="calendar-outline" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Xác Nhận Đặt Dịch Vụ</Text>
                </>
              )}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    display: "flex",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  serviceCard: {
    flexDirection: "row",
    backgroundColor: "#fdf2f8",
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#fbcfe8",
    alignItems: "center",
    gap: 12,
  },
  serviceThumb: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 16,
    marginBottom: 6,
  },
  serviceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#dc2626",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fce7f3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  durationText: {
    fontSize: 11,
    color: "#be185d",
    fontWeight: "600",
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
  },
  textArea: {
    minHeight: 70,
  },
  slotGrid: {
    gap: 8,
    marginTop: 4,
  },
  slotItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  slotItemActive: {
    backgroundColor: "#fdf2f8",
    borderColor: "#be185d",
  },
  slotText: {
    fontSize: 13,
    color: "#4b5563",
  },
  slotTextActive: {
    color: "#be185d",
    fontWeight: "bold",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 10,
  },
  paymentOptionActive: {
    backgroundColor: "#fdf2f8",
    borderColor: "#be185d",
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#be185d",
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  paymentDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    marginTop: 6,
    marginBottom: 0,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1f2937",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#dc2626",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  submitBtn: {
    backgroundColor: "#be185d",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#be185d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
