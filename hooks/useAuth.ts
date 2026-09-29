// hooks/useAuth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

export const useLogout = () => {
  const router = useRouter();

  const logout = async () => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("userToken");
            await AsyncStorage.removeItem("userData");
            // Dùng replace để xóa history, tránh user bấm back quay lại app
            router.replace("/auth/login");
          } catch (error) {
            Alert.alert("Lỗi", "Không thể đăng xuất, vui lòng thử lại");
          }
        },
      },
    ]);
  };

  return logout;
};
