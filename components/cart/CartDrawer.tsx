// components/cart/CartDrawer.tsx
import { API_URL } from "@/constants/config";
import { useCartStore } from "@/src/stores/useCartStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckoutModal } from "../order/CheckoutModal";

interface CartDrawerProps {
  visible: boolean;
  onClose: () => void;
  onOrderSuccess: (orderCode: string) => void;
}

const formatVND = (num: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
};

export const CartDrawer: React.FC<CartDrawerProps> = ({ visible, onClose, onOrderSuccess }) => {
  const {
    items,
    voucher,
    updateQuantity,
    removeFromCart,
    applyVoucher,
    removeVoucher,
    getSubtotal,
    getDiscountAmount,
    getShippingFee,
    getTotalAmount,
  } = useCartStore();

  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const shipping = getShippingFee();
  const totalAmount = getTotalAmount();

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) {
      return Alert.alert("Thông báo", "Vui lòng nhập mã giảm giá");
    }

    setCheckingVoucher(true);
    try {
      const res = await fetch(`${API_URL}/vouchers/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voucherCodeInput.trim(),
          order_amount: subtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Mã giảm giá không hợp lệ");
      }

      applyVoucher({
        id: data.data.id,
        code: data.data.code,
        discount_type: data.data.discount_type,
        discount_amount: data.data.discount_amount,
        description: data.data.message,
      });

      Alert.alert("Thành công 🎉", `Đã áp dụng mã "${data.data.code}", giảm ${formatVND(data.data.discount_amount)}`);
      setVoucherCodeInput("");
    } catch (err: any) {
      Alert.alert("Áp mã thất bại", err.message || "Mã không hợp lệ hoặc đã hết lượt");
    } finally {
      setCheckingVoucher(false);
    }
  };

  return (
    <>
      <Modal visible={visible && !showCheckout} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* HEADER */}
            <View style={styles.header}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="cart" size={24} color="#d97706" />
                <Text style={styles.headerTitle}>Giỏ Hàng ({items.length})</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="bag-handle-outline" size={70} color="#d1d5db" />
                <Text style={styles.emptyTitle}>Giỏ hàng của bạn đang trống</Text>
                <Text style={styles.emptySub}>Hãy thêm các món đồ thủ công tinh xảo vào giỏ nhé!</Text>
                <TouchableOpacity style={styles.shopNowBtn} onPress={onClose}>
                  <Text style={styles.shopNowBtnText}>Khám Phá Sản Phẩm</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* LIST SẢN PHẨM */}
                <FlatList
                  data={items}
                  keyExtractor={(item) => (item.id || item.product_id || Math.random()).toString()}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={styles.itemRow}>
                      {item.image && (
                        <Image source={{ uri: item.image }} style={styles.itemImg} resizeMode="cover" />
                      )}
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemPrice}>{formatVND(item.price)}</Text>
                        <Text style={styles.itemStock}>Kho còn: {item.stock}</Text>
                      </View>

                      {/* TĂNG / GIẢM / XÓA */}
                      <View style={styles.itemActions}>
                        <View style={styles.qtyControl}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateQuantity(item.id || item.product_id || 0, -1)}
                          >
                            <Ionicons name="remove" size={16} color="#4b5563" />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateQuantity(item.id || item.product_id || 0, 1)}
                          >
                            <Ionicons name="add" size={16} color="#4b5563" />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => removeFromCart(item.id || item.product_id || 0)}
                        >
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />

                {/* VOUCHER & TỔNG TIỀN */}
                <View style={styles.billSection}>
                  {/* Ô NHẬP VOUCHER */}
                  {voucher ? (
                    <View style={styles.activeVoucherBadge}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                        <Ionicons name="ticket" size={18} color="#16a34a" />
                        <Text style={styles.activeVoucherText}>
                          Mã: <Text style={{ fontWeight: "800" }}>{voucher.code}</Text> (-{formatVND(voucher.discount_amount)})
                        </Text>
                      </View>
                      <TouchableOpacity onPress={removeVoucher}>
                        <Ionicons name="close-circle" size={20} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.voucherInputRow}>
                      <TextInput
                        style={styles.voucherInput}
                        placeholder="Nhập mã ưu đãi (VD: EIKOCHAO)"
                        placeholderTextColor="#9ca3af"
                        value={voucherCodeInput}
                        onChangeText={setVoucherCodeInput}
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity
                        style={styles.applyBtn}
                        disabled={checkingVoucher}
                        onPress={handleApplyVoucher}
                      >
                        {checkingVoucher ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.applyBtnText}>Áp dụng</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* SUMMARY */}
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLineLabel}>Tạm tính:</Text>
                    <Text style={styles.summaryLineValue}>{formatVND(subtotal)}</Text>
                  </View>
                  {discount > 0 && (
                    <View style={styles.summaryLine}>
                      <Text style={[styles.summaryLineLabel, { color: "#16a34a" }]}>Giảm giá:</Text>
                      <Text style={[styles.summaryLineValue, { color: "#16a34a" }]}>-{formatVND(discount)}</Text>
                    </View>
                  )}
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLineLabel}>Phí giao hàng:</Text>
                    <Text style={styles.summaryLineValue}>
                      {shipping === 0 ? "Miễn phí (Đơn > 300k)" : formatVND(shipping)}
                    </Text>
                  </View>
                  <View style={[styles.summaryLine, styles.totalLine]}>
                    <Text style={styles.totalLineLabel}>Tổng cộng:</Text>
                    <Text style={styles.totalLineValue}>{formatVND(totalAmount)}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.checkoutBtn}
                    onPress={() => setShowCheckout(true)}
                  >
                    <Text style={styles.checkoutBtnText}>Tiến Hành Đặt Hàng</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* CHECKOUT MODAL LỒNG VÀO */}
      <CheckoutModal
        visible={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={(code) => {
          setShowCheckout(false);
          onClose();
          onOrderSuccess(code);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
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
    marginBottom: 24,
  },
  shopNowBtn: {
    backgroundColor: "#d97706",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopNowBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  listContent: {
    padding: 16,
  },
  itemRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    alignItems: "center",
  },
  itemImg: {
    width: 65,
    height: 65,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#d97706",
    marginTop: 4,
  },
  itemStock: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  itemActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 2,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 8,
    color: "#1f2937",
  },
  deleteBtn: {
    padding: 4,
  },
  billSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fafafa",
  },
  voucherInputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  voucherInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: "#1f2937",
  },
  applyBtn: {
    backgroundColor: "#4b5563",
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  applyBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  activeVoucherBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  activeVoucherText: {
    fontSize: 13,
    color: "#166534",
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLineLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  summaryLineValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  totalLine: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  totalLineLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },
  totalLineValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#d97706",
  },
  checkoutBtn: {
    backgroundColor: "#d97706",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
