import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { type Product } from "@/constants/shop-data";
import { useShopProducts } from "@/hooks/useShopProducts";
import { ProductModal } from "./CustomerModals";

/* ================= Kiểu dữ liệu ================= */

type OrderStatus = "pending" | "shipping" | "completed" | "cancelled";

type OrderItem = {
  name: string;
  icon: string;
  color: string;
  price: string;
  quantity: number;
};

type Order = {
  code: string;
  placedAt: string;
  status: OrderStatus;
  items: OrderItem[];
  total: string;
  address: string;
  payment: string;
};

type Address = {
  id: number;
  name: string;
  phone: string;
  detail: string;
  isDefault: boolean;
};

type Voucher = {
  code: string;
  title: string;
  discount: string;
  expiry: string;
  minOrder: string;
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "#f2b01e",
  shipping: "#3b82f6",
  completed: "#2e7d32",
  cancelled: "#c62828",
};

/* ================= Dữ liệu demo ================= */

const SEED_ORDERS: Order[] = [
  {
    code: "EIKO-260914-001",
    placedAt: "14/09/2026 09:12",
    status: "pending",
    items: [
      {
        name: "Túi cói Hội An",
        icon: "👜",
        color: "#f6d6a4",
        price: "189.000đ",
        quantity: 1,
      },
      {
        name: "Móc khóa Việt Nam",
        icon: "🔑",
        color: "#ffd2de",
        price: "59.000đ",
        quantity: 2,
      },
    ],
    total: "307.000đ",
    address: "12 Phố Lò Đúc, Hai Bà Trưng, Hà Nội",
    payment: "Thanh toán khi nhận (COD)",
  },
  {
    code: "EIKO-260912-004",
    placedAt: "12/09/2026 20:41",
    status: "shipping",
    items: [
      {
        name: "Bình gốm Bát Tràng",
        icon: "🏺",
        color: "#bce5dc",
        price: "275.000đ",
        quantity: 1,
      },
      {
        name: "Tranh treo Đông Hồ",
        icon: "🎋",
        color: "#f8e0ac",
        price: "215.000đ",
        quantity: 1,
      },
    ],
    total: "490.000đ",
    address: "12 Phố Lò Đúc, Hai Bà Trưng, Hà Nội",
    payment: "Chuyển khoản ngân hàng",
  },
  {
    code: "EIKO-260905-002",
    placedAt: "05/09/2026 15:03",
    status: "completed",
    items: [
      {
        name: "Áo dài mini Huế",
        icon: "👘",
        color: "#d9c4ff",
        price: "329.000đ",
        quantity: 1,
      },
    ],
    total: "329.000đ",
    address: "44 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh",
    payment: "Thanh toán khi nhận (COD)",
  },
  {
    code: "EIKO-260828-007",
    placedAt: "28/08/2026 11:27",
    status: "cancelled",
    items: [
      {
        name: "Tranh treo Đông Hồ",
        icon: "🎋",
        color: "#f8e0ac",
        price: "215.000đ",
        quantity: 2,
      },
    ],
    total: "430.000đ",
    address: "12 Phố Lò Đúc, Hai Bà Trưng, Hà Nội",
    payment: "Chuyển khoản ngân hàng",
  },
];

const SEED_ADDRESSES: Address[] = [
  {
    id: 1,
    name: "Minh Dũng",
    phone: "0912 345 678",
    detail: "12 Phố Lò Đúc, Hai Bà Trưng, Hà Nội",
    isDefault: true,
  },
  {
    id: 2,
    name: "Minh Dũng (công ty)",
    phone: "0912 345 678",
    detail: "Tầng 6, 96 Đường Láng, Đống Đa, Hà Nội",
    isDefault: false,
  },
];

