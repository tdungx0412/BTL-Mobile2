// app/(tabs)/account.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface UserInfo {
  username?: string;
  full_name?: string;
  role?: string;
}

// ✅ BIẾN CẤP MODULE (TOP-LEVEL)
// Theo tài liệu React: "Some logic should only run once when the app loads".
// Biến này giúp cache thông tin user để tránh gọi AsyncStorage liên tục mỗi khi chuyển tab.
let cachedUserInfo: UserInfo | null = null;

export default function AccountScreen() {
  const router = useRouter();

  // Khởi tạo state từ cache nếu có
  const [userInfo, setUserInfo] = useState<UserInfo | null>(cachedUserInfo);
  const [isReady, setIsReady] = useState(!!cachedUserInfo);

  // Logic khởi tạo: Chỉ chạy 1 lần duy nhất nếu chưa có cache
  useEffect(() => {
    if (cachedUserInfo) return; // Đã check rồi thì thoát sớm

    const loadUser = async () => {
      try {
        const tokenStr = await AsyncStorage.getItem("userToken");
        if (tokenStr) {
          const parsed = JSON.parse(tokenStr);
          cachedUserInfo = parsed; // Lưu vào biến global
          setUserInfo(parsed); // Cập nhật state
        } else {
          // Nếu chưa login, đá về trang login
          router.replace("/auth/login");
        }
      } catch (err) {
        console.error("Load user error:", err);
      } finally {
        setIsReady(true);
      }
    };

    loadUser();
  }, []);

  // ✅ HÀM ĐĂNG XUẤT CHUẨN & AN TOÀN
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");

      // Reset cache role
      // (Nếu bạn export biến cachedRole ra thì dùng, không thì reload là cách nhanh nhất)

      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
        window.location.reload(); // Tải lại trang để reset _layout.tsx
      } else {
        router.replace("/auth/login");
      }
    } catch (error) {
      alert("Lỗi đăng xuất");
    }
  };

  // Nếu chưa sẵn sàng, hiển thị loading
  if (!isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  // Nếu không có user (đã bị redirect ở trên), return null để tránh flash nội dung
  if (!userInfo) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tài Khoản</Text>

      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#d97706" />
        </View>

        <Text style={styles.label}>Tên đăng nhập:</Text>
        <Text style={styles.value}>{userInfo.username || "---"}</Text>

        <Text style={styles.label}>Quyền hạn:</Text>
        <Text
          style={[styles.value, userInfo.role === "admin" && styles.adminRole]}
        >
          {userInfo.role === "admin" ? "QUẢN TRỊ VIÊN" : "KHÁCH HÀNG"}
        </Text>
      </View>

      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.btnText}>Đăng Xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#1f2937",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
    alignSelf: "flex-start",
    width: "100%",
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
    alignSelf: "flex-start",
    width: "100%",
  },
  adminRole: { color: "#d97706" },
  btnLogout: {
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
});
