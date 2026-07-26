"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart-context";
import { AdminProvider } from "@/lib/admin-context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <CartProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </CartProvider>
      </AdminProvider>
    </QueryClientProvider>
  );
}
