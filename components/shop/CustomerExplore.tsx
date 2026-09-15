import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { CATEGORIES, type Product } from "@/constants/shop-data";
import { useShopProducts } from "@/database/use-shop-products";
import { ProductModal } from "./CustomerModals";

type SortMode = "featured" | "priceAsc" | "priceDesc" | "rating";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "featured", label: "Nổi bật" },
  { value: "priceAsc", label: "Giá tăng dần" },
  { value: "priceDesc", label: "Giá giảm dần" },
  { value: "rating", label: "Đánh giá cao" },
];

const priceToNumber = (price: string) =>
  Number(price.replace(/[^\d]/g, "")) || 0;

export function CustomerExplore() {
  const products = useShopProducts();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [favoriteNames, setFavoriteNames] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const origins = useMemo(
    () => Array.from(new Set(products.map((p) => p.origin))),
    [products],
  );
  const tags = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.tags))).slice(0, 14),
    [products],
  );
  const featured = useMemo(
    () => products.filter((p) => p.isFeatured),
    [products],
  );
  const topRated = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
        .slice(0, 5),
    [products],
  );
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      map.set(p.category, (map.get(p.category) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const normalizedSearch = search.trim().toLowerCase();
  const hasFilter = Boolean(
    normalizedSearch || selectedCategory || selectedOrigin || selectedTag,
  );

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const target = [
        p.name,
        p.description,
        p.category,
        p.origin,
        p.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const matchSearch =
        !normalizedSearch || target.includes(normalizedSearch);
      const matchCategory =
        !selectedCategory || p.category === selectedCategory;
      const matchOrigin = !selectedOrigin || p.origin === selectedOrigin;
      const matchTag = !selectedTag || p.tags.includes(selectedTag);
      return matchSearch && matchCategory && matchOrigin && matchTag;
    });
    switch (sortMode) {
      case "priceAsc":
        return [...list].sort(
          (a, b) => priceToNumber(a.price) - priceToNumber(b.price),
        );
      case "priceDesc":
        return [...list].sort(
          (a, b) => priceToNumber(b.price) - priceToNumber(a.price),
        );
      case "rating":
        return [...list].sort((a, b) => b.rating - a.rating);
      default:
        return [...list].sort(
          (a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0),
        );
    }
  }, [
    products,
    normalizedSearch,
    selectedCategory,
    selectedOrigin,
    selectedTag,
    sortMode,
  ]);

  const toggleFavorite = (product: Product) => {
    setFavoriteNames((current) => {
      const next = new Set(current);
      if (next.has(product.name)) next.delete(product.name);
      else next.add(product.name);
      return next;
    });
  };

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCategory(null);
    setSelectedOrigin(null);
    setSelectedTag(null);
  };

  const handleAddToCart = (product: Product) => {
    setSelectedProduct(null);
    setToast(`Đã thêm "${product.name}" vào giỏ hàng (demo)`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== Header ===== */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Khám phá</ThemedText>
          <ThemedText style={styles.subtitle}>
            Dẫn lối làng nghề Việt — chọn món quà đúng câu chuyện bạn muốn kể.
          </ThemedText>
        </View>

        {/* ===== Thanh tìm kiếm ===== */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#667085" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm tên, mô tả, làng nghề, chủ đề..."
            placeholderTextColor="#667085"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch("")}
              accessibilityLabel="Xóa tìm kiếm"
            >
              <Ionicons name="close-circle" size={18} color="#667085" />
            </Pressable>
          )}
        </View>

        {/* ===== Banner thống kê ===== */}
        <View style={styles.banner}>
          <ThemedText style={styles.bannerKicker}>EIKO DISCOVERY</ThemedText>
          <ThemedText style={styles.bannerTitle}>
            Hành hương qua những làng nghề
          </ThemedText>
          <ThemedText style={styles.bannerText}>
            {products.length} sản phẩm • {origins.length} làng nghề •{" "}
            {tags.length} chủ đề quà tặng
          </ThemedText>
        </View>

        {hasFilter ? (
          /* ===== KẾT QUẢ THEO BỘ LỌC ===== */
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText style={styles.sectionTitle}>
                Kết quả ({filteredProducts.length})
              </ThemedText>
              <Pressable onPress={clearAllFilters}>
                <ThemedText style={styles.clearAll}>Xóa tất cả</ThemedText>
              </Pressable>
            </View>

            {/* Chip bộ lọc đang bật */}
            <View style={styles.activeFilterRow}>
              {selectedCategory && (
                <FilterChip
                  label={selectedCategory}
                  onClear={() => setSelectedCategory(null)}
                />
              )}
              {selectedOrigin && (
                <FilterChip
                  label={selectedOrigin}
                  onClear={() => setSelectedOrigin(null)}
                />
              )}
              {selectedTag && (
                <FilterChip
                  label={`#${selectedTag}`}
                  onClear={() => setSelectedTag(null)}
                />
              )}
            </View>

            {/* Sắp xếp */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortRow}
            >
              {SORT_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.sortChip,
                    sortMode === option.value && styles.sortChipActive,
                  ]}
                  onPress={() => setSortMode(option.value)}
                >
                  <ThemedText
                    style={[
                      styles.sortChipText,
                      sortMode === option.value && styles.sortChipTextActive,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.grid}>
              {filteredProducts.map((product, index) => (
                <ExploreCard
                  key={`${product.sku ?? product.name}-${index}`}
                  product={product}
                  isFavorite={favoriteNames.has(product.name)}
                  onToggleFavorite={toggleFavorite}
                  onPress={() => setSelectedProduct(product)}
                />
              ))}
            </View>
            {filteredProducts.length === 0 && (
              <ThemedText style={styles.empty}>
                Không có sản phẩm phù hợp bộ lọc hiện tại.
              </ThemedText>
            )}
          </View>
        ) : (
          /* ===== NỘI DUNG KHÁM PHÁ MẶC ĐỊNH ===== */
          <>
            {/* Danh mục */}
            <View style={styles.sectionBlock}>
              <SectionTitle
                title="Danh mục"
                subtitle="Chạm để xem theo nhóm quà"
              />
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((category) => (
                  <Pressable
                    key={category.label}
                    style={styles.categoryCard}
                    onPress={() => setSelectedCategory(category.label)}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: category.color },
                      ]}
                    >
                      <Ionicons
                        name={category.icon}
                        size={22}
                        color="#593477"
                      />
                    </View>
                    <ThemedText style={styles.categoryName}>
                      {category.label}
                    </ThemedText>
                    <ThemedText style={styles.categoryCount}>
                      {categoryCounts.get(category.label) ?? 0} sản phẩm
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Làng nghề / xuất xứ */}
            <View style={styles.sectionBlock}>
              <SectionTitle
                title="Làng nghề & xuất xứ"
                subtitle="Nơi mỗi món quà sinh ra"
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {origins.map((origin) => (
                  <Pressable
                    key={origin}
                    style={styles.chip}
                    onPress={() => setSelectedOrigin(origin)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#7142a5"
                    />
                    <ThemedText style={styles.chipText} numberOfLines={1}>
                      {origin}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Nổi bật tuần này */}
            <View style={styles.sectionBlock}>
              <SectionTitle
                title="Nổi bật tuần này"
                subtitle="Chọn lọc bởi EiKo"
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfRow}
              >
                {featured.map((product, index) => (
                  <ShelfCard
                    key={`${product.sku ?? product.name}-${index}`}
                    product={product}
                    isFavorite={favoriteNames.has(product.name)}
                    onToggleFavorite={toggleFavorite}
                    onPress={() => setSelectedProduct(product)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Bảng xếp hạng đánh giá */}
            <View style={styles.sectionBlock}>
              <SectionTitle
                title="Được yêu thích nhất"
                subtitle="Xếp theo đánh giá của khách"
              />
              <View style={styles.rankingList}>
                {topRated.map((product, index) => (
                  <Pressable
                    key={`${product.sku ?? product.name}-${index}`}
                    style={styles.rankingRow}
                    onPress={() => setSelectedProduct(product)}
                  >
                    <ThemedText style={styles.rankingIndex}>
                      {index + 1}
                    </ThemedText>
                    <View
                      style={[
                        styles.rankingThumb,
                        { backgroundColor: product.color },
                      ]}
                    >
                      {product.image ? (
                        <Image
                          source={{ uri: product.image }}
                          style={styles.rankingImage}
                          contentFit="cover"
                          accessibilityLabel={product.name}
                        />
                      ) : (
                        <ThemedText style={styles.rankingEmoji}>
                          {product.icon}
                        </ThemedText>
                      )}
                    </View>
                    <View style={styles.rankingInfo}>
                      <ThemedText style={styles.rankingName} numberOfLines={1}>
                        {product.name}
                      </ThemedText>
                      <Stars rating={product.rating} />
                      <ThemedText style={styles.rankingMeta}>
                        {product.rating.toFixed(1)} • {product.reviewCount} đánh
                        giá
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.rankingPrice}>
                      {product.price}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Chủ đề quà tặng */}
            <View style={styles.sectionBlock}>
              <SectionTitle
                title="Chủ đề quà tặng"
                subtitle="Gợi ý nhanh theo dịp"
              />
              <View style={styles.tagWrap}>
                {tags.map((tag) => (
                  <Pressable
                    key={tag}
                    style={styles.tagChip}
                    onPress={() => setSelectedTag(tag)}
                  >
                    <ThemedText style={styles.tagText}>#{tag}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ===== Toast thêm giỏ hàng ===== */}
      {toast && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />
          <ThemedText style={styles.toastText}>{toast}</ThemedText>
        </View>
      )}

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
        onAddToCart={() => selectedProduct && handleAddToCart(selectedProduct)}
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

function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <View style={styles.activeChip}>
      <ThemedText style={styles.activeChipText} numberOfLines={1}>
        {label}
      </ThemedText>
      <Pressable onPress={onClear} accessibilityLabel={`Bỏ lọc ${label}`}>
        <Ionicons name="close" size={14} color="#ffffff" />
      </Pressable>
    </View>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((step) => (
        <Ionicons
          key={step}
          name={
            rating >= step
              ? "star"
              : rating >= step - 0.5
                ? "star-half"
                : "star-outline"
          }
          size={13}
          color="#f2b01e"
        />
      ))}
    </View>
  );
}

function ExploreCard({
  product,
  isFavorite,
  onToggleFavorite,
  onPress,
}: {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.cardImage, { backgroundColor: product.color }]}>
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={styles.cardImageObject}
            contentFit="cover"
            accessibilityLabel={product.name}
          />
        ) : (
          <ThemedText style={styles.cardEmoji}>{product.icon}</ThemedText>
        )}
        <Pressable
          style={styles.heart}
          onPress={(event) => {
            event.stopPropagation();
            onToggleFavorite(product);
          }}
          accessibilityLabel="Yêu thích sản phẩm"
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={16}
            color={isFavorite ? "#e66e88" : "#172b4d"}
          />
        </Pressable>
      </View>
      <ThemedText style={styles.cardName} numberOfLines={2}>
        {product.name}
      </ThemedText>
      <ThemedText style={styles.cardCategory}>{product.category}</ThemedText>
      <ThemedText style={styles.cardPrice}>{product.price}</ThemedText>
    </Pressable>
  );
}

function ShelfCard({
  product,
  isFavorite,
  onToggleFavorite,
  onPress,
}: {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.shelfCard} onPress={onPress}>
      <View style={[styles.shelfImage, { backgroundColor: product.color }]}>
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={styles.shelfImageObject}
            contentFit="cover"
            accessibilityLabel={product.name}
          />
        ) : (
          <ThemedText style={styles.shelfEmoji}>{product.icon}</ThemedText>
        )}
        <Pressable
          style={styles.heart}
          onPress={(event) => {
            event.stopPropagation();
            onToggleFavorite(product);
          }}
          accessibilityLabel="Yêu thích sản phẩm"
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={16}
            color={isFavorite ? "#e66e88" : "#172b4d"}
          />
        </Pressable>
      </View>
      <ThemedText style={styles.cardName} numberOfLines={2}>
        {product.name}
      </ThemedText>
      <ThemedText style={styles.cardPrice}>{product.price}</ThemedText>
    </Pressable>
  );
}

