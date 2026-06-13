import type { Metadata } from "next";

import { AppProviders } from "@/components/providers/app-providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "QuyenCommerce",
  description: "Modern ecommerce SaaS storefront and merchant dashboard."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
