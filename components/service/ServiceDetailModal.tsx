// components/service/ServiceDetailModal.tsx
import { BASE_URL } from "@/constants/config";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface ServiceDetailItem {
  id: number;
  name: string;
  price: number | string;
  image?: string | null;
  description?: string;
  category?: string;
  duration_minutes?: number;
  is_active?: boolean | number;
}

interface ServiceDetailModalProps {
  visible: boolean;
  service: ServiceDetailItem | null;
  onClose: () => void;
  onBook?: (service: ServiceDetailItem) => void;
}

const defaultFallbackServiceImg =
  "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80";

export const resolveServiceImage = (img?: string | null): string => {
  if (!img || img === "null" || img === "undefined" || img.trim() === "") {
    return defaultFallbackServiceImg;
  }
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) {
    return img;
  }
  const cleanPath = img.startsWith("/") ? img : `/${img}`;
  return `${BASE_URL}${cleanPath}`;
};

export const formatVND = (num: number | string | undefined | null): string => {
  const val = typeof num === "string" ? parseFloat(num) || 0 : num || 0;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
};

export const getServiceCategoryMeta = (cat?: string) => {
  switch (cat) {
    case "packaging":
      return {
        label: "Gói Quà Nghệ Thuật",
        icon: "gift-outline" as const,
        emoji: "🎁",
        color: "#be185d",
        bg: "#fce7f3",
      };
    case "diy_kit":
      return {
        label: "Bộ Kit Tự Làm DIY",
        icon: "construct-outline" as const,
        emoji: "🛠️",
        color: "#0369a1",
        bg: "#e0f2fe",
      };
    case "mini_decor":
      return {
        label: "Decor Thủ Công Mini",
        icon: "flower-outline" as const,
        emoji: "🌿",
        color: "#15803d",
        bg: "#dcfce7",
      };
    case "lettering":
      return {
        label: "Viết Thiệp Thư Pháp",
        icon: "create-outline" as const,
        emoji: "✍️",
        color: "#7c3aed",
        bg: "#ede9fe",
      };
    case "workshop":
      return {
        label: "Workshop Trải Nghiệm",
        icon: "color-palette-outline" as const,
        emoji: "🎨",
        color: "#c2410c",
        bg: "#ffedd5",
      };
    default:
      return {
        label: "Dịch Vụ Thủ Công",
        icon: "sparkles-outline" as const,
        emoji: "✨",
        color: "#b45309",
        bg: "#fef3c7",
      };
  }
};

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  visible,
  service,
  onClose,
  onBook,
}) => {
  if (!service) return null;

  const displayImageUri = resolveServiceImage(service.image);
  const catMeta = getServiceCategoryMeta(service.category);
  const duration = service.duration_minutes || 30;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Chạm vùng tối ngoài để đóng modal */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Khung nội dung chi tiết dịch vụ */}
        <View style={styles.sheet}>
          {/* Nút đóng góc trên */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={22} color="#1f2937" />
          </TouchableOpacity>

          {/* Vùng cuộn nội dung chi tiết */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Ảnh đại diện dịch vụ */}
            <View style={styles.imageBox}>
              <Image source={{ uri: displayImageUri }} style={styles.serviceImg} resizeMode="cover" />
              
              {/* Badge danh mục */}
              <View style={[styles.catBadgeOnImage, { backgroundColor: catMeta.bg }]}>
                <Ionicons name={catMeta.icon} size={14} color={catMeta.color} />
                <Text style={[styles.catBadgeText, { color: catMeta.color }]}>
                  {catMeta.emoji} {catMeta.label}
                </Text>
              </View>

              {/* Tag thời gian ước tính */}
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={13} color="#fff" />
                <Text style={styles.durationBadgeText}>{duration} phút</Text>
              </View>
            </View>

            {/* Thông tin chính dịch vụ */}
            <View style={styles.body}>
              <Text style={styles.serviceTitle}>{service.name}</Text>
              
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>Giá dịch vụ trọn gói</Text>
                  <Text style={styles.priceValue}>{formatVND(service.price)}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={15} color="#f59e0b" />
                  <Text style={styles.ratingText}>4.9/5</Text>
                  <Text style={styles.ratingCount}>(150+ lượt đặt)</Text>
                </View>
              </View>

              {/* 3 Cam kết nhanh */}
              <View style={styles.badgesRow}>
                <View style={styles.miniBadge}>
                  <Ionicons name="leaf-outline" size={15} color="#15803d" />
                  <Text style={styles.miniBadgeText}>Vật liệu tự nhiên</Text>
                </View>
                <View style={styles.miniBadge}>
                  <Ionicons name="hand-right-outline" size={15} color="#d97706" />
                  <Text style={styles.miniBadgeText}>100% Thủ công</Text>
                </View>
                <View style={styles.miniBadge}>
                  <Ionicons name="shield-checkmark-outline" size={15} color="#0284c7" />
                  <Text style={styles.miniBadgeText}>Bảo hiểm nứt vỡ</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Mô tả chi tiết dịch vụ */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="document-text-outline" size={18} color="#b45309" />
                  <Text style={styles.sectionTitle}>Mô Tả Chi Tiết</Text>
                </View>
                <Text style={styles.descriptionText}>
                  {service.description ||
                    "Dịch vụ thủ công được thiết kế chuyên biệt bởi đội ngũ nghệ nhân Eiko Handcraft. Từng công đoạn từ chọn lựa nguyên liệu tự nhiên đến hoàn thiện đều được thực hiện tỉ mỉ và gửi gắm trọn vẹn tình cảm."}
                </Text>
              </View>

              {/* Gói dịch vụ bao gồm */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="checkmark-done-circle-outline" size={18} color="#15803d" />
                  <Text style={styles.sectionTitle}>Gói Dịch Vụ Bao Gồm</Text>
                </View>
                <View style={styles.includeList}>
                  <View style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                    <Text style={styles.includeText}>
                      Nguyên vật liệu tuyển chọn cao cấp (giấy Kraft mộc, hoa lá sấy khô, dây gai tự nhiên).
                    </Text>
                  </View>
                  <View style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                    <Text style={styles.includeText}>
                      Thực hiện thủ công tỉ mỉ theo kích thước và yêu cầu cá nhân hóa riêng.
                    </Text>
                  </View>
                  <View style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                    <Text style={styles.includeText}>
                      Tặng kèm thiệp chúc mừng thiết kế riêng, hỗ trợ viết tay lời chúc ý nghĩa.
                    </Text>
                  </View>
                  <View style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                    <Text style={styles.includeText}>
                      Đóng bọc bảo vệ 2 lớp chống trầy xước, sẵn sàng làm quà tặng trang trọng.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quy trình đặt & thực hiện */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="git-network-outline" size={18} color="#0284c7" />
                  <Text style={styles.sectionTitle}>Quy Trình Thực Hiện</Text>
                </View>
                <View style={styles.stepsContainer}>
                  <View style={styles.stepRow}>
                    <View style={styles.stepNumCircle}>
                      <Text style={styles.stepNumText}>1</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Đặt lịch & Ghi chú yêu cầu</Text>
                      <Text style={styles.stepDesc}>Chọn khung giờ mong muốn và điền ghi chú quà tặng.</Text>
                    </View>
                  </View>

                  <View style={styles.stepRow}>
                    <View style={styles.stepNumCircle}>
                      <Text style={styles.stepNumText}>2</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Nghệ nhân xác nhận</Text>
                      <Text style={styles.stepDesc}>Eiko liên hệ chốt chi tiết màu sắc, kích thước và nội dung thiệp.</Text>
                    </View>
                  </View>

                  <View style={styles.stepRow}>
                    <View style={styles.stepNumCircle}>
                      <Text style={styles.stepNumText}>3</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Gia công & Hoàn thiện</Text>
                      <Text style={styles.stepDesc}>Chế tác công phu và kiểm tra chất lượng hoàn mỹ.</Text>
                    </View>
                  </View>

                  <View style={styles.stepRow}>
                    <View style={styles.stepNumCircle}>
                      <Text style={styles.stepNumText}>4</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Bàn giao hoặc Giao hàng</Text>
                      <Text style={styles.stepDesc}>Nhận tại xưởng hoặc Eiko giao tận tay người thương.</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Gợi ý liên hệ hỗ trợ */}
              <View style={styles.supportBox}>
                <Ionicons name="help-circle-outline" size={20} color="#b45309" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportTitle}>Cần tư vấn thiết kế riêng?</Text>
                  <Text style={styles.supportText}>
                    Liên hệ nghệ nhân Eiko để được tùy chỉnh theo màu sắc & ý tưởng độc bản.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Thanh hành động chân Modal */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.bookNowBtn}
              activeOpacity={0.88}
              onPress={() => {
                if (onBook) {
                  onBook(service);
                }
                onClose();
              }}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.bookNowBtnText}>Đặt Lịch Dịch Vụ Ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.88,
    flexDirection: "column",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageBox: {
    width: "100%",
    height: 250,
    position: "relative",
    backgroundColor: "#f5eee6",
  },
  serviceImg: {
    width: "100%",
    height: "100%",
  },
  catBadgeOnImage: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  durationBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  durationBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1c1917",
    lineHeight: 28,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fdfbf7",
    borderWidth: 1,
    borderColor: "#f5eee6",
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
  },
  priceLabel: {
    fontSize: 11,
    color: "#78716c",
    fontWeight: "600",
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#dc2626",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#92400e",
  },
  ratingCount: {
    fontSize: 11,
    color: "#9ca3af",
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fbf8f3",
    borderWidth: 1,
    borderColor: "#f3ede4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#44403c",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3ede4",
    marginVertical: 14,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1c1917",
  },
  descriptionText: {
    fontSize: 13,
    color: "#57534e",
    lineHeight: 22,
  },
  includeList: {
    backgroundColor: "#fbf8f3",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f5eee6",
    gap: 10,
  },
  includeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  includeText: {
    fontSize: 12,
    color: "#44403c",
    lineHeight: 18,
    flex: 1,
  },
  stepsContainer: {
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#d97706",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepNumText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1c1917",
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: "#78716c",
    lineHeight: 16,
  },
  supportBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fef3c7",
    padding: 12,
    borderRadius: 14,
    marginTop: 6,
  },
  supportTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400e",
    marginBottom: 2,
  },
  supportText: {
    fontSize: 11,
    color: "#b45309",
    lineHeight: 15,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: "#f3ede4",
    backgroundColor: "#fff",
  },
  bookNowBtn: {
    backgroundColor: "#d97706",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bookNowBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