/* ================= Styles ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f7f3fb" },
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  header: { marginTop: 8, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", color: "#2b1b3d" },
  subtitle: { marginTop: 4, fontSize: 13, lineHeight: 19, color: "#6b5b7d" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#e6dcf2",
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#172b4d", paddingVertical: 0 },
  banner: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#593477",
    marginBottom: 18,
  },
  bannerKicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#d9c7f0",
  },
  bannerTitle: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
  bannerText: { marginTop: 6, fontSize: 12, color: "#e6dcf2" },
  sectionBlock: { marginBottom: 18 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#2b1b3d" },
  sectionSubtitle: { marginTop: 2, fontSize: 12, color: "#6b5b7d" },
  clearAll: { fontSize: 13, fontWeight: "600", color: "#7142a5" },
  activeFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 240,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#7142a5",
  },
  activeChipText: { fontSize: 12, color: "#ffffff", flexShrink: 1 },
  sortRow: { gap: 8, paddingRight: 8, marginBottom: 12 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  sortChipActive: { backgroundColor: "#7142a5", borderColor: "#7142a5" },
  sortChipText: { fontSize: 12, color: "#5a4a6b" },
  sortChipTextActive: { color: "#ffffff", fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  empty: { fontSize: 13, color: "#6b5b7d", textAlign: "center", marginTop: 12 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryName: { fontSize: 14, fontWeight: "700", color: "#2b1b3d" },
  categoryCount: { marginTop: 2, fontSize: 11, color: "#6b5b7d" },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  chipText: { fontSize: 12, color: "#5a4a6b", flexShrink: 1 },
  shelfRow: { gap: 10, paddingRight: 8 },
  shelfCard: {
    width: 150,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  shelfImage: {
    width: "100%",
    height: 110,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shelfImageObject: { width: "100%", height: "100%", borderRadius: 12 },
  shelfEmoji: { fontSize: 40 },
  rankingList: { gap: 8 },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  rankingIndex: {
    fontSize: 16,
    fontWeight: "800",
    color: "#9b82ac",
    width: 20,
  },
  rankingThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rankingImage: { width: "100%", height: "100%", borderRadius: 12 },
  rankingEmoji: { fontSize: 22 },
  rankingInfo: { flex: 1 },
  rankingName: { fontSize: 14, fontWeight: "700", color: "#2b1b3d" },
  starsRow: { flexDirection: "row", gap: 2, marginVertical: 2 },
  rankingMeta: { fontSize: 11, color: "#6b5b7d" },
  rankingPrice: { fontSize: 13, fontWeight: "700", color: "#7142a5" },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#efe6f9",
  },
  tagText: { fontSize: 12, color: "#593477" },
  card: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e6dcf2",
  },
  cardImage: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardImageObject: { width: "100%", height: "100%", borderRadius: 12 },
  cardEmoji: { fontSize: 42 },
  heart: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffffee",
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { marginTop: 8, fontSize: 13, fontWeight: "600", color: "#2b1b3d" },
  cardCategory: { marginTop: 2, fontSize: 11, color: "#6b5b7d" },
  cardPrice: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#7142a5",
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
});
