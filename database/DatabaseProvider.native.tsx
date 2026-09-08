import { SQLiteProvider } from "expo-sqlite";
import type { PropsWithChildren } from "react";

import { initializeShopDatabase } from "./shop-database";

export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName="eiko-shop.db" onInit={initializeShopDatabase}>
      {children}
    </SQLiteProvider>
  );
}
