import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DEFAULT_PRODUCT_IMAGE = "/products/collection-01.jpg";

export function assetPath(path: string): string {
  return path || DEFAULT_PRODUCT_IMAGE;
}

export function parseProductList(value: string, fallback: string[] = []): string[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const normalized = parsed.map((item) => String(item).trim()).filter(Boolean);
      return normalized.length ? normalized : fallback;
    }
  } catch {
    const normalized = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (normalized.length) {
      return normalized;
    }
  }

  return fallback;
}
