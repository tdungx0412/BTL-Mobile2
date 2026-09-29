// app/_layout.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, Slot } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        setIsAuthenticated(!!token);
      } catch (e) {
        console.error("Lỗi kiểm tra auth:", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

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
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  // Nếu chưa đăng nhập, chặn truy cập và chuyển về Login
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  // Đã đăng nhập thì render các route con
  return <Slot />;
}
