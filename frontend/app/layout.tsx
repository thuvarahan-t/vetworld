import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "VetWorld – Veterinary & Lab Equipment",
    template: "%s | VetWorld",
  },
  description: "Your one-stop veterinary and laboratory equipment e-commerce platform. Browse, add to cart, and order via WhatsApp.",
  keywords: ["veterinary equipment", "lab supplies", "science equipment", "VetWorld"],
  icons: {
    icon: "/logo2.png?v=3",
    shortcut: "/logo2.png?v=3",
    apple: "/logo2.png?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
