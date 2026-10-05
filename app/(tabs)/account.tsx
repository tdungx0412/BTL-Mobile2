// app/(tabs)/account.tsx
import { OrderHistoryModal } from "@/components/order/OrderHistoryModal";
import { API_URL } from "@/constants/config";
import { useAuthStore } from "@/src/stores/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const formatVND = (num: number | string) => {
  const val = typeof num === "string" ? parseFloat(num) || 0 : num;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
};

export default function AccountScreen() {
  const router = useRouter();
  const { user, isLoading, logout, initAuth } = useAuthStore();
  const [showOrders, setShowOrders] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetch(`${API_URL}/orders/my-orders?userId=${user.id}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((orders: any[]) => {
          if (Array.isArray(orders)) {
            setOrderCount(orders.length);
            const sum = orders.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);
            setTotalSpent(sum);
          }
        })
        .catch(() => {});
    }
  }, [user?.id, showOrders]);

  const handleLogout = () => {
    Alert.alert("Xác nhận đăng xuất", "Bạn có chắc chắn muốn đăng xuất tài khoản?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/auth/login");
          } catch (error) {
            Alert.alert("Lỗi", "Không thể đăng xuất, vui lòng thử lại");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  if (!user) return null;

  const isCustomer = user.role !== "admin";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Tài Khoản</Text>

      {/* USER PROFILE CARD */}
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarBadge}>
            <Ionicons name="person" size={40} color="#d97706" />
          </View>
          <View style={[styles.roleBadge, !isCustomer && styles.adminRoleBadge]}>
            <Text style={[styles.roleText, !isCustomer && styles.adminRoleText]}>
              {isCustomer ? "KHÁCH HÀNG" : "QUẢN TRỊ VIÊN"}
            </Text>
          </View>
        </View>

        <Text style={styles.userName}>{user.full_name || user.username || "Khách Hàng"}</Text>
        <Text style={styles.userHandle}>@{user.username}</Text>

        {/* QUICK STATS FOR CUSTOMER */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="receipt" size={20} color="#d97706" />
            <Text style={styles.statVal}>{orderCount}</Text>
            <Text style={styles.statLabel}>Hóa đơn đã mua</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="cash" size={20} color="#16a34a" />
            <Text style={[styles.statVal, { color: "#16a34a" }]}>{formatVND(totalSpent)}</Text>
            <Text style={styles.statLabel}>Tổng tiền chi tiêu</Text>
          </View>
        </View>
      </View>

      {/* ACTIONS */}
      <Text style={styles.sectionHeader}>Quản Lý Mua Hàng</Text>

      {/* BUTTON: HÓA ĐƠN VÀ ĐƠN HÀNG */}
      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => setShowOrders(true)}
        activeOpacity={0.8}
      >
        <View style={styles.actionIconBox}>
          <Ionicons name="receipt-outline" size={24} color="#d97706" />
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Hóa Đơn & Đơn Mua Của Tôi</Text>
          <Text style={styles.actionDesc}>Xem chi tiết các sản phẩm, hóa đơn đã đặt mua</Text>
        </View>
        {orderCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{orderCount}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* BUTTON: KHÁM PHÁ SẢN PHẨM */}
      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => router.push("/(tabs)/explore")}
        activeOpacity={0.8}
      >
        <View style={[styles.actionIconBox, { backgroundColor: "#fef3c7" }]}>
          <Ionicons name="bag-handle-outline" size={24} color="#d97706" />
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Cửa Hàng Sản Phẩm Thủ Công</Text>
          <Text style={styles.actionDesc}>Khám phá túi cói, gốm sứ Bát Tràng, quà lưu niệm</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* BUTTON ĐĂNG XUẤT */}
      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.btnLogoutText}>Đăng Xuất Tài Khoản</Text>
      </TouchableOpacity>

      {/* MODAL LỊCH SỬ ĐƠN HÀNG & HÓA ĐƠN */}
      <OrderHistoryModal visible={showOrders} onClose={() => setShowOrders(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 16,
    color: "#1f2937",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
  },
  avatarBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fffbeb",
    borderWidth: 2,
    borderColor: "#fde68a",
    justifyContent: "center",
    alignItems: "center",
  },
  roleBadge: {
    marginTop: 8,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  adminRoleBadge: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  roleText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.5,
  },
  adminRoleText: {
    color: "#d97706",
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
    marginTop: 4,
  },
  userHandle: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e5e7eb",
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionCard: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fffbeb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  actionDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: "#d97706",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  countBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  btnLogout: {
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnLogoutText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
});
