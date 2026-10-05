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
            await AsyncStorage.multiRemove(["userToken", "userData", "userCart"]);
            router.replace("/auth/login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Lỗi", "Không thể đăng xuất, vui lòng thử lại");
          }
        },
      },
    ]);
  };

  return logout;
};

// ADDITIONAL HOOK: Check authentication status
export const useCheckAuth = () => {
  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      return !!token;
    } catch (err) {
      console.error("Check auth error:", err);
      return false;
    }
  };

  return checkAuth;
};
