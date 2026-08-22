import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// GitHubロゴのSVG直接描画用コンポーネント (lucide-reactのブランドアイコン欠損エラー対策)
function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: {
    default: "PalBreed | 個人用配合シミュレータ＆記録手帳",
    template: "%s | PalBreed"
  },
  description: "パルワールド（Palworld）の配合結果を自分だけのメモ代わりに記録・検索・管理できる個人用配合ブリーダー手帳です。ひらがな検索やサジェスト補完、重複警告など快適な操作性を実現。",
  keywords: ["パルワールド", "配合", "配合シミュレータ", "Palworld", "配合検索", "パルブリード", "PalBreed"],
  openGraph: {
    title: "PalBreed | 個人用配合シミュレータ＆記録手帳",
    description: "自分で体験したパルの配合結果をメモ代わりに記録・検索・管理できる個人用ブリーダー手帳です。",
    url: "https://palbreed.vercel.app",
    siteName: "PalBreed",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PalBreed | 個人用配合シミュレータ＆記録手帳",
    description: "自分で体験したパルの配合結果をメモ代わりに記録・検索・管理できる個人用ブリーダー手帳です。",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "PalBreed",
    "url": "https://palbreed.vercel.app",
    "description": "パルワールドの配合結果を自分用に記録・検索できるファンメイドのWebアプリです。",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "All"
  };

  return (
    <html lang="ja" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <footer className="border-t border-border/40 bg-zinc-950/20 py-6 text-center text-xs text-zinc-500 space-y-3 mt-auto">
          <div className="flex justify-center">
            <a
              href="https://github.com/ibukichi-jp/PalBreed"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors duration-200"
            >
              <GithubIcon className="h-4 w-4" />
              <span className="font-mono text-[11px] tracking-wider">GitHub Repository</span>
            </a>
          </div>
          <div className="space-y-1">
            <p>© 2026 PalBreed | 個人用配合記録手帳</p>
            <p className="max-w-md mx-auto px-4 leading-normal text-zinc-600">
              本アプリケーションは個人が開発した非公式のファンメイド作品であり、株式会社ポケットペア様とは一切関係ありません。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
