import { API_URL, BASE_URL } from "@/constants/config";
import { AddServiceModal } from "@/components/service/AddServiceModal";
import { AdminOrderDetailModal } from "@/components/order/AdminOrderDetailModal";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
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

const formatVND = (num: number | string) => {
  const val = typeof num === "string" ? parseFloat(num) || 0 : num;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return { label: "Chờ xác nhận", bg: "#fef3c7", text: "#b45309", icon: "time-outline" };
    case "confirmed":
      return { label: "Đã xác nhận", bg: "#dcfce7", text: "#15803d", icon: "checkmark-circle" };
    case "processing":
      return { label: "Đang đóng gói", bg: "#f3e8ff", text: "#7e22ce", icon: "cube-outline" };
    case "shipping":
      return { label: "Đang giao", bg: "#ede9fe", text: "#6d28d9", icon: "bicycle-outline" };
    case "completed":
      return { label: "Hoàn tất", bg: "#dcfce7", text: "#15803d", icon: "checkmark-done-circle" };
    case "cancelled":
      return { label: "Đã hủy", bg: "#fee2e2", text: "#b91c1c", icon: "close-circle-outline" };
    default:
      return { label: status, bg: "#f3f4f6", text: "#4b5563", icon: "help-circle-outline" };
  }
};

