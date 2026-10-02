// app/(tabs)/salary.tsx
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";
const HOURLY_RATE = 25000;

export default function SalaryScreen() {
  const [loading, setLoading] = useState(false);
  const [salaries, setSalaries] = useState([]);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const calculateSalary = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/attendance/salary?start_date=${startDate}&end_date=${endDate}`,
      );
      const data = await res.json();
      setSalaries(data);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tính lương");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  if (loading)
    return (
      <ActivityIndicator size="large" color="#d97706" style={{ flex: 1 }} />
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bảng Tính Lương</Text>
      </View>

      {/* Bộ lọc ngày */}
      <View style={styles.filterBox}>
        <View style={styles.dateInput}>
          <Text style={styles.label}>Từ ngày:</Text>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            style={styles.inputDate}
          />
        </View>
        <View style={styles.dateInput}>
          <Text style={styles.label}>Đến ngày:</Text>
          <TextInput
            value={endDate}
            onChangeText={setEndDate}
            style={styles.inputDate}
          />
        </View>
        <TouchableOpacity onPress={calculateSalary} style={styles.calcBtn}>
          <Ionicons
            name="calculator"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.calcText}>Tính Lương</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách lương */}
      <FlatList
        data={salaries}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.empInfo}>
              <Text style={styles.empName}>{item.name}</Text>
              <Text style={styles.shiftDetail}>
                🌅 Sáng: {item.shifts.morning} | 🌞 Chiều:{" "}
                {item.shifts.afternoon} | Tối: {item.shifts.evening}
              </Text>
              <Text style={styles.hours}>Tổng giờ: {item.formattedHours}h</Text>
            </View>
            <View style={styles.salaryBox}>
              <Text style={styles.salaryLabel}>Thành tiền</Text>
              <Text style={styles.salaryAmount}>
                {formatMoney(item.totalSalary)}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Chọn ngày và nhấn "Tính Lương" để xem kết quả
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#1f2937" },
  filterBox: { padding: 16, backgroundColor: "#fff", marginBottom: 10 },
  dateInput: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  label: { width: 80, fontSize: 14, color: "#6b7280" },
  inputDate: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  calcBtn: {
    flexDirection: "row",
    backgroundColor: "#d97706",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  calcText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  empInfo: { flex: 1 },
  empName: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  shiftDetail: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  hours: { fontSize: 13, color: "#d97706", marginTop: 4, fontWeight: "600" },
  salaryBox: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#f3f4f6",
  },
  salaryLabel: { fontSize: 12, color: "#9ca3af" },
  salaryAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 40,
    fontSize: 14,
  },
});
