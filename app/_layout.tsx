// app/_layout.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Chỉ cần đọc thử AsyncStorage để đảm bảo nó sẵn sàng
        await AsyncStorage.getItem("userToken");
      } catch (e) {
        console.error("Lỗi khởi tạo storage:", e);
      } finally {
        // Báo hiệu đã sẵn sàng render app
        setIsReady(true);
      }
    };
    prepare();
  }, []);

  if (!isReady) {
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

  // Render Slot an toàn, không bao giờ bị redirect loop
  return <Slot />;
}
