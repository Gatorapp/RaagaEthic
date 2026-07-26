"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Moon, Sun, Menu, X } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";
import { useCart } from "@/lib/cart-context";
import { useTheme } from "@/lib/theme-provider";
import { CATEGORIES } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { count } = useCart();
  const { theme, toggleTheme } = useTheme();
  const location = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" data-testid="link-home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/shop"
            className={`text-sm tracking-wide transition-colors hover-elevate rounded-md px-2 py-1 ${
              isActive("/shop") ? "text-primary" : "text-foreground"
            }`}
            data-testid="link-shop-all"
          >
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/shop?category=${encodeURIComponent(cat)}`}
              className="text-sm tracking-wide text-foreground/80 transition-colors hover:text-primary"
              data-testid={`link-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {cat}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link href="/cart" data-testid="link-cart">
            <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-medium text-primary-foreground"
                  data-testid="text-cart-count"
                >
                  {count}
                </span>
              )}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
          <Link href="/shop" className="rounded-md px-2 py-2 text-sm" onClick={() => setMobileOpen(false)}>
            All Products
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/shop?category=${encodeURIComponent(cat)}`}
              className="rounded-md px-2 py-2 text-sm text-foreground/80"
              onClick={() => setMobileOpen(false)}
            >
              {cat}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
