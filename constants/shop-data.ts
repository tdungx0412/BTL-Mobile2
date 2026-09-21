import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type Category = {
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  color: string;
};

// ✅ ĐÃ SỬA: isFeatured từ number sang boolean
export type Product = {
  id?: number;
  sku: string;
  icon: string;
  image?: string;
  name: string;
  price: string;
  color: string;
  description: string;
  category: string;
  origin: string;
  material: string;
  dimensions: string;
  weight: string;
  stock: number;
  rating: number;
  reviewCount: number;
  careInstructions: string;
  packageContents?: string;
  warranty?: string;
  shippingInfo?: string;
  usage?: string;
  tags: string[];
  isFeatured: boolean;
};

const PRODUCT_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1523170335258-fef16a32d017?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=80",
];

export const SHOP_LOGO_URL =
  "https://www.bing.com/th/id/OIP.sbV5afV6wlWHw2E70tqUZAHaJ4?w=193&h=257&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=ImgAns&rm=2";

export const CATEGORIES: Category[] = [
  { label: "Tết", icon: "sparkles-outline", color: "#ffe1c2" },
  { label: "Giáng sinh", icon: "snow-outline", color: "#d9e9ff" },
  { label: "Halloween", icon: "skull-outline", color: "#eadcff" },
  { label: "Sinh nhật", icon: "balloon-outline", color: "#ffdce8" },
  { label: "Thời trang", icon: "shirt-outline", color: "#eadfff" },
  { label: "Đồ thủ công", icon: "color-palette-outline", color: "#d8f2eb" },
  { label: "Trang trí", icon: "home-outline", color: "#ffe0e9" },
];

