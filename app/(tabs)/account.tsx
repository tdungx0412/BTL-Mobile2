// app/(tabs)/account.tsx
import { useLogout } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AccountScreen() {
  const logout = useLogout();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tài khoản của tôi</Text>

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
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#1f2937",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fee2e2",
    backgroundColor: "#fef2f2",
  },
  logoutText: { color: "#dc2626", fontWeight: "bold", fontSize: 16 },
});
