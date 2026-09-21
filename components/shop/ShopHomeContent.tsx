// components/shop/ShopHomeContent.tsx
import { CATEGORIES, SHOP_LOGO_URL } from "@/constants/shop-data"; // ✅ Import thêm SHOP_LOGO_URL
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useShopProducts } from "../../hooks/useShopProducts";
import ProductCard from "./ProductCard";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 40) / COLUMN_COUNT;

export default function ShopHomeContent({
  selectedProvince,
  onOpenLocation,
  favoriteNames,
  onToggleFavorite,
  onSelectProduct,
  cartCount,
  onOpenCart,
}: any) {
  const { products, loading, error } = useShopProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Lọc sản phẩm theo search và category
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory
      ? p.category === selectedCategory
      : true;
    return matchSearch && matchCategory;
  });

  // --- 1. PHẦN HEADER: LOGO + TÊN SHOP + ICONS ---
  const renderBrandHeader = () => (
    <View style={styles.brandContainer}>
      <View style={styles.brandLeft}>
        {/* Hiển thị Logo Shop */}
        <Image source={{ uri: SHOP_LOGO_URL }} style={styles.logo} />
        <View>
          <Text style={styles.shopName}>EIko Shop</Text>
          <Text style={styles.shopSlogan}>Quà tặng thủ công Việt Nam</Text>
        </View>
      </View>

      {/* Icons bên phải: Location & Cart */}
      <View style={styles.brandRight}>
        <TouchableOpacity onPress={onOpenLocation} style={styles.iconBtn}>
          <Ionicons name="location-sharp" size={22} color="#d97706" />
          <Text style={styles.provinceText}>
            {selectedProvince || "Hà Nội"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onOpenCart} style={styles.iconBtn}>
          <Ionicons name="cart-outline" size={24} color="#333" />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- 2. THANH TÌM KIẾM ---
  const renderSearchBar = () => (
    <View style={styles.searchBox}>
      <Ionicons
        name="search"
        size={20}
        color="#999"
        style={{ marginRight: 8 }}
      />
      <TextInput
        placeholder="Tìm túi cói, gốm sứ, tranh Đông Hồ..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery("")}>
          <Ionicons name="close-circle" size={20} color="#ccc" />
        </TouchableOpacity>
      )}
    </View>
  );

  // --- 3. DANH MỤC CATEGORY (CHIPS) ---
  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryScroll}
    >
      <TouchableOpacity
        style={[styles.chip, !selectedCategory && styles.chipActive]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text
          style={[styles.chipText, !selectedCategory && styles.chipTextActive]}
        >
          Tất cả
        </Text>
      </TouchableOpacity>

      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.label}
          style={[
            styles.chip,
            selectedCategory === cat.label && styles.chipActive,
            {
              backgroundColor:
                selectedCategory === cat.label ? cat.color : "#f3f4f6",
            },
          ]}
          onPress={() => setSelectedCategory(cat.label)}
        >
          <Ionicons
            name={cat.icon as any}
            size={16}
            color="#555"
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.chipText,
              selectedCategory === cat.label && styles.chipTextActive,
            ]}
          >
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // --- TRẠNG THÁI LOADING / ERROR ---
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#d97706" />
        <Text style={styles.loadingText}>Đang tải kho hàng...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#dc2626" />
        <Text style={styles.errorTitle}>Lỗi kết nối Server</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  // --- RENDER CHÍNH ---
  return (
    <FlatList
      data={filteredProducts}
      keyExtractor={(item) => item.id?.toString() || item.sku}
      numColumns={COLUMN_COUNT}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      // Gộp toàn bộ Header vào ListHeaderComponent
      ListHeaderComponent={
        <>
          {renderBrandHeader()} {/* ✅ Logo + Tên Shop */}
          {renderSearchBar()} {/* ✅ Thanh tìm kiếm */}
          {renderCategories()} {/* ✅ Danh mục */}
          <Text style={styles.sectionTitle}>
            {selectedCategory
              ? `Danh mục: ${selectedCategory}`
              : "Sản phẩm nổi bật"}
          </Text>
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Không tìm thấy sản phẩm phù hợp.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          containerWidth={ITEM_WIDTH}
          isFavorite={favoriteNames?.has(item.name)}
          onToggleFavorite={() => onToggleFavorite && onToggleFavorite(item)}
          onPress={() => onSelectProduct && onSelectProduct(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fbf9fd",
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#dc2626",
    marginTop: 12,
  },
  errorMessage: { fontSize: 14, color: "#666", marginTop: 4 },

  // Brand Header Styles
  brandContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
  },
  brandLeft: { flexDirection: "row", alignItems: "center" },
  logo: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
    backgroundColor: "#eee",
  },
  shopName: { fontSize: 18, fontWeight: "bold", color: "#1f2937" },
  shopSlogan: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  brandRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: { marginLeft: 15, alignItems: "center", position: "relative" },
  provinceText: {
    fontSize: 11,
    color: "#d97706",
    fontWeight: "600",
    marginTop: 2,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  // Search Box
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },

  // Categories
  categoryScroll: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f3f4f6",
  },
  chipActive: { backgroundColor: "#d97706" },
  chipText: { fontSize: 13, color: "#555", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "bold" },

  // List & Empty State
  listContent: { paddingBottom: 30 },
  row: { justifyContent: "space-between", paddingHorizontal: 5 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 15,
    marginBottom: 10,
    marginTop: 5,
  },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { marginTop: 10, fontSize: 14, color: "#999" },
});