// ✅ ĐÃ SỬA: Tất cả isFeatured trong BASE_PRODUCTS đều chuyển sang true/false
const BASE_PRODUCTS: Product[] = [
  {
    sku: "EIKO-001",
    icon: "👜",
    image: PRODUCT_IMAGE_POOL[0],
    name: "Túi cói Hội An",
    price: "189.000đ",
    color: "#f6d6a4",
    category: "Đồ thủ công",
    description:
      "Túi cói đan thủ công, nhẹ nhàng và tiện dụng cho mọi chuyến đi. Phom túi đứng, quai da mềm và ngăn trong tiện lợi.",
    origin: "Làng nghề Cẩm Kim, Hội An",
    material: "Cói tự nhiên, da PU",
    dimensions: "30 x 24 x 10 cm",
    weight: "420 g",
    stock: 28,
    rating: 4.8,
    reviewCount: 126,
    careInstructions:
      "Bảo quản nơi khô thoáng, tránh ngâm nước và phơi nắng gắt.",
    packageContents: "1 túi cói, 1 thẻ hướng dẫn bảo quản",
    warranty: "Đổi sản phẩm trong 7 ngày nếu lỗi do nhà sản xuất",
    shippingInfo: "Đóng hộp chống móp, giao toàn quốc từ 2-4 ngày",
    usage: "Dùng đi chợ, đi biển hoặc làm túi quà tặng hằng ngày",
    tags: ["thủ công", "Hội An", "quà tặng"],
    isFeatured: true,
  },
  {
    sku: "EIKO-002",
    icon: "👘",
    image: PRODUCT_IMAGE_POOL[1],
    name: "Áo dài mini Huế",
    price: "329.000đ",
    color: "#d9c4ff",
    category: "Thời trang",
    description:
      "Món quà nhỏ mang nét duyên dáng và thanh lịch của xứ Huế, phù hợp làm đồ trang trí hoặc quà lưu niệm.",
    origin: "Phường Kim Long, Huế",
    material: "Lụa tơ tằm, khung gỗ",
    dimensions: "Dài 32 x rộng 18 cm",
    weight: "180 g",
    stock: 15,
    rating: 4.9,
    reviewCount: 84,
    careInstructions:
      "Lau nhẹ bằng khăn mềm, không giặt máy hoặc để gần nguồn nhiệt.",
    packageContents: "1 áo dài mini, 1 giá đỡ gỗ, 1 hộp quà",
    warranty: "Bảo hành khung gỗ 30 ngày",
    shippingInfo: "Bọc chống bụi, giao toàn quốc từ 2-4 ngày",
    usage: "Trưng trên bàn làm việc, kệ sách hoặc tặng dịp lễ",
    tags: ["Huế", "lụa", "lưu niệm"],
    isFeatured: true,
  },
  {
    sku: "EIKO-003",
    icon: "🏺",
    image: PRODUCT_IMAGE_POOL[2],
    name: "Bình gốm Bát Tràng",
    price: "275.000đ",
    color: "#bce5dc",
    category: "Trang trí",
    description:
      "Bình gốm thủ công với họa tiết lấy cảm hứng từ làng nghề Việt, tạo điểm nhấn trang nhã cho không gian sống.",
    origin: "Làng gốm Bát Tràng, Hà Nội",
    material: "Gốm sứ nung nhiệt cao",
    dimensions: "18 x 18 x 24 cm",
    weight: "780 g",
    stock: 34,
    rating: 4.7,
    reviewCount: 203,
    careInstructions: "Lau bằng khăn mềm; tránh va đập và sốc nhiệt đột ngột.",
    packageContents: "1 bình gốm, 1 hộp giấy kraft có đệm giấy",
    warranty: "Đổi mới nếu sản phẩm nứt vỡ do vận chuyển",
    shippingInfo: "Đóng 2 lớp chống sốc, giao toàn quốc từ 2-4 ngày",
    usage: "Cắm hoa, trưng trên kệ sách hoặc làm quà tặng tân gia",
    tags: ["gốm sứ", "Bát Tràng", "trang trí"],
    isFeatured: true,
  },
  {
    sku: "EIKO-004",
    icon: "🔑",
    image: PRODUCT_IMAGE_POOL[3],
    name: "Móc khóa Việt Nam",
    price: "59.000đ",
    color: "#ffd2de",
    category: "Quà tặng",
    description:
      "Móc khóa gỗ nhỏ gọn, khắc hình bản đồ Việt Nam và phủ lớp bảo vệ trong suốt.",
    origin: "Xưởng mộc Đồng Kỵ, Bắc Ninh",
    material: "Gỗ beech, khoen thép không gỉ",
    dimensions: "6 x 3.5 x 0.8 cm",
    weight: "35 g",
    stock: 62,
    rating: 4.6,
    reviewCount: 318,
    careInstructions: "Tránh tiếp xúc lâu với nước và hóa chất tẩy rửa.",
    packageContents: "1 móc khóa, 1 túi giấy mini",
    warranty: "Đổi sản phẩm trong 7 ngày nếu lỗi gia công",
    shippingInfo: "Gói chống xước, giao toàn quốc từ 2-4 ngày",
    usage: "Gắn vào chìa khóa, balo hoặc quai túi",
    tags: ["gỗ", "Việt Nam", "giá tốt"],
    isFeatured: false,
  },
  {
    sku: "EIKO-005",
    icon: "🎋",
    image: PRODUCT_IMAGE_POOL[4],
    name: "Tranh treo Đông Hồ",
    price: "215.000đ",
    color: "#f8e0ac",
    category: "Trang trí",
    description:
      "Tranh in thủ công lấy cảm hứng từ dòng tranh Đông Hồ, tạo điểm nhấn ấm áp cho góc nhà.",
    origin: "Làng tranh Đông Hồ, Bắc Ninh",
    material: "Giấy điệp, khung gỗ thông",
    dimensions: "25 x 35 cm",
    weight: "360 g",
    stock: 19,
    rating: 4.8,
    reviewCount: 97,
    careInstructions:
      "Treo trong nhà, tránh ánh nắng trực tiếp và nơi có độ ẩm cao.",
    packageContents: "1 tranh, 1 khung gỗ, 1 bộ móc treo",
    warranty: "Đổi mới nếu khung bị hư hỏng khi nhận hàng",
    shippingInfo: "Bọc góc chống va đập, giao toàn quốc từ 2-4 ngày",
    usage: "Treo ở phòng khách, phòng làm việc hoặc góc đọc sách",
    tags: ["trang trí", "Đông Hồ", "nghệ thuật"],
    isFeatured: true,
  },
];

type ProductSeed = [string, string, string, string];

