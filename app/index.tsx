// app/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        setIsLoggedIn(!!token);
      } catch (err) {
        console.error("Error checking auth:", err);
        setIsLoggedIn(false);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  if (checking) {
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

  // Logic điều hướng nằm ở đây, an toàn tuyệt đối
  if (!isLoggedIn) {
    return <Redirect href="/auth/login" />;
  }

  // Đã đăng nhập thì chuyển vào Tabs
  return <Redirect href="/(tabs)" />;
}
