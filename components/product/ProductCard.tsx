// components/product/ProductCard.tsx
import { BASE_URL } from "@/constants/config";
import { useCartStore } from "@/src/stores/useCartStore";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface ProductItem {
  id: number;
  sku?: string;
  name: string;
  price: number | string;
  stock: number;
  image?: string;
  category?: string;
  category_name?: string;
  color?: string;
  rating?: number;
  review_count?: number;
}

interface ProductCardProps {
  product: ProductItem;
  onPress?: () => void;
}

const formatVND = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const isOutOfStock = product.stock <= 0;

  // Resolve Image URL
  let imgUri = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80";
  if (product.image) {
    imgUri = product.image.startsWith("http") ? product.image : `${BASE_URL}${product.image}`;
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: typeof product.price === "string" ? parseFloat(product.price) || 0 : product.price,
      stock: product.stock,
      image: imgUri,
      category: product.category_name || product.category,
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.card, isOutOfStock && styles.cardDisabled]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imgUri }} style={styles.image} resizeMode="cover" />
        {isOutOfStock ? (
          <View style={styles.stockBadgeOut}>
            <Text style={styles.stockBadgeOutText}>HẾT HÀNG</Text>
          </View>
        ) : (
          <View style={styles.stockBadgeIn}>
            <Text style={styles.stockBadgeInText}>Kho: {product.stock}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.category} numberOfLines={1}>
          {product.category_name || product.category || "Thủ công mỹ nghệ"}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={13} color="#f59e0b" />
          <Text style={styles.ratingText}>{product.rating || "5.0"}</Text>
          <Text style={styles.reviewCount}>({product.review_count || 12})</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>{formatVND(product.price)}</Text>
          <TouchableOpacity
            style={[styles.cartBtn, isOutOfStock && styles.cartBtnDisabled]}
            disabled={isOutOfStock}
            onPress={handleAddToCart}
          >
            <Ionicons name="cart-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 6,
  },
  cardDisabled: {
    opacity: 0.75,
  },
  imageContainer: {
    width: "100%",
    height: 155,
    backgroundColor: "#f9fafb",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  stockBadgeIn: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeInText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  stockBadgeOut: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(239, 68, 68, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeOutText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  content: {
    padding: 12,
  },
  category: {
    fontSize: 11,
    fontWeight: "600",
    color: "#d97706",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    lineHeight: 19,
    minHeight: 38,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b5563",
  },
  reviewCount: {
    fontSize: 11,
    color: "#9ca3af",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: "#d97706",
  },
  cartBtn: {
    backgroundColor: "#d97706",
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBtnDisabled: {
    backgroundColor: "#9ca3af",
  },
});
