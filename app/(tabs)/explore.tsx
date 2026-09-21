// app/(tabs)/explore.tsx
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // <-- THÊM IMPORT NÀY
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

// Interface cho Sản phẩm
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

// Interface cho Nhân viên (Giả lập)
interface StaffItem {
  id: number;
  name: string;
  role: string;
  phone: string;
  status: "active" | "inactive";
}

export default function ExploreScreen() {
  // State chuyển đổi tab con
  const [activeSubTab, setActiveSubTab] = useState<"products" | "staff">(
    "products",
  );

  // --- STATE & LOGIC CHO SẢN PHẨM ---
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProd, setLoadingProd] = useState(true);
  const [search, setSearch] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
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

  // --- STATE GIẢ LẬP CHO NHÂN VIÊN ---
  const [staffs, setStaffs] = useState<StaffItem[]>([
    {
      id: 1,
      name: "Nguyễn Văn A",
      role: "Quản lý",
      phone: "0901234567",
      status: "active",
    },
    {
      id: 2,
      name: "Trần Thị B",
      role: "Bán hàng",
      phone: "0912345678",
      status: "active",
    },
    {
      id: 3,
      name: "Lê Văn C",
      role: "Kho vận",
      phone: "0987654321",
      status: "inactive",
    },
  ]);

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
    if (activeSubTab === "products") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProducts();
    }
  }, [activeSubTab]);

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

  // --- HÀM CHỌN ẢNH TỪ THƯ VIỆN ---
  const pickImage = async () => {
    // Yêu cầu quyền truy cập
    let permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Cần quyền truy cập",
        "Vui lòng cấp quyền truy cập thư viện ảnh để tiếp tục.",
      );
      return;
    }

    // Mở bộ chọn ảnh
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      // Cập nhật state với đường dẫn ảnh cục bộ
      setFormData({ ...formData, image: result.assets[0].uri });
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

      // Lưu ý: Nếu dùng ảnh cục bộ (file://), bạn cần upload lên server trước khi gửi JSON.
      // Ở đây giả định bạn sẽ xử lý việc upload hoặc dùng URL public.
      const body = {
        ...formData,
        price: formData.price + ".000đ",
        stock: Number(formData.stock),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Server lỗi");

      Alert.alert("Thành công", editingProduct ? "Đã cập nhật" : "Đã thêm mới");
      setModalVisible(false);
      fetchProducts(search);
    } catch (err) {
      Alert.alert("Thất bại", "Không thể lưu vào MySQL");
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

  // Render Item Sản phẩm
  const renderProductItem = ({ item }: { item: ProductItem }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => openForm(item)}
    >
      {/* Hiển thị ảnh nhỏ nếu có */}
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

  // Render Item Nhân viên (Giả lập)
  const renderStaffItem = ({ item }: { item: StaffItem }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => Alert.alert("Chi tiết", `Sửa thông tin ${item.name}`)}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.role}>
          {item.role} • {item.phone}
        </Text>
        <View style={styles.statusBadge}>
          <Text
            style={[
              styles.statusText,
              item.status === "active"
                ? styles.activeStatus
                : styles.inactiveStatus,
            ]}
          >
            {item.status === "active" ? "Đang làm việc" : "Nghỉ việc"}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="create-outline" size={20} color="#d97706" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // --- GIAO DIỆN CHÍNH ---
  return (
    <ThemedView style={styles.container}>
      {/* Header & Tab Switcher */}
      <View style={styles.headerArea}>
        <View style={styles.topHeader}>
          <Text style={styles.title}>Trung tâm Quản lý</Text>
          {activeSubTab === "products" && (
            <TouchableOpacity
              onPress={() => openForm()}
              style={styles.addBtnHeader}
            >
              <Ionicons name="add-circle" size={32} color="#d97706" />
            </TouchableOpacity>
          )}
        </View>

        {/* Thanh chuyển đổi Sản phẩm / Nhân viên */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[
              styles.switchTab,
              activeSubTab === "products" && styles.activeSwitch,
            ]}
            onPress={() => setActiveSubTab("products")}
          >
            <Ionicons
              name="cube-outline"
              size={18}
              color={activeSubTab === "products" ? "#fff" : "#666"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.switchText,
                activeSubTab === "products" && styles.activeSwitchText,
              ]}
            >
              Sản phẩm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.switchTab,
              activeSubTab === "staff" && styles.activeSwitch,
            ]}
            onPress={() => setActiveSubTab("staff")}
          >
            <Ionicons
              name="people-outline"
              size={18}
              color={activeSubTab === "staff" ? "#fff" : "#666"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.switchText,
                activeSubTab === "staff" && styles.activeSwitchText,
              ]}
            >
              Nhân viên
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nội dung động theo Tab */}
      {activeSubTab === "products" ? (
        <>
          {/* Thanh tìm kiếm chỉ hiện ở tab Sản phẩm */}
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
        </>
      ) : (
        // Giao diện Tab Nhân viên
        <FlatList
          data={staffs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStaffItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.staffHeader}>
              <Text style={styles.staffCount}>
                Tổng số: {staffs.length} nhân viên
              </Text>
              <TouchableOpacity
                style={styles.addStaffBtn}
                onPress={() =>
                  Alert.alert(
                    "Thông báo",
                    "Tính năng thêm nhân viên đang phát triển",
                  )
                }
              >
                <Ionicons
                  name="person-add"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.addStaffText}>Thêm NV</Text>
              </TouchableOpacity>
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

            {/* Ô chọn ảnh */}
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

              {/* Xem trước ảnh */}
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
            <View style={styles.formGroup}>
              <Text style={styles.label}>Danh mục</Text>
              <TextInput
                style={styles.textInput}
                value={formData.category}
                onChangeText={(t) => setFormData({ ...formData, category: t })}
                placeholder="Đồ thủ công..."
              />
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

  // Tab Switcher
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  switchTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeSwitch: {
    backgroundColor: "#d97706",
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  switchText: { fontSize: 14, color: "#666", fontWeight: "600" },
  activeSwitchText: { color: "#fff", fontWeight: "bold" },

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
    alignItems: "center", // Căn giữa theo chiều dọc
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
  role: { fontSize: 14, color: "#4b5563", marginBottom: 4 },
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

  // Staff Specific
  staffHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  staffCount: { fontSize: 14, color: "#666", fontWeight: "500" },
  addStaffBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4b5563",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addStaffText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  statusBadge: { marginTop: 4 },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  activeStatus: { backgroundColor: "#d1fae5", color: "#059669" },
  inactiveStatus: { backgroundColor: "#fee2e2", color: "#dc2626" },

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
});
