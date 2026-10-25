import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Analytics } from "@vercel/analytics/next";

const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";
const DESCRIPTION = "고정현헤어 교육 아카데미. 단계별 정규 과정부터 트렌드 코스, 초청 원장 클래스까지 살롱에서 쓰는 기술을 배워요.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "버드아카데미", template: "%s | 버드아카데미" },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "버드아카데미",
    title: "버드아카데미 · 고정현헤어 교육 아카데미",
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "버드아카데미 교육장" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
