// components/order/CheckoutModal.tsx
import { API_URL, BASE_URL } from "@/constants/config";
import { useAuthStore } from "@/src/stores/useAuthStore";
import { useCartStore } from "@/src/stores/useCartStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
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
import { OrderInvoiceModal } from "./OrderInvoiceModal";

export interface CheckoutDirectItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CheckoutModalProps {
  visible: boolean;
  directItem?: CheckoutDirectItem | null;
  onClose: () => void;
  onSuccess: (orderCode: string) => void;
}

const formatVND = (num: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  directItem,
  onClose,
  onSuccess,
}) => {
  const user = useAuthStore((state) => state.user);
  const {
    items: cartItems,
    voucher,
    getSubtotal,
    getDiscountAmount,
    getShippingFee,
    getTotalAmount,
    clearCart,
  } = useCartStore();

  const [customerName, setCustomerName] = useState(user?.full_name || user?.username || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANKING">("COD");
  const [submitting, setSubmitting] = useState(false);

  // Success modal state
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Determine items and pricing based on whether directItem is present
  const itemsToBuy = directItem
    ? [
        {
          id: directItem.id,
          name: directItem.name,
          price: directItem.price,
          quantity: directItem.quantity,
          image: directItem.image,
        },
      ]
    : cartItems;

  const subtotal = directItem
    ? directItem.price * directItem.quantity
    : getSubtotal();
  const discount = directItem ? 0 : getDiscountAmount();
  const shipping = subtotal > 300000 ? 0 : 25000;
  const totalAmount = Math.max(0, subtotal - discount + shipping);

  const qrUrl = `https://img.vietqr.io/image/MB-0971410870-compact2.png?amount=${Math.round(totalAmount)}&addInfo=EIKO%20ORDER`;

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      return Alert.alert("Thiếu thông tin", "Vui lòng nhập họ và tên người nhận");
    }
    if (!phone.trim()) {
      return Alert.alert("Thiếu thông tin", "Vui lòng nhập số điện thoại giao hàng");
    }
    if (!address.trim()) {
      return Alert.alert("Thiếu thông tin", "Vui lòng nhập địa chỉ nhận hàng");
    }
    if (itemsToBuy.length === 0) {
      return Alert.alert("Lỗi", "Không có sản phẩm nào để thanh toán");
    }

    setSubmitting(true);
    try {
      const payload = {
        user_id: user?.id,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        payment_method: paymentMethod,
        note: note.trim(),
        voucher_code: directItem ? undefined : voucher?.code,
        items: itemsToBuy.map((i: any) => ({
          product_id: i.id || i.product_id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      };

      const res = await fetch(`${API_URL}/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Lỗi đặt hàng (${res.status})`);
      }

      if (data.id) {
        try {
          const raw = await AsyncStorage.getItem("@eiko_recent_order_ids");
          const existing = raw ? JSON.parse(raw) : [];
          const updated = [data.id, ...existing.filter((x: number) => x !== data.id)].slice(0, 20);
          await AsyncStorage.setItem("@eiko_recent_order_ids", JSON.stringify(updated));
        } catch {}
      }

      if (!directItem) {
        clearCart();
      }

      // Save completed order data for the success modal
      setCompletedOrder({
        ...data,
        items: itemsToBuy,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        payment_method: paymentMethod,
        total_amount: totalAmount,
        subtotal,
        discount_amount: discount,
        shipping_fee: shipping,
      });
    } catch (err: any) {
      console.error("Lỗi đặt hàng:", err);
      Alert.alert("Đặt hàng thất bại", err.message || "Không thể kết nối đến máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishSuccess = () => {
    const code = completedOrder?.order_code || `EIKO-${completedOrder?.id}`;
    setCompletedOrder(null);
    onClose();
    onSuccess(code);
  };

  return (
    <>
      <Modal visible={visible && !completedOrder} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* HEADER */}
            <View style={styles.header}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="card" size={22} color="#d97706" />
                <Text style={styles.headerTitle}>Thanh Toán & Mua Hàng</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* TỔNG QUAN ĐƠN HÀNG */}
              <View style={styles.orderSummaryCard}>
                <Text style={styles.summaryTitle}>Đơn hàng ({itemsToBuy.length} sản phẩm)</Text>

                {itemsToBuy.map((it: any, idx: number) => {
                  let imgUri = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80";
                  if (it.image) {
                    imgUri = it.image.startsWith("http") ? it.image : `${BASE_URL}${it.image}`;
                  }
                  return (
                    <View key={idx} style={styles.itemSummaryRow}>
                      <Image source={{ uri: imgUri }} style={styles.itemThumb} />
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.itemSummaryName} numberOfLines={1}>
                          {it.name}
                        </Text>
                        <Text style={styles.itemSummaryQty}>Số lượng: x{it.quantity}</Text>
                      </View>
                      <Text style={styles.itemSummaryPrice}>{formatVND(it.price * it.quantity)}</Text>
                    </View>
                  );
                })}

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tạm tính:</Text>
                  <Text style={styles.summaryValue}>{formatVND(subtotal)}</Text>
                </View>
                {discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: "#16a34a" }]}>Giảm giá voucher:</Text>
                    <Text style={[styles.summaryValue, { color: "#16a34a" }]}>-{formatVND(discount)}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Phí giao hàng:</Text>
                  <Text style={styles.summaryValue}>{shipping === 0 ? "Miễn phí" : formatVND(shipping)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                  <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                  <Text style={styles.totalValue}>{formatVND(totalAmount)}</Text>
                </View>
              </View>

              {/* THÔNG TIN NGƯỜI NHẬN */}
              <Text style={styles.sectionHeading}>Thông tin nhận hàng</Text>
              <TextInput
                style={styles.input}
                placeholder="Họ và tên người nhận *"
                placeholderTextColor="#9ca3af"
                value={customerName}
                onChangeText={setCustomerName}
              />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại nhận hàng *"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Địa chỉ giao hàng (Số nhà, đường, phường, quận...)*"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                value={address}
                onChangeText={setAddress}
              />
              <TextInput
                style={styles.input}
                placeholder="Ghi chú giao hàng (giao giờ hành chính, gọi trước...)"
                placeholderTextColor="#9ca3af"
                value={note}
                onChangeText={setNote}
              />

              {/* PHƯƠNG THỨC THANH TOÁN */}
              <Text style={styles.sectionHeading}>Phương thức thanh toán</Text>
              <View style={styles.paymentOptions}>
                <TouchableOpacity
                  style={[styles.payOption, paymentMethod === "COD" && styles.payOptionActive]}
                  onPress={() => setPaymentMethod("COD")}
                >
                  <Ionicons
                    name={paymentMethod === "COD" ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={paymentMethod === "COD" ? "#d97706" : "#9ca3af"}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.payOptionTitle}>Thanh toán khi nhận hàng (COD)</Text>
                    <Text style={styles.payOptionSub}>Kiểm tra hàng rồi thanh toán tiền mặt</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.payOption, paymentMethod === "BANKING" && styles.payOptionActive]}
                  onPress={() => setPaymentMethod("BANKING")}
                >
                  <Ionicons
                    name={paymentMethod === "BANKING" ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={paymentMethod === "BANKING" ? "#d97706" : "#9ca3af"}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.payOptionTitle}>Chuyển khoản Ngân hàng (VietQR)</Text>
                    <Text style={styles.payOptionSub}>Quét mã QR tiện lợi, duyệt nhanh</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* CHI TIẾT NGÂN HÀNG NẾU CHỌN BANKING */}
              {paymentMethod === "BANKING" && (
                <View style={styles.bankingPreviewBox}>
                  <Text style={styles.bankingPreviewTitle}>Thông Tin Chuyển Khoản Ngân Hàng:</Text>
                  <Text style={styles.bankingPreviewText}>• Ngân hàng: <Text style={{ fontWeight: "700" }}>MB Bank (Quân Đội)</Text></Text>
                  <Text style={styles.bankingPreviewText}>• STK: <Text style={{ fontWeight: "700", color: "#d97706" }}>0971410870</Text></Text>
                  <Text style={styles.bankingPreviewText}>• Chủ TK: <Text style={{ fontWeight: "700" }}>TRAN TRUNG DUNG</Text></Text>
                  <Text style={styles.bankingPreviewText}>• Số tiền: <Text style={{ fontWeight: "700", color: "#d97706" }}>{formatVND(totalAmount)}</Text></Text>
                  <View style={styles.qrMiniContainer}>
                    <Image source={{ uri: qrUrl }} style={styles.qrMiniImage} resizeMode="contain" />
                    <Text style={styles.qrMiniHint}>Quét mã để chuyển khoản nhanh sau khi đặt hàng</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* FOOTER NÚT BẤM */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                disabled={submitting}
                onPress={handleCheckout}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.submitBtnText}>Xác Nhận Đặt Hàng ({formatVND(totalAmount)})</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POPUP THÀNH CÔNG VỚI LỰA CHỌN XEM HÓA ĐƠN */}
      {completedOrder && (
        <Modal visible={!!completedOrder} animationType="fade" transparent>
          <View style={styles.successOverlay}>
            <View style={styles.successCard}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={40} color="#fff" />
              </View>

              <Text style={styles.successTitle}>Đặt Hàng Thành Công! 🎉</Text>
              <Text style={styles.successCode}>Mã hóa đơn: {completedOrder.order_code || `EIKO-${completedOrder.id}`}</Text>

              <View style={styles.successDetailsBox}>
                <View style={styles.successLine}>
                  <Text style={styles.successLabel}>Khách hàng:</Text>
                  <Text style={styles.successVal}>{completedOrder.customer_name}</Text>
                </View>
                <View style={styles.successLine}>
                  <Text style={styles.successLabel}>Số điện thoại:</Text>
                  <Text style={styles.successVal}>{completedOrder.phone}</Text>
                </View>
                <View style={styles.successLine}>
                  <Text style={styles.successLabel}>Tổng thanh toán:</Text>
                  <Text style={[styles.successVal, { color: "#d97706", fontWeight: "800", fontSize: 16 }]}>
                    {formatVND(completedOrder.total_amount)}
                  </Text>
                </View>
                <View style={styles.successLine}>
                  <Text style={styles.successLabel}>Hình thức:</Text>
                  <Text style={styles.successVal}>
                    {completedOrder.payment_method === "BANKING" ? "Chuyển khoản VietQR" : "Tiền mặt (COD)"}
                  </Text>
                </View>
              </View>

              {/* NẾU CHUYỂN KHOẢN: HIỆN QR ĐỂ KHÁCH QUÉT LUÔN */}
              {completedOrder.payment_method === "BANKING" && (
                <View style={styles.successQrBox}>
                  <Text style={styles.successQrTitle}>Mã QR Chuyển Khoản Ngân Hàng:</Text>
                  <Image
                    source={{
                      uri: `https://img.vietqr.io/image/MB-0971410870-compact2.png?amount=${Math.round(
                        completedOrder.total_amount
                      )}&addInfo=${encodeURIComponent(completedOrder.order_code)}`,
                    }}
                    style={styles.successQrImg}
                    resizeMode="contain"
                  />
                  <Text style={styles.successQrSub}>MB Bank: 0971410870 • TRAN TRUNG DUNG</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.btnViewInvoice}
                onPress={() => setShowInvoiceModal(true)}
              >
                <Ionicons name="receipt-outline" size={18} color="#fff" />
                <Text style={styles.btnViewInvoiceText}>Xem Hóa Đơn Chi Tiết</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnContinueShop} onPress={handleFinishSuccess}>
                <Text style={styles.btnContinueShopText}>Tiếp Tục Mua Sắm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* FULL INVOICE MODAL CHO ĐƠN VỪA TẠO */}
      {completedOrder && (
        <OrderInvoiceModal
          visible={showInvoiceModal}
          order={completedOrder}
          onClose={() => {
            setShowInvoiceModal(false);
            handleFinishSuccess();
          }}
          onConfirmPayment={async (orderId) => {
            try {
              await fetch(`${API_URL}/orders/${orderId}/confirm-payment`, { method: "POST" });
              Alert.alert("Thành công 🎉", "Đã xác nhận thanh toán đơn hàng!");
              setCompletedOrder({ ...completedOrder, status: "confirmed", payment_status: "paid" });
            } catch (e: any) {
              Alert.alert("Lỗi", e.message);
            }
          }}
        />
      )}
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
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    minHeight: "75%",
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
    fontWeight: "800",
    color: "#1f2937",
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  orderSummaryCard: {
    backgroundColor: "#fffbeb",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 12,
  },
  itemSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#fed7aa",
    marginRight: 10,
  },
  itemSummaryName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  itemSummaryQty: {
    fontSize: 11,
    color: "#6b7280",
  },
  itemSummaryPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#b45309",
  },
  divider: {
    height: 1,
    backgroundColor: "#fef3c7",
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#78350f",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#78350f",
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(146, 64, 14, 0.2)",
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#92400e",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#d97706",
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },
  paymentOptions: {
    marginBottom: 16,
    gap: 10,
  },
  payOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  payOptionActive: {
    borderColor: "#d97706",
    backgroundColor: "#fffbeb",
  },
  payOptionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  payOptionSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  bankingPreviewBox: {
    backgroundColor: "#f0f9ff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  bankingPreviewTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0369a1",
    marginBottom: 6,
  },
  bankingPreviewText: {
    fontSize: 12,
    color: "#334155",
    marginBottom: 3,
  },
  qrMiniContainer: {
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
  },
  qrMiniImage: {
    width: 160,
    height: 160,
  },
  qrMiniHint: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  submitBtn: {
    backgroundColor: "#d97706",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#d1d5db",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // SUCCESS OVERLAY
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 6,
  },
  successCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#d97706",
    marginBottom: 16,
  },
  successDetailsBox: {
    backgroundColor: "#f9fafb",
    width: "100%",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  successLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  successLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  successVal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  successQrBox: {
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#f0f9ff",
    padding: 10,
    borderRadius: 12,
    width: "100%",
  },
  successQrTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0369a1",
    marginBottom: 6,
  },
  successQrImg: {
    width: 170,
    height: 170,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  successQrSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 6,
    fontWeight: "600",
  },
  btnViewInvoice: {
    backgroundColor: "#d97706",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    gap: 8,
    marginBottom: 10,
  },
  btnViewInvoiceText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  btnContinueShop: {
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
  },
  btnContinueShopText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
});
