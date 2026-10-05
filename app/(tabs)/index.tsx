// app/(tabs)/index.tsx
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CheckoutModal, CheckoutDirectItem } from "@/components/order/CheckoutModal";
import { OrderHistoryModal } from "@/components/order/OrderHistoryModal";
import { ServiceBookingHistoryModal } from "@/components/service/ServiceBookingHistoryModal";
import { ServiceBookingModal } from "@/components/service/ServiceBookingModal";
import {
  ServiceDetailModal,
  resolveServiceImage,
} from "@/components/service/ServiceDetailModal";
import { ProductDetailModal } from "@/components/product/ProductDetailModal";
import { API_URL, BASE_URL } from "@/constants/config";
import { useAuthStore } from "@/src/stores/useAuthStore";
import { useCartStore } from "@/src/stores/useCartStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  TouchableOpacity,
  View,
} from "react-native";

interface ServiceItem {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  duration_minutes: number;
}

interface ProductItem {
  id: number;
  sku?: string;
  name: string;
  price: number | string;
  stock: number;
  image?: string;
  category?: string;
  rating?: number;
  review_count?: number;
  description?: string;
}

const formatVND = (num: number | string | undefined) => {
  const val = typeof num === "string" ? parseFloat(num) || 0 : num || 0;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, initAuth } = useAuthStore();
  const { loadCart, getItemCount, addToCart } = useCartStore();
  const cartItemCount = getItemCount();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState<ServiceItem | null>(null);
  const [serviceDetailModalVisible, setServiceDetailModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [cartDrawerVisible, setCartDrawerVisible] = useState(false);

  // Product Detail & Direct Buy modal
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [productBuyQty, setProductBuyQty] = useState(1);
  const [directCheckoutItem, setDirectCheckoutItem] = useState<CheckoutDirectItem | null>(null);
  const [directCheckoutVisible, setDirectCheckoutVisible] = useState(false);

  useEffect(() => {
    initAuth();
    loadCart();
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [servRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/personal-services`),
        fetch(`${API_URL}/products`),
      ]);

      if (servRes.ok) {
        const servData = await servRes.json();
        setServices(Array.isArray(servData) ? servData : []);
      }

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const list = Array.isArray(prodData) ? prodData : prodData.data || [];
        setFeaturedProducts(list.slice(0, 6)); // Top 6 sản phẩm nổi bật
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu trang chủ:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const getServiceCategoryLabel = (cat: string) => {
    switch (cat) {
      case "packaging":
        return "🎁 Gói Quà";
      case "diy_kit":
        return "🛠️ Kit Tự Làm";
      case "mini_decor":
        return "🌿 Decor Mini";
      case "lettering":
        return "✍️ Viết Thiệp";
      default:
        return "✨ Dịch Vụ";
    }
  };

  const handleCopyVoucher = (code: string, desc: string) => {
    Alert.alert("Mã Ưu Đãi 🎟️", `Mã "${code}": ${desc}\n\nHãy dán mã này ở giỏ hàng để được giảm giá ngay khi mua sắm nhé!`);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#d97706"]} />}
    >
      {/* 1. TOP HEADER: GREETING & QUICK ICONS */}
      <View style={styles.topHeader}>
        <View style={styles.greetingBox}>
          <Text style={styles.greetingHello}>
            Xin chào, {user?.full_name || user?.username || "bạn mới"} 👋
          </Text>
          <Text style={styles.greetingSub}>Chúc bạn một ngày an vui cùng đồ thủ công!</Text>
        </View>

        <View style={styles.topActions}>
          {/* NÚT HÓA ĐƠN & ĐƠN HÀNG */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setOrderModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="receipt-outline" size={20} color="#b45309" />
          </TouchableOpacity>

          {/* NÚT GIỎ HÀNG */}
          <TouchableOpacity
            style={[styles.headerIconBtn, styles.cartBtnActive]}
            onPress={() => setCartDrawerVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="cart-outline" size={20} color="#fff" />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. HERO BANNER: WARM ARTISANAL CARD */}
      <View style={styles.heroCard}>
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroTag}>
            <Ionicons name="sparkles" size={12} color="#b45309" />
            <Text style={styles.heroTagText}>NGHỆ THUẬT THỦ CÔNG VIỆT</Text>
          </View>
          <Text style={styles.heroSeasonText}>Mùa Thu 2026</Text>
        </View>

        <Text style={styles.heroTitle}>Gói Trọn Yêu Thương{"\n"}Trong Từng Nét Đan Mộc</Text>
        <Text style={styles.heroDesc}>
          Chắt chiu nét duyên từ cói Hội An, gốm sứ men Bát Tràng và tơ lụa xứ Huế.
        </Text>

        <View style={styles.heroButtonRow}>
          <TouchableOpacity
            style={styles.heroBtnPrimary}
            onPress={() => router.push("/(tabs)/explore")}
            activeOpacity={0.85}
          >
            <Ionicons name="bag-handle" size={17} color="#fff" />
            <Text style={styles.heroBtnPrimaryText}>Khám Phá Sản Phẩm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroBtnSecondary}
            onPress={() => setOrderModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="receipt-outline" size={16} color="#d97706" />
            <Text style={styles.heroBtnSecondaryText}>Hóa Đơn Của Tôi</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. QUICK CATEGORY NAVIGATION */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Khám Phá Theo Chủ Đề</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          <TouchableOpacity
            style={styles.catItem}
            onPress={() => router.push("/(tabs)/explore")}
            activeOpacity={0.8}
          >
            <View style={[styles.catIconCircle, { backgroundColor: "#fef3c7" }]}>
              <Text style={styles.catEmoji}>👜</Text>
            </View>
            <Text style={styles.catName}>Đồ Thủ Công</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.catItem}
            onPress={() => router.push("/(tabs)/explore")}
            activeOpacity={0.8}
          >
            <View style={[styles.catIconCircle, { backgroundColor: "#e0f2fe" }]}>
              <Text style={styles.catEmoji}>🏺</Text>
            </View>
            <Text style={styles.catName}>Gốm Sứ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.catItem}
            onPress={() => router.push("/(tabs)/explore")}
            activeOpacity={0.8}
          >
            <View style={[styles.catIconCircle, { backgroundColor: "#f3e8ff" }]}>
              <Text style={styles.catEmoji}>👘</Text>
            </View>
            <Text style={styles.catName}>Thời Trang</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.catItem}
            onPress={() => router.push("/(tabs)/explore")}
            activeOpacity={0.8}
          >
            <View style={[styles.catIconCircle, { backgroundColor: "#dcfce7" }]}>
              <Text style={styles.catEmoji}>🎋</Text>
            </View>
            <Text style={styles.catName}>Quà Lưu Niệm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.catItem}
            onPress={() => setHistoryModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.catIconCircle, { backgroundColor: "#fce7f3" }]}>
              <Text style={styles.catEmoji}>🎁</Text>
            </View>
            <Text style={styles.catName}>Gói Quà DIY</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 4. PROMO VOUCHER BANNER */}
      <View style={styles.voucherSection}>
        <View style={styles.voucherHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="ticket" size={18} color="#d97706" />
            <Text style={styles.voucherHeaderTitle}>Mã Ưu Đãi Độc Quyền</Text>
          </View>
          <Text style={styles.voucherHeaderSub}>Chạm để lấy mã</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voucherList}>
          {/* VOUCHER 1 */}
          <TouchableOpacity
            style={styles.voucherCard}
            onPress={() => handleCopyVoucher("EIKOCHAO", "Giảm 20.000đ cho đơn từ 150.000đ")}
            activeOpacity={0.8}
          >
            <View style={styles.voucherLeft}>
              <Text style={styles.voucherCode}>EIKOCHAO</Text>
              <Text style={styles.voucherDiscount}>GIẢM 20.000₫</Text>
              <Text style={styles.voucherMin}>Đơn từ 150.000₫</Text>
            </View>
            <View style={styles.voucherDottedLine} />
            <View style={styles.voucherRight}>
              <Text style={styles.voucherBtnText}>LẤY MÃ</Text>
            </View>
          </TouchableOpacity>

          {/* VOUCHER 2 */}
          <TouchableOpacity
            style={[styles.voucherCard, { borderColor: "#c084fc", backgroundColor: "#faf5ff" }]}
            onPress={() => handleCopyVoucher("EIKO10", "Giảm 10% tối đa 50.000đ cho mọi đơn hàng")}
            activeOpacity={0.8}
          >
            <View style={styles.voucherLeft}>
              <Text style={[styles.voucherCode, { color: "#7e22ce" }]}>EIKO10</Text>
              <Text style={[styles.voucherDiscount, { color: "#9333ea" }]}>GIẢM 10%</Text>
              <Text style={styles.voucherMin}>Tối đa 50.000₫</Text>
            </View>
            <View style={[styles.voucherDottedLine, { borderColor: "#d8b4fe" }]} />
            <View style={styles.voucherRight}>
              <Text style={[styles.voucherBtnText, { color: "#7e22ce" }]}>LẤY MÃ</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 5. SẢN PHẨM THỦ CÔNG TIÊU BIỂU (FEATURED PRODUCTS) */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Sản Phẩm Tiêu Biểu 🌿</Text>
            <Text style={styles.sectionSubtitle}>Các tác phẩm được yêu thích nhất tại Eiko</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push("/(tabs)/explore")}
          >
            <Text style={styles.seeAllText}>Xem tất cả</Text>
            <Ionicons name="arrow-forward" size={14} color="#d97706" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ padding: 30, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#d97706" />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredProductList}
          >
            {featuredProducts.map((p) => {
              let imgUri = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80";
              if (p.image) {
                imgUri = p.image.startsWith("http") ? p.image : `${BASE_URL}${p.image}`;
              }

              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.productCard}
                  activeOpacity={0.88}
                  onPress={() => {
                    setSelectedProduct(p);
                    setProductBuyQty(1);
                  }}
                >
                  <View style={styles.productImgBox}>
                    <Image source={{ uri: imgUri }} style={styles.productImg} resizeMode="cover" />
                    <View style={styles.productStockBadge}>
                      <Text style={styles.productStockText}>Còn {p.stock}</Text>
                    </View>
                  </View>

                  <View style={styles.productCardBody}>
                    <Text style={styles.productCatName} numberOfLines={1}>
                      {p.category || "Đồ thủ công"}
                    </Text>
                    <Text style={styles.productName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.productPrice}>{formatVND(p.price)}</Text>

                    <View style={styles.productCardFooter}>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#f59e0b" />
                        <Text style={styles.ratingVal}>{p.rating || "5.0"}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.quickAddBtn}
                        onPress={() => {
                          addToCart({
                            id: p.id,
                            name: p.name,
                            price: typeof p.price === "string" ? parseFloat(p.price) || 0 : p.price,
                            stock: p.stock,
                            image: imgUri,
                          });
                          Alert.alert("Đã thêm vào giỏ 🛒", `"${p.name}" đã được đưa vào giỏ hàng của bạn.`);
                        }}
                      >
                        <Ionicons name="cart-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* 6. DỊCH VỤ CÁ NHÂN & WORKSHOP (CRAFT SERVICES) */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flex: 1, paddingRight: 6 }}>
            <Text style={styles.sectionTitle}>Dịch Vụ Cá Nhân & Gói Quà 🎁</Text>
            <Text style={styles.sectionSubtitle}>Gói quà tỉ mỉ, thêu tay và kit sáng tạo</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => setHistoryModalVisible(true)}
          >
            <Ionicons name="calendar-outline" size={14} color="#d97706" />
            <Text style={styles.seeAllText}>Lịch của tôi</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceList}>
          {services.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.serviceCard}
              activeOpacity={0.88}
              onPress={() => {
                setSelectedServiceForDetail(item);
                setServiceDetailModalVisible(true);
              }}
            >
              <Image
                source={{ uri: resolveServiceImage(item.image) }}
                style={styles.serviceImg}
                resizeMode="cover"
              />
              <View style={styles.serviceCategoryBadge}>
                <Text style={styles.serviceCategoryText}>{getServiceCategoryLabel(item.category)}</Text>
              </View>

              <View style={styles.serviceDetailTag}>
                <Ionicons name="eye-outline" size={11} color="#fff" />
                <Text style={styles.serviceDetailTagText}>Chi tiết</Text>
              </View>

              <View style={styles.serviceBody}>
                <Text style={styles.serviceName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.serviceFooter}>
                  <View>
                    <Text style={styles.serviceDuration}>⏱️ {item.duration_minutes || 30} phút</Text>
                    <Text style={styles.servicePrice}>{formatVND(item.price)}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.serviceBookBtn}
                    onPress={() => {
                      setSelectedService(item);
                      setBookingModalVisible(true);
                    }}
                  >
                    <Text style={styles.serviceBookBtnText}>Đặt Lịch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 7. COMMITMENT & TRUST BADGES */}
      <View style={styles.trustSection}>
        <Text style={styles.trustTitle}>Cam Kết Từ Eiko Handcraft</Text>
        <View style={styles.trustGrid}>
          <View style={styles.trustItem}>
            <View style={[styles.trustIconCircle, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="leaf" size={22} color="#b45309" />
            </View>
            <Text style={styles.trustItemTitle}>100% Thủ Công</Text>
            <Text style={styles.trustItemDesc}>Chế tác tự nhiên từ các làng nghề Việt Nam</Text>
          </View>

          <View style={styles.trustItem}>
            <View style={[styles.trustIconCircle, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="shield-checkmark" size={22} color="#15803d" />
            </View>
            <Text style={styles.trustItemTitle}>Bảo Hiểm Nứt Vỡ</Text>
            <Text style={styles.trustItemDesc}>Đổi mới miễn phí 100% nếu hư hại vận chuyển</Text>
          </View>

          <View style={styles.trustItem}>
            <View style={[styles.trustIconCircle, { backgroundColor: "#e0f2fe" }]}>
              <Ionicons name="rocket" size={22} color="#0369a1" />
            </View>
            <Text style={styles.trustItemTitle}>Giao Nhanh Toàn Quốc</Text>
            <Text style={styles.trustItemDesc}>Đóng gói 2 lớp cẩn thận, nhận hàng 1-3 ngày</Text>
          </View>

          <View style={styles.trustItem}>
            <View style={[styles.trustIconCircle, { backgroundColor: "#fce7f3" }]}>
              <Ionicons name="heart" size={22} color="#be185d" />
            </View>
            <Text style={styles.trustItemTitle}>Tỉ Mỉ & Tận Tâm</Text>
            <Text style={styles.trustItemDesc}>Miễn phí thiệp viết tay theo lời chúc của bạn</Text>
          </View>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerBrand}>Eiko Handcraft Store</Text>
        <Text style={styles.footerNote}>© 2026 Tinh hoa thủ công Việt Nam • Hotline: 0971.410.870</Text>
      </View>

      {/* MODALS */}
      {/* 1. ORDER & INVOICE HISTORY */}
      <OrderHistoryModal visible={orderModalVisible} onClose={() => setOrderModalVisible(false)} />

      {/* 2. CART DRAWER */}
      <CartDrawer
        visible={cartDrawerVisible}
        onClose={() => setCartDrawerVisible(false)}
        onOrderSuccess={() => {
          setCartDrawerVisible(false);
          setOrderModalVisible(true);
        }}
      />

      {/* 3. SERVICE BOOKING MODAL */}
      <ServiceBookingModal
        visible={bookingModalVisible}
        service={selectedService}
        onClose={() => setBookingModalVisible(false)}
        onSuccess={(bookingCode) => {
          setBookingModalVisible(false);
          Alert.alert("Đặt Lịch Thành Công 🎉", `Mã đặt dịch vụ: ${bookingCode}`);
        }}
      />

      {/* 3.1 SERVICE DETAIL MODAL */}
      <ServiceDetailModal
        visible={serviceDetailModalVisible}
        service={selectedServiceForDetail}
        onClose={() => {
          setServiceDetailModalVisible(false);
          setSelectedServiceForDetail(null);
        }}
        onBook={(serv) => {
          setServiceDetailModalVisible(false);
          setSelectedService(serv as ServiceItem);
          setBookingModalVisible(true);
        }}
      />

      {/* 4. SERVICE BOOKING HISTORY MODAL */}
      <ServiceBookingHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
      />

      {/* 5. DIRECT BUY CHECKOUT MODAL */}
      <CheckoutModal
        visible={directCheckoutVisible}
        directItem={directCheckoutItem}
        onClose={() => {
          setDirectCheckoutVisible(false);
          setDirectCheckoutItem(null);
        }}
        onSuccess={() => {
          setDirectCheckoutVisible(false);
          setDirectCheckoutItem(null);
          setOrderModalVisible(true);
        }}
      />

      {/* 7. PRODUCT DETAIL MODAL */}
      <ProductDetailModal
        visible={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, qty) => {
          for (let i = 0; i < qty; i++) {
            addToCart({
              id: p.id,
              name: p.name,
              price: typeof p.price === "string" ? parseFloat(p.price) || 0 : p.price,
              stock: p.stock,
              image: p.image || undefined,
            });
          }
          setCartDrawerVisible(true);
        }}
        onBuyNow={(p, qty) => {
          const itemToBuy: CheckoutDirectItem = {
            id: p.id,
            name: p.name,
            price: typeof p.price === "string" ? parseFloat(p.price) || 0 : p.price,
            quantity: qty,
            image: p.image || undefined,
          };
          setDirectCheckoutItem(itemToBuy);
          setDirectCheckoutVisible(true);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf7f2",
  },
  // 1. TOP HEADER
  topHeader: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f3ede4",
  },
  greetingBox: {
    flex: 1,
    marginRight: 12,
  },
  greetingHello: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1c1917",
  },
  greetingSub: {
    fontSize: 12,
    color: "#78716c",
    marginTop: 2,
  },
  topActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  cartBtnActive: {
    backgroundColor: "#d97706",
    borderColor: "#b45309",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },

  // 2. HERO CARD
  heroCard: {
    margin: 16,
    padding: 22,
    borderRadius: 24,
    backgroundColor: "#fffbeb",
    borderWidth: 1.5,
    borderColor: "#fde68a",
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heroTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#b45309",
    letterSpacing: 0.5,
  },
  heroSeasonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#92400e",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#78350f",
    lineHeight: 30,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 13,
    color: "#92400e",
    lineHeight: 19,
    marginBottom: 18,
  },
  heroButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  heroBtnPrimary: {
    flex: 1.3,
    backgroundColor: "#d97706",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  heroBtnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  heroBtnSecondary: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#fde68a",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  heroBtnSecondaryText: {
    color: "#b45309",
    fontWeight: "800",
    fontSize: 13,
  },

  // 3. CATEGORIES
  sectionContainer: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1c1917",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#78716c",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryRow: {
    paddingHorizontal: 16,
    gap: 14,
    paddingTop: 8,
  },
  catItem: {
    alignItems: "center",
    width: 72,
  },
  catIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  catEmoji: {
    fontSize: 26,
  },
  catName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#44403c",
    textAlign: "center",
  },

  // 4. VOUCHERS
  voucherSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3ede4",
  },
  voucherHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  voucherHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1c1917",
  },
  voucherHeaderSub: {
    fontSize: 11,
    color: "#9ca3af",
  },
  voucherList: {
    gap: 12,
  },
  voucherCard: {
    flexDirection: "row",
    backgroundColor: "#fffdf7",
    borderWidth: 1.5,
    borderColor: "#fde68a",
    borderRadius: 14,
    width: 250,
    overflow: "hidden",
  },
  voucherLeft: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  voucherCode: {
    fontSize: 13,
    fontWeight: "900",
    color: "#b45309",
    letterSpacing: 0.5,
  },
  voucherDiscount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#d97706",
    marginTop: 2,
  },
  voucherMin: {
    fontSize: 10,
    color: "#78716c",
    marginTop: 2,
  },
  voucherDottedLine: {
    width: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#fde68a",
    marginVertical: 4,
  },
  voucherRight: {
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(254, 243, 199, 0.4)",
  },
  voucherBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#b45309",
  },

  // 5. FEATURED PRODUCTS
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d97706",
  },
  featuredProductList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  productCard: {
    width: 175,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f3ede4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  productImgBox: {
    width: "100%",
    height: 135,
    backgroundColor: "#f9fafb",
    position: "relative",
  },
  productImg: {
    width: "100%",
    height: "100%",
  },
  productStockBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  productStockText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  productCardBody: {
    padding: 10,
  },
  productCatName: {
    fontSize: 10,
    fontWeight: "700",
    color: "#d97706",
    textTransform: "uppercase",
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1c1917",
    marginTop: 2,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#b45309",
    marginBottom: 8,
  },
  productCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingVal: {
    fontSize: 11,
    fontWeight: "700",
    color: "#44403c",
  },
  quickAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#d97706",
    justifyContent: "center",
    alignItems: "center",
  },

  // 6. SERVICES
  serviceList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  serviceCard: {
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f3ede4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceImg: {
    width: "100%",
    height: 125,
  },
  serviceCategoryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  serviceCategoryText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#b45309",
  },
  serviceDetailTag: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  serviceDetailTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  serviceBody: {
    padding: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1c1917",
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 11,
    color: "#78716c",
    lineHeight: 16,
    marginBottom: 10,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#f5eee6",
    paddingTop: 8,
  },
  serviceDuration: {
    fontSize: 10,
    color: "#9ca3af",
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#dc2626",
    marginTop: 2,
  },
  serviceBookBtn: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fde68a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  serviceBookBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#b45309",
  },

  // 7. TRUST SECTION
  trustSection: {
    margin: 16,
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f3ede4",
    marginBottom: 20,
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1c1917",
    marginBottom: 14,
    textAlign: "center",
  },
  trustGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  trustItem: {
    width: "47%",
    alignItems: "center",
    backgroundColor: "#fcfaf7",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f5eee6",
  },
  trustIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  trustItemTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1c1917",
    textAlign: "center",
    marginBottom: 3,
  },
  trustItemDesc: {
    fontSize: 10,
    color: "#78716c",
    textAlign: "center",
    lineHeight: 14,
  },

  // FOOTER
  footer: {
    paddingVertical: 24,
    alignItems: "center",
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: "800",
    color: "#d97706",
  },
  footerNote: {
    fontSize: 11,
    color: "#a8a29e",
    marginTop: 4,
  },

  // PRODUCT DETAIL MODAL
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  detailImg: {
    width: "100%",
    height: 260,
    backgroundColor: "#f3f4f6",
  },
  detailBody: {
    padding: 20,
  },
  detailCategory: {
    fontSize: 11,
    fontWeight: "800",
    color: "#d97706",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#1f2937",
    marginBottom: 6,
  },
  detailPrice: {
    fontSize: 20,
    fontWeight: "900",
    color: "#d97706",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 12,
  },
  detailDescTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 6,
  },
  detailDesc: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 14,
  },
  qtyBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  qtyVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
    minWidth: 24,
    textAlign: "center",
  },
  detailFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  modalAddCartBtn: {
    flex: 1,
    backgroundColor: "#f59e0b",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  modalAddCartBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  modalBuyNowBtn: {
    flex: 1,
    backgroundColor: "#d97706",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  modalBuyNowBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
