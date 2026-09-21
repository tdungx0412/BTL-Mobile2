// hooks/useShopProducts.ts
import { useEffect, useState } from "react";

export interface Product {
  id: number;
  sku: string;
  name: string;
  price: string;
  icon: string;
  image: string;
  color: string;
  category: string;
  description: string;
  origin: string;
  material: string;
  dimensions: string;
  weight: string;
  stock: number;
  rating: number;
  reviewCount: number;
  careInstructions: string;
  packageContents: string;
  warranty: string;
  shippingInfo: string;
  usage: string;
  tags: string[];
  isFeatured: boolean;
}

interface UseShopProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";

export function useShopProducts(): UseShopProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/products?page=1&limit=50`,
        );

        if (!response.ok) {
          throw new Error(`Lỗi server: ${response.status}`);
        }

        const payload = await response.json();
        const rawList = Array.isArray(payload) ? payload : (payload.data ?? []);

        if (isMounted) {
          const normalizedProducts: Product[] = rawList.map((product: any) => ({
            ...product,
            tags: Array.isArray(product.tags)
              ? product.tags
              : typeof product.tags === "string"
                ? product.tags.split(",").filter(Boolean)
                : [],
            reviewCount: Number(
              product.reviewCount ?? product.review_count ?? 0,
            ),
            careInstructions:
              product.careInstructions ??
              product.care_instructions ??
              "Đang cập nhật",
            packageContents:
              product.packageContents ??
              product.package_contents ??
              "Đang cập nhật",
            shippingInfo:
              product.shippingInfo ?? product.shipping_info ?? "Đang cập nhật",
            usage: product.usage ?? "Đang cập nhật",
            isFeatured: Boolean(product.isFeatured ?? product.is_featured ?? 0),
          }));

          setProducts(normalizedProducts);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Lỗi kết nối");
          setProducts([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  return { products, loading, error };
}
