// app/auth/register.tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !password || !confirmPassword) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng điền đầy đủ các trường bắt buộc",
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Lỗi mật khẩu", "Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Mật khẩu yếu", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, full_name: fullName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Alert.alert("Thành công", "Đăng ký thành công! Vui lòng đăng nhập.", [
        { text: "OK", onPress: () => router.replace("/auth/login") },
      ]);
    } catch (err: any) {
      Alert.alert("Đăng ký thất bại", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
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
        Tạo Tài Khoản Mới
      </Text>

      <TextInput
        placeholder="Tên đăng nhập *"
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
      />

      <TextInput
        placeholder="Họ và tên"
        value={fullName}
        onChangeText={setFullName}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      />

      <TextInput
        placeholder="Mật khẩu *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      />

      <TextInput
        placeholder="Xác nhận mật khẩu *"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 24,
        }}
      />

      <TouchableOpacity
        onPress={handleRegister}
        disabled={loading}
        style={{
          backgroundColor: "#d97706",
          padding: 14,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            Đăng Ký
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        style={{ marginTop: 16, alignItems: "center" }}
      >
        <Text style={{ color: "#d97706" }}>
          Đã có tài khoản? Đăng nhập ngay
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