const SEED_VOUCHERS: Voucher[] = [
  {
    code: "EIKO10",
    title: "Giảm 10% toàn sàn",
    discount: "-10%",
    expiry: "30/09/2026",
    minOrder: "Từ 199.000đ",
  },
  {
    code: "FREESHIP",
    title: "Miễn phí vận chuyển",
    discount: "0đ ship",
    expiry: "25/09/2026",
    minOrder: "Từ 99.000đ",
  },
  {
    code: "QUAVIET50",
    title: "Giảm 50k đơn quà Việt",
    discount: "-50.000đ",
    expiry: "15/10/2026",
    minOrder: "Từ 399.000đ",
  },
];

/* ================= Component chính ================= */

export function CustomerAccount() {
  const products = useShopProducts();

  const [profile, setProfile] = useState({
    name: "Minh Dũng",
    phone: "0912 345 678",
    email: "minhdung@eiko.vn",
    tier: "Thành viên Vàng",
    joined: "03/2025",
  });

  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const [favoriteNames, setFavoriteNames] = useState<Set<string>>(
    () => new Set(["Túi cói Hội An", "Tranh treo Đông Hồ"]),
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [addresses, setAddresses] = useState<Address[]>(SEED_ADDRESSES);
  const [savedCodes, setSavedCodes] = useState<Set<string>>(
    () => new Set(["EIKO10"]),
  );

  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [darkEnabled, setDarkEnabled] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  const [isEditProfileOpen, setEditProfileOpen] = useState(false);
  const [isAddAddressOpen, setAddAddressOpen] = useState(false);
  const [isLogoutOpen, setLogoutOpen] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrDetail, setAddrDetail] = useState("");

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const favoriteProducts = useMemo(
    () => products.filter((p) => favoriteNames.has(p.name)),
    [products, favoriteNames],
  );

  const visibleOrders = useMemo(
    () =>
      statusFilter === "all"
        ? orders
        : orders.filter((order) => order.status === statusFilter),
    [orders, statusFilter],
  );

  const completedCount = orders.filter((o) => o.status === "completed").length;

  /* ----- Hành động đơn hàng ----- */
  const cancelOrder = (code: string) => {
    setOrders((current) =>
      current.map((o) => (o.code === code ? { ...o, status: "cancelled" } : o)),
    );
    showToast(`Đã hủy đơn ${code} (demo)`);
  };
  const confirmReceived = (code: string) => {
    setOrders((current) =>
      current.map((o) => (o.code === code ? { ...o, status: "completed" } : o)),
    );
    showToast(`Xác nhận đã nhận đơn ${code} 🎉`);
  };
  const reorder = (order: Order) => {
    showToast(`Đã thêm ${order.items.length} món vào giỏ hàng (demo)`);
  };

  /* ----- Yêu thích ----- */
  const toggleFavorite = (product: Product) => {
    setFavoriteNames((current) => {
      const next = new Set(current);
      if (next.has(product.name)) next.delete(product.name);
      else next.add(product.name);
      return next;
    });
  };

  /* ----- Hồ sơ ----- */
  const openEditProfile = () => {
    setEditName(profile.name);
    setEditPhone(profile.phone);
    setEditEmail(profile.email);
    setEditProfileOpen(true);
  };
  const saveProfile = () => {
    if (!editName.trim() || !editPhone.trim()) {
      showToast("Vui lòng điền đủ họ tên và số điện thoại");
      return;
    }
    setProfile((p) => ({
      ...p,
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
    }));
    setEditProfileOpen(false);
    showToast("Đã cập nhật thông tin tài khoản");
  };

  /* ----- Địa chỉ ----- */
  const addAddress = () => {
    if (!addrName.trim() || !addrPhone.trim() || !addrDetail.trim()) {
      showToast("Vui lòng điền đủ thông tin địa chỉ");
      return;
    }
    setAddresses((current) => [
      ...current,
      {
        id: Date.now(),
        name: addrName.trim(),
        phone: addrPhone.trim(),
        detail: addrDetail.trim(),
        isDefault: current.length === 0,
      },
    ]);
    setAddrName("");
    setAddrPhone("");
    setAddrDetail("");
    setAddAddressOpen(false);
    showToast("Đã thêm địa chỉ mới");
  };
  const setDefaultAddress = (id: number) => {
    setAddresses((current) =>
      current.map((a) => ({ ...a, isDefault: a.id === id })),
    );
    showToast("Đã đặt địa chỉ mặc định");
  };
  const removeAddress = (id: number) => {
    const target = addresses.find((a) => a.id === id);
    if (target?.isDefault) {
      showToast("Không thể xóa địa chỉ mặc định");
      return;
    }
    setAddresses((current) => current.filter((a) => a.id !== id));
    showToast("Đã xóa địa chỉ");
  };

  /* ----- Voucher ----- */
  const toggleSaveVoucher = (code: string) => {
    setSavedCodes((current) => {
      const next = new Set(current);
      if (next.has(code)) {
        next.delete(code);
        showToast(`Đã bỏ lưu mã ${code}`);
      } else {
        next.add(code);
        showToast(`Đã lưu mã ${code} vào ví`);
      }
      return next;
    });
  };

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== Thẻ hồ sơ ===== */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>
              {initials || "EK"}
            </ThemedText>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>{profile.name}</ThemedText>
            <ThemedText style={styles.profilePhone}>{profile.phone}</ThemedText>
            <View style={styles.tierBadge}>
              <Ionicons name="diamond" size={12} color="#f2b01e" />
              <ThemedText style={styles.tierText}>{profile.tier}</ThemedText>
            </View>
          </View>
          <Pressable style={styles.editButton} onPress={openEditProfile}>
            <Ionicons name="create-outline" size={17} color="#7142a5" />
            <ThemedText style={styles.editText}>Sửa</ThemedText>
          </Pressable>
        </View>

        {/* ===== Thống kê nhanh ===== */}
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <ThemedText style={styles.statValue}>{orders.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Đơn hàng</ThemedText>
          </View>
          <View style={styles.statTile}>
            <ThemedText style={styles.statValue}>{completedCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Hoàn thành</ThemedText>
          </View>
          <View style={styles.statTile}>
            <ThemedText style={styles.statValue}>
              {favoriteNames.size}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Yêu thích</ThemedText>
          </View>
          <View style={styles.statTile}>
            <ThemedText style={styles.statValue}>{savedCodes.size}</ThemedText>
            <ThemedText style={styles.statLabel}>Voucher</ThemedText>
          </View>
        </View>

        {/* ===== Quản lý đơn hàng ===== */}
        <SectionTitle
          title="Đơn hàng của tôi"
          subtitle="Theo dõi và quản lý đơn"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusRow}
        >
          {(
            ["all", "pending", "shipping", "completed", "cancelled"] as const
          ).map((status) => (
            <Pressable
              key={status}
              style={[
                styles.statusChip,
                statusFilter === status && styles.statusChipActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <ThemedText
                style={[
                  styles.statusChipText,
                  statusFilter === status && styles.statusChipTextActive,
                ]}
              >
                {status === "all" ? "Tất cả" : STATUS_LABEL[status]}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {visibleOrders.length === 0 && (
          <ThemedText style={styles.empty}>
            Không có đơn hàng nào ở trạng thái này.
          </ThemedText>
        )}

        {visibleOrders.map((order) => {
          const expanded = expandedCode === order.code;
          return (
            <View key={order.code} style={styles.orderCard}>
              <Pressable
                style={styles.orderHead}
                onPress={() => setExpandedCode(expanded ? null : order.code)}
              >
                <View style={styles.orderHeadInfo}>
                  <ThemedText style={styles.orderCode}>{order.code}</ThemedText>
                  <ThemedText style={styles.orderDate}>
                    {order.placedAt}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${STATUS_COLOR[order.status]}1a` },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.statusBadgeText,
                      { color: STATUS_COLOR[order.status] },
                    ]}
                  >
                    {STATUS_LABEL[order.status]}
                  </ThemedText>
                </View>
              </Pressable>

              <View style={styles.orderThumbs}>
                {order.items.map((item, index) => (
                  <View
                    key={`${item.name}-${index}`}
                    style={[styles.orderThumb, { backgroundColor: item.color }]}
                  >
                    <ThemedText style={styles.orderThumbIcon}>
                      {item.icon}
                    </ThemedText>
                  </View>
                ))}
                <ThemedText style={styles.orderTotal}>{order.total}</ThemedText>
              </View>

              {expanded && (
                <View style={styles.orderDetail}>
                  {order.items.map((item, index) => (
                    <View
                      key={`${item.name}-${index}`}
                      style={styles.orderItemRow}
                    >
                      <ThemedText
                        style={styles.orderItemName}
                        numberOfLines={1}
                      >
                        {item.name}
                      </ThemedText>
                      <ThemedText style={styles.orderItemQty}>
                        x{item.quantity}
                      </ThemedText>
                      <ThemedText style={styles.orderItemPrice}>
                        {item.price}
                      </ThemedText>
                    </View>
                  ))}
                  <View style={styles.orderMetaRow}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#6b5b7d"
                    />
                    <ThemedText style={styles.orderMetaText}>
                      {order.address}
                    </ThemedText>
                  </View>
                  <View style={styles.orderMetaRow}>
                    <Ionicons name="card-outline" size={14} color="#6b5b7d" />
                    <ThemedText style={styles.orderMetaText}>
                      {order.payment}
                    </ThemedText>
                  </View>
                </View>
              )}

              <View style={styles.orderActions}>
                {order.status === "pending" && (
                  <Pressable
                    style={styles.orderActionGhost}
                    onPress={() => cancelOrder(order.code)}
                  >
                    <ThemedText style={styles.orderActionGhostText}>
                      Hủy đơn
                    </ThemedText>
                  </Pressable>
                )}
                {order.status === "shipping" && (
                  <Pressable
                    style={styles.orderActionSolid}
                    onPress={() => confirmReceived(order.code)}
                  >
                    <ThemedText style={styles.orderActionSolidText}>
                      Đã nhận hàng
                    </ThemedText>
                  </Pressable>
                )}
                {(order.status === "completed" ||
                  order.status === "cancelled") && (
                  <Pressable
                    style={styles.orderActionSolid}
                    onPress={() => reorder(order)}
                  >
                    <ThemedText style={styles.orderActionSolidText}>
                      Mua lại
                    </ThemedText>
                  </Pressable>
                )}
                <Pressable
                  style={styles.orderActionGhost}
                  onPress={() => setExpandedCode(expanded ? null : order.code)}
                >
                  <ThemedText style={styles.orderActionGhostText}>
                    {expanded ? "Thu gọn" : "Chi tiết"}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          );
        })}

        {/* ===== Sản phẩm yêu thích ===== */}
        <SectionTitle title="Yêu thích" subtitle="Món quà bạn đã thả tim" />
        {favoriteProducts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="heart-outline" size={26} color="#9b82ac" />
            <ThemedText style={styles.empty}>
              Chưa có sản phẩm yêu thích. Hãy thả tim ở tab Trang chủ nhé!
            </ThemedText>
          </View>
        ) : (
          favoriteProducts.map((product) => (
            <View key={product.sku ?? product.name} style={styles.favoriteRow}>
              <Pressable
                style={styles.favoriteMain}
                onPress={() => setSelectedProduct(product)}
              >
                <View
                  style={[
                    styles.favoriteThumb,
                    { backgroundColor: product.color },
                  ]}
                >
                  {product.image ? (
                    <Image
                      source={{ uri: product.image }}
                      style={styles.favoriteImage}
                      contentFit="cover"
                      accessibilityLabel={product.name}
                    />
                  ) : (
                    <ThemedText style={styles.favoriteEmoji}>
                      {product.icon}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.favoriteInfo}>
                  <ThemedText style={styles.favoriteName} numberOfLines={1}>
                    {product.name}
                  </ThemedText>
                  <ThemedText style={styles.favoritePrice}>
                    {product.price}
                  </ThemedText>
                </View>
              </Pressable>
              <Pressable
                style={styles.favoriteHeart}
                onPress={() => toggleFavorite(product)}
                accessibilityLabel="Bỏ yêu thích"
              >
                <Ionicons name="heart" size={18} color="#e66e88" />
              </Pressable>
            </View>
          ))
        )}

        {/* ===== Sổ địa chỉ ===== */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <ThemedText style={styles.sectionTitle}>Sổ địa chỉ</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Địa chỉ giao hàng của bạn
            </ThemedText>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => setAddAddressOpen(true)}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <ThemedText style={styles.addBtnText}>Thêm</ThemedText>
          </Pressable>
        </View>
        {addresses.map((address) => (
          <View key={address.id} style={styles.addressCard}>
            <View style={styles.addressHead}>
              <ThemedText style={styles.addressName}>{address.name}</ThemedText>
              <ThemedText style={styles.addressPhone}>
                {address.phone}
              </ThemedText>
              {address.isDefault && (
                <View style={styles.defaultBadge}>
                  <ThemedText style={styles.defaultBadgeText}>
                    Mặc định
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.addressDetail}>
              {address.detail}
            </ThemedText>
            <View style={styles.addressActions}>
              {!address.isDefault && (
                <>
                  <Pressable onPress={() => setDefaultAddress(address.id)}>
                    <ThemedText style={styles.addressAction}>
                      Đặt mặc định
                    </ThemedText>
                  </Pressable>
                  <Pressable onPress={() => removeAddress(address.id)}>
                    <ThemedText style={styles.addressActionDanger}>
                      Xóa
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        ))}

        {/* ===== Ví voucher ===== */}
        <SectionTitle title="Ví voucher" subtitle="Ưu đãi đang chờ bạn" />
        {SEED_VOUCHERS.map((voucher) => {
          const saved = savedCodes.has(voucher.code);
          return (
            <View key={voucher.code} style={styles.voucherCard}>
              <View style={styles.voucherLeft}>
                <ThemedText style={styles.voucherDiscount}>
                  {voucher.discount}
                </ThemedText>
              </View>
              <View style={styles.voucherInfo}>
                <ThemedText style={styles.voucherTitle}>
                  {voucher.title}
                </ThemedText>
                <ThemedText style={styles.voucherMeta}>
                  Mã {voucher.code} • {voucher.minOrder}
                </ThemedText>
                <ThemedText style={styles.voucherMeta}>
                  HSD: {voucher.expiry}
                </ThemedText>
              </View>
              <Pressable
                style={[styles.voucherBtn, saved && styles.voucherBtnSaved]}
                onPress={() => toggleSaveVoucher(voucher.code)}
              >
                <ThemedText
                  style={[
                    styles.voucherBtnText,
                    saved && styles.voucherBtnTextSaved,
                  ]}
                >
                  {saved ? "Đã lưu" : "Lưu"}
                </ThemedText>
              </Pressable>
            </View>
          );
        })}

        {/* ===== Cài đặt & tiện ích ===== */}
        <SectionTitle
          title="Cài đặt & tiện ích"
          subtitle="Tùy chỉnh trải nghiệm"
        />
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Ionicons name="notifications-outline" size={18} color="#7142a5" />
            <ThemedText style={styles.settingLabel}>
              Thông báo đơn hàng
            </ThemedText>
            <Switch
              value={notifyEnabled}
              onValueChange={(value) => {
                setNotifyEnabled(value);
                showToast(
                  value
                    ? "Đã bật thông báo đơn hàng"
                    : "Đã tắt thông báo đơn hàng",
                );
              }}
              trackColor={{ true: "#7142a5", false: "#d9cfe6" }}
              thumbColor="#ffffff"
            />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <Ionicons name="moon-outline" size={18} color="#7142a5" />
            <ThemedText style={styles.settingLabel}>Giao diện tối</ThemedText>
            <Switch
              value={darkEnabled}
              onValueChange={(value) => {
                setDarkEnabled(value);
                showToast("Chế độ tối là bản demo, sẽ sớm hoàn thiện 🌙");
              }}
              trackColor={{ true: "#7142a5", false: "#d9cfe6" }}
              thumbColor="#ffffff"
            />
          </View>
          <View style={styles.settingDivider} />
          <Pressable
            style={styles.settingRow}
            onPress={() => showToast("Tính năng đổi mật khẩu là bản demo")}
          >
            <Ionicons name="key-outline" size={18} color="#7142a5" />
            <ThemedText style={styles.settingLabel}>Đổi mật khẩu</ThemedText>
            <Ionicons name="chevron-forward" size={16} color="#9b82ac" />
          </Pressable>
          <View style={styles.settingDivider} />
          <Pressable
            style={styles.settingRow}
            onPress={() => setPolicyOpen(!policyOpen)}
          >
            <Ionicons name="document-text-outline" size={18} color="#7142a5" />
            <ThemedText style={styles.settingLabel}>
              Chính sách & hỗ trợ
            </ThemedText>
            <Ionicons
              name={policyOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color="#9b82ac"
            />
          </Pressable>
          {policyOpen && (
            <View style={styles.policyBox}>
              <ThemedText style={styles.policyText}>
                • Đổi trả miễn phí trong 7 ngày nếu lỗi nhà sản xuất.{"\n"}•
                Freeship toàn quốc cho đơn từ 199.000đ.{"\n"}• Hotline hỗ trợ:
                1900 6868 (8:00 - 21:00 hằng ngày).
              </ThemedText>
            </View>
          )}
          <View style={styles.settingDivider} />
          <Pressable
            style={styles.settingRow}
            onPress={() => setLogoutOpen(true)}
          >
            <Ionicons name="log-out-outline" size={18} color="#c62828" />
            <ThemedText style={[styles.settingLabel, styles.logoutLabel]}>
              Đăng xuất
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color="#9b82ac" />
          </Pressable>
        </View>

        <ThemedText style={styles.version}>
          EiKo Shop • phiên bản 1.0.0 (BTL Mobile)
        </ThemedText>
      </ScrollView>

      {/* ===== Toast ===== */}
      {toast && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />
          <ThemedText style={styles.toastText}>{toast}</ThemedText>
        </View>
      )}

      {/* ===== Modal sửa hồ sơ ===== */}
      <Modal
        visible={isEditProfileOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditProfileOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>
              Cập nhật thông tin
            </ThemedText>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Họ và tên"
              placeholderTextColor="#667085"
              style={styles.modalInput}
            />
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Số điện thoại"
              placeholderTextColor="#667085"
              style={styles.modalInput}
              keyboardType="phone-pad"
            />
            <TextInput
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Email"
              placeholderTextColor="#667085"
              style={styles.modalInput}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalGhost}
                onPress={() => setEditProfileOpen(false)}
              >
                <ThemedText style={styles.modalGhostText}>Hủy</ThemedText>
              </Pressable>
              <Pressable style={styles.modalSolid} onPress={saveProfile}>
                <ThemedText style={styles.modalSolidText}>Lưu</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== Modal thêm địa chỉ ===== */}
      <Modal
        visible={isAddAddressOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddAddressOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Địa chỉ mới</ThemedText>
            <TextInput
              value={addrName}
              onChangeText={setAddrName}
              placeholder="Tên người nhận"
              placeholderTextColor="#667085"
              style={styles.modalInput}
            />
            <TextInput
              value={addrPhone}
              onChangeText={setAddrPhone}
              placeholder="Số điện thoại"
              placeholderTextColor="#667085"
              style={styles.modalInput}
              keyboardType="phone-pad"
            />
            <TextInput
              value={addrDetail}
              onChangeText={setAddrDetail}
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
              placeholderTextColor="#667085"
              style={styles.modalInput}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalGhost}
                onPress={() => setAddAddressOpen(false)}
              >
                <ThemedText style={styles.modalGhostText}>Hủy</ThemedText>
              </Pressable>
              <Pressable style={styles.modalSolid} onPress={addAddress}>
                <ThemedText style={styles.modalSolidText}>Thêm</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== Modal xác nhận đăng xuất ===== */}
      <Modal
        visible={isLogoutOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Đăng xuất?</ThemedText>
            <ThemedText style={styles.modalBody}>
              Bạn sẽ cần đăng nhập lại để tiếp tục mua sắm (bản demo).
            </ThemedText>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalGhost}
                onPress={() => setLogoutOpen(false)}
              >
                <ThemedText style={styles.modalGhostText}>Ở lại</ThemedText>
              </Pressable>
              <Pressable
                style={styles.modalDanger}
                onPress={() => {
                  setLogoutOpen(false);
                  showToast("Đã đăng xuất (demo) 👋");
                }}
              >
                <ThemedText style={styles.modalSolidText}>Đăng xuất</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== Modal chi tiết sản phẩm ===== */}
      <ProductModal
        product={selectedProduct}
        isFavorite={
          selectedProduct ? favoriteNames.has(selectedProduct.name) : false
        }
        onClose={() => setSelectedProduct(null)}
        onToggleFavorite={() =>
          selectedProduct && toggleFavorite(selectedProduct)
        }
        onAddToCart={() => {
          if (selectedProduct) {
            showToast(`Đã thêm "${selectedProduct.name}" vào giỏ hàng (demo)`);
            setSelectedProduct(null);
          }
        }}
      />
    </View>
  );
}

/* ================= Component con ================= */

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        <ThemedText style={styles.sectionSubtitle}>{subtitle}</ThemedText>
      </View>
    </View>
  );
}

/* ================= Styles ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f7f3fb" },
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#593477",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#7142a5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#d9c7f0",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#ffffff" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: "800", color: "#ffffff" },
  profilePhone: { marginTop: 2, fontSize: 12, color: "#d9c7f0" },
  tierBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#ffffff22",
  },
  tierText: { fontSize: 11, color: "#ffe08a" },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  editText: { fontSize: 12, fontWeight: "600", color: "#7142a5" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  statTile: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  statValue: { fontSize: 17, fontWeight: "800", color: "#7142a5" },
  statLabel: { marginTop: 2, fontSize: 10, color: "#6b5b7d" },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#2b1b3d" },
  sectionSubtitle: { marginTop: 2, fontSize: 12, color: "#6b5b7d" },
  statusRow: { gap: 8, paddingRight: 8, marginBottom: 12 },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  statusChipActive: { backgroundColor: "#7142a5", borderColor: "#7142a5" },
  statusChipText: { fontSize: 12, color: "#5a4a6b" },
  statusChipTextActive: { color: "#ffffff", fontWeight: "600" },
  orderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  orderHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderHeadInfo: { flex: 1 },
  orderCode: { fontSize: 13, fontWeight: "700", color: "#2b1b3d" },
  orderDate: { marginTop: 2, fontSize: 11, color: "#6b5b7d" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusBadgeText: { fontSize: 11, fontWeight: "600" },
  orderThumbs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  orderThumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  orderThumbIcon: { fontSize: 17 },
  orderTotal: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: "800",
    color: "#7142a5",
  },
  orderDetail: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#efe7f7",
  },
  orderItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  orderItemName: { flex: 1, fontSize: 12, color: "#2b1b3d" },
  orderItemQty: { fontSize: 12, color: "#6b5b7d" },
  orderItemPrice: { fontSize: 12, fontWeight: "600", color: "#2b1b3d" },
  orderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  orderMetaText: { flex: 1, fontSize: 11, color: "#6b5b7d" },
  orderActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  orderActionGhost: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  orderActionGhostText: { fontSize: 12, color: "#5a4a6b" },
  orderActionSolid: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#7142a5",
  },
  orderActionSolidText: { fontSize: 12, color: "#ffffff", fontWeight: "600" },
  emptyBox: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 18,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e6dcf2",
    marginBottom: 10,
  },
  empty: {
    fontSize: 12,
    color: "#6b5b7d",
    paddingHorizontal: 16,
    textAlign: "center",
  },
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  favoriteMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  favoriteThumb: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  favoriteImage: { width: "100%", height: "100%", borderRadius: 12 },
  favoriteEmoji: { fontSize: 21 },
  favoriteInfo: { flex: 1 },
  favoriteName: { fontSize: 13, fontWeight: "600", color: "#2b1b3d" },
  favoritePrice: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#7142a5",
  },
  favoriteHeart: { padding: 6 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#7142a5",
  },
  addBtnText: { fontSize: 12, color: "#ffffff", fontWeight: "600" },
  addressCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  addressHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  addressName: { fontSize: 13, fontWeight: "700", color: "#2b1b3d" },
  addressPhone: { fontSize: 12, color: "#6b5b7d" },
  defaultBadge: {
    marginLeft: "auto",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#efe6f9",
  },
  defaultBadgeText: { fontSize: 10, color: "#593477", fontWeight: "600" },
  addressDetail: {
    marginTop: 6,
    fontSize: 12,
    color: "#5a4a6b",
    lineHeight: 18,
  },
  addressActions: { flexDirection: "row", gap: 14, marginTop: 8 },
  addressAction: { fontSize: 12, color: "#7142a5", fontWeight: "600" },
  addressActionDanger: { fontSize: 12, color: "#c62828", fontWeight: "600" },
  voucherCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  voucherLeft: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: "#efe6f9",
    alignItems: "center",
    justifyContent: "center",
  },
  voucherDiscount: { fontSize: 13, fontWeight: "800", color: "#7142a5" },
  voucherInfo: { flex: 1 },
  voucherTitle: { fontSize: 13, fontWeight: "700", color: "#2b1b3d" },
  voucherMeta: { marginTop: 2, fontSize: 11, color: "#6b5b7d" },
  voucherBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#7142a5",
  },
  voucherBtnSaved: { backgroundColor: "#efe6f9" },
  voucherBtnText: { fontSize: 12, color: "#ffffff", fontWeight: "600" },
  voucherBtnTextSaved: { color: "#7142a5" },
  settingsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  settingLabel: { flex: 1, fontSize: 13, color: "#2b1b3d" },
  logoutLabel: { color: "#c62828" },
  settingDivider: { height: 1, backgroundColor: "#efe7f7" },
  policyBox: { paddingHorizontal: 28, paddingBottom: 12 },
  policyText: { fontSize: 12, color: "#5a4a6b", lineHeight: 19 },
  version: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 11,
    color: "#9b82ac",
  },
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d8ecda",
  },
  toastText: { flex: 1, fontSize: 13, color: "#2b1b3d" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000066",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2b1b3d",
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 13,
    color: "#5a4a6b",
    lineHeight: 19,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e6dcf2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#172b4d",
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
  modalGhost: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  modalGhostText: { fontSize: 13, color: "#5a4a6b" },
  modalSolid: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#7142a5",
  },
  modalDanger: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#c62828",
  },
  modalSolidText: { fontSize: 13, color: "#ffffff", fontWeight: "600" },
});
