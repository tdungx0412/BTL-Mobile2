// app/(tabs)/explore.tsx
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CheckoutModal } from "@/components/order/CheckoutModal";
import { OrderHistoryModal } from "@/components/order/OrderHistoryModal";
import { ProductCard, ProductItem } from "@/components/product/ProductCard";
import { ProductDetailModal } from "@/components/product/ProductDetailModal";
import { API_URL, BASE_URL } from "@/constants/config";
import { useAuthStore } from "@/src/stores/useAuthStore";
import { useCartStore } from "@/src/stores/useCartStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Category {
  id: number;
  name: string;
  icon: string;
}

const formatVND = (num: number | string) => {
  const val = typeof num === "string" ? parseFloat(num) || 0 : num;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
};

export default function ExploreScreen() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [showCart, setShowCart] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [showDirectCheckout, setShowDirectCheckout] = useState(false);
  const [directCheckoutItem, setDirectCheckoutItem] = useState<any | null>(null);

  // Stores
  const { initAuth } = useAuthStore();
  const { loadCart, getItemCount } = useCartStore();
  const cartItemCount = getItemCount();

  // Khởi tạo Auth & Cart
  useEffect(() => {
    initAuth();
    loadCart();
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Gọi song song danh mục & sản phẩm
      const [catRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/products`),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.data || catData || []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.data || prodData || []);
      }
    } catch (e) {
      console.error("Lỗi tải dữ liệu sản phẩm:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Lọc sản phẩm theo Category & Tìm kiếm
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCatId === null ||
        (p as any).category_id === selectedCatId ||
        p.category === categories.find((c) => c.id === selectedCatId)?.name;

      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchSearch;
    });
  }, [products, selectedCatId, searchQuery, categories]);

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>Bộ Sưu Tập Thủ Công</Text>
            <Text style={styles.headerTitle}>Eiko Handcraft 🎁</Text>
          </View>

          <View style={styles.headerActions}>
            {/* NÚT LỊCH SỬ ĐƠN HÀNG & HÓA ĐƠN */}
            <TouchableOpacity
              style={styles.billHeaderBtn}
              onPress={() => setShowHistory(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="receipt-outline" size={17} color="#d97706" />
              <Text style={styles.billHeaderBtnText}>Hóa đơn</Text>
            </TouchableOpacity>

            {/* NÚT GIỎ HÀNG */}
            <TouchableOpacity
              style={[styles.iconBtn, styles.cartIconBtn]}
              onPress={() => setShowCart(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="cart-outline" size={22} color="#fff" />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm túi cói, gốm sứ, lụa Huế..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* CATEGORY CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          <TouchableOpacity
            style={[styles.catChip, selectedCatId === null && styles.catChipActive]}
            onPress={() => setSelectedCatId(null)}
          >
            <Text style={[styles.catChipText, selectedCatId === null && styles.catChipTextActive]}>
              ✨ Tất cả ({products.length})
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, selectedCatId === cat.id && styles.catChipActive]}
              onPress={() => setSelectedCatId(cat.id === selectedCatId ? null : cat.id)}
            >
              <Text
                style={[
                  styles.catChipText,
                  selectedCatId === cat.id && styles.catChipTextActive,
                ]}
              >
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* PRODUCT GRID */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#d97706" />
          <Text style={styles.loadingText}>Đang cập nhật sản phẩm thủ công...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cube-outline" size={60} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm nào</Text>
          <Text style={styles.emptySub}>Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc danh mục.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#d97706"]} />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => {
                setSelectedProduct(item);
                setBuyQuantity(1);
              }}
            />
          )}
        />
      )}

      {/* CART DRAWER */}
      <CartDrawer
        visible={showCart}
        onClose={() => setShowCart(false)}
        onOrderSuccess={(orderCode) => {
          setShowCart(false);
          setShowHistory(true);
        }}
      />

      {/* ORDER HISTORY MODAL */}
      <OrderHistoryModal visible={showHistory} onClose={() => setShowHistory(false)} />

      {/* DIRECT BUY CHECKOUT MODAL */}
      <CheckoutModal
        visible={showDirectCheckout}
        directItem={directCheckoutItem}
        onClose={() => {
          setShowDirectCheckout(false);
          setDirectCheckoutItem(null);
        }}
        onSuccess={(orderCode) => {
          setShowDirectCheckout(false);
          setDirectCheckoutItem(null);
          setShowHistory(true);
        }}
      />

      {/* PRODUCT DETAIL MODAL */}
      <ProductDetailModal
        visible={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, qty) => {
          for (let i = 0; i < qty; i++) {
            useCartStore.getState().addToCart({
              id: p.id,
              name: p.name,
              price: typeof p.price === "string" ? parseFloat(p.price) || 0 : p.price,
              stock: p.stock,
              image: p.image || undefined,
            });
          }
          setShowCart(true);
        }}
        onBuyNow={(p, qty) => {
          const itemToBuy = {
            id: p.id,
            name: p.name,
            price: typeof p.price === "string" ? parseFloat(p.price) || 0 : p.price,
            quantity: qty,
            image: p.image || undefined,
          };
          setDirectCheckoutItem(itemToBuy);
          setShowDirectCheckout(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d97706",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1f2937",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  cartIconBtn: {
    backgroundColor: "#d97706",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
  },
  categoryList: {
    gap: 8,
    paddingRight: 10,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  catChipActive: {
    backgroundColor: "#d97706",
  },
  catChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
  },
  catChipTextActive: {
    color: "#fff",
  },
  gridContent: {
    padding: 10,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 6,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  detailSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    overflow: "hidden",
  },
  detailCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  detailImg: {
    width: "100%",
    height: 280,
    backgroundColor: "#f3f4f6",
  },
  detailBody: {
    padding: 20,
  },
  detailCategory: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d97706",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 8,
  },
  detailPrice: {
    fontSize: 22,
    fontWeight: "900",
    color: "#d97706",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  detailDesc: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 16,
  },
  specBox: {
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  specItem: {
    fontSize: 13,
    color: "#4b5563",
  },
  detailFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  qtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400e",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    minWidth: 26,
    textAlign: "center",
  },
  btnRowActions: {
    flexDirection: "row",
    gap: 10,
  },
  detailAddBtn: {
    flex: 1,
    backgroundColor: "#f59e0b",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  detailAddBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  detailBuyNowBtn: {
    flex: 1,
    backgroundColor: "#d97706",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  detailBuyNowBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  billHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  billHeaderBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d97706",
  },
});
