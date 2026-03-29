import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppProviders } from "@/components/app-providers";
import { site } from "@/content/no";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  keywords: site.keywords,
  manifest: "/favicons/favicon-for-app/manifest.json",
  icons: {
    icon: [
      {
        url: "/favicons/favicon-for-app/favicon.ico",
        sizes: "any",
      },
      {
        url: "/favicons/favicon-for-app/icon0.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicons/favicon-for-app/icon1.png",
        type: "image/png",
        sizes: "96x96",
      },
    ],
    shortcut: "/favicons/favicon-for-app/favicon.ico",
    apple: "/favicons/favicon-for-app/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
