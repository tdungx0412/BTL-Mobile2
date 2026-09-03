import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.shopHeader}>
            <View style={styles.logo}>
              <Image
                source={{ uri: 'https://www.bing.com/th/id/OIP.sbV5afV6wlWHw2E70tqUZAHaJ4?w=193&h=257&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=ImgAns&rm=2' }}
                style={styles.logoImage}
                contentFit="cover"
                accessibilityLabel="Logo EiKo"
              />
            </View>
            <View style={styles.shopName}><ThemedText style={styles.brand}>EiKo</ThemedText><ThemedText style={styles.slogan}>Gửi hồn Việt đi muôn nơi</ThemedText></View>
            <Pressable style={styles.bagButton} accessibilityLabel="Giỏ hàng"><Ionicons name="bag-handle-outline" size={22} color="#4b2869" /><View style={styles.badge}><ThemedText style={styles.badgeText}>2</ThemedText></View></Pressable>
          </View>
          <Pressable style={styles.locationPill} onPress={openMenu}><Ionicons name="location-outline" size={15} color="#7142a5" /><ThemedText style={styles.locationText}>Giao đến <ThemedText style={styles.locationStrong}>{selectedProvince}</ThemedText></ThemedText><Ionicons name="chevron-down" size={14} color="#7142a5" /></Pressable>
          <View style={styles.searchBar}><Ionicons name="search-outline" size={20} color="#8c729f" /><TextInput placeholder="Bạn đang tìm món quà gì?" placeholderTextColor="#a895b5" style={styles.searchInput} /><Ionicons name="options-outline" size={20} color="#7142a5" /></View>
          <View style={styles.hero}>
            <View style={styles.heroCopy}><ThemedText style={styles.heroKicker}>BỘ SƯU TẬP MỚI</ThemedText><ThemedText style={styles.heroTitle}>Quà Việt,{`\n`}tình quê.</ThemedText><ThemedText style={styles.heroText}>Những món quà nhỏ, mang câu chuyện thật lớn.</ThemedText><Pressable style={styles.heroButton}><ThemedText style={styles.heroButtonText}>Khám phá ngay</ThemedText><Ionicons name="arrow-forward" size={15} color="#432064" /></Pressable></View>
            <View style={styles.heroArt}><View style={styles.heroSun} /><ThemedText style={styles.lantern}>🏮</ThemedText></View>
          </View>
          <View style={styles.sectionHeader}><ThemedText style={styles.sectionTitle}>Khám phá danh mục</ThemedText><ThemedText style={styles.seeAll}>Xem tất cả</ThemedText></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>{['restaurant-outline', 'shirt-outline', 'color-palette-outline', 'home-outline'].map((icon, index) => <Pressable key={icon} style={styles.category}><View style={[styles.categoryIcon, { backgroundColor: ['#fff0d8', '#eadfff', '#d8f2eb', '#ffe0e9'][index] }]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={24} color="#593477" /></View><ThemedText style={styles.categoryText}>{['Đặc sản', 'Thời trang', 'Đồ thủ công', 'Trang trí'][index]}</ThemedText></Pressable>)}</ScrollView>
          <View style={styles.sectionHeader}><ThemedText style={styles.sectionTitle}>Món quà được yêu thích 🔥</ThemedText><ThemedText style={styles.seeAll}>Xem tất cả</ThemedText></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productList}>{[['👜', 'Túi cói Hội An', '189.000đ', '#f6d6a4'], ['👘', 'Áo dài mini Huế', '329.000đ', '#d9c4ff'], ['🏺', 'Bộ ly gốm Bát Tràng', '275.000đ', '#bce5dc']].map(([icon, name, price, color]) => <Pressable key={name} style={styles.productCard}><View style={[styles.productImage, { backgroundColor: color }]}><ThemedText style={styles.productEmoji}>{icon}</ThemedText><View style={styles.heart}><Ionicons name="heart-outline" size={16} color="#7142a5" /></View></View><ThemedText style={styles.productName}>{name}</ThemedText><ThemedText style={styles.price}>{price}</ThemedText></Pressable>)}</ScrollView>
          <View style={styles.promise}><Ionicons name="gift-outline" size={22} color="#7142a5" /><View style={styles.promiseCopy}><ThemedText style={styles.promiseTitle}>Gói quà thật xinh</ThemedText><ThemedText style={styles.promiseText}>Trao gửi yêu thương trọn vẹn</ThemedText></View><Ionicons name="chevron-forward" size={18} color="#9b82ac" /></View>
        </ScrollView>
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
    backgroundColor: '#fbf9fd',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 35,
    paddingHorizontal: 20,
  },
  shopHeader: { alignItems: 'center', flexDirection: 'row', paddingTop: 16 },
  logo: { backgroundColor: '#7142a5', borderRadius: 14, height: 42, overflow: 'hidden', width: 42 },
  logoImage: { height: '100%', width: '100%' },
  shopName: { flex: 1, marginLeft: 10 },
  brand: { color: '#3b205f', fontSize: 16, fontWeight: '800', letterSpacing: 1.5 },
  slogan: { color: '#a18baa', fontSize: 10, marginTop: 2 },
  bagButton: { alignItems: 'center', backgroundColor: '#f1eafa', borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  badge: { alignItems: 'center', backgroundColor: '#e66e88', borderColor: '#fbf9fd', borderRadius: 7, borderWidth: 2, height: 17, justifyContent: 'center', position: 'absolute', right: -3, top: -4, width: 17 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  locationPill: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 5, marginTop: 17 },
  locationText: { color: '#8c7898', fontSize: 12 },
  locationStrong: { color: '#5c3478', fontWeight: '700' },
  searchBar: { alignItems: 'center', backgroundColor: '#f1eafa', borderRadius: 14, flexDirection: 'row', height: 50, marginTop: 13, paddingHorizontal: 15 },
  searchInput: { color: '#3b205f', flex: 1, fontSize: 14, marginHorizontal: 10, paddingVertical: 0 },
  hero: { backgroundColor: '#7142a5', borderRadius: 22, flexDirection: 'row', marginTop: 20, minHeight: 202, overflow: 'hidden', padding: 21 },
  heroCopy: { flex: 1, zIndex: 1 },
  heroKicker: { color: '#eadcff', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  heroTitle: { color: '#fff', fontFamily: 'serif', fontSize: 34, fontWeight: '700', lineHeight: 37, marginTop: 9 },
  heroText: { color: '#e9dff2', fontSize: 12, lineHeight: 17, marginTop: 8, maxWidth: 185 },
  heroButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#f8d77b', borderRadius: 10, flexDirection: 'row', gap: 7, marginTop: 15, paddingHorizontal: 12, paddingVertical: 10 },
  heroButtonText: { color: '#432064', fontSize: 12, fontWeight: '800' },
  heroArt: { alignItems: 'center', justifyContent: 'center', width: 105 },
  heroSun: { backgroundColor: '#d9b4ee', borderRadius: 75, height: 145, opacity: 0.38, position: 'absolute', width: 145 },
  lantern: { fontSize: 70, zIndex: 1 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 27 },
  sectionTitle: { color: '#3b205f', fontSize: 18, fontWeight: '800' },
  seeAll: { color: '#7142a5', fontSize: 12, fontWeight: '700' },
  categoryList: { gap: 20, paddingTop: 16 },
  category: { alignItems: 'center', width: 68 },
  categoryIcon: { alignItems: 'center', borderRadius: 20, height: 58, justifyContent: 'center', width: 58 },
  categoryText: { color: '#725c7f', fontSize: 11, marginTop: 8, textAlign: 'center' },
  productList: { gap: 13, paddingTop: 15 },
  productCard: { width: 153 },
  productImage: { alignItems: 'center', borderRadius: 17, height: 162, justifyContent: 'center', position: 'relative' },
  productEmoji: { fontSize: 69 },
  heart: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 14, height: 28, justifyContent: 'center', position: 'absolute', right: 9, top: 9, width: 28 },
  productName: { color: '#4f3a5e', fontSize: 13, fontWeight: '600', marginTop: 10 },
  price: { color: '#7142a5', fontSize: 14, fontWeight: '800', marginTop: 5 },
  promise: { alignItems: 'center', backgroundColor: '#f1eafa', borderRadius: 15, flexDirection: 'row', marginTop: 28, padding: 14 },
  promiseCopy: { flex: 1, marginLeft: 11 },
  promiseTitle: { color: '#54316d', fontSize: 13, fontWeight: '800' },
  promiseText: { color: '#917e9a', fontSize: 11, marginTop: 3 },
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
