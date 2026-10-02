// app/(tabs)/staff.tsx
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as XLSX from "xlsx";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";
const HOURLY_RATE = 25000;

// Định nghĩa các tab con
type TabType = "list" | "attendance" | "salary";

export default function StaffScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("list");

  // State cho Danh sách NV
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho Chấm công & Tính lương
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceData, setAttendanceData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // State cho Modal Thêm/Sửa NV
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "" });

  // --- LOGIC DANH SÁCH NHÂN VIÊN ---
  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`);
      const data = await res.json();
      setStaffs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSaveStaff = async () => {
    if (!formData.name.trim()) return Alert.alert("Lỗi", "Nhập tên nhân viên");
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem
        ? `${API_URL}/employees/${editingItem.id}`
        : `${API_URL}/employees`;
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      Alert.alert("Thành công", editingItem ? "Đã cập nhật" : "Đã thêm mới");
      setModalVisible(false);
      fetchStaff();
    } catch (err) {
      Alert.alert("Thất bại", "Lỗi kết nối");
    }
  };

  const handleDeleteStaff = (id) => {
    Alert.alert("Xác nhận", "Xóa nhân viên này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await fetch(`${API_URL}/employees/${id}`, { method: "DELETE" });
          fetchStaff();
        },
      },
    ]);
  };

  // --- LOGIC CHẤM CÔNG ---
  const fetchAttendance = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(
        `${API_URL}/attendance/daily?date=${selectedDate}`,
      );
      const data = await res.json();
      setAttendanceData(data);
    } catch (err) {
      Alert.alert("Lỗi", "Không tải được bảng chấm công");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (activeTab === "attendance") fetchAttendance();
  }, [activeTab, selectedDate]);

  const handleCheckInOut = async (employeeId, type) => {
    try {
      const res = await fetch(`${API_URL}/attendance/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId, type }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      Alert.alert("Thành công", result.message);
      fetchAttendance(); // Refresh bảng
    } catch (err: any) {
      Alert.alert("Lỗi", err.message);
    }
  };

  // --- LOGIC TÍNH LƯƠNG & EXPORT EXCEL ---
  const calculateAndExport = async () => {
    if (attendanceData.length === 0)
      return Alert.alert("Thông báo", "Không có dữ liệu chấm công để xuất");

    setIsProcessing(true);
    try {
      // 1. Chuẩn bị dữ liệu Excel
      const excelData = attendanceData.map((row) => {
        let hours = 0;
        if (row.check_in && row.check_out) {
          const start = new Date(`2000-01-01T${row.check_in}`);
          const end = new Date(`2000-01-01T${row.check_out}`);
          hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          if (hours < 0) hours += 24;
        }

        // Xác định ca
        const hourStart = new Date(`2000-01-01T${row.check_in}`).getHours();
        let shift = "Không xác định";
        if (hourStart >= 8 && hourStart < 12.5) shift = "Sáng (8h-12h30)";
        else if (hourStart >= 12.5 && hourStart < 18)
          shift = "Chiều (12h30-18h)";
        else if (hourStart >= 18) shift = "Tối (18h-23h)";

        return {
          "Họ tên": row.name,
          SĐT: row.phone,
          "Ngày làm": row.work_date,
          "Giờ vào": row.check_in || "-",
          "Giờ ra": row.check_out || "-",
          "Tổng giờ": hours.toFixed(2),
          "Ca làm việc": shift,
          "Thành tiền (VNĐ)": Math.round(hours * HOURLY_RATE),
        };
      });

      // 2. Tạo Workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "BangLuong");

      // 3. Ghi file và chia sẻ (Hoạt động tốt trên Web/Mobile)
      const fileName = `BangLuong_${selectedDate}.xlsx`;
      const base64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Thành công", `File đã lưu tại: ${fileUri}`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể xuất file Excel");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDER GIAO DIỆN ---
  if (loading && activeTab === "list")
    return (
      <ActivityIndicator size="large" color="#d97706" style={{ flex: 1 }} />
    );

  return (
    <View style={styles.container}>
      {/* Header & Tab Switcher nội bộ */}
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý Nhân sự</Text>
        {activeTab === "list" && (
          <TouchableOpacity
            onPress={() => {
              setEditingItem(null);
              setFormData({ name: "", phone: "" });
              setModalVisible(true);
            }}
          >
            <Ionicons name="add-circle" size={32} color="#d97706" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabSwitcher}>
        {(["list", "attendance", "salary"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={
                tab === "list"
                  ? "people"
                  : tab === "attendance"
                    ? "calendar"
                    : "cash"
              }
              size={18}
              color={activeTab === tab ? "#fff" : "#666"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab === "list"
                ? "Danh sách"
                : tab === "attendance"
                  ? "Chấm công"
                  : "Tính lương"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* NỘI DUNG TAB DANH SÁCH */}
      {activeTab === "list" && (
        <FlatList
          data={staffs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.phone}>{item.phone || "Chưa có SĐT"}</Text>
                <Text
                  style={[
                    styles.status,
                    item.status === "active" ? styles.active : styles.inactive,
                  ]}
                >
                  {item.status === "active" ? "Đang làm việc" : "Nghỉ việc"}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingItem(item);
                    setFormData({ name: item.name, phone: item.phone });
                    setModalVisible(true);
                  }}
                  style={styles.iconBtn}
                >
                  <Ionicons name="create-outline" size={22} color="#d97706" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteStaff(item.id)}
                  style={styles.iconBtn}
                >
                  <Ionicons name="trash-outline" size={22} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      {/* NỘI DUNG TAB CHẤM CÔNG & TÍNH LƯƠNG */}
      {(activeTab === "attendance" || activeTab === "salary") && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.filterBox}>
            <Text style={styles.label}>Chọn ngày: </Text>
            <TextInput
              value={selectedDate}
              onChangeText={setSelectedDate}
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
            />
            {activeTab === "salary" && (
              <TouchableOpacity
                onPress={calculateAndExport}
                disabled={isProcessing}
                style={styles.exportBtn}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.exportText}>
                      Xuất Excel & Tính Lương
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {isProcessing ? (
            <ActivityIndicator
              size="large"
              color="#d97706"
              style={{ marginTop: 20 }}
            />
          ) : attendanceData.length === 0 ? (
            <Text style={styles.emptyText}>
              Không có dữ liệu chấm công cho ngày {selectedDate}
            </Text>
          ) : (
            attendanceData.map((item, index) => (
              <View key={index} style={styles.attendanceCard}>
                <View style={styles.attInfo}>
                  <Text style={styles.attName}>{item.name}</Text>
                  <Text style={styles.attTime}>
                    Vào: {item.check_in || "--:--"} | Ra:{" "}
                    {item.check_out || "--:--"}
                  </Text>
                </View>
                {activeTab === "attendance" && (
                  <View style={styles.attActions}>
                    {!item.check_in ? (
                      <TouchableOpacity
                        onPress={() =>
                          handleCheckInOut(item.employee_id, "check_in")
                        }
                        style={styles.checkBtn}
                      >
                        <Text style={styles.checkText}>Vào làm</Text>
                      </TouchableOpacity>
                    ) : !item.check_out ? (
                      <TouchableOpacity
                        onPress={() =>
                          handleCheckInOut(item.employee_id, "check_out")
                        }
                        style={[styles.checkBtn, styles.outBtn]}
                      >
                        <Text style={styles.checkText}>Tan làm</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={{ color: "#059669", fontWeight: "bold" }}>
                        ✔ Đã xong
                      </Text>
                    )}
                  </View>
                )}
                {activeTab === "salary" && (
                  <View style={styles.salaryPreview}>
                    <Text style={styles.salaryAmt}>
                      {Math.round(
                        ((new Date(`2000-01-01T${item.check_out}`).getTime() -
                          new Date(`2000-01-01T${item.check_in}`).getTime()) /
                          3600000) *
                          HOURLY_RATE,
                      ).toLocaleString("vi-VN")}{" "}
                      đ
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* MODAL THÊM/SỬA NV (Giữ nguyên như cũ) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? "Sửa thông tin" : "Thêm nhân viên"}
            </Text>
            <TextInput
              placeholder="Họ và tên *"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              style={styles.input}
            />
            <TextInput
              placeholder="Số điện thoại"
              value={formData.phone}
              onChangeText={(t) => setFormData({ ...formData, phone: t })}
              style={styles.input}
              keyboardType="phone-pad"
            />
            {editingItem && (
              <TouchableOpacity
                onPress={() =>
                  setFormData({
                    ...formData,
                    status:
                      formData.status === "active" ? "inactive" : "active",
                  })
                }
                style={styles.statusToggle}
              >
                <Text>
                  Trạng thái:{" "}
                  {formData.status === "active" ? " Đang làm" : " Nghỉ việc"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSaveStaff}
              style={styles.submitBtn}
            >
              <Text style={styles.submitText}>Lưu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#1f2937" },

  // Internal Tabs
  tabSwitcher: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  activeTabBtn: { backgroundColor: "#d97706" },
  tabText: { fontSize: 14, color: "#666", fontWeight: "600" },
  activeTabText: { color: "#fff" },

  // List Styles
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
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  phone: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  status: {
    fontSize: 12,
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: "600",
  },
  active: { backgroundColor: "#d1fae5", color: "#059669" },
  inactive: { backgroundColor: "#fee2e2", color: "#dc2626" },
  actions: { justifyContent: "center", gap: 12 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },

  // Attendance & Salary Styles
  filterBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  label: { fontSize: 14, color: "#6b7280" },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  exportBtn: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  exportText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  attendanceCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  attInfo: { flex: 1 },
  attName: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  attTime: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  attActions: { marginLeft: 12 },
  checkBtn: {
    backgroundColor: "#d97706",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  outBtn: { backgroundColor: "#dc2626" },
  checkText: { color: "#fff", fontWeight: "bold", fontSize: 13 },

  salaryPreview: { marginLeft: 12, alignItems: "flex-end" },
  salaryAmt: { fontSize: 16, fontWeight: "bold", color: "#059669" },

  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 40,
    fontSize: 14,
  },

  // Modal Styles (Giữ nguyên)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#1f2937",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
    backgroundColor: "#f9fafb",
  },
  statusToggle: {
    padding: 14,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    marginBottom: 16,
    alignItems: "center",
  },
  submitBtn: {
    backgroundColor: "#d97706",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: { marginTop: 16, alignItems: "center" },
  cancelText: { color: "#6b7280", fontSize: 15 },
});
