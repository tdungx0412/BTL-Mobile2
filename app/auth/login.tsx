// app/auth/login.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      // CHỈ LƯU USER INFO CẦN THIẾT, KHÔNG LƯU TOÀN BỘ RESPONSE
      const userData = {
        token: data.token,
        user_id: data.user_id,
        username: data.username,
        full_name: data.full_name,
        role: data.role,
      };

      await AsyncStorage.setItem("userToken", JSON.stringify(userData));
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      // Chuyển vào app chính sau khi login thành công
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("Login error:", err);
      Alert.alert(
        "Đăng nhập thất bại",
        err.message || "Không thể kết nối đến server",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 32,
          textAlign: "center",
          color: "#1f2937",
        }}
      >
        Đăng Nhập
      </Text>

      <TextInput
        placeholder="Tên đăng nhập"
        value={username}
        onChangeText={setUsername}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
        autoCapitalize="none"
        autoComplete="username"
      />

      <TextInput
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 24,
        }}
        autoComplete="current-password"
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#a8a8a8" : "#d97706",
          padding: 14,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            Đăng Nhập
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/auth/register")}
        style={{ marginTop: 16, alignItems: "center" }}
      >
        <Text style={{ color: "#d97706" }}>
          Chưa có tài khoản? Đăng ký ngay
        </Text>
      </TouchableOpacity>
    </View>
  );
}
