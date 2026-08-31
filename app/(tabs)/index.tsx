import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const PROVINCES = [
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Cần Thơ',
  'Đà Nẵng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Nội',
  'Hà Tĩnh',
  'Hải Dương',
  'Hải Phòng',
  'Hậu Giang',
  'Hòa Bình',
  'Hồ Chí Minh',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
];

export default function HomeScreen() {
  const [selectedProvince, setSelectedProvince] = useState('Hà Nội');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredProvinces = useMemo(
    () => PROVINCES.filter((province) => province.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const openMenu = () => {
    setSearch('');
    setIsMenuVisible(true);
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.eyebrow}>KHÁM PHÁ VIỆT NAM</ThemedText>
            <ThemedText type="title" style={styles.heading}>
              Bạn đang ở đâu?
            </ThemedText>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="location" size={22} color="#ffffff" />
          </View>
        </View>

        <Pressable style={styles.locationButton} onPress={openMenu} accessibilityRole="button">
          <View style={styles.pinBackground}>
            <Ionicons name="location-outline" size={22} color="#0e7490" />
          </View>
          <View style={styles.locationCopy}>
            <ThemedText style={styles.label}>ĐỊA ĐIỂM HIỆN TẠI</ThemedText>
            <ThemedText type="subtitle" style={styles.selectedProvince}>
              {selectedProvince}
            </ThemedText>
          </View>
          <Ionicons name="chevron-down" size={21} color="#52636a" />
        </Pressable>

        <View style={styles.infoRow}>
          <Ionicons name="map-outline" size={18} color="#0e7490" />
          <ThemedText style={styles.infoText}>Chọn một tỉnh hoặc thành phố tại Việt Nam</ThemedText>
        </View>
      </SafeAreaView>

      <Modal
        visible={isMenuVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsMenuVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Chọn địa điểm
                </ThemedText>
                <ThemedText style={styles.countText}>{PROVINCES.length} tỉnh, thành phố</ThemedText>
              </View>
              <Pressable
                onPress={() => setIsMenuVisible(false)}
                style={styles.closeButton}
                accessibilityLabel="Đóng menu địa điểm">
                <Ionicons name="close" size={22} color="#52636a" />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={19} color="#71858c" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm tỉnh, thành phố..."
                placeholderTextColor="#8a9aa0"
                style={styles.searchInput}
                autoCapitalize="words"
                accessibilityLabel="Tìm tỉnh thành phố"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} accessibilityLabel="Xóa tìm kiếm">
                  <Ionicons name="close-circle" size={19} color="#8a9aa0" />
                </Pressable>
              )}
            </View>

            <FlatList
              data={filteredProvinces}
              keyExtractor={(province) => province}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = item === selectedProvince;
                return (
                  <Pressable
                    style={[styles.provinceRow, isSelected && styles.selectedRow]}
                    onPress={() => {
                      setSelectedProvince(item);
                      setIsMenuVisible(false);
                    }}>
                    <ThemedText style={[styles.provinceName, isSelected && styles.selectedName]}>
                      {item}
                    </ThemedText>
                    {isSelected && <Ionicons name="checkmark-circle" size={21} color="#0e7490" />}
                  </Pressable>
                );
              }}
              ListEmptyComponent={<ThemedText style={styles.emptyText}>Không tìm thấy địa điểm phù hợp.</ThemedText>}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#edf6f4',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 34,
  },
  eyebrow: {
    color: '#0e7490',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heading: {
    color: '#17363b',
    fontSize: 30,
    lineHeight: 36,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: '#0e7490',
    borderRadius: 20,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  locationButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d5e8e4',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    minHeight: 94,
    paddingHorizontal: 16,
    shadowColor: '#1b4d50',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  pinBackground: {
    alignItems: 'center',
    backgroundColor: '#e1f3ef',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  locationCopy: {
    flex: 1,
    marginLeft: 14,
  },
  label: {
    color: '#789096',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 5,
  },
  selectedProvince: {
    color: '#17363b',
    fontSize: 21,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
    paddingHorizontal: 4,
  },
  infoText: {
    color: '#60787d',
    fontSize: 14,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(19, 47, 50, 0.38)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#f8fcfb',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    minHeight: '64%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#17363b',
    fontSize: 22,
  },
  countText: {
    color: '#789096',
    fontSize: 13,
    marginTop: 3,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#e7f0ee',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#eaf3f1',
    borderRadius: 12,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: '#17363b',
    flex: 1,
    fontSize: 15,
    marginLeft: 9,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 22,
    paddingTop: 10,
  },
  provinceRow: {
    alignItems: 'center',
    borderBottomColor: '#e5eeec',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 10,
  },
  selectedRow: {
    backgroundColor: '#e5f4f0',
    borderRadius: 10,
    borderBottomColor: 'transparent',
  },
  provinceName: {
    color: '#344f54',
    fontSize: 16,
  },
  selectedName: {
    color: '#0e7490',
    fontWeight: '700',
  },
  emptyText: {
    color: '#789096',
    padding: 24,
    textAlign: 'center',
  },
});
