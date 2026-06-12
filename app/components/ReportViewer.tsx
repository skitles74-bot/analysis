"use client";

import { useRef } from "react";
import { toPng } from "html-to-image";
import type { ErpReport, KpiSummary } from "@/lib/types";
import { exportReportDocx } from "@/lib/export/docx";
import { exportReportPdf } from "@/lib/export/pdf";
import { KpiCards } from "@/app/components/KpiCards";
import { DashboardCharts, CHART_IDS } from "@/app/components/DashboardCharts";

function SeverityBadge({ level }: { level: string }) {
  return (
    <span className={`impact-badge impact-${level}`}>{level}</span>
  );
}

interface ReportViewerProps {
  report: ErpReport;
  kpis: KpiSummary;
}

async function captureCharts(): Promise<{ label: string; dataUrl: string }[]> {
  const images: { label: string; dataUrl: string }[] = [];

  for (const chart of CHART_IDS) {
    const el = document.querySelector(`[data-chart-id="${chart.id}"]`);
    if (!el) continue;
    try {
      const dataUrl = await toPng(el as HTMLElement, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      images.push({ label: chart.label, dataUrl });
    } catch {
      // skip failed capture
    }
  }

  return images;
}

export function ReportViewer({ report, kpis }: ReportViewerProps) {
  const reportContentRef = useRef<HTMLDivElement>(null);
  const exporting = useRef(false);

  const handleExport = async (format: "pdf" | "docx") => {
    if (exporting.current) return;
    exporting.current = true;

    try {
      const chartImages = await captureCharts();
      if (format === "pdf") {
        if (!reportContentRef.current) {
          throw new Error("보고서 영역을 찾을 수 없습니다.");
        }
        await exportReportPdf(reportContentRef.current);
      } else {
        await exportReportDocx(report, kpis, chartImages);
      }
    } finally {
      exporting.current = false;
    }
  };

  return (
    <div className="report-viewer">
      <div className="report-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleExport("pdf")}
        >
          PDF 다운로드
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleExport("docx")}
        >
          Word (.docx) 다운로드
        </button>
      </div>

      <div className="report-result" ref={reportContentRef}>
        <header className="report-header">
          <h2 className="report-title">ERP 경영 분석 보고서</h2>
          <p className="report-meta">
            생성일: {new Date(report.generatedAt).toLocaleString("ko-KR")} ·
            분석 기간: {kpis.periodStart} ~ {kpis.periodEnd}
          </p>
        </header>

        <section>
          <h3 className="report-section-title">경영 요약</h3>
          <p className="report-summary">{report.executiveSummary}</p>
        </section>

        <section>
          <h3 className="report-section-title">핵심 지표</h3>
          <KpiCards kpis={kpis} />
        </section>

        <section>
          <h3 className="report-section-title">핵심 수치 해석</h3>
          <p className="report-metrics">{report.keyMetrics}</p>
        </section>

        <section>
          <h3 className="report-section-title">주요 발견사항</h3>
          <ul className="issue-list">
            {report.findings.map((f, i) => (
              <li key={i} className="issue-item">
                <div className="issue-header">
                  <span className="issue-title">{f.title}</span>
                  <SeverityBadge level={f.severity} />
                </div>
                <p className="issue-description">{f.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="report-section-title">개선 제안</h3>
          <ul className="issue-list">
            {report.recommendations.map((r, i) => (
              <li key={i} className="issue-item">
                <div className="issue-header">
                  <span className="issue-title">{r.title}</span>
                  <SeverityBadge level={r.priority} />
                </div>
                <p className="issue-description">{r.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        {report.riskAlerts.length > 0 && (
          <section>
            <h3 className="report-section-title">리스크 경고</h3>
            <ul className="risk-list">
              {report.riskAlerts.map((alert, i) => (
                <li key={i}>{alert}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="report-charts-section">
          <h3 className="report-section-title">데이터 시각화</h3>
          <DashboardCharts kpis={kpis} />
        </section>
      </div>
    </div>
  );
}
