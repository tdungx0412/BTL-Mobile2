// app/(tabs)/admin.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
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

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image?: string;
  category?: string;
  description?: string;
}
interface Service {
  id: number;
  name: string;
  price: number;
  image?: string;
  description?: string;
  category?: string;
  duration_minutes?: number;
}
interface Customer {
  id: number;
  username: string;
  full_name: string;
  created_at: string;
}
interface Order {
  id: number;
  created_at: string;
  total_amount: number;
  summary: string;
}

let didInit = false;
let cachedProducts: Product[] | null = null;
let cachedServices: Service[] | null = null;
let cachedCustomers: Customer[] | null = null;

export default function AdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(!didInit);
  const [activeTab, setActiveTab] = useState<
    "products" | "services" | "customers"
  >("products");

  const [products, setProducts] = useState<Product[]>(cachedProducts || []);
  const [services, setServices] = useState<Service[]>(cachedServices || []);
  const [customers, setCustomers] = useState<Customer[]>(cachedCustomers || []);

  const [modalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState<"product" | "service">("product");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    image: "",
    description: "",
    duration: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");

  if (!didInit) {
    didInit = true;
    (async () => {
      try {
        const tokenStr = await AsyncStorage.getItem("userToken");
        if (!tokenStr || JSON.parse(tokenStr).role !== "admin") {
          router.replace("/");
          return;
        }

        const promises = [];
        if (!cachedProducts)
          promises.push(
            fetch(`${API_URL}/products`).then((r) => (r.ok ? r.json() : [])),
          );
        else promises.push(Promise.resolve(cachedProducts));

        if (!cachedServices)
          promises.push(
            fetch(`${API_URL}/admin/services`).then((r) =>
              r.ok ? r.json() : [],
            ),
          );
        else promises.push(Promise.resolve(cachedServices));

        if (!cachedCustomers)
          promises.push(
            fetch(`${API_URL}/admin/customers`).then((r) =>
              r.ok ? r.json() : [],
            ),
          );
        else promises.push(Promise.resolve(cachedCustomers));

        const [p, s, c] = await Promise.all(promises);
        cachedProducts = p;
        setProducts(p);
        cachedServices = s;
        setServices(s);
        cachedCustomers = c;
        setCustomers(c);
      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }

  const openForm = (type: "product" | "service", item?: any) => {
    setFormType(type);
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: String(item.price),
        stock: String(item.stock || ""),
        category: item.category || "",
        image: item.image || "",
        description: item.description || "",
        duration: String(item.duration_minutes || ""),
      });
      setImagePreview(item.image || null);
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        price: "",
        stock: "",
        category: "",
        image: "",
        description: "",
        duration: "",
      });
      setImagePreview(null);
    }
    setModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled) {
      setImagePreview(result.assets[0].uri);
      setFormData((prev) => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price)
      return Alert.alert("Lỗi", "Thiếu Tên hoặc Giá");

    const payload: any = {
      name: formData.name,
      price: formData.price.replace(/[^0-9]/g, ""),
      category: formData.category,
      image: formData.image,
      description: formData.description,
    };

    if (formType === "product") payload.stock = formData.stock || 0;
    else payload.duration_minutes = formData.duration || 30;

    try {
      const isEdit = !!editingItem;
      const url = isEdit
        ? `${API_URL}/admin/${formType === "product" ? "products" : "services"}/${editingItem.id}`
        : `${API_URL}/admin/${formType === "product" ? "products" : "services"}`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Thành công", data.message);
        setModalVisible(false);

        // ✅ Tải lại dữ liệu ngay lập tức để đồng bộ giao diện Admin
        if (formType === "product") {
          const refresh = await fetch(`${API_URL}/products`);
          if (refresh.ok) {
            const newData = await refresh.json();
            cachedProducts = newData;
            setProducts(newData);
          }
        } else {
          const refresh = await fetch(`${API_URL}/admin/services`);
          if (refresh.ok) {
            const newData = await refresh.json();
            cachedServices = newData;
            setServices(newData);
          }
        }
      } else {
        Alert.alert("Thất bại", data.message);
      }
    } catch (err) {
      Alert.alert("Lỗi mạng", "Không thể kết nối server");
    }
  };

  const handleDelete = async (id: number, type: "product" | "service") => {
    Alert.alert("Xác nhận", "Bạn muốn xóa mục này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const url = `${API_URL}/admin/${type === "product" ? "products" : "services"}/${id}`;
          await fetch(url, { method: "DELETE" });

          if (type === "product") {
            const newProducts = products.filter((p) => p.id !== id);
            cachedProducts = newProducts;
            setProducts(newProducts);
          } else {
            const newServices = services.filter((s) => s.id !== id);
            cachedServices = newServices;
            setServices(newServices);
          }
        },
      },
    ]);
  };

  const viewCustomerOrders = async (customer: Customer) => {
    setSelectedCustomerName(customer.full_name || customer.username);
    try {
      const res = await fetch(
        `${API_URL}/admin/customers/${customer.id}/orders`,
      );
      if (res.ok) {
        setCustomerOrders(await res.json());
        setOrderModalVisible(true);
      } else {
        Alert.alert("Lỗi", "Không thể tải hóa đơn");
      }
    } catch (err) {
      Alert.alert("Lỗi mạng");
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản Trị Eiko</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab("products")}
            style={[
              styles.tabBtn,
              activeTab === "products" && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "products" && styles.activeTabText,
              ]}
            >
              Sản Phẩm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("services")}
            style={[
              styles.tabBtn,
              activeTab === "services" && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "services" && styles.activeTabText,
              ]}
            >
              Dịch Vụ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("customers")}
            style={[
              styles.tabBtn,
              activeTab === "customers" && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "customers" && styles.activeTabText,
              ]}
            >
              Khách Hàng
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === "products" && (
          <>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => openForm("product")}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
            <FlatList
              data={products}
              keyExtractor={(i) => i.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSub}>
                      Giá: {Number(item.price).toLocaleString()}đ | Tồn:{" "}
                      {item.stock}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => openForm("product", item)}>
                      <Ionicons name="create" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, "product")}
                    >
                      <Ionicons name="trash" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </>
        )}

        {activeTab === "services" && (
          <>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => openForm("service")}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
            <FlatList
              data={services}
              keyExtractor={(i) => i.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSub}>
                      Giá: {Number(item.price).toLocaleString()}đ |{" "}
                      {item.duration_minutes} phút
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => openForm("service", item)}>
                      <Ionicons name="create" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, "service")}
                    >
                      <Ionicons name="trash" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </>
        )}

        {activeTab === "customers" && (
          <FlatList
            data={customers}
            keyExtractor={(i) => i.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {item.full_name || item.username}
                  </Text>
                  <Text style={styles.cardSub}>
                    Tham gia: {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => viewCustomerOrders(item)}
                >
                  <Ionicons name="receipt-outline" size={20} color="#fff" />
                  <Text style={{ color: "#fff", marginLeft: 5, fontSize: 12 }}>
                    Xem HĐ
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* MODAL FORM */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? "Chỉnh Sửa" : "Thêm Mới"}{" "}
              {formType === "product" ? "Sản Phẩm" : "Dịch Vụ"}
            </Text>
            <ScrollView>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imagePreview ? (
                  <Image
                    source={{ uri: imagePreview }}
                    style={styles.previewImage}
                  />
                ) : (
                  <Text>Chọn ảnh...</Text>
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Tên *"
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Giá *"
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(t) => setFormData({ ...formData, price: t })}
              />
              {formType === "product" ? (
                <TextInput
                  style={styles.input}
                  placeholder="Tồn kho"
                  keyboardType="numeric"
                  value={formData.stock}
                  onChangeText={(t) => setFormData({ ...formData, stock: t })}
                />
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder="Thời gian (phút)"
                  keyboardType="numeric"
                  value={formData.duration}
                  onChangeText={(t) =>
                    setFormData({ ...formData, duration: t })
                  }
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="Danh mục"
                value={formData.category}
                onChangeText={(t) => setFormData({ ...formData, category: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Mô tả"
                multiline
                value={formData.description}
                onChangeText={(t) =>
                  setFormData({ ...formData, description: t })
                }
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                <Text>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL HÓA ĐƠN */}
      <Modal
        visible={orderModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Hóa đơn của {selectedCustomerName}
              </Text>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={customerOrders}
              keyExtractor={(i) => i.id.toString()}
              ListEmptyComponent={
                <Text
                  style={{ textAlign: "center", padding: 20, color: "#999" }}
                >
                  Khách hàng chưa mua gì.
                </Text>
              }
              renderItem={({ item }) => (
                <View style={styles.orderItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "bold", color: "#1f2937" }}>
                      Mã ĐH: #{item.id}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}
                    >
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                    <Text
                      style={{ marginTop: 5, fontSize: 13, color: "#4b5563" }}
                      numberOfLines={2}
                    >
                      {item.summary}
                    </Text>
                  </View>
                  <Text style={styles.orderPrice}>
                    {Number(item.total_amount).toLocaleString()}đ
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#fff",
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  tabs: { flexDirection: "row", gap: 10 },
  tabBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  activeTab: { backgroundColor: "#d97706" },
  tabText: { fontWeight: "600", color: "#666", fontSize: 13 },
  activeTabText: { color: "#fff" },
  content: { flex: 1, padding: 16 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#d97706",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    zIndex: 10,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: { fontWeight: "bold", fontSize: 16, color: "#1f2937" },
  cardSub: { fontSize: 13, color: "#666", marginTop: 4 },
  actions: { flexDirection: "row", gap: 12 },
  viewBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#1f2937",
  },
  imagePicker: {
    width: "100%",
    height: 150,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  btnCancel: {
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  btnSave: {
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#d97706",
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "center",
  },
  orderPrice: {
    fontWeight: "bold",
    color: "#d97706",
    fontSize: 16,
    marginLeft: 10,
  },
});
