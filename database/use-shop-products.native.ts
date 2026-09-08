import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";

import type { Product } from "@/constants/shop-data";
import { getProducts } from "./shop-database";

export function useShopProducts() {
  const database = useSQLiteContext();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;
    getProducts(database).then((loadedProducts) => {
      if (isMounted) setProducts(loadedProducts);
    });

    return () => {
      isMounted = false;
    };
  }, [database]);

  return products;
}
