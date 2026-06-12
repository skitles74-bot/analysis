import type { Metadata } from "next";
import { DataProvider } from "@/lib/context/DataContext";
import { AppNav } from "@/app/components/AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERP 데이터 분석 대시보드",
  description: "ERP CSV 업로드, 경영 대시보드, AI 분석 보고서",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <DataProvider>
          <div className="app app--wide">
            <header className="header">
              <h1>ERP 데이터 분석 대시보드</h1>
              <p className="subtitle">
                CSV 업로드 후 대시보드 · 보고서 · 원본데이터를 메뉴에서 이용하세요 (Gemini 2.5)
              </p>
              <AppNav />
            </header>
            <main>{children}</main>
            <footer className="footer">
              ERP Analysis Dashboard · CSV 4종 업로드 · PDF/DOCX 다운로드
            </footer>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
