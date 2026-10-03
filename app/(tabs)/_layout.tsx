// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

// ✅ BIẾN CẤP MODULE (TOP-LEVEL)
// Theo tài liệu React: Dùng để cache dữ liệu tránh fetch liên tục.
let cachedRole: string | null = null;

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(cachedRole);
  const [isLoaded, setIsLoaded] = useState(!!cachedRole);
  const pathname = usePathname();

  // Hàm kiểm tra role (có thể gọi lại khi cần thiết)
  const checkRole = async () => {
    try {
      const json = await AsyncStorage.getItem("userToken");
      if (json) {
        const user = JSON.parse(json);
        cachedRole = user.role; // Cập nhật cache
        setRole(user.role); // Cập nhật state
      } else {
        cachedRole = "user";
        setRole("user");
      }
    } catch (e) {
      cachedRole = "user";
      setRole("user");
    } finally {
      setIsLoaded(true);
    }
  };

  // ✅ KHỞI TẠO 1 LẦN (INITIALIZING THE APP)
  useEffect(() => {
    if (!cachedRole) {
      checkRole();
    } else {
      setIsLoaded(true);
    }
  }, []);

  // ✅ QUAN TRỌNG: LẮNG NGHE SỰ THAY ĐỔI ĐƯỜNG DẪN
  // Mỗi khi chuyển tab hoặc đăng nhập xong (đường dẫn thay đổi),
  // ta kiểm tra lại role để đảm bảo tab Admin hiện/ẩn đúng lúc.
  // Đây là cách "synchronize with external system" (AsyncStorage) an toàn.
  useEffect(() => {
    // Chỉ check lại nếu chưa có cache hoặc đang ở trang login/account
    if (!cachedRole || pathname === "/auth/login" || pathname === "/account") {
      checkRole();
    }
  }, [pathname]);

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator color="#d97706" size="large" />
      </View>
    );
  }

  // ✅ LOGIC ẨN/HIỆN TAB
  // Nếu role là admin -> href undefined (hiện).
  // Nếu role là user -> href null (ẩn hoàn toàn).
  const adminTabHref = role === "admin" ? undefined : null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#d97706",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Sản phẩm",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />

      {/* TAB ADMIN: Chỉ hiện khi role === 'admin' */}
      <Tabs.Screen
        name="admin"
        options={{
          href: adminTabHref,
          title: "Quản lý",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-sharp" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
