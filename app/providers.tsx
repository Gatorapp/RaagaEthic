"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { CartProvider } from "@/lib/cart-context";
import { AdminProvider } from "@/lib/admin-context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AdminProvider>
          <CartProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </CartProvider>
        </AdminProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
