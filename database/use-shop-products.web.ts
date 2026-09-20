import { useEffect, useState } from "react";

import type { Product } from "@/constants/shop-data";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.10:3001/api";

export async function fetchProductsFromApi(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/products`);

  if (!response.ok) {
    throw new Error(`Không tải được danh sách sản phẩm: ${response.status}`);
  }

  const payload = await response.json();
  const list = Array.isArray(payload) ? payload : (payload.data ?? []);

  return list.map((product: any) => ({
    ...product,
    tags: Array.isArray(product.tags)
      ? product.tags
      : typeof product.tags === "string"
        ? product.tags.split(",").filter(Boolean)
        : [],
    reviewCount: Number(product.reviewCount ?? product.review_count ?? 0),
    careInstructions:
      product.careInstructions ?? product.care_instructions ?? "Đang cập nhật",
    packageContents:
      product.packageContents ?? product.package_contents ?? "Đang cập nhật",
    shippingInfo:
      product.shippingInfo ?? product.shipping_info ?? "Đang cập nhật",
    usage: product.usage ?? "Đang cập nhật",
    isFeatured: Number(product.isFeatured ?? product.is_featured ?? 0),
  }));
}

export function useShopProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;

    fetchProductsFromApi()
      .then((loadedProducts) => {
        if (isMounted) setProducts(loadedProducts);
      })
      .catch(() => {
        if (isMounted) setProducts([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return products;
}
