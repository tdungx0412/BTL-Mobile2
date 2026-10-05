// src/stores/useCartStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { create } from "zustand";

export interface CartProduct {
  id: number;
  product_id?: number;
  name: string;
  price: number;
  stock: number;
  image?: string;
  category?: string;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

export interface Voucher {
  id: number;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_amount: number;
  description?: string;
}

interface CartState {
  items: CartItem[];
  voucher: Voucher | null;
  loadCart: () => Promise<void>;
  addToCart: (product: CartProduct, quantity?: number) => boolean;
  updateQuantity: (productId: number, delta: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  applyVoucher: (voucher: Voucher) => void;
  removeVoucher: () => void;

  // Computed values
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getShippingFee: () => number;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  voucher: null,

  loadCart: async () => {
    try {
      const data = await AsyncStorage.getItem("userCart");
      if (data) {
        set({ items: JSON.parse(data) });
      }
    } catch (e) {
      console.error("Lỗi đọc giỏ hàng:", e);
    }
  },

  addToCart: (product, quantity = 1) => {
    const { items } = get();
    const pId = product.id || product.product_id || 0;

    if (product.stock <= 0) {
      Alert.alert("Hết hàng", `Sản phẩm "${product.name}" hiện đã hết hàng.`);
      return false;
    }

    const existingIndex = items.findIndex((i) => (i.id || i.product_id) === pId);
    let newItems = [...items];

    if (existingIndex > -1) {
      const currentQty = newItems[existingIndex].quantity;
      if (currentQty + quantity > product.stock) {
        Alert.alert(
          "Vượt tồn kho",
          `Kho chỉ còn ${product.stock} món, bạn đã có ${currentQty} món trong giỏ.`
        );
        return false;
      }
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: currentQty + quantity,
      };
    } else {
      if (quantity > product.stock) {
        Alert.alert("Vượt tồn kho", `Kho chỉ còn ${product.stock} món.`);
        return false;
      }
      newItems.push({
        ...product,
        id: pId,
        product_id: pId,
        quantity,
      });
    }

    set({ items: newItems });
    AsyncStorage.setItem("userCart", JSON.stringify(newItems)).catch(console.error);
    return true;
  },

  updateQuantity: (productId, delta) => {
    const { items } = get();
    const newItems = items
      .map((item) => {
        const itemId = item.id || item.product_id;
        if (itemId === productId) {
          const nextQty = item.quantity + delta;
          if (nextQty > item.stock) {
            Alert.alert("Vượt quá tồn kho", `Sản phẩm chỉ còn ${item.stock} món trong kho.`);
            return item;
          }
          return { ...item, quantity: nextQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    set({ items: newItems });
    AsyncStorage.setItem("userCart", JSON.stringify(newItems)).catch(console.error);
  },

  removeFromCart: (productId) => {
    const { items } = get();
    const newItems = items.filter((i) => (i.id || i.product_id) !== productId);
    set({ items: newItems });
    AsyncStorage.setItem("userCart", JSON.stringify(newItems)).catch(console.error);
  },

  clearCart: () => {
    set({ items: [], voucher: null });
    AsyncStorage.removeItem("userCart").catch(console.error);
  },

  applyVoucher: (voucher) => set({ voucher }),
  removeVoucher: () => set({ voucher: null }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  },

  getDiscountAmount: () => {
    const { voucher } = get();
    if (!voucher) return 0;
    return voucher.discount_amount || 0;
  },

  getShippingFee: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal >= 300000 ? 0 : 25000;
  },

  getTotalAmount: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const shipping = get().getShippingFee();
    return Math.max(0, subtotal - discount + shipping);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
