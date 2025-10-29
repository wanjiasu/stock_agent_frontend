import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToasterProvider from "../components/toaster-provider";
import Footer from "@/components/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "多团队协作，一次生成可执行交易方案",
  description: "多团队协作，一次生成可执行交易方案",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
        {/* 全局页脚 */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        {/* 将页脚统一渲染在所有页面底部 */}
        <Footer />
        <ToasterProvider />
      </body>
    </html>
  );
}
