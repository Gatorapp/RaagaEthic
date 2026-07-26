"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/lib/admin-context";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsTab from "./ProductsTab";
import OrdersTab from "./OrdersTab";
import { LogOut, ExternalLink } from "lucide-react";

export default function AdminDashboard() {
  const { adminKey, logout } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!adminKey) {
      router.replace("/admin/login");
    }
  }, [adminKey, router]);

  if (!adminKey) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-sidebar">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <Logo tone="light" />
          <div className="flex items-center gap-2">
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
          </TabsList>
          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
