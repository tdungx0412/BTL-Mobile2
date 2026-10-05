// components/statistics/StatisticsModal.tsx
import { API_URL, BASE_URL } from "@/constants/config";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface StatisticsData {
  range: string;
  summary: {
    totalRevenue: number;
    validRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    shippingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    uniqueCustomers: number;
    registeredCustomers: number;
    totalProducts: number;
    totalStock: number;
    outOfStock: number;
    lowStock: number;
  };
  topProducts: Array<{
    id: number;
    name: string;
    image: string | null;
    category: string;
    price: number;
    quantity: number;
    revenue: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  bookings: {
    total: number;
    revenue: number;
    pending: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  chart7Days: Array<{
    date: string;
    dayName: string;
    orders: number;
    revenue: number;
  }>;
}

interface StatisticsModalProps {
  visible: boolean;
  onClose: () => void;
}

const formatVND = (num: number | string | undefined) => {
  const val = typeof num === "string" ? parseFloat(num) || 0 : num || 0;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
};

const formatCompactVND = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}Tr`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}k`;
  }
  return `${num}đ`;
};

type RangeOption = "all" | "today" | "week" | "month";

const RANGES: { key: RangeOption; label: string; icon: string }[] = [
  { key: "all", label: "Tất Cả", icon: "calendar-outline" },
  { key: "today", label: "Hôm Nay", icon: "today-outline" },
  { key: "week", label: "7 Ngày Qua", icon: "stats-chart-outline" },
  { key: "month", label: "Tháng Này", icon: "time-outline" },
];

