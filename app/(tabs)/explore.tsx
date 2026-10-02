// app/(tabs)/explore.tsx
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

// Danh sách danh mục cố định để chọn
const CATEGORIES = [
  "Đồ thủ công",
  "Điện tử",
  "Thời trang",
  "Gia dụng",
  "Thực phẩm",
  "Sách & Văn phòng phẩm",
  "Khác",
];

interface ProductItem {
  id: number;
  name: string;
  price: string;
  category: string;
  stock: number;
  sku: string;
  description?: string;
  image?: string;
}

export default function ExploreScreen() {
  // --- STATE SẢN PHẨM ---
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProd, setLoadingProd] = useState(true);
  const [search, setSearch] = useState("");

  // --- STATE FORM & MODAL ---
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null,
  );

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    stock: "0",
    description: "",
    image: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch sản phẩm
  const fetchProducts = async (keyword?: string) => {
    setLoadingProd(true);
    try {
      const url = keyword
        ? `${API_URL}/products/search?keyword=${encodeURIComponent(keyword)}`
        : `${API_URL}/products?page=1&limit=100`;

      const res = await fetch(url);
      const json = await res.json();
      setProducts(Array.isArray(json) ? json : json.data || []);
    } catch (err) {
      Alert.alert("Lỗi kết nối", "Không thể tải danh sách từ server MySQL");
    } finally {
      setLoadingProd(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    clearTimeout((handleSearch as any).timer);
    (handleSearch as any).timer = setTimeout(() => fetchProducts(text), 400);
  };

  // Logic Form Sản phẩm
  const openForm = (product?: ProductItem) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.replace(/[^\d]/g, ""),
        category: product.category,
        stock: String(product.stock),
        description: product.description || "",
        image: product.image || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        price: "",
        category: "",
        stock: "0",
        description: "",
        image: "",
      });
    }
    setModalVisible(true);
  };

  const pickImage = async () => {
    let permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Cần quyền truy cập",
        "Vui lòng cấp quyền truy cập thư viện ảnh.",
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFormData({ ...formData, image: base64Image });
    }
  };

  const handleSubmitProduct = async () => {
    if (!formData.name.trim() || !formData.price.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên và giá sản phẩm");
      return;
    }
    setSubmitting(true);
    try {
      const method = editingProduct ? "PUT" : "POST";
      const url = editingProduct
        ? `${API_URL}/products/${editingProduct.id}`
        : `${API_URL}/products`;

      const bodyData = {
        name: formData.name,
        price: formData.price + ".000đ",
        category: formData.category,
        stock: Number(formData.stock),
        description: formData.description,
        image: formData.image || "",
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Có lỗi xảy ra từ phía Server");
      }

      Alert.alert(
        "Thành công",
        editingProduct
          ? "Đã cập nhật sản phẩm"
          : "Đã thêm sản phẩm mới vào kho",
      );
      setModalVisible(false);
      fetchProducts(search);
    } catch (err: any) {
      console.error("Lỗi chi tiết:", err);
      Alert.alert("Thất bại", err.message || "Không thể kết nối đến Server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = (item: ProductItem) => {
    Alert.alert("Xác nhận xóa", `Xóa "${item.name}" khỏi kho?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${API_URL}/products/${item.id}`, { method: "DELETE" });
            setProducts((prev) => prev.filter((p) => p.id !== item.id));
          } catch {
            Alert.alert("Lỗi", "Không thể xóa");
          }
        },
      },
    ]);
  };

  const renderProductItem = ({ item }: { item: ProductItem }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => openForm(item)}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.productThumb} />
      ) : (
        <View style={[styles.productThumb, styles.placeholderImg]} />
      )}

      <View style={styles.cardInfo}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.price}>{item.price}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.sku}>{item.sku}</Text>
          <Text style={[styles.stock, item.stock < 10 && styles.lowStock]}>
            Tồn: {item.stock}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => openForm(item)}>
          <Ionicons name="create-outline" size={20} color="#d97706" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => handleDeleteProduct(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header & Tìm kiếm */}
      <View style={styles.headerArea}>
        <View style={styles.topHeader}>
          <Text style={styles.title}>Quản lý Sản phẩm</Text>
          <TouchableOpacity
            onPress={() => openForm()}
            style={styles.addBtnHeader}
          >
            <Ionicons name="add-circle" size={32} color="#d97706" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            placeholder="Tìm tên hoặc SKU..."
            value={search}
            onChangeText={handleSearch}
            style={styles.input}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Danh sách sản phẩm */}
      {loadingProd && products.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#d97706" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
            </View>
          }
        />
      )}

      {/* MODAL FORM SẢN PHẨM */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? "Chỉnh sửa SP" : "Thêm SP mới"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Ảnh sản phẩm</Text>
              <TouchableOpacity
                style={[
                  styles.textInput,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                ]}
                onPress={pickImage}
              >
                <Text
                  style={{
                    color: formData.image ? "#1f2937" : "#999",
                    flex: 1,
                  }}
                >
                  {formData.image ? "Đã chọn ảnh" : "Chọn ảnh từ thư viện..."}
                </Text>
                <Ionicons name="image-outline" size={20} color="#666" />
              </TouchableOpacity>
              {formData.image ? (
                <View style={{ marginTop: 10, alignItems: "center" }}>
                  <Image
                    source={{ uri: formData.image }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                    }}
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên sản phẩm *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
                placeholder="Ví dụ: Túi cói Hội An"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Giá bán *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.price}
                  onChangeText={(t) =>
                    setFormData({
                      ...formData,
                      price: t.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder="189000"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Tồn kho</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.stock}
                  onChangeText={(t) =>
                    setFormData({
                      ...formData,
                      stock: t.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Ô CHỌN DANH MỤC (PICKER) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Danh mục</Text>
              <TouchableOpacity
                style={[
                  styles.textInput,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                ]}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Text
                  style={{
                    color: formData.category ? "#1f2937" : "#999",
                    flex: 1,
                  }}
                >
                  {formData.category || "Chọn danh mục..."}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabledBtn]}
              onPress={handleSubmitProduct}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {editingProduct ? "Lưu thay đổi" : "Thêm vào kho"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL CHỌN DANH MỤC */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    formData.category === item && styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, category: item });
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      formData.category === item && styles.categoryTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {formData.category === item && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#d97706"
                    />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbf9fd" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header Area
  headerArea: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 5 },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
  addBtnHeader: { padding: 5 },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  input: { flex: 1, marginLeft: 8, fontSize: 14, color: "#333" },

  // List & Cards
  list: { paddingHorizontal: 15, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  productThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },
  placeholderImg: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  cardInfo: { flex: 1, justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "bold", color: "#1f2937", marginBottom: 4 },
  price: { fontSize: 15, color: "#d97706", fontWeight: "600", marginBottom: 4 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sku: { fontSize: 12, color: "#9ca3af" },
  stock: { fontSize: 12, color: "#059669", fontWeight: "500" },
  lowStock: { color: "#dc2626", fontWeight: "bold" },

  actions: { justifyContent: "center", gap: 10, paddingLeft: 10 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: 14, color: "#999" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1f2937" },
  formGroup: { marginBottom: 16 },
  row: { flexDirection: "row" },
  label: { fontSize: 13, fontWeight: "600", color: "#4b5563", marginBottom: 6 },
  textInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
  },
  submitBtn: {
    backgroundColor: "#d97706",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  disabledBtn: { opacity: 0.7 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // Category Picker Styles
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  categoryItemSelected: {
    backgroundColor: "#fffbeb",
  },
  categoryText: {
    fontSize: 15,
    color: "#4b5563",
  },
  categoryTextSelected: {
    color: "#d97706",
    fontWeight: "600",
  },
});
