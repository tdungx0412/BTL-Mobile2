import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { CATEGORIES, PRODUCTS } from "@/constants/shop-data";
import { styles } from "./shop-styles";

export function CustomerExplore() {
  return (
    <ScrollView
      style={styles.customerScreen}
      contentContainerStyle={styles.customerContent}
      showsVerticalScrollIndicator={false}
    >
      <ThemedText style={styles.pageKicker}>EIko STORE</ThemedText>
      <ThemedText type="title" style={styles.pageTitle}>
        Khám phá quà Việt
      </ThemedText>
      <ThemedText style={styles.pageDescription}>
        Tìm thấy một món quà thật ý nghĩa cho người bạn thương.
      </ThemedText>

      <View style={styles.filterRow}>
        <Pressable style={styles.filterButton}>
          <Ionicons name="options-outline" size={18} color="#7142a5" />
          <ThemedText style={styles.filterText}>Bộ lọc</ThemedText>
        </Pressable>
        <Pressable style={styles.sortButton}>
          <ThemedText style={styles.sortText}>Phổ biến nhất</ThemedText>
          <Ionicons name="chevron-down" size={16} color="#7142a5" />
        </Pressable>
      </View>

      <View style={styles.exploreGrid}>
        {PRODUCTS.concat([
          {
            sku: "EIKO-004",
            icon: "🔑",
            name: "Móc khóa Việt Nam",
            price: "59.000đ",
            color: "#ffd2de",
            category: "Quà tặng",
            description: "Móc khóa gỗ nhỏ gọn, khắc hình bản đồ Việt Nam.",
            origin: "Xưởng mộc Đồng Kỵ, Bắc Ninh",
            material: "Gỗ beech, khoen thép không gỉ",
            dimensions: "6 x 3.5 x 0.8 cm",
            weight: "35 g",
            stock: 62,
            rating: 4.6,
            reviewCount: 318,
            careInstructions: "Tránh tiếp xúc lâu với nước.",
            tags: ["gỗ", "Việt Nam"],
            isFeatured: 0,
          },
          {
            sku: "EIKO-005",
            icon: "🎋",
            name: "Tranh treo Đông Hồ",
            price: "215.000đ",
            color: "#f8e0ac",
            category: "Trang trí",
            description:
              "Tranh in thủ công lấy cảm hứng từ dòng tranh Đông Hồ.",
            origin: "Làng tranh Đông Hồ, Bắc Ninh",
            material: "Giấy điệp, khung gỗ thông",
            dimensions: "25 x 35 cm",
            weight: "360 g",
            stock: 19,
            rating: 4.8,
            reviewCount: 97,
            careInstructions: "Tránh ánh nắng trực tiếp.",
            tags: ["trang trí", "Đông Hồ"],
            isFeatured: 0,
          },
        ]).map((product) => (
          <Pressable key={product.name} style={styles.exploreCard}>
            <View
              style={[styles.exploreImage, { backgroundColor: product.color }]}
            >
              <ThemedText style={styles.exploreEmoji}>
                {product.icon}
              </ThemedText>
              <View style={styles.exploreHeart}>
                <Ionicons name="heart-outline" size={17} color="#7142a5" />
              </View>
            </View>
            <ThemedText style={styles.exploreName}>{product.name}</ThemedText>
            <ThemedText style={styles.explorePrice}>{product.price}</ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText style={styles.subsectionTitle}>Danh mục nổi bật</ThemedText>
      {CATEGORIES.map((category) => (
        <Pressable key={category.label} style={styles.categoryRow}>
          <View
            style={[
              styles.smallCategoryIcon,
              { backgroundColor: category.color },
            ]}
          >
            <Ionicons name={category.icon} size={20} color="#593477" />
          </View>
          <ThemedText style={styles.categoryRowText}>
            {category.label}
          </ThemedText>
          <Ionicons name="chevron-forward" size={18} color="#aa9ab8" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function CustomerAccount() {
  return (
    <ScrollView
      style={styles.customerScreen}
      contentContainerStyle={styles.customerContent}
      showsVerticalScrollIndicator={false}
    >
      <ThemedText style={styles.pageKicker}>TÀI KHOẢN EIKO</ThemedText>
      <ThemedText type="title" style={styles.pageTitle}>
        Xin chào bạn!
      </ThemedText>
      <View style={styles.accountCard}>
        <View style={styles.accountAvatar}>
          <Ionicons name="person" size={28} color="#7142a5" />
        </View>
        <View style={styles.accountCopy}>
          <ThemedText style={styles.accountTitle}>Khách hàng EiKo</ThemedText>
          <ThemedText style={styles.accountText}>
            Đăng nhập để quản lý đơn hàng
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#7142a5" />
      </View>
      <ThemedText style={styles.subsectionTitle}>Quản lý mua sắm</ThemedText>
      {[
        [
          "receipt-outline",
          "Đơn hàng của tôi",
          "Theo dõi đơn hàng và lịch sử mua sắm",
        ],
        [
          "heart-outline",
          "Sản phẩm yêu thích",
          "Lưu lại những món quà bạn thích",
        ],
        ["location-outline", "Sổ địa chỉ", "Quản lý địa chỉ nhận hàng"],
        [
          "notifications-outline",
          "Thông báo",
          "Cập nhật ưu đãi mới nhất từ EiKo",
        ],
      ].map(([icon, title, description]) => (
        <Pressable key={title} style={styles.accountRow}>
          <View style={styles.accountIcon}>
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color="#7142a5"
            />
          </View>
          <View style={styles.accountRowCopy}>
            <ThemedText style={styles.accountRowTitle}>{title}</ThemedText>
            <ThemedText style={styles.accountRowText}>{description}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aa9ab8" />
        </Pressable>
      ))}
      <View style={styles.helpCard}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={23}
          color="#7142a5"
        />
        <View style={styles.accountRowCopy}>
          <ThemedText style={styles.accountRowTitle}>
            Bạn cần hỗ trợ?
          </ThemedText>
          <ThemedText style={styles.accountRowText}>
            Đội ngũ EiKo luôn sẵn sàng lắng nghe
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );
}