export const StatisticsModal: React.FC<StatisticsModalProps> = ({ visible, onClose }) => {
  const [range, setRange] = useState<RangeOption>("all");
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (selectedRange: RangeOption = range, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`${API_URL}/admin/statistics?range=${selectedRange}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("fetchStats error:", err);
      Alert.alert("Lỗi tải dữ liệu", "Không thể lấy dữ liệu thống kê. Vui lòng thử lại!");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchStats(range);
    }
  }, [visible, range]);

  const maxChartRev = Math.max(
    ...(data?.chart7Days?.map((d) => d.revenue) || [1]),
    100000
  );

  const renderProductImage = (imagePath: string | null) => {
    if (!imagePath) {
      return (
        <View style={styles.productPlaceholder}>
          <Ionicons name="basket-outline" size={24} color="#d97706" />
        </View>
      );
    }

    const uri = imagePath.startsWith("http")
      ? imagePath
      : `${BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;

    return <Image source={{ uri }} style={styles.productImg} resizeMode="cover" />;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Báo Cáo & Thống Kê</Text>
            <Text style={styles.headerSubtitle}>Doanh thu & hiệu quả kinh doanh Eiko Shop</Text>
          </View>
          <TouchableOpacity
            onPress={() => fetchStats(range, true)}
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={22} color="#d97706" />
          </TouchableOpacity>
        </View>

        {/* TIME FILTER TABS */}
        <View style={styles.filterBar}>
          {RANGES.map((r) => {
            const isActive = range === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setRange(r.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* MAIN BODY */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#d97706" />
            <Text style={styles.loadingText}>Đang tổng hợp dữ liệu số liệu...</Text>
          </View>
        ) : !data ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
            <Text style={styles.errorText}>Không thể hiển thị thống kê lúc này</Text>
            <TouchableOpacity style={styles.btnRetry} onPress={() => fetchStats(range)}>
              <Text style={styles.btnRetryText}>Thử Lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchStats(range, true)}
                colors={["#d97706"]}
              />
            }
          >
            {/* 1. HERO REVENUE CARD */}
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>DOANH THU THỰC TẾ (HỢP LỆ)</Text>
                  <Text style={styles.heroRevenue}>{formatVND(data.summary.validRevenue)}</Text>
                  <Text style={styles.heroSubtext}>
                    Đã thanh toán / giao hàng thành công (không tính đơn đã hủy)
                  </Text>
                </View>
                <View style={styles.heroIconBadge}>
                  <Ionicons name="cash" size={28} color="#fff" />
                </View>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroMetricsRow}>
                <View style={styles.heroMetricItem}>
                  <Text style={styles.heroMetricLabel}>Tổng doanh thu ghi nhận</Text>
                  <Text style={styles.heroMetricVal}>{formatVND(data.summary.totalRevenue)}</Text>
                </View>
                <View style={styles.heroMetricItem}>
                  <Text style={styles.heroMetricLabel}>Doanh thu Dịch Vụ</Text>
                  <Text style={[styles.heroMetricVal, { color: "#0284c7" }]}>
                    {formatVND(data.bookings.revenue)}
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. ORDER SUMMARY GRID */}
            <Text style={styles.sectionTitle}>Tình Trạng Đơn Hàng</Text>
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, { borderColor: "#fde68a" }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: "#fef3c7" }]}>
                  <Ionicons name="receipt" size={18} color="#d97706" />
                </View>
                <Text style={styles.kpiNumber}>{data.summary.totalOrders}</Text>
                <Text style={styles.kpiTitle}>Tổng Đơn Hàng</Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: "#bbf7d0" }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: "#dcfce7" }]}>
                  <Ionicons name="checkmark-done" size={18} color="#16a34a" />
                </View>
                <Text style={[styles.kpiNumber, { color: "#16a34a" }]}>
                  {data.summary.completedOrders + data.summary.confirmedOrders}
                </Text>
                <Text style={styles.kpiTitle}>Đã Chốt / Xong</Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: "#fed7aa" }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: "#ffedd5" }]}>
                  <Ionicons name="time" size={18} color="#ea580c" />
                </View>
                <Text style={[styles.kpiNumber, { color: "#ea580c" }]}>
                  {data.summary.pendingOrders}
                </Text>
                <Text style={styles.kpiTitle}>Chờ Xác Nhận</Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: "#fecaca" }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: "#fee2e2" }]}>
                  <Ionicons name="close-circle" size={18} color="#dc2626" />
                </View>
                <Text style={[styles.kpiNumber, { color: "#dc2626" }]}>
                  {data.summary.cancelledOrders}
                </Text>
                <Text style={styles.kpiTitle}>Đã Bị Hủy</Text>
              </View>
            </View>

            {/* ORDER SUCCESS RATE BAR */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Tỷ lệ đơn hàng thành công:</Text>
                <Text style={styles.progressPercent}>
                  {data.summary.totalOrders > 0
                    ? Math.round(
                        ((data.summary.completedOrders + data.summary.confirmedOrders) /
                          data.summary.totalOrders) *
                          100
                      )
                    : 0}
                  %
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${
                        data.summary.totalOrders > 0
                          ? Math.round(
                              ((data.summary.completedOrders + data.summary.confirmedOrders) /
                                data.summary.totalOrders) *
                                100
                            )
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* 3. 7-DAY REVENUE BAR CHART */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="bar-chart" size={20} color="#d97706" />
                  <Text style={styles.chartTitle}>Biểu Đồ Doanh Thu 7 Ngày Gần Nhất</Text>
                </View>
                <Text style={styles.chartSubtitle}>Xu hướng tuần này</Text>
              </View>

              <View style={styles.barChartContainer}>
                {data.chart7Days && data.chart7Days.length > 0 ? (
                  data.chart7Days.map((item, idx) => {
                    const ratio = maxChartRev > 0 ? item.revenue / maxChartRev : 0;
                    const barHeight = Math.max(ratio * 120, 6);
                    const isHigh = item.revenue > 0;

                    return (
                      <View key={idx} style={styles.chartColumn}>
                        {/* REVENUE VALUE BADGE */}
                        <Text style={styles.barValText}>
                          {item.revenue > 0 ? formatCompactVND(item.revenue) : "0"}
                        </Text>

                        {/* BAR */}
                        <View style={styles.barWrapper}>
                          <View
                            style={[
                              styles.chartBar,
                              { height: barHeight },
                              isHigh ? styles.chartBarActive : styles.chartBarEmpty,
                            ]}
                          />
                        </View>

                        {/* ORDERS COUNT */}
                        {item.orders > 0 ? (
                          <View style={styles.orderPill}>
                            <Text style={styles.orderPillText}>{item.orders}đ</Text>
                          </View>
                        ) : (
                          <View style={{ height: 16 }} />
                        )}

                        {/* DAY OF WEEK & DATE */}
                        <Text style={[styles.dayLabel, isHigh && styles.dayLabelActive]}>
                          {item.dayName}
                        </Text>
                        <Text style={styles.dateLabel}>{item.date}</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>Chưa có dữ liệu biểu đồ tuần qua</Text>
                )}
              </View>
            </View>

            {/* 4. TOP SELLING PRODUCTS */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="trophy" size={20} color="#f59e0b" />
                  <Text style={styles.sectionHeaderTitle}>Sản Phẩm Bán Chạy Nhất</Text>
                </View>
                <Text style={styles.sectionBadgeText}>{data.topProducts?.length || 0} mục</Text>
              </View>

              {data.topProducts && data.topProducts.length > 0 ? (
                data.topProducts.map((prod, index) => {
                  const medalColors = ["#f59e0b", "#94a3b8", "#b45309"];
                  const rankColor = medalColors[index] || "#6b7280";

                  return (
                    <View key={prod.id || index} style={styles.productRow}>
                      <View style={[styles.rankBadge, { backgroundColor: rankColor + "20" }]}>
                        <Text style={[styles.rankText, { color: rankColor }]}>#{index + 1}</Text>
                      </View>

                      {renderProductImage(prod.image)}

                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>
                          {prod.name}
                        </Text>
                        <View style={styles.prodMetaRow}>
                          <Text style={styles.prodCategory}>{prod.category || "Thủ công"}</Text>
                          <Text style={styles.prodUnitPrice}>{formatVND(prod.price)}</Text>
                        </View>
                      </View>

                      <View style={styles.productSales}>
                        <Text style={styles.salesCount}>{prod.quantity} đã bán</Text>
                        <Text style={styles.salesRev}>{formatVND(prod.revenue)}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Chưa có sản phẩm nào được bán trong giai đoạn này</Text>
              )}
            </View>

            {/* 5. PAYMENT METHODS & CATEGORY BREAKDOWN */}
            <View style={styles.dualGrid}>
              {/* PAYMENT METHODS */}
              <View style={styles.halfCard}>
                <View style={styles.cardHeaderSmall}>
                  <Ionicons name="wallet-outline" size={18} color="#d97706" />
                  <Text style={styles.cardHeaderSmallTitle}>Thanh Toán</Text>
                </View>

                {data.paymentMethods && data.paymentMethods.length > 0 ? (
                  data.paymentMethods.map((pm, i) => (
                    <View key={i} style={styles.breakdownItem}>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownName}>
                          {pm.method === "COD"
                            ? "Tiền mặt (COD)"
                            : pm.method === "BANKING"
                            ? "VietQR / Banking"
                            : pm.method}
                        </Text>
                        <Text style={styles.breakdownVal}>{pm.count} đơn</Text>
                      </View>
                      <Text style={styles.breakdownSub}>{formatVND(pm.total)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
                )}
              </View>

              {/* CATEGORIES */}
              <View style={styles.halfCard}>
                <View style={styles.cardHeaderSmall}>
                  <Ionicons name="pie-chart-outline" size={18} color="#059669" />
                  <Text style={styles.cardHeaderSmallTitle}>Danh Mục</Text>
                </View>

                {data.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                  data.categoryBreakdown.map((cat, i) => (
                    <View key={i} style={styles.breakdownItem}>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownName} numberOfLines={1}>
                          {cat.category || "Khác"}
                        </Text>
                        <Text style={styles.breakdownVal}>{cat.quantity} sp</Text>
                      </View>
                      <Text style={styles.breakdownSub}>{formatVND(cat.revenue)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
                )}
              </View>
            </View>

            {/* 6. CRAFT SERVICES BOOKINGS */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="cut-outline" size={20} color="#0284c7" />
                  <Text style={styles.sectionHeaderTitle}>Dịch Vụ Cá Nhân & Workshop</Text>
                </View>
                <Text style={[styles.sectionBadgeText, { color: "#0284c7" }]}>
                  {data.bookings.total} lượt đặt
                </Text>
              </View>

              <View style={styles.serviceStatsRow}>
                <View style={styles.serviceStatBox}>
                  <Text style={styles.serviceStatVal}>{data.bookings.pending}</Text>
                  <Text style={styles.serviceStatLabel}>Chờ duyệt</Text>
                </View>
                <View style={styles.serviceStatBox}>
                  <Text style={[styles.serviceStatVal, { color: "#059669" }]}>
                    {data.bookings.confirmed}
                  </Text>
                  <Text style={styles.serviceStatLabel}>Đã duyệt</Text>
                </View>
                <View style={styles.serviceStatBox}>
                  <Text style={[styles.serviceStatVal, { color: "#0284c7" }]}>
                    {data.bookings.completed}
                  </Text>
                  <Text style={styles.serviceStatLabel}>Hoàn thành</Text>
                </View>
                <View style={styles.serviceStatBox}>
                  <Text style={[styles.serviceStatVal, { color: "#dc2626" }]}>
                    {data.bookings.cancelled}
                  </Text>
                  <Text style={styles.serviceStatLabel}>Đã hủy</Text>
                </View>
              </View>
            </View>

            {/* 7. CUSTOMERS & INVENTORY OVERVIEW */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="people" size={22} color="#4338ca" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Khách Hàng Mua Sắm</Text>
                  <Text style={styles.infoDesc}>
                    {data.summary.uniqueCustomers} người mua thực tế đã phát sinh đơn hàng
                  </Text>
                </View>
                <Text style={styles.infoNumber}>{data.summary.uniqueCustomers}</Text>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <View style={[styles.infoIconBox, { backgroundColor: "#fef3c7" }]}>
                  <Ionicons name="cube" size={22} color="#d97706" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Kho Hàng Thủ Công</Text>
                  <Text style={styles.infoDesc}>
                    {data.summary.totalProducts} mặt hàng ({data.summary.totalStock} sản phẩm có sẵn)
                  </Text>
                </View>
                <Text style={[styles.infoNumber, { color: "#d97706" }]}>
                  {data.summary.totalStock}
                </Text>
              </View>
            </View>

            {/* FOOTER NOTE */}
            <View style={styles.footerNote}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#9ca3af" />
              <Text style={styles.footerNoteText}>
                Số liệu được tính toán và đồng bộ trực tiếp từ hệ thống Eiko Shop Database.
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  filterBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: "#d97706",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b5563",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 15,
    color: "#4b5563",
    marginTop: 12,
    marginBottom: 16,
  },
  btnRetry: {
    backgroundColor: "#d97706",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnRetryText: {
    color: "#fff",
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: "#d97706",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fef3c7",
    letterSpacing: 0.5,
  },
  heroRevenue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    marginVertical: 4,
  },
  heroSubtext: {
    fontSize: 11,
    color: "#fde68a",
    maxWidth: width * 0.65,
  },
  heroIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 14,
  },
  heroMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroMetricItem: {
    flex: 1,
  },
  heroMetricLabel: {
    fontSize: 11,
    color: "#fef3c7",
    marginBottom: 2,
  },
  heroMetricVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: (width - 42) / 2,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
  },
  kpiTitle: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "800",
    color: "#16a34a",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 4,
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },
  chartSubtitle: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  barChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 190,
    paddingTop: 16,
    paddingBottom: 4,
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  barValText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#d97706",
    marginBottom: 4,
  },
  barWrapper: {
    height: 120,
    justifyContent: "flex-end",
    width: "100%",
    alignItems: "center",
  },
  chartBar: {
    width: 22,
    borderRadius: 6,
    minHeight: 6,
  },
  chartBarActive: {
    backgroundColor: "#d97706",
  },
  chartBarEmpty: {
    backgroundColor: "#e5e7eb",
  },
  orderPill: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  orderPillText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#b45309",
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    marginTop: 4,
  },
  dayLabelActive: {
    color: "#d97706",
    fontWeight: "800",
  },
  dateLabel: {
    fontSize: 9,
    color: "#9ca3af",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d97706",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rankText: {
    fontSize: 11,
    fontWeight: "800",
  },
  productImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    marginRight: 10,
  },
  productPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#fffbeb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 2,
  },
  prodMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  prodCategory: {
    fontSize: 11,
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  prodUnitPrice: {
    fontSize: 11,
    color: "#9ca3af",
  },
  productSales: {
    alignItems: "flex-end",
  },
  salesCount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#16a34a",
  },
  salesRev: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  dualGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeaderSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  cardHeaderSmallTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1f2937",
  },
  breakdownItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#f9fafb",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1f2937",
    marginLeft: 4,
  },
  breakdownSub: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 1,
  },
  serviceStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0f9ff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  serviceStatBox: {
    alignItems: "center",
    flex: 1,
  },
  serviceStatVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0369a1",
  },
  serviceStatLabel: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937",
  },
  infoDesc: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  infoNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4338ca",
    marginLeft: 8,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  footerNoteText: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
  },
});
