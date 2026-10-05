// constants/config.ts
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Tự động xác định địa chỉ IP/Host chính xác của backend API:
 * 1. Web: dùng hostname hiện tại của trình duyệt (ví dụ localhost)
 * 2. Mobile (Expo Go): dùng hostUri thực tế mà Expo Go đang kết nối
 * 3. Fallback: ENV EXPO_PUBLIC_API_URL (loại trừ IP cũ không còn hiệu lực) hoặc IP máy dev
 */
const resolveBaseUrl = (): string => {
  // Trình duyệt Web
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const host = window.location.hostname || "localhost";
    return `http://${host}:3001`;
  }

  // Thiết bị thật / Máy ảo qua Expo Go
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:3001`;
    }
  }

  // Biến môi trường (chỉ nhận nếu không phải IP cũ bị cache)
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BASE_URL;
  if (envUrl && !envUrl.includes("192.168.1.10")) {
    return envUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }

  // IP Wi-Fi hiện tại của máy chủ backend
  return "http://192.168.1.11:3001";
};

// BASE_URL luôn là: http://...:3001 (không có /api ở cuối)
export const BASE_URL = resolveBaseUrl();

// API_URL luôn là: http://...:3001/api (đảm bảo luôn có /api ở cuối)
export const API_URL = `${BASE_URL}/api`;
export const API_BASE_URL = API_URL;
