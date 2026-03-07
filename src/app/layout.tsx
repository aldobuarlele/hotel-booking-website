import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pilot Booking | Pengalaman Menginap Terbaik",
  description: "Platform booking hotel premium dengan koleksi akomodasi terbaik, layanan pelanggan 24/7, dan pengalaman menginap yang tak terlupakan",
  keywords: ["hotel booking", "penginapan premium", "booking kamar hotel", "akomodasi mewah", "pengalaman menginap terbaik"],
  authors: [{ name: "Pilot Booking Team" }],
  creator: "Pilot Booking",
  publisher: "Pilot Booking",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Pilot Booking | Pengalaman Menginap Terbaik",
    description: "Platform booking hotel premium dengan koleksi akomodasi terbaik, layanan pelanggan 24/7, dan pengalaman menginap yang tak terlupakan",
    url: "https://pilotbooking.com",
    siteName: "Pilot Booking",
    images: [
      {
        url: "https://pilotbooking.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pilot Booking - Platform Booking Hotel Premium",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pilot Booking | Pengalaman Menginap Terbaik",
    description: "Platform booking hotel premium dengan koleksi akomodasi terbaik, layanan pelanggan 24/7, dan pengalaman menginap yang tak terlupakan",
    images: ["https://pilotbooking.com/og-image.png"],
    creator: "@pilotbooking",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
