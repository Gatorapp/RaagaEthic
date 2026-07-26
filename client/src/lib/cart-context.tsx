import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@shared/schema";

export interface CartLine {
  productId: number;
  name: string;
  image: string;
  price: number; // cents
  size: string;
  qty: number;
  stock: number;
}

interface CartContextValue {
  lines: CartLine[];
  addToCart: (product: Product, size: string, qty: number) => void;
  updateQty: (productId: number, size: string, qty: number) => void;
  removeLine: (productId: number, size: string) => void;
  clearCart: () => void;
  subtotal: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addToCart = (product: Product, size: string, qty: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.id && l.size === size);
      const images: string[] = JSON.parse(product.images);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id && l.size === size
            ? { ...l, qty: Math.min(l.qty + qty, product.stock) }
            : l
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          image: images[0] || "",
          price: product.price,
          size,
          qty: Math.min(qty, product.stock),
          stock: product.stock,
        },
      ];
    });
  };

  const updateQty = (productId: number, size: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) =>
          l.productId === productId && l.size === size
            ? { ...l, qty: Math.max(1, Math.min(qty, l.stock)) }
            : l
        )
    );
  };

  const removeLine = (productId: number, size: string) => {
    setLines((prev) => prev.filter((l) => !(l.productId === productId && l.size === size)));
  };

  const clearCart = () => setLines([]);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.qty, 0), [lines]);
  const count = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);

  return (
    <CartContext.Provider value={{ lines, addToCart, updateQty, removeLine, clearCart, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
