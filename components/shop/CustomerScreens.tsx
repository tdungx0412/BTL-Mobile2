import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
        {PRODUCTS.map((product) => (
          <Pressable
            key={product.sku ?? product.name}
            style={styles.exploreCard}
          >
            <View
              style={[styles.exploreImage, { backgroundColor: product.color }]}
            >
              {product.image ? (
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImageObject}
                  contentFit="cover"
                  accessibilityLabel={product.name}
                />
              ) : (
                <ThemedText style={styles.exploreEmoji}>
                  {product.icon}
                </ThemedText>
              )}
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
  const accountMenus = [
    {
      icon: "receipt-outline",
      title: "Đơn hàng của tôi",
      description: "Theo dõi đơn hàng và lịch sử mua sắm",
      badge: "03",
    },
    {
      icon: "heart-outline",
      title: "Sản phẩm yêu thích",
      description: "Lưu lại những món quà bạn thích",
      badge: "12",
    },
    {
      icon: "location-outline",
      title: "Sổ địa chỉ",
      description: "Quản lý địa chỉ nhận hàng",
      badge: "02",
    },
    {
      icon: "notifications-outline",
      title: "Thông báo",
      description: "Cập nhật ưu đãi mới nhất từ EiKo",
      badge: "05",
    },
  ];

  const accountMetrics = [
    { label: "Đơn hàng", value: "03" },
    { label: "Yêu thích", value: "12" },
    { label: "Điểm EiKo", value: "980" },
  ];

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

      <View style={styles.accountProfileCard}>
        <View style={styles.accountAvatar}>
          <Ionicons name="person" size={28} color="#7142a5" />
        </View>

        <View style={styles.accountCopy}>
          <ThemedText style={styles.accountTitle}>Khách hàng EiKo</ThemedText>
          <ThemedText style={styles.accountText}>
            khoidev@eiko.vn • Thành viên vàng
          </ThemedText>
          <View style={styles.accountMetaRow}>
            <Ionicons name="shield-checkmark" size={12} color="#7142a5" />
            <ThemedText style={styles.accountMetaText}>
              Tài khoản đã xác thực
            </ThemedText>
          </View>
        </View>

        <Pressable style={styles.accountArrowButton}>
          <Ionicons name="chevron-forward" size={20} color="#7142a5" />
        </Pressable>
      </View>

      <View style={styles.accountMetricsGrid}>
        {accountMetrics.map((metric) => (
          <View key={metric.label} style={styles.accountMetricCard}>
            <ThemedText style={styles.accountMetricValue}>
              {metric.value}
            </ThemedText>
            <ThemedText style={styles.accountMetricLabel}>
              {metric.label}
            </ThemedText>
          </View>
        ))}
      </View>

      <ThemedText style={styles.subsectionTitle}>Quản lý mua sắm</ThemedText>
      {accountMenus.map((item) => (
        <Pressable key={item.title} style={styles.accountRow}>
          <View style={styles.accountIcon}>
            <Ionicons
              name={item.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color="#7142a5"
            />
          </View>
          <View style={styles.accountRowCopy}>
            <ThemedText style={styles.accountRowTitle}>{item.title}</ThemedText>
            <ThemedText style={styles.accountRowText}>
              {item.description}
            </ThemedText>
          </View>
          <View style={styles.accountRowBadge}>
            <ThemedText style={styles.accountRowBadgeText}>
              {item.badge}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#aa9ab8" />
        </Pressable>
      ))}

      <ThemedText style={styles.subsectionTitle}>Hỗ trợ & chăm sóc</ThemedText>
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
        <Ionicons name="chevron-forward" size={18} color="#aa9ab8" />
      </View>

      <Pressable style={styles.accountPrimaryButton}>
        <Ionicons name="power-outline" size={18} color="#fff" />
        <ThemedText style={styles.accountPrimaryButtonText}>
          Đăng xuất
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}
