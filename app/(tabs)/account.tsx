// app/(tabs)/account.tsx
import { useLogout } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AccountScreen() {
  const logout = useLogout();
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const tokenStr = await AsyncStorage.getItem("userToken");
      if (tokenStr) setUserInfo(JSON.parse(tokenStr));
    };
    loadUser();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>
          {userInfo?.full_name || userInfo?.username || "Người dùng"}
        </Text>
        <Text style={styles.role}>
          {userInfo?.role === "admin" ? "Quản trị viên" : "Người dùng"}
        </Text>
      </View>

      <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#dc2626"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  header: { alignItems: "center", marginTop: 40, marginBottom: 60 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d97706",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  name: { fontSize: 22, fontWeight: "bold", color: "#1f2937", marginBottom: 4 },
  role: { fontSize: 14, color: "#6b7280" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fee2e2",
    backgroundColor: "#fef2f2",
    marginTop: "auto",
  },
  logoutText: { color: "#dc2626", fontWeight: "bold", fontSize: 16 },
});
