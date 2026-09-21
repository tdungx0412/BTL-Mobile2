import { useState } from "react";
import { StyleSheet } from "react-native";

import {
  CartModal,
  CheckoutModal,
  LocationModal,
  ProductModal,
} from "@/components/shop";
import { ThemedView } from "@/components/themed-view";
import type { Product } from "@/constants/shop-data"; // Giữ lại type này cho Modal/Cart
import ShopHomeContent from "../../components/shop/ShopHomeContent";

export default function HomeScreen() {
  // State quản lý UI/Modal (Giữ nguyên)
  const [selectedProvince, setSelectedProvince] = useState("Hà Nội");
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [favoriteNames, setFavoriteNames] = useState<Set<string>>(new Set());
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);

  //_handlers_ (Giữ nguyên logic)
  const openLocationMenu = () => {
    setIsMenuVisible(true);
  };
  const closeLocationMenu = () => setIsMenuVisible(false);
  const selectProvince = (province: string) => {
    setSelectedProvince(province);
    closeLocationMenu();
  };

  const toggleFavorite = (product: Product) => {
    setFavoriteNames((current) => {
      const next = new Set(current);
      if (next.has(product.name)) next.delete(product.name);
      else next.add(product.name);
      return next;
    });
  };

  const addToCart = (product: Product) => {
    setCartItems((current) =>
      current.some((item) => item.name === product.name)
        ? current
        : [...current, product],
    );
    setSelectedProduct(null);
  };

  return (
    <ThemedView style={styles.screen}>
      <ShopHomeContent
        selectedProvince={selectedProvince}
        onOpenLocation={openLocationMenu}
        favoriteNames={favoriteNames}
        onToggleFavorite={toggleFavorite}
        onSelectProduct={setSelectedProduct}
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartVisible(true)}
      />

      {/* Các Modal giữ nguyên */}
      <LocationModal
        visible={isMenuVisible}
        search=""
        selectedProvince={selectedProvince}
        onSearchChange={() => {}}
        onClose={closeLocationMenu}
        onSelect={selectProvince}
      />
      <ProductModal
        product={selectedProduct}
        isFavorite={
          selectedProduct ? favoriteNames.has(selectedProduct.name) : false
        }
        onClose={() => setSelectedProduct(null)}
        onToggleFavorite={() =>
          selectedProduct && toggleFavorite(selectedProduct)
        }
        onAddToCart={() => selectedProduct && addToCart(selectedProduct)}
      />
      <CartModal
        visible={isCartVisible}
        items={cartItems}
        onClose={() => setIsCartVisible(false)}
        onRemove={(name) =>
          setCartItems((c) => c.filter((i) => i.name !== name))
        }
        onCheckout={() => {
          setIsCartVisible(false);
          setIsCheckoutVisible(true);
        }}
      />
      <CheckoutModal
        visible={isCheckoutVisible}
        items={cartItems}
        selectedProvince={selectedProvince}
        onClose={() => setIsCheckoutVisible(false)}
        onConfirm={() => {
          setIsCheckoutVisible(false);
          setCartItems([]);
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#fbf9fd", flex: 1 },
});