const CATEGORY_SEEDS: Record<string, ProductSeed[]> = {
  Tết: [
    ["Bao lì xì thư pháp", "🧧", "49.000đ", "#f3b1a8"],
    ["Câu đối đỏ mini", "📜", "89.000đ", "#e9b2a2"],
    ["Móc khóa linh vật", "🐉", "69.000đ", "#f3cf8b"],
    ["Dây treo mai vàng", "", "129.000đ", "#f5d98b"],
    ["Tranh Tết ép kim", "🖼️", "259.000đ", "#e3b17e"],
    ["Đèn lồng đỏ mini", "🏮", "119.000đ", "#ef9f98"],
    ["Thiệp chúc Tết thủ công", "💌", "39.000đ", "#f0c8a4"],
    ["Bộ sticker năm mới", "✨", "45.000đ", "#f3d58f"],
  ],
  "Giáng sinh": [
    ["Vòng nguyệt quế len", "🎄", "249.000đ", "#b9d8c0"],
    ["Quả châu thủy tinh", "🔴", "79.000đ", "#e6b0b5"],
    ["Tất treo Noel", "🧦", "99.000đ", "#dba9a9"],
    ["Thiệp Giáng sinh nổi", "💌", "45.000đ", "#d5e2ef"],
    ["Mô hình ông già Noel", "🎅", "159.000đ", "#e8b6a8"],
    ["Nơ gói quà nhung", "🎀", "59.000đ", "#d9a5a7"],
    ["Chuông treo cửa Noel", "🔔", "119.000đ", "#e4c782"],
    ["Bộ sticker Giáng sinh", "⭐", "49.000đ", "#c9dced"],
  ],
  Halloween: [
    ["Mặt nạ bí ngô", "", "129.000đ", "#efa46d"],
    ["Đèn ma giấy", "👻", "99.000đ", "#d8c6e6"],
    ["Băng đô phù thủy", "🧙", "89.000đ", "#bfa7d8"],
    ["Sticker Halloween", "🕷️", "45.000đ", "#c6b3d8"],
    ["Móc khóa mèo đen", "🐈‍⬛", "69.000đ", "#b9a8c5"],
    ["Dây treo bí ngô", "🎃", "139.000đ", "#e6a16f"],
    ["Thiệp Halloween", "", "39.000đ", "#c5b1d8"],
    ["Khăn choàng hóa trang", "🧣", "179.000đ", "#b7a4ca"],
  ],
  "Sinh nhật": [
    ["Bóng bay chữ Happy", "🎈", "89.000đ", "#efb3c7"],
    ["Nến số trang trí", "🕯️", "39.000đ", "#f3d39b"],
    ["Thiệp sinh nhật pop-up", "💌", "59.000đ", "#f2b9c9"],
    ["Bộ ruy băng pastel", "🎀", "69.000đ", "#d8c0df"],
    ["Hộp quà nam châm", "🎁", "119.000đ", "#e7b2b9"],
    ["Túi quà sinh nhật", "🛍️", "49.000đ", "#c9d8ec"],
    ["Banner chúc mừng", "🎉", "99.000đ", "#f2c28d"],
    ["Bộ sticker sinh nhật", "🌈", "45.000đ", "#e4c4df"],
  ],
  "Thời trang": [
    ["Khăn lụa Nha Xá", "🧣", "259.000đ", "#e9bfd2"],
    ["Áo bà ba Nam Bộ", "👚", "389.000đ", "#b9d5e8"],
    ["Nón lá Huế mini", "👒", "149.000đ", "#efe0a8"],
    ["Túi thổ cẩm Mai Châu", "", "239.000đ", "#d9b9a8"],
    ["Ví da thủ công Hội An", "👛", "315.000đ", "#c99772"],
    ["Cà vạt lụa Việt", "👔", "229.000đ", "#b8c8e8"],
    ["Băng đô vải thổ cẩm", "🎀", "89.000đ", "#e8a9b8"],
    ["Khăn rằn Nam Bộ", "", "119.000đ", "#d5d9d2"],
    ["Áo sơ mi linen Việt", "👕", "425.000đ", "#d9e5d0"],
    ["Dép cói miền biển", "🩴", "179.000đ", "#e6c08f"],
    ["Vòng tay bạc H'Mông", "📿", "349.000đ", "#c9ced7"],
    ["Mũ cói vành rộng", "", "219.000đ", "#e8d2a4"],
    ["Túi vải canvas Việt", "👜", "159.000đ", "#c3d7df"],
    ["Áo khoác chàm Indigo", "🧥", "529.000đ", "#a8bdd7"],
    ["Kẹp tóc gỗ dừa", "", "69.000đ", "#dcb78f"],
    ["Thắt lưng da bò", "〰️", "289.000đ", "#b9825e"],
    ["Áo len Đà Lạt", "🧶", "459.000đ", "#d5c4df"],
    ["Khuyên tai bạc Thái", "💎", "195.000đ", "#d1d9e5"],
    ["Túi đeo chéo thổ cẩm", "️", "279.000đ", "#d8b3c8"],
  ],
  "Đồ thủ công": [
    ["Đèn lồng Hội An", "🏮", "189.000đ", "#f0b083"],
    ["Bình hoa mây tre", "🧺", "229.000đ", "#d9bd8c"],
    ["Khay tre đan tay", "", "145.000đ", "#e1c99e"],
    ["Sổ tay giấy dó", "📓", "85.000đ", "#e6d6b8"],
    ["Móc treo gỗ khắc chữ", "🪝", "75.000đ", "#c99b70"],
    ["Quạt giấy nghệ thuật", "🪭", "119.000đ", "#f0c1bd"],
    ["Bộ lót ly mây tre", "🟤", "99.000đ", "#d8bd91"],
    ["Tượng gỗ chú Tễu", "🗿", "275.000đ", "#c89f78"],
    ["Hộp đựng trà tre", "📦", "165.000đ", "#dcc28e"],
    ["Chậu cây xi măng", "🪴", "139.000đ", "#c7d0ca"],
    ["Nến thơm sáp ong", "🕯️", "159.000đ", "#f1d69f"],
    ["Hoa giấy Thanh Tiên", "🌸", "129.000đ", "#efb8c9"],
    ["Giỏ tre đựng đồ", "🧺", "249.000đ", "#d7b67d"],
    ["Trống cơm mini", "🥁", "199.000đ", "#d89b7c"],
    ["Khung ảnh gỗ xoan", "🖼️", "189.000đ", "#cda579"],
    ["Búp bê vải dân gian", "🪆", "155.000đ", "#deb5c4"],
    ["Đĩa sơn mài thủ công", "🍽️", "329.000đ", "#d5a69a"],
    ["Mô hình xích lô gỗ", "🚲", "219.000đ", "#b9caa8"],
    ["Dây treo macrame", "🪢", "179.000đ", "#dfc7aa"],
  ],
  "Trang trí": [
    ["Bình gốm men lam", "🏺", "345.000đ", "#b7cee2"],
    ["Đĩa trang trí Bát Tràng", "🍽️", "185.000đ", "#d9c4b0"],
    ["Tranh sơn dầu phố cổ", "🎨", "495.000đ", "#e1b88b"],
    ["Đèn tre treo trần", "💡", "389.000đ", "#e8cc99"],
    ["Tượng cò gỗ", "", "219.000đ", "#d7c1a7"],
    ["Gương mây tròn", "🪞", "299.000đ", "#dfc092"],
    ["Lọ hoa gốm men rạn", "🌷", "259.000đ", "#c1d5d2"],
    ["Bộ tranh hoa sen", "🪷", "369.000đ", "#e4b9c8"],
    ["Thảm cói dệt tay", "🟨", "329.000đ", "#dfc78f"],
    ["Đồng hồ gỗ treo tường", "️", "449.000đ", "#c79d76"],
    ["Kệ sách tre nhỏ", "📚", "279.000đ", "#d8b889"],
    ["Tượng voi gốm", "🐘", "159.000đ", "#becbc7"],
    ["Bình treo tường mây", "🪴", "239.000đ", "#d5b78b"],
    ["Tranh chữ thư pháp", "🖌️", "229.000đ", "#e3c7a4"],
    ["Chụp đèn vải linen", "🔆", "315.000đ", "#e6d5b5"],
    ["Bộ tượng mèo may mắn", "🐈", "189.000đ", "#e8b4a7"],
    ["Đĩa lá sen trang trí", "🍃", "149.000đ", "#b8d1b7"],
    ["Lọ gốm hoa văn Việt", "🏺", "289.000đ", "#d0b4c5"],
    ["Mành tre cửa sổ", "🎍", "259.000đ", "#d6bd87"],
  ],
};

