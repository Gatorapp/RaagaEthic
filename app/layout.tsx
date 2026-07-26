import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Raaga Ethnic Couture",
    template: "%s | Raaga Ethnic Couture",
  },
  description:
    "Heritage Indian craftsmanship meets contemporary silhouettes at Raaga Ethnic Couture.",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
