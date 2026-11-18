import type { HttpTypes } from "@medusajs/types";

/**
 * Check if a product variant is in stock
 * A variant is in stock if:
 * - manage_inventory is false (inventory tracking disabled), OR
 * - inventory_quantity is greater than 0
 */
export function isVariantInStock(
  variant: HttpTypes.StoreProductVariant | undefined | null
): boolean {
  if (!variant) {
    return false;
  }

  return variant.manage_inventory === false || (variant.inventory_quantity || 0) > 0;
}


// Sub acest număr de bucăți afișăm badge-ul „Stoc limitat”.
export const LOW_STOCK_THRESHOLD = 5;

/**
 * Verifică dacă o variantă are stoc limitat:
 * - stocul e urmărit (manage_inventory nu e false),
 * - mai există bucăți (altfel e „Stoc epuizat”),
 * - dar sunt mai puține decât pragul LOW_STOCK_THRESHOLD.
 */
export function isLowStock(
  variant: HttpTypes.StoreProductVariant | undefined | null
): boolean {
  if (!variant || variant.manage_inventory === false) {
    return false;
  }

  const quantity = variant.inventory_quantity ?? 0;
  return quantity > 0 && quantity < LOW_STOCK_THRESHOLD;
}
