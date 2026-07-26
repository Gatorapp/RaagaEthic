import type { ReactNode } from "react";
import StoreLayout from "@/components/Layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <StoreLayout>{children}</StoreLayout>;
}
