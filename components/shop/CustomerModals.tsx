import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Product } from "@/constants/shop-data";
import { styles } from "./shop-styles";

type ProductModalProps = {
  product: Product | null;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onAddToCart: () => void;
};

export function ProductModal({
  product,
  isFavorite,
  onClose,
  onToggleFavorite,
  onAddToCart,
}: ProductModalProps) {
  return (
    <Modal
      visible={Boolean(product)}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {product && (
        <View style={styles.modalBackdrop}>
          <View style={styles.productModal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View
                style={[styles.detailImage, { backgroundColor: product.color }]}
              >
                {product.image ? (
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImageObject}
                    contentFit="cover"
                    accessibilityLabel={product.name}
                  />
                ) : (
                  <ThemedText style={styles.detailEmoji}>
                    {product.icon}
                  </ThemedText>
                )}
                <Pressable
                  style={styles.detailClose}
                  onPress={onClose}
                  accessibilityLabel="Đóng chi tiết"
                >
                  <Ionicons name="close" size={21} color="#54316d" />
                </Pressable>
              </View>
              <View style={styles.detailHeader}>
                <View style={styles.detailCopy}>
                  <ThemedText style={styles.detailName}>
                    {product.name}
                  </ThemedText>
                  <ThemedText style={styles.detailPrice}>
                    {product.price}
                  </ThemedText>
                </View>
                <Pressable
                  style={styles.detailFavorite}
                  onPress={onToggleFavorite}
                  accessibilityLabel="Yêu thích sản phẩm"
                >
                  <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={22}
                    color="#e66e88"
                  />
                </Pressable>
              </View>
              <ThemedText style={styles.detailRating}>
                ★ {product.rating.toFixed(1)} · {product.reviewCount} đánh giá ·
                Còn {product.stock} sản phẩm
              </ThemedText>
              <ThemedText style={styles.detailDescription}>
                {product.description}
              </ThemedText>
              <View style={styles.detailFacts}>
                <DetailFact label="Nguồn gốc" value={product.origin} />
                <DetailFact label="Chất liệu" value={product.material} />
                <DetailFact label="Kích thước" value={product.dimensions} />
                <DetailFact label="Khối lượng" value={product.weight} />
                <DetailFact label="Bảo quản" value={product.careInstructions} />
                <DetailFact
                  label="Bộ sản phẩm"
                  value={product.packageContents ?? "Đang cập nhật"}
                />
                <DetailFact
                  label="Cách dùng"
                  value={product.usage ?? "Đang cập nhật"}
                />
              </View>
              <ThemedText style={styles.detailTags}>
                #{product.tags.join("  #")}
              </ThemedText>
              <View style={styles.detailServiceList}>
                <ServiceRow
                  icon="car-outline"
                  title="Giao hàng"
                  text={product.shippingInfo ?? "Đang cập nhật"}
                />
                <ServiceRow
                  icon="shield-checkmark-outline"
                  title="Đổi trả / bảo hành"
                  text={product.warranty ?? "Đang cập nhật"}
                />
              </View>
              <View style={styles.detailBenefits}>
                <Ionicons name="gift-outline" size={20} color="#7142a5" />
                <ThemedText style={styles.detailBenefitText}>
                  Có thể gói quà và viết lời chúc miễn phí
                </ThemedText>
              </View>
              <Pressable style={styles.addButton} onPress={onAddToCart}>
                <Ionicons name="bag-add-outline" size={20} color="#fff" />
                <ThemedText style={styles.addButtonText}>
                  Thêm vào giỏ hàng
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      )}
    </Modal>
  );
}

function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailFact}>
      <ThemedText style={styles.detailFactLabel}>{label}</ThemedText>
      <ThemedText style={styles.detailFactValue}>{value}</ThemedText>
    </View>
  );
}

function ServiceRow({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.serviceRow}>
      <Ionicons name={icon} size={19} color="#7142a5" />
      <View style={styles.serviceCopy}>
        <ThemedText style={styles.serviceTitle}>{title}</ThemedText>
        <ThemedText style={styles.serviceText}>{text}</ThemedText>
      </View>
    </View>
  );
}

type CartModalProps = {
  visible: boolean;
  items: Product[];
  onClose: () => void;
  onRemove: (name: string) => void;
};

export function CartModal({
  visible,
  items,
  onClose,
  onRemove,
}: CartModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.cartModal}>
          <View style={styles.modalHeader}>
            <View>
              <ThemedText style={styles.modalTitle}>
                Giỏ hàng của bạn
              </ThemedText>
              <ThemedText style={styles.countText}>
                {items.length} sản phẩm
              </ThemedText>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Đóng giỏ hàng"
            >
              <Ionicons name="close" size={21} color="#54316d" />
            </Pressable>
          </View>
          {items.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="bag-handle-outline" size={44} color="#cbb9d6" />
              <ThemedText style={styles.emptyCartTitle}>
                Giỏ hàng đang trống
              </ThemedText>
              <ThemedText style={styles.emptyCartText}>
                Hãy chọn một món quà thật xinh cho người bạn thương.
              </ThemedText>
            </View>
          ) : (
            <>
              {items.map((item) => (
                <View style={styles.cartRow} key={item.name}>
                  <View
                    style={[styles.cartThumb, { backgroundColor: item.color }]}
                  >
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.productImageObject}
                        contentFit="cover"
                        accessibilityLabel={item.name}
                      />
                    ) : (
                      <ThemedText style={styles.cartEmoji}>
                        {item.icon}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.cartCopy}>
                    <ThemedText style={styles.cartName}>{item.name}</ThemedText>
                    <ThemedText style={styles.cartPrice}>
                      {item.price}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => onRemove(item.name)}
                    accessibilityLabel={`Xóa ${item.name}`}
                  >
                    <Ionicons name="trash-outline" size={19} color="#aa9ab8" />
                  </Pressable>
                </View>
              ))}
              <View style={styles.cartTotal}>
                <ThemedText style={styles.totalLabel}>Tạm tính</ThemedText>
                <ThemedText style={styles.totalPrice}>
                  {items
                    .reduce(
                      (total, item) =>
                        total + Number(item.price.replace(/\D/g, "")),
                      0,
                    )
                    .toLocaleString("vi-VN")}
                  đ
                </ThemedText>
              </View>
              <Pressable style={styles.checkoutButton}>
                <ThemedText style={styles.addButtonText}>
                  Tiến hành đặt hàng
                </ThemedText>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
