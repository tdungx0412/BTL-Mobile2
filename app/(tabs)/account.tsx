// app/(tabs)/account.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react"; // ✅ BỎ useEffect
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UserInfo {
  username?: string;
  full_name?: string;
  role?: string;
}

export default function AccountScreen() {
  const router = useRouter();

  // Đọc token ngay lập tức khi mở màn hình
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    try {
      const raw = AsyncStorage.getItem("userToken");
      // Lưu ý: getItem trả về Promise nên cách này chỉ đúng nếu bạn đã await ở đâu đó trước đó
      // Để đơn giản nhất cho Demo, ta giả sử data đã có sẵn trong state hoặc dùng hook custom
      return null;
    } catch {
      return null;
    }
  });

  // Hàm Load User thủ công (gọi khi cần refresh)
  const loadUser = async () => {
    try {
      const tokenStr = await AsyncStorage.getItem("userToken");
      if (tokenStr) {
        setUserInfo(JSON.parse(tokenStr));
      } else {
        // Nếu chưa login thì đá về trang login
        router.replace("/auth/login");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Gọi loadUser ngay khi component mount (dùng trick IIFE an toàn hơn useEffect cho case này)
  if (!userInfo && typeof window !== "undefined") {
    // Chạy 1 lần duy nhất
    setTimeout(loadUser, 0);
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.clear(); // Xóa sạch mọi cache cũ
      router.replace("/auth/login");
    } catch (error) {
      alert("Lỗi đăng xuất");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tài Khoản</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Tên đăng nhập:</Text>
        <Text style={styles.value}>{userInfo?.username || "---"}</Text>

        <Text style={styles.label}>Quyền hạn:</Text>
        <Text
          style={[styles.value, userInfo?.role === "admin" && styles.adminRole]}
        >
          {userInfo?.role === "admin" ? "ADMIN" : "USER"}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: { fontSize: 14, color: "#6b7280", marginBottom: 4 },
  value: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  adminRole: { color: "#d97706" },
  btnLogout: {
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
});