const getServiceCatBadge = (cat: string) => {
  switch (cat) {
    case "packaging":
      return { label: "🎁 Gói Quà", bg: "#fce7f3", text: "#be185d" };
    case "diy_kit":
      return { label: "🛠️ Kit DIY", bg: "#fef3c7", text: "#b45309" };
    case "mini_decor":
      return { label: "🌿 Decor Mini", bg: "#dcfce7", text: "#15803d" };
    case "lettering":
      return { label: "✍️ Viết Thiệp", bg: "#ede9fe", text: "#6d28d9" };
    case "workshop":
      return { label: "🎨 Workshop", bg: "#e0e7ff", text: "#4338ca" };
    default:
      return { label: `✨ ${cat || "Dịch Vụ"}`, bg: "#f3f4f6", text: "#4b5563" };
  }
};

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "services">("orders");

  // ================= STATE QUẢN LÝ DỊCH VỤ =================
  // 1. Quản lý danh mục dịch vụ hiển thị
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [loadingServicesList, setLoadingServicesList] = useState(false);
  const [refreshingServicesList, setRefreshingServicesList] = useState(false);
  const [serviceSubTab, setServiceSubTab] = useState<"catalog" | "bookings">("catalog");
  const [serviceSearch, setServiceSearch] = useState("");
  const [editingService, setEditingService] = useState<any | null>(null);
  const [visibleServiceModal, setVisibleServiceModal] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);

  // 2. Quản lý lịch hẹn đặt dịch vụ từ khách
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [refreshingBookings, setRefreshingBookings] = useState(false);
  const [filterBookingStatus, setFilterBookingStatus] = useState<string>("all");
  const [processingBookingId, setProcessingBookingId] = useState<number | null>(null);

  // Fetch danh mục dịch vụ
  const fetchAdminServicesList = async (isPull = false) => {
    if (isPull) setRefreshingServicesList(true);
    else setLoadingServicesList(true);

    try {
      const res = await fetch(`${API_URL}/admin/services`);
      if (res.ok) {
        const data = await res.json();
        setServicesList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Lỗi lấy danh mục dịch vụ admin:", e);
    } finally {
      setLoadingServicesList(false);
      setRefreshingServicesList(false);
    }
  };

  // Fetch lịch đặt dịch vụ của khách
  const fetchAdminServiceBookings = async (isPull = false) => {
    if (isPull) setRefreshingBookings(true);
    else setLoadingBookings(true);

    try {
      const res = await fetch(`${API_URL}/admin/service-bookings`);
      if (res.ok) {
        const data = await res.json();
        setServiceBookings(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Lỗi lấy lịch dịch vụ admin:", e);
    } finally {
      setLoadingBookings(false);
      setRefreshingBookings(false);
    }
  };

  // ================= STATE QUẢN LÝ SẢN PHẨM =================
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [refreshingProducts, setRefreshingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form Modal Sản Phẩm
  const [visibleProductModal, setVisibleProductModal] = useState(false);
  const [prodUri, setProdUri] = useState<string | null>(null);
  const [prodImageBase64, setProdImageBase64] = useState<string | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodStock, setProdStock] = useState("10");
  const [prodCategory, setProdCategory] = useState("Đồ thủ công");
  const [prodDescription, setProdDescription] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  // ================= STATE QUẢN LÝ ĐƠN HÀNG =================
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any | null>(null);
  const [visibleOrderDetailModal, setVisibleOrderDetailModal] = useState(false);

  const handleOpenOrderDetail = (order: any) => {
    setSelectedOrderForDetail(order);
    setVisibleOrderDetailModal(true);
  };

  // Fetch danh sách đơn hàng
  const fetchAdminOrders = async (isPull = false) => {
    if (isPull) setRefreshingOrders(true);
    else setLoadingOrders(true);

    try {
      const res = await fetch(`${API_URL}/admin/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Lỗi lấy đơn hàng admin:", e);
    } finally {
      setLoadingOrders(false);
      setRefreshingOrders(false);
    }
  };

  // Fetch danh sách sản phẩm
  const fetchAdminProducts = async (isPull = false) => {
    if (isPull) setRefreshingProducts(true);
    else setLoadingProducts(true);

    try {
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Lỗi lấy sản phẩm admin:", e);
    } finally {
      setLoadingProducts(false);
      setRefreshingProducts(false);
    }
  };

  useEffect(() => {
    fetchAdminOrders();
    fetchAdminProducts();
    fetchAdminServiceBookings();
    fetchAdminServicesList();
  }, []);

  // Mở modal Thêm Dịch Vụ Mới
  const handleOpenAddServiceModal = () => {
    setEditingService(null);
    setVisibleServiceModal(true);
  };

  // Mở modal Sửa Dịch Vụ
  const handleOpenEditServiceModal = (item: any) => {
    setEditingService(item);
    setVisibleServiceModal(true);
  };

  // Xóa Dịch Vụ
  const handleDeleteService = (serviceId: number, serviceName: string) => {
    Alert.alert(
      "Xác nhận xóa dịch vụ",
      `Bạn có chắc chắn muốn xóa dịch vụ "${serviceName}" (Mã #${serviceId})?\nThao tác này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa Ngay",
          style: "destructive",
          onPress: async () => {
            setDeletingServiceId(serviceId);
            try {
              const res = await fetch(`${API_URL}/admin/services/${serviceId}`, {
                method: "DELETE",
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert("Thành công 🎉", data.message || "Đã xóa dịch vụ thành công!");
                fetchAdminServicesList();
              } else {
                Alert.alert("Lỗi", data.message || "Không thể xóa dịch vụ");
              }
            } catch (err: any) {
              Alert.alert("Lỗi kết nối", err.message);
            } finally {
              setDeletingServiceId(null);
            }
          },
        },
      ]
    );
  };

  // Mở modal Thêm Sản Phẩm Mới
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProdUri(null);
    setProdImageBase64(null);
    setProdName("");
    setProdPrice("");
    setProdStock("10");
    setProdCategory("Đồ thủ công");
    setProdDescription("");
    setVisibleProductModal(true);
  };

  // Mở modal Chỉnh Sửa Sản Phẩm
  const handleOpenEditModal = (item: any) => {
    setEditingProduct(item);
    let resolvedImage = item.image;
    if (resolvedImage && !resolvedImage.startsWith("http")) {
      resolvedImage = `${BASE_URL}${resolvedImage}`;
    }
    setProdUri(resolvedImage || null);
    setProdImageBase64(null);
    setProdName(item.name || "");
    setProdPrice(String(item.price || ""));
    setProdStock(String(item.stock ?? 10));
    setProdCategory(item.category || "Đồ thủ công");
    setProdDescription(item.description || "");
    setVisibleProductModal(true);
  };

  // Chọn ảnh từ máy
  const pickProductImage = async () => {
    let res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      setProdUri(res.assets[0].uri);
      if (res.assets[0].base64) {
        setProdImageBase64(`data:image/jpeg;base64,${res.assets[0].base64}`);
      } else {
        setProdImageBase64(res.assets[0].uri);
      }
    }
  };

  // Lưu sản phẩm (Thêm mới hoặc Cập nhật)
  const handleSaveProduct = async () => {
    if (!prodName.trim() || !prodPrice.trim()) {
      return Alert.alert("Lỗi", "Vui lòng nhập tên và giá sản phẩm");
    }

    setSavingProduct(true);
    try {
      const payload: any = {
        name: prodName.trim(),
        price: prodPrice.trim(),
        stock: prodStock.trim() || "0",
        category: prodCategory.trim() || "Đồ thủ công",
        description: prodDescription.trim(),
      };

      if (prodImageBase64) {
        payload.image = prodImageBase64;
      } else if (editingProduct?.image) {
        payload.image = editingProduct.image;
      }

      let url = `${API_URL}/admin/products`;
      let method = "POST";

      if (editingProduct?.id) {
        url = `${API_URL}/admin/products/${editingProduct.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert(
          "Thành công 🎉",
          data.message || (editingProduct ? "Đã cập nhật sản phẩm!" : "Đã thêm sản phẩm mới!")
        );
        setVisibleProductModal(false);
        fetchAdminProducts();
      } else {
        Alert.alert("Lỗi ❌", data.message || "Không thể lưu sản phẩm");
      }
    } catch (e: any) {
      console.error("Admin save product error:", e);
      Alert.alert("Lỗi lưu sản phẩm", e.message || "Không thể kết nối đến máy chủ");
    } finally {
      setSavingProduct(false);
    }
  };

  // Xóa sản phẩm
  const handleDeleteProduct = (productId: number, productName: string) => {
    Alert.alert(
      "Xác nhận xóa sản phẩm",
      `Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm "${productName}" (Mã #${productId})?\nThao tác này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa Ngay",
          style: "destructive",
          onPress: async () => {
            setDeletingProductId(productId);
            try {
              const res = await fetch(`${API_URL}/admin/products/${productId}`, {
                method: "DELETE",
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert("Thành công 🎉", data.message || "Đã xóa sản phẩm thành công!");
                fetchAdminProducts();
              } else {
                Alert.alert("Lỗi", data.message || "Không thể xóa sản phẩm");
              }
            } catch (err: any) {
              Alert.alert("Lỗi kết nối", err.message);
            } finally {
              setDeletingProductId(null);
            }
          },
        },
      ]
    );
  };

  // Cập nhật trạng thái đơn hàng
  const handleUpdateOrderStatus = (orderId: number, newStatus: string, statusLabel: string) => {
    Alert.alert(
      "Xác nhận thay đổi",
      `Bạn có chắc chắn muốn chuyển đơn hàng #${orderId} sang trạng thái "${statusLabel}"?`,
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Đồng Ý",
          onPress: async () => {
            setProcessingOrderId(orderId);
            try {
              let res;
              if (newStatus === "confirmed") {
                res = await fetch(`${API_URL}/orders/${orderId}/confirm-payment`, {
                  method: "POST",
                });
              } else {
                res = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: newStatus }),
                });
              }

              const data = await res.json();
              if (res.ok) {
                Alert.alert("Thành công 🎉", data.message || `Đã chuyển sang ${statusLabel}`);
                fetchAdminOrders();
              } else {
                Alert.alert("Lỗi", data.message || "Không thể cập nhật trạng thái");
              }
            } catch (err: any) {
              Alert.alert("Lỗi kết nối", err.message);
            } finally {
              setProcessingOrderId(null);
            }
          },
        },
      ]
    );
  };

  // Cập nhật trạng thái lịch dịch vụ
  const handleUpdateServiceBookingStatus = (bookingId: number, newStatus: string, statusLabel: string) => {
    Alert.alert(
      "Xác nhận thay đổi",
      `Bạn có chắc chắn muốn chuyển lịch hẹn #${bookingId} sang trạng thái "${statusLabel}"?`,
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Đồng Ý",
          onPress: async () => {
            setProcessingBookingId(bookingId);
            try {
              let res;
              if (newStatus === "confirmed") {
                res = await fetch(`${API_URL}/service-bookings/${bookingId}/confirm-payment`, {
                  method: "POST",
                });
              } else {
                res = await fetch(`${API_URL}/admin/service-bookings/${bookingId}/status`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: newStatus }),
                });
              }

              const data = await res.json();
              if (res.ok) {
                Alert.alert("Thành công 🎉", data.message || `Đã chuyển sang ${statusLabel}`);
                fetchAdminServiceBookings();
              } else {
                Alert.alert("Lỗi", data.message || "Không thể cập nhật trạng thái");
              }
            } catch (err: any) {
              Alert.alert("Lỗi kết nối", err.message);
            } finally {
              setProcessingBookingId(null);
            }
          },
        },
      ]
    );
  };

  // Lọc đơn hàng
  const filteredOrders = orders.filter((o) => {
    if (filterStatus === "all") return true;
    return o.status === filterStatus;
  });

  // Lọc sản phẩm theo tìm kiếm
  const filteredProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const term = productSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term) ||
      String(p.id).includes(term)
    );
  });

  // Lọc lịch dịch vụ
  const filteredServiceBookings = serviceBookings.filter((b) => {
    if (filterBookingStatus === "all") return true;
    return b.status === filterBookingStatus;
  });

  // Lọc danh mục dịch vụ theo tìm kiếm
  const filteredServicesList = servicesList.filter((serv) => {
    if (!serviceSearch.trim()) return true;
    const term = serviceSearch.toLowerCase();
    return (
      serv.name?.toLowerCase().includes(term) ||
      serv.category?.toLowerCase().includes(term) ||
      serv.description?.toLowerCase().includes(term) ||
      String(serv.id).includes(term)
    );
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;
  const pendingServiceCount = serviceBookings.filter((b) => b.status === "pending").length;
  const inProgressServiceCount = serviceBookings.filter((b) => b.status === "in_progress").length;

  return (
    <View style={s.container}>
      {/* HEADER QUẢN TRỊ */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Kênh Quản Trị</Text>
          <Text style={s.headerSub}>Quản lý sản phẩm & dịch vụ Eiko Shop</Text>
        </View>

        {activeTab === "services" ? (
          <TouchableOpacity
            style={[s.btnAddProduct, { backgroundColor: "#be185d" }]}
            onPress={handleOpenAddServiceModal}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={17} color="#fff" />
            <Text style={s.btnAddText}>+ Thêm Dịch Vụ</Text>
          </TouchableOpacity>
        ) : activeTab === "products" ? (
          <TouchableOpacity
            style={s.btnAddProduct}
            onPress={handleOpenAddModal}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={s.btnAddText}>Tạo SP</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity
              style={[s.btnAddProduct, { backgroundColor: "#be185d", paddingHorizontal: 10 }]}
              onPress={handleOpenAddServiceModal}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={15} color="#fff" />
              <Text style={s.btnAddText}>+ Dịch Vụ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnAddProduct, { paddingHorizontal: 10 }]}
              onPress={handleOpenAddModal}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={15} color="#fff" />
              <Text style={s.btnAddText}>+ SP</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* SEGMENTED TAB BAR */}
      <View style={s.segmentRow}>
        <TouchableOpacity
          style={[s.segmentBtn, activeTab === "orders" && s.segmentBtnActive]}
          onPress={() => setActiveTab("orders")}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color={activeTab === "orders" ? "#d97706" : "#6b7280"}
          />
          <Text style={[s.segmentText, activeTab === "orders" && s.segmentTextActive]}>
            Đơn ({orders.length})
          </Text>
          {pendingCount > 0 && (
            <View style={s.tabBadge}>
              <Text style={s.tabBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.segmentBtn, activeTab === "products" && s.segmentBtnActive]}
          onPress={() => setActiveTab("products")}
        >
          <Ionicons
            name="cube-outline"
            size={16}
            color={activeTab === "products" ? "#d97706" : "#6b7280"}
          />
          <Text style={[s.segmentText, activeTab === "products" && s.segmentTextActive]}>
            Sản Phẩm ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.segmentBtn, activeTab === "services" && s.segmentBtnActive]}
          onPress={() => setActiveTab("services")}
        >
          <Ionicons
            name="sparkles-outline"
            size={16}
            color={activeTab === "services" ? "#be185d" : "#6b7280"}
          />
          <Text style={[s.segmentText, activeTab === "services" && { color: "#be185d", fontWeight: "700" }]}>
            Dịch Vụ ({servicesList.length})
          </Text>
          {pendingServiceCount > 0 && (
            <View style={[s.tabBadge, { backgroundColor: "#be185d" }]}>
              <Text style={s.tabBadgeText}>{pendingServiceCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ================= TAB 1: QUẢN LÝ ĐƠN HÀNG ================= */}
      {activeTab === "orders" && (
        <>
          {/* STATS QUICK BAR */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statNum}>{orders.length}</Text>
              <Text style={s.statLabel}>Tổng đơn</Text>
            </View>
            <View style={[s.statCard, s.statPending]}>
              <Text style={[s.statNum, { color: "#b45309" }]}>{pendingCount}</Text>
              <Text style={[s.statLabel, { color: "#b45309" }]}>Chờ xác nhận</Text>
            </View>
            <View style={[s.statCard, s.statConfirmed]}>
              <Text style={[s.statNum, { color: "#15803d" }]}>{confirmedCount}</Text>
              <Text style={[s.statLabel, { color: "#15803d" }]}>Đã xác nhận</Text>
            </View>
          </View>

          {/* FILTER CHIPS */}
          <View style={s.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
              {[
                { id: "all", label: "Tất cả" },
                { id: "pending", label: "Chờ xác nhận" },
                { id: "confirmed", label: "Đã xác nhận" },
                { id: "shipping", label: "Đang giao" },
                { id: "completed", label: "Hoàn tất" },
                { id: "cancelled", label: "Đã hủy" },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[s.chip, filterStatus === f.id && s.chipActive]}
                  onPress={() => setFilterStatus(f.id)}
                >
                  <Text style={[s.chipText, filterStatus === f.id && s.chipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ORDERS LIST */}
          {loadingOrders ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color="#d97706" />
              <Text style={{ marginTop: 10, color: "#6b7280" }}>Đang tải danh sách đơn...</Text>
            </View>
          ) : filteredOrders.length === 0 ? (
            <View style={s.center}>
              <Ionicons name="receipt-outline" size={56} color="#d1d5db" />
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#4b5563", marginTop: 8 }}>
                Không có đơn hàng nào
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshingOrders}
                  onRefresh={() => fetchAdminOrders(true)}
                  colors={["#d97706"]}
                />
              }
              renderItem={({ item }) => {
                const badge = getStatusBadge(item.status);
                const isProcessing = processingOrderId === item.id;

                return (
                  <TouchableOpacity
                    style={s.orderCard}
                    activeOpacity={0.88}
                    onPress={() => handleOpenOrderDetail(item)}
                  >
                    {/* CARD HEADER */}
                    <View style={s.cardHeader}>
                      <View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={s.orderCode}>{item.order_code || `Đơn #${item.id}`}</Text>
                          <View style={s.viewDetailTag}>
                            <Text style={s.viewDetailTagText}>Xem chi tiết</Text>
                            <Ionicons name="chevron-forward" size={11} color="#b45309" />
                          </View>
                        </View>
                        <Text style={s.orderDate}>
                          {item.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : ""}
                        </Text>
                      </View>
                      <View style={[s.badge, { backgroundColor: badge.bg }]}>
                        <Ionicons name={badge.icon as any} size={13} color={badge.text} />
                        <Text style={[s.badgeText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>

                    {/* CUSTOMER INFO */}
                    <View style={s.custInfo}>
                      <Text style={s.custName}>👤 {item.customer_name} ({item.phone || "---"})</Text>
                      <Text style={s.custAddress} numberOfLines={2}>📍 {item.address || "Chưa có địa chỉ"}</Text>
                      {item.details && (
                        <Text style={s.custItems} numberOfLines={2}>📦 {item.details}</Text>
                      )}
                    </View>

                    {/* CARD FOOTER */}
                    <View style={s.cardFooter}>
                      <View>
                        <Text style={s.totalLabel}>
                          Thanh toán: {item.payment_method || "COD"} •{" "}
                          <Text style={{ color: item.payment_status === "paid" ? "#16a34a" : "#dc2626", fontWeight: "700" }}>
                            {item.payment_status === "paid" ? "ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN"}
                          </Text>
                        </Text>
                        <Text style={s.totalAmount}>{formatVND(item.total_amount)}</Text>
                      </View>

                      {/* ACTION BUTTONS */}
                      <View style={s.actionRow}>
                        {/* NÚT CHI TIẾT */}
                        <TouchableOpacity
                          style={s.btnDetailHint}
                          onPress={() => handleOpenOrderDetail(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="eye-outline" size={13} color="#b45309" />
                          <Text style={s.btnDetailHintText}>Chi tiết</Text>
                        </TouchableOpacity>

                        {item.status === "pending" && (
                          <>
                            <TouchableOpacity
                              style={s.btnCancel}
                              disabled={isProcessing}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleUpdateOrderStatus(item.id, "cancelled", "Đã hủy");
                              }}
                            >
                              <Text style={s.btnCancelText}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={s.btnConfirm}
                              disabled={isProcessing}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleUpdateOrderStatus(item.id, "confirmed", "Đã xác nhận");
                              }}
                            >
                              {isProcessing ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <>
                                  <Ionicons name="checkmark-circle" size={14} color="#fff" />
                                  <Text style={s.btnConfirmText}>Xác Nhận TT</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </>
                        )}

                        {item.status === "confirmed" && (
                          <TouchableOpacity
                            style={s.btnShip}
                            disabled={isProcessing}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleUpdateOrderStatus(item.id, "shipping", "Đang giao");
                            }}
                          >
                            <Ionicons name="bicycle-outline" size={14} color="#fff" />
                            <Text style={s.btnConfirmText}>Giao Hàng</Text>
                          </TouchableOpacity>
                        )}

                        {item.status === "shipping" && (
                          <TouchableOpacity
                            style={s.btnComplete}
                            disabled={isProcessing}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleUpdateOrderStatus(item.id, "completed", "Hoàn tất");
                            }}
                          >
                            <Ionicons name="checkmark-done" size={14} color="#fff" />
                            <Text style={s.btnConfirmText}>Hoàn Tất</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </>
      )}

      {/* ================= TAB 2: QUẢN LÝ SẢN PHẨM (SỬA & XÓA) ================= */}
      {activeTab === "products" && (
        <View style={{ flex: 1 }}>
          {/* SEARCH BOX */}
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={18} color="#9ca3af" />
            <TextInput
              style={s.searchBox}
              placeholder="Tìm theo tên hoặc danh mục..."
              placeholderTextColor="#9ca3af"
              value={productSearch}
              onChangeText={setProductSearch}
            />
            {productSearch.length > 0 && (
              <TouchableOpacity onPress={() => setProductSearch("")}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* PRODUCTS LIST */}
          {loadingProducts ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color="#d97706" />
              <Text style={{ marginTop: 10, color: "#6b7280" }}>Đang tải danh sách sản phẩm...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={s.center}>
              <Ionicons name="cube-outline" size={56} color="#d1d5db" />
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#4b5563", marginTop: 8 }}>
                Không tìm thấy sản phẩm phù hợp
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshingProducts}
                  onRefresh={() => fetchAdminProducts(true)}
                  colors={["#d97706"]}
                />
              }
              renderItem={({ item }) => {
                let imgUri = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80";
                if (item.image) {
                  imgUri = item.image.startsWith("http") ? item.image : `${BASE_URL}${item.image}`;
                }
                const isDeleting = deletingProductId === item.id;

                return (
                  <View style={s.prodCard}>
                    {/* THUMBNAIL */}
                    <Image source={{ uri: imgUri }} style={s.prodThumb} resizeMode="cover" />

                    {/* CONTENT */}
                    <View style={s.prodContent}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text style={s.prodName} numberOfLines={1}>{item.name}</Text>
                        <Text style={s.prodCatBadge}>{item.category || "Thủ công"}</Text>
                      </View>

                      <Text style={s.prodPrice}>{formatVND(item.price)}</Text>

                      <View style={s.prodMetaRow}>
                        <Text style={s.prodStock}>
                          Kho: <Text style={{ fontWeight: "700", color: item.stock <= 0 ? "#dc2626" : "#1f2937" }}>{item.stock} món</Text>
                        </Text>
                        {item.stock <= 0 && (
                          <Text style={s.outOfStockTag}>Hết hàng</Text>
                        )}
                      </View>

                      {/* ACTION BUTTONS (SỬA & XÓA) */}
                      <View style={s.prodActions}>
                        <TouchableOpacity
                          style={s.btnEditProd}
                          onPress={() => handleOpenEditModal(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="pencil" size={14} color="#0284c7" />
                          <Text style={s.btnEditText}>Sửa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={s.btnDeleteProd}
                          disabled={isDeleting}
                          onPress={() => handleDeleteProduct(item.id, item.name)}
                          activeOpacity={0.8}
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color="#dc2626" />
                          ) : (
                            <>
                              <Ionicons name="trash-outline" size={14} color="#dc2626" />
                              <Text style={s.btnDeleteText}>Xóa</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* ================= TAB 3: QUẢN LÝ DỊCH VỤ ================= */}
      {activeTab === "services" && (
        <View style={{ flex: 1 }}>
          {/* SUB-TABS: DANH SÁCH DỊCH VỤ vs LỊCH ĐẶT */}
          <View style={s.subTabRow}>
            <TouchableOpacity
              style={[s.subTabBtn, serviceSubTab === "catalog" && s.subTabBtnActive]}
              onPress={() => setServiceSubTab("catalog")}
            >
              <Ionicons
                name="sparkles"
                size={14}
                color={serviceSubTab === "catalog" ? "#be185d" : "#6b7280"}
              />
              <Text
                style={[
                  s.subTabBtnText,
                  serviceSubTab === "catalog" && s.subTabBtnTextActive,
                ]}
              >
                Dịch Vụ Eiko ({servicesList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.subTabBtn, serviceSubTab === "bookings" && s.subTabBtnActive]}
              onPress={() => setServiceSubTab("bookings")}
            >
              <Ionicons
                name="calendar"
                size={14}
                color={serviceSubTab === "bookings" ? "#be185d" : "#6b7280"}
              />
              <Text
                style={[
                  s.subTabBtnText,
                  serviceSubTab === "bookings" && s.subTabBtnTextActive,
                ]}
              >
                Lịch Đặt Của Khách ({serviceBookings.length})
              </Text>
              {pendingServiceCount > 0 && (
                <View style={[s.tabBadge, { backgroundColor: "#be185d" }]}>
                  <Text style={s.tabBadgeText}>{pendingServiceCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* SUB-TAB 1: QUẢN LÝ DANH MỤC DỊCH VỤ (THÊM, SỬA, XÓA) */}
          {serviceSubTab === "catalog" && (
            <View style={{ flex: 1 }}>
              {/* PROMINENT ADD SERVICE BANNER BUTTON */}
              <View style={s.addServiceBanner}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={s.addServiceBannerTitle}>Dịch Vụ Cá Nhân & Gói Quà 🎁</Text>
                  <Text style={s.addServiceBannerSub}>
                    Gói quà kraft hoa khô, kit DIY, viết thiệp thư pháp...
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.btnAddServiceCTA}
                  onPress={handleOpenAddServiceModal}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle" size={18} color="#fff" />
                  <Text style={s.btnAddServiceCTAText}>Thêm Dịch Vụ</Text>
                </TouchableOpacity>
              </View>

              {/* SEARCH BOX FOR SERVICES */}
              <View style={s.searchWrap}>
                <Ionicons name="search-outline" size={18} color="#9ca3af" />
                <TextInput
                  style={s.searchBox}
                  placeholder="Tìm theo tên dịch vụ, danh mục..."
                  placeholderTextColor="#9ca3af"
                  value={serviceSearch}
                  onChangeText={setServiceSearch}
                />
                {serviceSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setServiceSearch("")}>
                    <Ionicons name="close-circle" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>

              {/* SERVICES LIST */}
              {loadingServicesList ? (
                <View style={s.center}>
                  <ActivityIndicator size="large" color="#be185d" />
                  <Text style={{ marginTop: 10, color: "#6b7280" }}>Đang tải danh mục dịch vụ...</Text>
                </View>
              ) : filteredServicesList.length === 0 ? (
                <View style={s.center}>
                  <Ionicons name="sparkles-outline" size={56} color="#d1d5db" />
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: "#4b5563", marginTop: 8 }}>
                    Chưa có dịch vụ nào
                  </Text>
                  <TouchableOpacity
                    style={[s.btnAddServiceCTA, { marginTop: 12 }]}
                    onPress={handleOpenAddServiceModal}
                  >
                    <Ionicons name="add-circle" size={18} color="#fff" />
                    <Text style={s.btnAddServiceCTAText}>Thêm Dịch Vụ Mới</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={filteredServicesList}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshingServicesList}
                      onRefresh={() => fetchAdminServicesList(true)}
                      colors={["#be185d"]}
                    />
                  }
                  renderItem={({ item }) => {
                    let imgUri = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80";
                    if (item.image) {
                      imgUri = item.image.startsWith("http") ? item.image : `${BASE_URL}${item.image}`;
                    }
                    const catBadge = getServiceCatBadge(item.category);
                    const isDeleting = deletingServiceId === item.id;

                    return (
                      <View style={s.servCard}>
                        {/* THUMBNAIL */}
                        <Image source={{ uri: imgUri }} style={s.servThumb} resizeMode="cover" />

                        {/* CONTENT */}
                        <View style={s.servContent}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Text style={s.servName} numberOfLines={1}>{item.name}</Text>
                            <View style={[s.servCatBadge, { backgroundColor: catBadge.bg }]}>
                              <Text style={[s.servCatBadgeText, { color: catBadge.text }]}>{catBadge.label}</Text>
                            </View>
                          </View>

                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                            <Text style={s.servPrice}>{formatVND(item.price)}</Text>
                            <View style={s.servDurationBadge}>
                              <Ionicons name="time-outline" size={11} color="#be185d" />
                              <Text style={s.servDurationText}>{item.duration_minutes || 30}p</Text>
                            </View>
                          </View>

                          {item.description ? (
                            <Text style={s.servDesc} numberOfLines={2}>
                              {item.description}
                            </Text>
                          ) : null}

                          {/* ACTION BUTTONS (SỬA & XÓA) */}
                          <View style={s.prodActions}>
                            <TouchableOpacity
                              style={s.btnEditProd}
                              onPress={() => handleOpenEditServiceModal(item)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="pencil" size={13} color="#0284c7" />
                              <Text style={s.btnEditText}>Sửa</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={s.btnDeleteProd}
                              disabled={isDeleting}
                              onPress={() => handleDeleteService(item.id, item.name)}
                              activeOpacity={0.8}
                            >
                              {isDeleting ? (
                                <ActivityIndicator size="small" color="#dc2626" />
                              ) : (
                                <>
                                  <Ionicons name="trash-outline" size={13} color="#dc2626" />
                                  <Text style={s.btnDeleteText}>Xóa</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  }}
                />
              )}
            </View>
          )}

          {/* SUB-TAB 2: QUẢN LÝ LỊCH HẸN ĐẶT DỊCH VỤ CỦA KHÁCH */}
          {serviceSubTab === "bookings" && (
            <>
              {/* STATS QUICK BAR */}
              <View style={s.statsRow}>
                <View style={s.statCard}>
                  <Text style={s.statNum}>{serviceBookings.length}</Text>
                  <Text style={s.statLabel}>Tổng lịch đặt</Text>
                </View>
                <View style={[s.statCard, s.statPending]}>
                  <Text style={[s.statNum, { color: "#b45309" }]}>{pendingServiceCount}</Text>
                  <Text style={[s.statLabel, { color: "#b45309" }]}>Chờ xác nhận</Text>
                </View>
                <View style={[s.statCard, { borderColor: "#fbcfe8", backgroundColor: "#fdf2f8" }]}>
                  <Text style={[s.statNum, { color: "#be185d" }]}>{inProgressServiceCount}</Text>
                  <Text style={[s.statLabel, { color: "#be185d" }]}>Đang làm</Text>
                </View>
              </View>

              {/* FILTER CHIPS */}
              <View style={s.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "pending", label: "Chờ xác nhận" },
                    { id: "confirmed", label: "Đã xác nhận" },
                    { id: "in_progress", label: "Đang làm" },
                    { id: "completed", label: "Hoàn tất" },
                    { id: "cancelled", label: "Đã hủy" },
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[s.chip, filterBookingStatus === f.id && { backgroundColor: "#be185d", borderColor: "#be185d" }]}
                      onPress={() => setFilterBookingStatus(f.id)}
                    >
                      <Text style={[s.chipText, filterBookingStatus === f.id && { color: "#fff" }]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* SERVICE BOOKINGS LIST */}
              {loadingBookings ? (
                <View style={s.center}>
                  <ActivityIndicator size="large" color="#be185d" />
                  <Text style={{ marginTop: 10, color: "#6b7280" }}>Đang tải danh sách đặt dịch vụ...</Text>
                </View>
              ) : filteredServiceBookings.length === 0 ? (
                <View style={s.center}>
                  <Ionicons name="sparkles-outline" size={56} color="#d1d5db" />
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: "#4b5563", marginTop: 8 }}>
                    Không có lịch đặt dịch vụ nào
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredServiceBookings}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshingBookings}
                      onRefresh={() => fetchAdminServiceBookings(true)}
                      colors={["#be185d"]}
                    />
                  }
                  renderItem={({ item }) => {
                    const isProcessing = processingBookingId === item.id;
                    let badge = { label: item.status, bg: "#f3f4f6", text: "#4b5563" };
                    if (item.status === "pending") badge = { label: "Chờ xác nhận", bg: "#fef3c7", text: "#b45309" };
                    else if (item.status === "confirmed") badge = { label: "Đã xác nhận", bg: "#dcfce7", text: "#15803d" };
                    else if (item.status === "in_progress") badge = { label: "Đang làm", bg: "#e0e7ff", text: "#4338ca" };
                    else if (item.status === "completed") badge = { label: "Hoàn tất", bg: "#dcfce7", text: "#15803d" };
                    else if (item.status === "cancelled") badge = { label: "Đã hủy", bg: "#fee2e2", text: "#b91c1c" };

                    let apptDateStr = "";
                    if (item.appointment_date) {
                      try {
                        const d = new Date(item.appointment_date);
                        apptDateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                      } catch {
                        apptDateStr = item.appointment_date;
                      }
                    }

                    return (
                      <View style={s.orderCard}>
                        {/* CARD HEADER */}
                        <View style={s.cardHeader}>
                          <View>
                            <Text style={[s.orderCode, { color: "#be185d" }]}>
                              {item.booking_code || `DV-${item.id}`}
                            </Text>
                            <Text style={s.orderDate}>
                              Hẹn ngày: {apptDateStr || "Chưa xác định"}
                            </Text>
                          </View>
                          <View style={[s.badge, { backgroundColor: badge.bg }]}>
                            <Text style={[s.badgeText, { color: badge.text }]}>{badge.label}</Text>
                          </View>
                        </View>

                        {/* SERVICE & CUSTOMER DETAILS */}
                        <View style={s.custInfo}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <Ionicons name="sparkles" size={15} color="#be185d" />
                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1f2937" }}>
                              {item.service_name || "Dịch vụ Eiko"}
                            </Text>
                            {item.duration_minutes ? (
                              <Text style={{ fontSize: 12, color: "#be185d", backgroundColor: "#fce7f3", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                                {item.duration_minutes}p
                              </Text>
                            ) : null}
                          </View>

                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <Ionicons name="person" size={14} color="#6b7280" />
                            <Text style={{ fontSize: 13, color: "#374151" }}>
                              {item.customer_name} - <Text style={{ fontWeight: "600" }}>{item.customer_phone}</Text>
                            </Text>
                          </View>

                          {item.customer_address ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                              <Ionicons name="location" size={14} color="#6b7280" />
                              <Text style={{ fontSize: 12, color: "#6b7280" }} numberOfLines={1}>
                                {item.customer_address}
                              </Text>
                            </View>
                          ) : null}

                          {item.customer_note ? (
                            <View style={{ backgroundColor: "#fdf2f8", padding: 8, borderRadius: 8, marginTop: 8 }}>
                              <Text style={{ fontSize: 12, color: "#831843" }}>
                                <Text style={{ fontWeight: "700" }}>Yêu cầu: </Text>
                                {item.customer_note}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* CARD FOOTER: PRICE & PAYMENT STATUS */}
                        <View style={s.cardFooter}>
                          <View>
                            <Text style={{ fontSize: 11, color: "#9ca3af" }}>Phí dịch vụ:</Text>
                            <Text style={[s.totalAmount, { color: "#dc2626" }]}>
                              {formatVND(item.estimated_price)}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "600",
                                color: item.payment_status === "paid" ? "#15803d" : "#b45309",
                                marginTop: 2,
                              }}
                            >
                              {item.payment_status === "paid" ? "● Đã thanh toán" : "○ Chưa thanh toán"} ({item.payment_method || "COD"})
                            </Text>
                          </View>

                          {/* ACTION BUTTONS */}
                          <View style={{ flexDirection: "row", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                            {item.status === "pending" && (
                              <>
                                <TouchableOpacity
                                  style={[s.btnServiceAction, { backgroundColor: "#15803d" }]}
                                  onPress={() => handleUpdateServiceBookingStatus(item.id, "confirmed", "Đã xác nhận")}
                                  disabled={isProcessing}
                                >
                                  <Text style={s.btnServiceActionText}>Xác Nhận (Đã TT)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[s.btnServiceAction, { backgroundColor: "#dc2626" }]}
                                  onPress={() => handleUpdateServiceBookingStatus(item.id, "cancelled", "Đã hủy")}
                                  disabled={isProcessing}
                                >
                                  <Text style={s.btnServiceActionText}>Hủy</Text>
                                </TouchableOpacity>
                              </>
                            )}

                            {item.status === "confirmed" && (
                              <>
                                <TouchableOpacity
                                  style={[s.btnServiceAction, { backgroundColor: "#4338ca" }]}
                                  onPress={() => handleUpdateServiceBookingStatus(item.id, "in_progress", "Đang thực hiện")}
                                  disabled={isProcessing}
                                >
                                  <Text style={s.btnServiceActionText}>Bắt Đầu Làm</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[s.btnServiceAction, { backgroundColor: "#dc2626" }]}
                                  onPress={() => handleUpdateServiceBookingStatus(item.id, "cancelled", "Đã hủy")}
                                  disabled={isProcessing}
                                >
                                  <Text style={s.btnServiceActionText}>Hủy</Text>
                                </TouchableOpacity>
                              </>
                            )}

                            {item.status === "in_progress" && (
                              <>
                                <TouchableOpacity
                                  style={[s.btnServiceAction, { backgroundColor: "#15803d" }]}
                                  onPress={() => handleUpdateServiceBookingStatus(item.id, "completed", "Hoàn tất")}
                                  disabled={isProcessing}
                                >
                                  <Text style={s.btnServiceActionText}>Hoàn Tất Dịch Vụ</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[s.btnServiceAction, { backgroundColor: "#dc2626" }]}
                                  onPress={() => handleUpdateServiceBookingStatus(item.id, "cancelled", "Đã hủy")}
                                  disabled={isProcessing}
                                >
                                  <Text style={s.btnServiceActionText}>Hủy</Text>
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  }}
                />
              )}
            </>
          )}
        </View>
      )}

      {/* ================= MODAL SỬA / THÊM SẢN PHẨM ================= */}
      <Modal visible={visibleProductModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>
                  {editingProduct ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
                </Text>
                <TouchableOpacity onPress={() => setVisibleProductModal(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={pickProductImage} style={s.imgArea}>
                {prodUri ? (
                  <Image source={{ uri: prodUri }} style={s.preview} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="camera-outline" size={32} color="#9ca3af" />
                    <Text style={{ color: "#6b7280", marginTop: 4, fontSize: 13 }}>
                      Bấm để chọn ảnh từ thư viện
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={s.inputLabel}>Tên sản phẩm *</Text>
              <TextInput
                placeholder="Nhập tên sản phẩm..."
                placeholderTextColor="#9ca3af"
                style={s.input}
                value={prodName}
                onChangeText={setProdName}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Giá bán (VNĐ) *</Text>
                  <TextInput
                    placeholder="VD: 150000"
                    placeholderTextColor="#9ca3af"
                    style={s.input}
                    value={prodPrice}
                    onChangeText={setProdPrice}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Tồn kho</Text>
                  <TextInput
                    placeholder="VD: 20"
                    placeholderTextColor="#9ca3af"
                    style={s.input}
                    value={prodStock}
                    onChangeText={setProdStock}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={s.inputLabel}>Danh mục</Text>
              <TextInput
                placeholder="VD: Đồ thủ công, Gốm sứ, Thời trang..."
                placeholderTextColor="#9ca3af"
                style={s.input}
                value={prodCategory}
                onChangeText={setProdCategory}
              />

              <Text style={s.inputLabel}>Mô tả chi tiết</Text>
              <TextInput
                placeholder="Mô tả chất liệu, nguồn gốc làng nghề..."
                placeholderTextColor="#9ca3af"
                style={[s.input, { height: 80, textAlignVertical: "top" }]}
                value={prodDescription}
                onChangeText={setProdDescription}
                multiline
              />

              <TouchableOpacity
                style={[s.btnSave, savingProduct && { opacity: 0.6 }]}
                onPress={handleSaveProduct}
                disabled={savingProduct}
              >
                {savingProduct ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnSaveText}>
                    {editingProduct ? "LƯU THAY ĐỔI" : "THÊM SẢN PHẨM"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL THÊM / SỬA DỊCH VỤ ================= */}
      <AddServiceModal
        visible={visibleServiceModal}
        onClose={() => setVisibleServiceModal(false)}
        onSuccess={() => {
          fetchAdminServicesList();
        }}
        editingService={editingService}
      />

      {/* ================= MODAL CHI TIẾT ĐƠN HÀNG ADMIN ================= */}
      <AdminOrderDetailModal
        visible={visibleOrderDetailModal}
        orderId={selectedOrderForDetail?.id || null}
        initialOrderSummary={selectedOrderForDetail}
        onClose={() => {
          setVisibleOrderDetailModal(false);
          setSelectedOrderForDetail(null);
        }}
        onStatusUpdated={() => {
          fetchAdminOrders();
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1f2937" },
  headerSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  btnAddProduct: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#d97706",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnAddText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Segment Tab Bar
  segmentRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    position: "relative",
  },
  segmentBtnActive: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  segmentTextActive: {
    color: "#d97706",
    fontWeight: "700",
  },
  tabBadge: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Stats Bar
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statPending: { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
  statConfirmed: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  statNum: { fontSize: 18, fontWeight: "800", color: "#1f2937" },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },

  // Filter Chips
  filterRow: {
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  chipActive: { backgroundColor: "#d97706" },
  chipText: { fontSize: 12, color: "#4b5563", fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  // Order Cards
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  orderCode: { fontSize: 14, fontWeight: "800", color: "#1f2937" },
  orderDate: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  custInfo: {
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    gap: 4,
  },
  custName: { fontSize: 13, fontWeight: "700", color: "#374151" },
  custAddress: { fontSize: 12, color: "#6b7280" },
  custItems: { fontSize: 12, color: "#4b5563", fontStyle: "italic" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 10,
  },
  totalLabel: { fontSize: 11, color: "#6b7280" },
  totalAmount: { fontSize: 15, fontWeight: "800", color: "#d97706" },
  actionRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  btnCancel: {
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnCancelText: { color: "#ef4444", fontSize: 11, fontWeight: "700" },
  btnConfirm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#16a34a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnConfirmText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  btnShip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#6d28d9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnComplete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0284c7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },

  // Products Tab Styles
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  searchBox: {
    flex: 1,
    fontSize: 13,
    color: "#1f2937",
    padding: 0,
  },
  prodCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    gap: 12,
  },
  prodThumb: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  prodContent: {
    flex: 1,
    gap: 3,
  },
  prodName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
  },
  prodCatBadge: {
    fontSize: 10,
    color: "#7c3aed",
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: "600",
  },
  prodPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#d97706",
  },
  prodMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  prodStock: {
    fontSize: 12,
    color: "#6b7280",
  },
  outOfStockTag: {
    fontSize: 10,
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: "700",
  },
  prodActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  btnEditProd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e0f2fe",
    borderColor: "#bae6fd",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnEditText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0284c7",
  },
  btnDeleteProd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnDeleteText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#dc2626",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1f2937" },
  imgArea: {
    height: 140,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  preview: { width: "100%", height: "100%" },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    color: "#1f2937",
    backgroundColor: "#ffffff",
    fontSize: 13,
  },
  btnSave: {
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  btnSaveText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  btnServiceAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnServiceActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  // Service Catalog Sub-Tab Styles
  subTabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  subTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  subTabBtnActive: {
    backgroundColor: "#fdf2f8",
    borderColor: "#fbcfe8",
  },
  subTabBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  subTabBtnTextActive: {
    color: "#be185d",
    fontWeight: "700",
  },
  addServiceBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fdf2f8",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fbcfe8",
  },
  addServiceBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#831843",
  },
  addServiceBannerSub: {
    fontSize: 11,
    color: "#9d174d",
    marginTop: 2,
  },
  btnAddServiceCTA: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#be185d",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: "#be185d",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  btnAddServiceCTAText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  servCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    gap: 12,
  },
  servThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  servContent: {
    flex: 1,
    gap: 3,
  },
  servName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
  },
  servCatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  servCatBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  servPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#be185d",
  },
  servDurationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#fdf2f8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  servDurationText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#be185d",
  },
  servDesc: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 16,
  },
  viewDetailTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#fffbeb",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  viewDetailTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#b45309",
  },
  btnDetailHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnDetailHintText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#b45309",
  },
});
