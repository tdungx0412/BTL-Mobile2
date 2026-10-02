// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Ẩn header mặc định của Expo Router
        tabBarActiveTintColor: "#d97706", // Màu cam khi tab đang được chọn
        tabBarInactiveTintColor: "#9ca3af", // Màu xám khi không chọn
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 10, // Đổ bóng cho Android
          shadowColor: "#000", // Đổ bóng cho iOS
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
      }}
    >
      {/* TAB 1: TRANG CHỦ */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* TAB 2: QUẢN LÝ SẢN PHẨM */}
      <Tabs.Screen
        name="explore"
        options={{
          title: "Sản phẩm",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />

      {/* TAB 3: QUẢN LÝ NHÂN VIÊN */}
      <Tabs.Screen
        name="staff"
        options={{
          title: "Nhân viên",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* TAB 4: TÀI KHOẢN (Đã chuyển lên thay thế vị trí cũ) */}
      <Tabs.Screen
        name="account"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
