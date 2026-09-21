// components/shop/ProductCard.tsx
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
  color: string;
  rating?: number;
  reviewCount?: number;
}

interface ProductCardProps {
  product: Product;
  containerWidth: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPress?: () => void;
}
const ProductCard = React.memo(
  ({ product, containerWidth }: ProductCardProps) => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.card, { width: containerWidth }]}
      >
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: `${product.color}30` },
          ]}
        >
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.price}>{product.price}</Text>
          {product.rating && product.rating > 0 && (
            <Text style={styles.rating}>
              ⭐ {product.rating} ({product.reviewCount})
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

ProductCard.displayName = "ProductCard";

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 15,
  },
  imageContainer: {
    width: "100%",
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: "100%", height: "100%" },
  info: { padding: 12 },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 6,
    height: 40,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d97706",
    marginBottom: 4,
  },
  rating: { fontSize: 12, color: "#6b7280" },
});
