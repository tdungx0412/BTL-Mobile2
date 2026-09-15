import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { CATEGORIES, SHOP_LOGO_URL, type Product } from "@/constants/shop-data";
import { styles } from "./shop-styles";

type ShopHomeContentProps = {
  products: Product[];
  selectedProvince: string;
  onOpenLocation: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  favoriteNames: Set<string>;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  cartCount: number;
  onOpenCart: () => void;
};

export function ShopHomeContent({
  products,
  selectedProvince,
  onOpenLocation,
  search,
  onSearchChange,
  favoriteNames,
  onToggleFavorite,
  onSelectProduct,
  cartCount,
  onOpenCart,
}: ShopHomeContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const normalizedSearch = search.trim().toLowerCase();

  const suggestedProducts = products
    .filter((product) => {
      if (!normalizedSearch) return false;
      return product.name.toLowerCase().includes(normalizedSearch);
    })
    .slice(0, 4);

  const visibleProducts = products.filter((product) => {
    const searchTarget = [
      product.name,
      product.category,
      product.description,
      product.origin,
      product.material,
      product.dimensions,
      product.weight,
      product.usage,
      product.careInstructions,
      product.packageContents ?? "",
      product.shippingInfo ?? "",
      product.warranty ?? "",
      product.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch || searchTarget.includes(normalizedSearch);
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.amazonHeader}>
          <View style={styles.headerTop}>
            <View style={styles.shopHeader}>
              <View style={styles.logo}>
                <Image
                  source={{ uri: SHOP_LOGO_URL }}
                  style={styles.logoImage}
                  contentFit="cover"
                  accessibilityLabel="Logo EiKo"
                />
              </View>
              <ThemedText style={styles.brand}>EiKo</ThemedText>
            </View>
            <Pressable
              style={styles.accountButton}
              accessibilityLabel="Tài khoản"
            >
              <Ionicons name="person-outline" size={22} color="#fff" />
              <ThemedText style={styles.accountLabel}>Tài khoản</ThemedText>
            </Pressable>
            <Pressable
              style={styles.cartButton}
              onPress={onOpenCart}
              accessibilityLabel="Giỏ hàng"
            >
              <Ionicons name="cart-outline" size={27} color="#fff" />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{cartCount}</ThemedText>
                </View>
              )}
            </Pressable>
          </View>
          <View style={styles.searchBar}>
            <TextInput
              value={search}
              onChangeText={onSearchChange}
              placeholder="Tìm kiếm sản phẩm"
              placeholderTextColor="#667085"
              style={styles.searchInput}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable
                style={styles.searchClearButton}
                onPress={() => onSearchChange("")}
                accessibilityLabel="Xóa tìm kiếm"
              >
                <Ionicons name="close-circle" size={18} color="#667085" />
              </Pressable>
            )}
            <Pressable
              style={styles.searchButton}
              accessibilityLabel="Tìm kiếm"
              onPress={() => {}}
            >
              <Ionicons name="search" size={21} color="#172b4d" />
            </Pressable>
          </View>
          {normalizedSearch.length > 0 && suggestedProducts.length > 0 && (
            <View style={styles.searchSuggestionList}>
              {suggestedProducts.map(
                (
                  product,
                  index, // ← ĐÃ SỬA: thêm index
                ) => (
                  <Pressable
                    key={`${product.sku ?? product.name}-${index}`} // ← ĐÃ SỬA: key unique
                    style={styles.searchSuggestionItem}
                    onPress={() => {
                      onSearchChange(product.name);
                      setSelectedCategory(null);
                    }}
                  >
                    <View style={styles.searchSuggestionThumb}>
                      {product.image ? (
                        <Image
                          source={{ uri: product.image }}
                          style={styles.searchSuggestionImage}
                          contentFit="cover"
                          accessibilityLabel={product.name}
                        />
                      ) : (
                        <ThemedText style={styles.searchSuggestionEmoji}>
                          {product.icon}
                        </ThemedText>
                      )}
                    </View>
                    <ThemedText style={styles.searchSuggestionName}>
                      {product.name}
                    </ThemedText>
                    <Ionicons name="arrow-forward" size={15} color="#7142a5" />
                  </Pressable>
                ),
              )}
            </View>
          )}
        </View>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <ThemedText style={styles.heroKicker}>EI KO PICKS</ThemedText>
            <ThemedText style={styles.heroTitle}>
              Quà Việt,{`\n`}gửi yêu thương.
            </ThemedText>
            <ThemedText style={styles.heroText}>
              Quà tặng theo mùa và đồ thủ công chọn lọc cho mọi dịp đặc biệt.
            </ThemedText>
            <Pressable
              style={styles.heroButton}
              onPress={() => setSelectedCategory(null)}
            >
              <ThemedText style={styles.heroButtonText}>Mua ngay</ThemedText>
              <Ionicons name="arrow-forward" size={15} color="#172b4d" />
            </Pressable>
          </View>
          <View style={styles.heroArt}>
            <View style={styles.heroSun} />
            <ThemedText style={styles.lantern}></ThemedText>
          </View>
        </View>
        <SectionHeader
          title="Mua sắm theo danh mục"
          onSeeAll={() => setSelectedCategory(null)}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.label}
              style={[
                styles.category,
                selectedCategory === category.label && styles.categoryActive,
              ]}
              onPress={() => setSelectedCategory(category.label)}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: category.color },
                ]}
              >
                <Ionicons name={category.icon} size={24} color="#593477" />
              </View>
              <ThemedText style={styles.categoryText}>
                {category.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
        {!selectedCategory &&
          CATEGORIES.map((category) => {
            const categoryProducts = products.filter(
              (product) => product.category === category.label,
            );
            return (
              <View key={category.label}>
                <SectionHeader
                  title={category.label}
                  onSeeAll={() => setSelectedCategory(category.label)}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.shelfProductList}
                >
                  {categoryProducts.slice(0, 4).map(
                    (
                      product,
                      index, // ← ĐÃ SỬA: thêm index
                    ) => (
                      <ProductCard
                        key={`${product.sku ?? product.name}-${index}`} // ← ĐÃ SỬA: key unique
                        product={product}
                        compact
                        isFavorite={favoriteNames.has(product.name)}
                        onToggleFavorite={onToggleFavorite}
                        onSelectProduct={onSelectProduct}
                      />
                    ),
                  )}
                </ScrollView>
              </View>
            );
          })}
        <SectionHeader
          title={selectedCategory || "Sản phẩm nổi bật"}
          onSeeAll={() => setSelectedCategory(null)}
        />
        <View style={styles.productGrid}>
          {visibleProducts.map(
            (
              product,
              index, // ← ĐÃ SỬA: thêm index
            ) => (
              <ProductCard
                key={`${product.sku ?? product.name}-${index}`} // ← ĐÃ SỬA: key unique
                product={product}
                isFavorite={favoriteNames.has(product.name)}
                onToggleFavorite={onToggleFavorite}
                onSelectProduct={onSelectProduct}
              />
            ),
          )}
        </View>
        {search.length > 0 && visibleProducts.length === 0 && (
          <ThemedText style={styles.noResults}>
            Không tìm thấy món quà phù hợp.
          </ThemedText>
        )}
        <View style={styles.promise}>
          <Ionicons name="gift-outline" size={22} color="#7142a5" />
          <View style={styles.promiseCopy}>
            <ThemedText style={styles.promiseTitle}>
              Gói quà thật xinh
            </ThemedText>
            <ThemedText style={styles.promiseText}>
              Trao gửi yêu thương trọn vẹn
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9b82ac" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductCard({
  product,
  compact = false,
  isFavorite,
  onToggleFavorite,
  onSelectProduct,
}: {
  product: Product;
  compact?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}) {
  return (
    <Pressable
      style={[styles.productCard, compact && styles.shelfProductCard]}
      onPress={() => onSelectProduct(product)}
    >
      <View
        style={[
          styles.productImage,
          compact && styles.shelfProductImage,
          { backgroundColor: product.color },
        ]}
      >
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={styles.productImageObject}
            contentFit="cover"
            accessibilityLabel={product.name}
          />
        ) : (
          <ThemedText style={styles.productEmoji}>{product.icon}</ThemedText>
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
            size={17}
            color={isFavorite ? "#e66e88" : "#172b4d"}
          />
        </Pressable>
      </View>
      <ThemedText style={styles.productName}>{product.name}</ThemedText>
      <ThemedText style={styles.price}>{product.price}</ThemedText>
      <ThemedText style={styles.delivery}>Giao hàng miễn phí</ThemedText>
    </Pressable>
  );
}

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <Pressable onPress={onSeeAll}>
        <ThemedText style={styles.seeAll}>Xem tất cả</ThemedText>
      </Pressable>
    </View>
  );
}
