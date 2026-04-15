import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Divine Pharmacy Operations | ERP System",
  description: "Native-grade POS & Inventory for clinical precision.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#54ACBF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Divinepharm" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(function(reg) {
                console.log('SW registered:', reg.scope);
              }, function(err) {
                console.log('SW failed:', err);
              });
            });
          }
        `}} />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased h-full`}
      >
        {/* Skip to main content — WCAG 2.4.1 */}
        <a
          href="#main-content"
          className="skip-link"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
