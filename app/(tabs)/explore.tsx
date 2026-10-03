// app/(tabs)/explore.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
interface CartItem extends Product {
  quantity: number;
}
interface OrderHistory {
  id: number;
  created_at: string;
  total_amount: number;
  summary: string;
}

let didInit = false;
let cachedProducts: Product[] | null = null;

export default function ExploreScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(!didInit);
  const [viewMode, setViewMode] = useState<"shop" | "cart" | "history">("shop");

  const [products, setProducts] = useState<Product[]>(cachedProducts || []);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [history, setHistory] = useState<OrderHistory[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // ✅ Hàm tải dữ liệu (Dùng cho lần đầu và khi làm mới)
  const loadData = async () => {
    try {
      // Luôn fetch từ server để lấy dữ liệu mới nhất (nhờ Backend đã tắt cache)
      const resP = await fetch(`${API_URL}/products`);
      if (resP.ok) {
        const data = await resP.json();
        cachedProducts = data;
        setProducts(data);
      }

      const savedCart = await AsyncStorage.getItem("userCart");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!didInit) {
    didInit = true;
    loadData();
  }

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const newCart = existing
        ? prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...prev, { ...product, quantity: 1 }];
      AsyncStorage.setItem("userCart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      const newCart = prev.map((item) => {
        if (item.id === id)
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        return item;
      });
      AsyncStorage.setItem("userCart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.id !== id);
      AsyncStorage.setItem("userCart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    AsyncStorage.removeItem("userCart");
  };

  // Trong app/(tabs)/explore.tsx

  const handleCheckout = async () => {
    if (cart.length === 0) return Alert.alert("Giỏ hàng trống");
    if (isProcessingPayment) return;

    setIsProcessingPayment(true);

    try {
      const tokenStr = await AsyncStorage.getItem("userToken");
      let userId = null;

      if (tokenStr) {
        try {
          const user = JSON.parse(tokenStr);
          userId = user.id;
        } catch (e) {}
      }

      // Nếu chưa đăng nhập thì cảnh báo nhưng vẫn cho mua (tùy chọn)
      if (!userId) {
        Alert.alert(
          "Lưu ý",
          "Bạn chưa đăng nhập. Đơn hàng sẽ không lưu vào lịch sử cá nhân.",
        );
      }

      const payload = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        user_id: userId, // Gửi ID này lên Backend
      };

      const res = await fetch(`${API_URL}/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Thành công 🎉", "Đơn hàng đã được ghi nhận!");
        clearCart();

        // Chuyển tab
        setViewMode("history");

        // QUAN TRỌNG: Gọi loadHistory ngay sau khi mua xong
        // Không cần truyền userId vì hàm loadHistory mới sẽ tự lấy từ Storage
        await loadHistory();
      } else {
        Alert.alert("Thất bại ❌", data.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi mạng 📡");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const loadHistory = async () => {
    try {
      // 1. Lấy token
      const tokenStr = await AsyncStorage.getItem("userToken");

      if (!tokenStr) {
        console.log("Chưa có token, không tải lịch sử");
        return;
      }

      // 2. Parse an toàn
      let userId = null;
      try {
        const user = JSON.parse(tokenStr);
        userId = user.id;
      } catch (e) {
        console.error("Lỗi parse token", e);
        return;
      }

      if (!userId) {
        console.log("Không tìm thấy userId trong token");
        return;
      }

      console.log("🔄 Đang tải lịch sử cho user:", userId);

      // 3. Gọi API
      const res = await fetch(`${API_URL}/my-orders?userId=${userId}`);

      if (res.ok) {
        const data = await res.json();
        console.log("✅ Dữ liệu lịch sử:", data); // Debug xem server trả về gì
        setHistory(data);
      } else {
        console.error("❌ Lỗi API lịch sử:", await res.text());
      }
    } catch (err) {
      console.error("💥 Lỗi mạng load history:", err);
    }
  };

  const viewOrderDetail = async (orderId: number) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`);
      if (res.ok) {
        setSelectedOrder(await res.json());
        setOrderDetailVisible(true);
      }
    } catch (err) {
      Alert.alert("Lỗi tải chi tiết");
    }
  };

  // ✅ Xử lý chuyển tab: Tải lại dữ liệu khi vào tab Cửa hàng
  const handleTabPress = (tab: "shop" | "cart" | "history") => {
    setViewMode(tab);
    if (tab === "history") {
      loadHistory(); // Mỗi lần bấm tab Lịch sử đều tải lại
    }
    if (tab === "shop") {
      loadData();
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerNav}>
        <TouchableOpacity
          onPress={() => handleTabPress("shop")}
          style={[styles.navBtn, viewMode === "shop" && styles.activeNav]}
        >
          <Ionicons
            name="storefront-outline"
            size={20}
            color={viewMode === "shop" ? "#fff" : "#666"}
          />
          <Text>Cửa hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleTabPress("cart")}
          style={[styles.navBtn, viewMode === "cart" && styles.activeNav]}
        >
          <Ionicons
            name="cart-outline"
            size={20}
            color={viewMode === "cart" ? "#fff" : "#666"}
          />
          <Text>Giỏ ({cart.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleTabPress("history")}
          style={[styles.navBtn, viewMode === "history" && styles.activeNav]}
        >
          <Ionicons
            name="receipt-outline"
            size={20}
            color={viewMode === "history" ? "#fff" : "#666"}
          />
          <Text>Lịch sử</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {viewMode === "shop" && (
          <>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                placeholder="Tìm sản phẩm..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>
            <FlatList
              data={filteredProducts}
              keyExtractor={(i) => i.id.toString()}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productCard}
                  onPress={() => {
                    setSelectedProduct(item);
                    setDetailVisible(true);
                  }}
                >
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.img}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.img, styles.placeholder]}>
                      <Ionicons name="cube" size={40} color="#ccc" />
                    </View>
                  )}
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.price}>
                      ₺{Number(item.price).toLocaleString()}
                    </Text>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                    >
                      <Ionicons name="add-cart" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {viewMode === "cart" && (
          <ScrollView>
            {cart.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={64} color="#ddd" />
                <Text style={styles.emptyText}>Giỏ hàng trống</Text>
                <TouchableOpacity
                  style={styles.goShopBtn}
                  onPress={() => handleTabPress("shop")}
                >
                  <Text style={styles.goShopText}>Mua sắm ngay</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {cart.map((item) => (
                  <View key={item.id} style={styles.cartItem}>
                    {item.image && (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.thumbSmall}
                      />
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.cartName}>{item.name}</Text>
                      <Text style={styles.cartPrice}>
                        ₺{Number(item.price).toLocaleString()}
                      </Text>
                      <View style={styles.qtyControl}>
                        <TouchableOpacity
                          onPress={() => updateQuantity(item.id, -1)}
                          style={styles.qtyBtn}
                        >
                          <Text>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          onPress={() => updateQuantity(item.id, 1)}
                          style={styles.qtyBtn}
                        >
                          <Text>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                      <Ionicons name="trash-bin" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={styles.checkoutSummary}>
                  <Text>Tổng cộng:</Text>
                  <Text style={styles.totalPrice}>
                    ₺{totalPrice.toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.payBtn,
                    isProcessingPayment && { opacity: 0.6 },
                  ]}
                  onPress={handleCheckout}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.payText}>THANH TOÁN NGAY</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        )}

        {viewMode === "history" && (
          <FlatList
            data={history}
            keyExtractor={(i) => i.id.toString()}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#ddd" />
                <Text style={styles.emptyText}>Chưa có đơn hàng.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.historyCard}
                onPress={() => viewOrderDetail(item.id)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={styles.histTitle}>Đơn #{item.id}</Text>
                  <Text style={styles.histAmount}>
                    ₺{Number(item.total_amount).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.histSummary} numberOfLines={2}>
                  {item.summary}
                </Text>
                <Text
                  style={{
                    color: "#d97706",
                    fontSize: 12,
                    textAlign: "right",
                    marginTop: 5,
                  }}
                >
                  Xem chi tiết &rarr;
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* MODAL CHI TIẾT SẢN PHẨM */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailSheet}>
            <ScrollView>
              {selectedProduct?.image && (
                <Image
                  source={{ uri: selectedProduct.image }}
                  style={styles.detailImg}
                />
              )}
              <View style={styles.detailInfo}>
                <Text style={styles.detailName}>{selectedProduct?.name}</Text>
                <Text style={styles.detailPrice}>
                  ₺{Number(selectedProduct?.price).toLocaleString()}
                </Text>
                <Text style={styles.detailDesc}>
                  {selectedProduct?.description}
                </Text>
                <TouchableOpacity
                  style={styles.addToCartBig}
                  onPress={() => {
                    if (selectedProduct) addToCart(selectedProduct);
                    setDetailVisible(false);
                  }}
                >
                  <Ionicons name="cart-add" size={24} color="#fff" />
                  <Text
                    style={{ color: "#fff", fontWeight: "bold", marginLeft: 8 }}
                  >
                    Thêm vào giỏ
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeDetailBtn}
              onPress={() => setDetailVisible(false)}
            >
              <Text>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      <Modal
        visible={orderDetailVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setOrderDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Hóa đơn #{selectedOrder?.id}
              </Text>
              <TouchableOpacity onPress={() => setOrderDetailVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
              <Text style={styles.sectionTitle}>Sản phẩm:</Text>
              {selectedOrder?.items.map((item: any, i: number) => (
                <View key={i} style={styles.orderItemRow}>
                  <Text style={{ flex: 1 }}>
                    {item.name} x{item.quantity}
                  </Text>
                  <Text style={styles.itemTotal}>
                    ₺{Number(item.price * item.quantity).toLocaleString()}
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng cộng:</Text>
                <Text style={styles.totalValue}>
                  ₺
                  {selectedOrder
                    ? Number(selectedOrder.total_amount).toLocaleString()
                    : 0}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    gap: 10,
    elevation: 2,
  },
  navBtn: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  activeNav: { backgroundColor: "#d97706" },
  content: { flex: 1, padding: 16 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchInput: { flex: 1, marginLeft: 8 },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
    position: "relative",
  },
  img: { width: "100%", height: 150, backgroundColor: "#f9fafb" },
  placeholder: { justifyContent: "center", alignItems: "center" },
  info: { padding: 10 },
  name: { fontSize: 14, fontWeight: "600", color: "#1f2937", marginBottom: 4 },
  price: { fontSize: 15, color: "#d97706", fontWeight: "bold" },
  addBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#d97706",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#999", marginTop: 10 },
  goShopBtn: {
    marginTop: 20,
    backgroundColor: "#d97706",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goShopText: { color: "#fff", fontWeight: "bold" },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  thumbSmall: { width: 50, height: 50, borderRadius: 8 },
  cartName: { fontWeight: "bold", fontSize: 14 },
  cartPrice: { color: "#d97706", fontSize: 13, marginTop: 2 },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 10,
  },
  qtyBtn: {
    backgroundColor: "#f3f4f6",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: { fontWeight: "bold", minWidth: 20, textAlign: "center" },
  checkoutSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  totalPrice: { fontSize: 18, fontWeight: "bold", color: "#dc2626" },
  payBtn: {
    backgroundColor: "#1f2937",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  payText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  historyCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  histTitle: { fontWeight: "bold", color: "#1f2937" },
  histAmount: { fontWeight: "bold", color: "#d97706" },
  histSummary: { fontSize: 12, color: "#666", marginTop: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  detailSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "50%",
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
  detailDesc: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 15,
  },
  addToCartBig: {
    backgroundColor: "#d97706",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  closeDetailBtn: {
    padding: 15,
    textAlign: "center",
    color: "#666",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemTotal: { fontWeight: "bold", color: "#d97706" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  totalLabel: { fontSize: 16, fontWeight: "bold" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#dc2626" },
});
