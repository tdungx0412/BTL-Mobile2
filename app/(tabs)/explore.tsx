// app/(tabs)/explore.tsx
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

interface ProductItem {
  id: number;
  name: string;
  price: string;
  category: string;
  stock: number;
  sku: string;
  description?: string;
  image?: string;
  origin?: string;
  material?: string;
}

export default function ExploreScreen() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProd, setLoadingProd] = useState(true);
  const [search, setSearch] = useState("");

  // State cho Modal Chi Tiết
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(
    null,
  );
  const [hasFetched, setHasFetched] = useState(false);

  // ✅ SỬA LỖI TDZ: KHAI BÁO HÀM loadProducts TRƯỚC KHI GỌI
  const loadProducts = async (keyword?: string) => {
    setLoadingProd(true);
    try {
      const url = keyword
        ? `${API_URL}/products/search?keyword=${encodeURIComponent(keyword)}`
        : `${API_URL}/products?page=1&limit=100`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Lỗi tải");
      const json = await res.json();
      setProducts(Array.isArray(json) ? json : json.data || []);
    } catch (err) {
      Alert.alert("Lỗi", "Không kết nối server");
    } finally {
      setLoadingProd(false);
    }
  };

  // Gọi hàm sau khi đã định nghĩa xong
  if (!hasFetched) {
    setHasFetched(true);
    loadProducts();
  }

  // Mở modal chi tiết
  const openDetail = (item: ProductItem) => {
    setSelectedProduct(item);
    setDetailVisible(true);
  };

  // Xử lý Search debounce
  const handleSearch = (text: string) => {
    setSearch(text);
    clearTimeout((handleSearch as any).timer);
    (handleSearch as any).timer = setTimeout(
      () => loadProducts(text.trim() || undefined),
      400,
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header Tìm Kiếm */}
      <View style={styles.headerArea}>
        <Text style={styles.title}>Sản Phẩm</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChangeText={handleSearch}
            style={styles.input}
          />
        </View>
      </View>

      {/* Danh Sách Sản Phẩm Dạng Lưới */}
      {loadingProd && products.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#d97706" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2} // Hiển thị dạng lưới 2 cột
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cardGrid}
              onPress={() => openDetail(item)}
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.imgGrid}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.imgGrid, styles.placeholder]}>
                  <Ionicons name="cube-outline" size={40} color="#ccc" />
                </View>
              )}
              <View style={styles.infoGrid}>
                <Text style={styles.nameGrid} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.priceGrid}>{item.price}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có sản phẩm</Text>
          }
        />
      )}

      {/* MODAL CHI TIẾT SẢN PHẨM (Trượt từ dưới lên) */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Ảnh lớn */}
              {selectedProduct?.image ? (
                <Image
                  source={{ uri: selectedProduct.image }}
                  style={styles.detailImg}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.detailImg, styles.placeholder]}>
                  <Ionicons name="image-outline" size={60} color="#ddd" />
                </View>
              )}

              {/* Thông tin chi tiết */}
              <View style={styles.detailInfo}>
                <Text style={styles.detailName}>{selectedProduct?.name}</Text>
                <Text style={styles.detailPrice}>{selectedProduct?.price}</Text>

                <View style={styles.tagRow}>
                  <Text style={styles.tagBadge}>
                    {selectedProduct?.category}
                  </Text>
                  <Text style={styles.stockText}>
                    Còn hàng: {selectedProduct?.stock}
                  </Text>
                </View>

                <Text style={styles.sectionLabel}>Xuất xứ:</Text>
                <Text style={styles.sectionValue}>
                  {selectedProduct?.origin || "Việt Nam"}
                </Text>

                <Text style={styles.sectionLabel}>Chất liệu:</Text>
                <Text style={styles.sectionValue}>
                  {selectedProduct?.material || "---"}
                </Text>

                <Text style={styles.sectionLabel}>Mô tả chi tiết:</Text>
                <Text style={styles.descText}>
                  {selectedProduct?.description || "Chưa có mô tả."}
                </Text>
              </View>

              {/* Hành động mua hàng */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.buyBtn}
                  onPress={() =>
                    Alert.alert(
                      "Đặt hàng",
                      "Tính năng thanh toán sẽ được cập nhật trong phiên bản tới!",
                    )
                  }
                >
                  <Text style={styles.buyText}>Mua Ngay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setDetailVisible(false)}
                >
                  <Text style={styles.closeText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerArea: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingTop: 50,
  }, // Padding top cho status bar web/mobile
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  input: { flex: 1, marginLeft: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  gridContent: { padding: 16 },
  cardGrid: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 2,
  },
  imgGrid: { width: "100%", height: 150, backgroundColor: "#f9fafb" },
  placeholder: { justifyContent: "center", alignItems: "center" },
  infoGrid: { padding: 10 },
  nameGrid: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  priceGrid: { fontSize: 15, color: "#d97706", fontWeight: "bold" },
  emptyText: { textAlign: "center", marginTop: 50, color: "#999" },

  // Styles for Detail Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  detailSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    minHeight: "60%",
  },
  detailImg: { width: "100%", height: 250, backgroundColor: "#f9fafb" },
  detailInfo: { padding: 20 },
  detailName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  detailPrice: {
    fontSize: 22,
    color: "#d97706",
    fontWeight: "bold",
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tagBadge: {
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
  },
  stockText: { color: "#6b7280", fontSize: 12 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 4,
  },
  sectionValue: { fontSize: 15, color: "#4b5563" },
  descText: { fontSize: 15, color: "#4b5563", lineHeight: 22, marginTop: 4 },
  actionRow: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#f3f4f6",
    gap: 12,
  },
  buyBtn: {
    flex: 2,
    backgroundColor: "#d97706",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buyText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  closeBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#6b7280", fontWeight: "600" },
});
