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

interface ServiceItem {
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
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  // ✅ Pattern Initialize-on-Render (Không dùng useEffect)
  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/personal-services`);
      if (res.ok) setServices(await res.json());
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HERO SECTION */}
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
          <Text style={styles.shopBtnText}>Xem Sản Phẩm</Text>
        </TouchableOpacity>
      </View>

      {/* SERVICE LIST */}
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
              <Image
                source={{ uri: item.image }}
                style={styles.cardImg}
                resizeMode="cover"
              />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {getCategoryLabel(item.category)}
                </Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.footerRow}>
                  <Text style={styles.price}>
                    ₺{Number(item.price).toLocaleString()}
                  </Text>
                  <TouchableOpacity
                    style={styles.orderBtn}
                    onPress={() =>
                      Alert.alert(
                        "Đặt hàng",
                        "Tính năng thanh toán sẽ ra mắt sớm!",
                      )
                    }
                  >
                    <Text style={styles.orderBtnText}>Đặt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Eiko Shop</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdf2f8" },
  heroSection: {
    padding: 30,
    backgroundColor: "#fce7f3",
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
  title: { fontSize: 32, fontWeight: "bold", color: "#be185d", marginTop: 4 },
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
  },
  badgeText: { fontSize: 10, fontWeight: "bold", color: "#be185d" },

  cardBody: { padding: 12 },
  cardName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
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

  footer: { padding: 20, alignItems: "center" },
  footerText: { fontSize: 12, color: "#9ca3af" },
});
