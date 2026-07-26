"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/lib/admin-context";
import { useTheme } from "@/lib/theme-provider";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsTab from "./ProductsTab";
import OrdersTab from "./OrdersTab";
import SettingsTab from "./SettingsTab";
import { LogOut, ExternalLink, Moon, Sun } from "lucide-react";

export default function AdminDashboard() {
  const { adminKey, isReady, logout } = useAdmin();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !adminKey) {
      router.replace("/admin/login");
    }
  }, [isReady, adminKey, router]);

  if (!isReady || !adminKey) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-sidebar">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <Logo tone="light" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sidebar-foreground hover:text-sidebar-foreground"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              data-testid="button-admin-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"} Mode</span>
            </Button>
            <Link href="/" data-testid="link-view-store">
              <Button variant="ghost" size="sm" className="gap-1.5 text-sidebar-foreground hover:text-sidebar-foreground">
                <ExternalLink className="h-3.5 w-3.5" /> <span className="hidden sm:inline">View Store</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sidebar-foreground hover:text-sidebar-foreground"
              onClick={() => {
                logout();
                router.push("/admin/login");
              }}
              data-testid="button-admin-logout"
            >
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Log Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <h1 className="mb-6 font-serif text-2xl" data-testid="text-admin-dashboard-title">
          Store Dashboard
        </h1>
        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products" data-testid="tab-products">
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              Orders
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
