// app/(tabs)/_layout.tsx
import { TodayServiceReminderModal } from "@/components/service/TodayServiceReminderModal";
import { checkAndNotifyDueBookings, initNotifications } from "@/src/services/notificationService";
import { useAuthStore } from "@/src/stores/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function TabLayout() {
  const { user, isLoading, initAuth } = useAuthStore();
  const [dueBookings, setDueBookings] = useState<any[]>([]);
  const [showDueModal, setShowDueModal] = useState(false);
  const hasAutoPromptedRef = useRef(false);

  useEffect(() => {
    initAuth();
    initNotifications();
  }, []);

  // 🔔 Tự động kiểm tra lịch hẹn dịch vụ tới ngày hôm nay và bắn thông báo về máy
  useEffect(() => {
    if (!isLoading) {
      checkAndNotifyDueBookings(user).then((items) => {
        if (Array.isArray(items)) {
          setDueBookings(items);
          if (items.length > 0 && !hasAutoPromptedRef.current) {
            hasAutoPromptedRef.current = true;
            setShowDueModal(true);
          }
        }
      });
    }
  }, [user?.id, user?.role, isLoading]);

  if (isLoading) {
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

  const role = user?.role || "customer";

  // ✅ LOGIC ẨN/HIỆN TAB
  // Nếu role là admin -> href undefined (hiện).
  // Nếu role là user -> href null (ẩn hoàn toàn).
  const adminTabHref = role === "admin" ? undefined : null;

  return (
    <View style={{ flex: 1 }}>
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
              <View>
                <Ionicons name="settings-sharp" size={size} color={color} />
                {role === "admin" && dueBookings.length > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      right: -3,
                      top: -2,
                      width: 9,
                      height: 9,
                      borderRadius: 4.5,
                      backgroundColor: "#dc2626",
                    }}
                  />
                )}
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="account"
          options={{
            title: "Tài khoản",
            tabBarIcon: ({ color, size }) => (
              <View>
                <Ionicons name="person-circle-outline" size={size} color={color} />
                {role !== "admin" && dueBookings.length > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      right: -3,
                      top: -2,
                      width: 9,
                      height: 9,
                      borderRadius: 4.5,
                      backgroundColor: "#ea580c",
                    }}
                  />
                )}
              </View>
            ),
          }}
        />
      </Tabs>

      {/* POPUP THÔNG BÁO TỚI NGÀY HẸN DỊCH VỤ */}
      <TodayServiceReminderModal
        visible={showDueModal}
        onClose={() => setShowDueModal(false)}
        bookings={dueBookings}
        isAdmin={role === "admin"}
      />
    </View>
  );
}
