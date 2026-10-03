// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

interface PersonalService {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  duration_minutes: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [services, setServices] = useState<PersonalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  // ✅ SỬA LỖI TDZ: KHAI BÁO HÀM TRƯỚC
  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/personal-services`);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!hasFetched) {
    setHasFetched(true);
    fetchServices();
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "packaging":
        return "🎁 Gói Quà";
      case "diy_kit":
        return "🛠️ Kit Tự Làm";
      case "mini_decor":
        return "🌿 Decor Mini";
      case "lettering":
        return "✍️ Thư Pháp";
      default:
        return "✨ Khác";
    }
  };

  const handleOrder = (item: PersonalService) => {
    Alert.alert(
      "Đặt Dịch Vụ Handmade",
      `${item.name}\n\nGiá: ${Number(item.price).toLocaleString()}đ\nThời gian làm: ~${item.duration_minutes} phút\n\nBạn muốn đặt ngay hay cần tư vấn thêm?`,
      [
        { text: "Tư vấn Zalo", style: "cancel" },
        {
          text: "Đặt Ngay",
          onPress: () =>
            Alert.alert("Thành công", "Đơn hàng của bạn đã được ghi nhận!"),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER NHẸ NHÀNG */}
      <View style={styles.heroSection}>
        <Text style={styles.subtitle}>Tự tay trao gửi yêu thương</Text>
        <Text style={styles.title}>EIKO HANDMADE</Text>
        <Text style={styles.desc}>
          Dịch vụ gói quà, kit DIY và decor mini dành riêng cho bạn.
        </Text>

        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => router.push("/explore")}
        >
          <Ionicons name="bag-handle-outline" size={20} color="#fff" />
          <Text style={styles.shopBtnText}>Mua Nguyên Liệu</Text>
        </TouchableOpacity>
      </View>

      {/* DANH SÁCH DỊCH VỤ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Dịch Vụ Hot Trend</Text>
        <Text style={styles.sectionSub}>Nhỏ xinh, ý nghĩa, giá hạt dẻ</Text>
      </View>

      {loading ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={services}
          keyExtractor={(i) => i.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Ảnh chính */}
              <Image
                source={{ uri: item.image }}
                style={styles.cardImg}
                resizeMode="cover"
              />

              {/* Badge danh mục nổi trên ảnh */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {getCategoryLabel(item.category)}
                </Text>
              </View>

              {/* Nội dung thẻ */}
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={2}>
                  {item.name}
                </Text>

                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color="#9ca3af" />
                  <Text style={styles.metaText}>
                    {item.duration_minutes} làm
                  </Text>
                </View>

                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.footerRow}>
                  <Text style={styles.price}>
                    ₺{Number(item.price).toLocaleString()}
                  </Text>
                  <TouchableOpacity
                    style={styles.orderBtn}
                    onPress={() => handleOrder(item)}
                  >
                    <Text style={styles.orderBtnText}>Đặt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: "#999", paddingLeft: 16 }}>
              Chưa có dịch vụ nào.
            </Text>
          }
        />
      )}

      {/* LỜI KÊU GỌI HÀNH ĐỘNG CUỐI TRANG */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Bạn có ý tưởng riêng?</Text>
        <Text style={styles.ctaDesc}>
          Chúng tôi nhận thiết kế theo yêu cầu (Custom Order).
        </Text>
        <TouchableOpacity style={styles.contactBtn}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
          <Text style={styles.contactBtnText}>Chat với Artisan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ by Eiko Team</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdf2f8" }, // Màu hồng pastel nhạt nền web/app

  heroSection: {
    padding: 30,
    backgroundColor: "#fce7f3", // Hồng phấn đậm hơn chút
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
    paddingTop: 60,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "#db2777",
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#be185d",
    marginTop: 4,
    fontFamily: "serif",
  }, // Font serif cho cảm giác vintage
  desc: {
    fontSize: 14,
    color: "#831843",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 280,
  },

  shopBtn: {
    marginTop: 20,
    backgroundColor: "#be185d",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#be185d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  shopBtnText: { color: "#fff", fontWeight: "bold" },

  sectionHeader: { paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#1f2937" },
  sectionSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },

  listContent: { paddingHorizontal: 20, gap: 16, paddingBottom: 20 },

  card: {
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardImg: { width: "100%", height: 140 },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: { fontSize: 10, fontWeight: "bold", color: "#be185d" },

  cardBody: { padding: 12 },
  cardName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  metaText: { fontSize: 11, color: "#9ca3af", marginLeft: 4 },
  cardDesc: {
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 16,
    marginBottom: 10,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
  },
  price: { fontSize: 16, fontWeight: "bold", color: "#dc2626" },
  orderBtn: {
    backgroundColor: "#fdf2f8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fbcfe8",
  },
  orderBtnText: { fontSize: 12, fontWeight: "bold", color: "#be185d" },

  ctaSection: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#fbcfe8",
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  ctaDesc: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 12,
  },
  contactBtn: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  footer: { padding: 20, alignItems: "center" },
  footerText: { fontSize: 12, color: "#9ca3af" },
});
