// src/stores/useAuthStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export interface User {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: "admin" | "staff" | "customer" | "user";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    try {
      const stored = await AsyncStorage.getItem("userToken");
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed.token || "";
        const user: User = {
          id: parsed.id || parsed.user_id,
          user_id: parsed.id || parsed.user_id,
          username: parsed.username || "",
          full_name: parsed.full_name || "",
          email: parsed.email,
          phone: parsed.phone,
          avatar: parsed.avatar,
          role: parsed.role || "customer",
        };
        set({ user, token, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch (e) {
      console.error("Lỗi khởi tạo AuthStore:", e);
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  login: async (userData, token) => {
    const normalizedUser: User = {
      ...userData,
      id: userData.id || userData.user_id,
      user_id: userData.id || userData.user_id,
    };
    const storageData = { ...normalizedUser, token };
    await AsyncStorage.setItem("userToken", JSON.stringify(storageData));
    await AsyncStorage.setItem("userData", JSON.stringify(storageData));
    set({ user: normalizedUser, token, isAuthenticated: true });
  },

  updateUser: async (updatedData: Partial<User>) => {
    const current = get().user;
    if (!current) return;
    const merged: User = {
      ...current,
      ...updatedData,
      id: updatedData.id || current.id,
      user_id: updatedData.user_id || current.user_id,
    };
    const token = get().token || "";
    const storageData = { ...merged, token };
    await AsyncStorage.setItem("userToken", JSON.stringify(storageData));
    await AsyncStorage.setItem("userData", JSON.stringify(storageData));
    set({ user: merged });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(["userToken", "userData", "userCart"]);
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

