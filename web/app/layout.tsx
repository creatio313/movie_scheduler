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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: "撮影計画支援電算処理システム",
  description: "候補日時と役者のスケジュールから、シーン別の撮影可能日時を算出します。",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "撮影計画支援電算処理システム",
    description: "候補日時と役者のスケジュールから、シーン別の撮影可能日時を算出します。",
    type: "website",
    locale: "ja_JP",
    images: [
      {
        url: "/ogp_image.png",
        width: 192,
        height: 192,
        alt: "撮影計画支援電算処理システム",
      },
    ],
  },
  twitter: {
    card: "summary",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