function createSeedProduct(
  category: string,
  index: number,
  seed: ProductSeed,
  sku: string,
): Product {
  const [name, icon, price, color] = seed;
  const region = `Xưởng quà tặng ${category} Việt Nam`;
  return {
    sku,
    icon,
    image: PRODUCT_IMAGE_POOL[index % PRODUCT_IMAGE_POOL.length],
    name,
    price,
    color,
    category,
    description: `${name} được tuyển chọn từ các làng nghề Việt, hoàn thiện cẩn thận và phù hợp làm quà tặng cho gia đình, bạn bè.`,
    origin: region,
    material: "Vật liệu thủ công thân thiện môi trường",
    dimensions: "Kích thước tiêu chuẩn đóng hộp quà",
    weight: "350 g",
    stock: 12 + (index % 6) * 7,
    rating: 4.5 + (index % 5) / 10,
    reviewCount: 32 + index * 9,
    careInstructions: "Bảo quản nơi khô thoáng, tránh ánh nắng trực tiếp.",
    packageContents: `1 ${name.toLowerCase()}, 1 hộp quà EiKo`,
    warranty: "Hỗ trợ đổi hàng trong 7 ngày nếu lỗi do nhà sản xuất",
    shippingInfo: "Đóng gói cẩn thận, giao toàn quốc từ 2-4 ngày",
    usage: "Dùng hằng ngày hoặc làm quà tặng trong các dịp đặc biệt",
    tags: [category, "quà Việt", "EiKo"],
    // ✅ ĐÃ SỬA: Trả về boolean thay vì số 1/0
    isFeatured: index < 4,
  };
}

export const PRODUCTS: Product[] = (() => {
  let counter = BASE_PRODUCTS.length;
  return [
    ...BASE_PRODUCTS,
    ...Object.entries(CATEGORY_SEEDS).flatMap(([category, seeds]) =>
      seeds.map((seed, index) =>
        createSeedProduct(
          category,
          index,
          seed,
          `EIKO-${String(++counter).padStart(3, "0")}`,
        ),
      ),
    ),
  ];
})();
