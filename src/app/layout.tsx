import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const frankRuhlLibre = Frank_Ruhl_Libre({
  subsets: ["hebrew"],
  variable: "--font-frank-ruhl-libre",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ivrit עברית — Hebräisch lernen",
  description: "Lerne das hebräische Alphabet, Vokabeln, Torah und tippe auf Hebräisch",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ivrit עברית",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F0F1A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" dir="ltr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${frankRuhlLibre.variable} antialiased bg-[#0F0F1A] text-[#F0DCC0] min-h-dvh`}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
