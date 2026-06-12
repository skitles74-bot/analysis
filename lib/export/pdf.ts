import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ErpReport, KpiSummary } from "@/lib/types";

function formatKrw(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function exportReportPdf(
  report: ErpReport,
  kpis: KpiSummary,
  chartImages: { label: string; dataUrl: string }[]
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 20;

  doc.setFontSize(18);
  doc.text("ERP 경영 분석 보고서", 14, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `생성일: ${new Date(report.generatedAt).toLocaleString("ko-KR")} | 분석 기간: ${kpis.periodStart} ~ ${kpis.periodEnd}`,
    14,
    y
  );
  y += 12;
  doc.setTextColor(0);

  doc.setFontSize(12);
  doc.text("경영 요약", 14, y);
  y += 6;
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(report.executiveSummary, 180);
  doc.text(summaryLines, 14, y);
  y += summaryLines.length * 5 + 8;

  doc.setFontSize(12);
  doc.text("핵심 지표", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["지표", "값"]],
    body: [
      ["총매출", formatKrw(kpis.totalRevenue)],
      ["주문건수", `${kpis.orderCount.toLocaleString()}건`],
      ["평균객단가", formatKrw(kpis.avgOrderValue)],
      ["활성고객", `${kpis.activeCustomerCount.toLocaleString()}명`],
    ],
    theme: "grid",
    headStyles: { fillColor: [201, 148, 0] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.text("핵심 수치 해석", 14, y);
  y += 6;
  doc.setFontSize(10);
  const metricsLines = doc.splitTextToSize(report.keyMetrics, 180);
  doc.text(metricsLines, 14, y);
  y += metricsLines.length * 5 + 8;

  autoTable(doc, {
    startY: y,
    head: [["발견사항", "심각도", "내용"]],
    body: report.findings.map((f) => [f.title, f.severity, f.detail]),
    theme: "grid",
    headStyles: { fillColor: [201, 148, 0] },
    columnStyles: { 2: { cellWidth: 90 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: y,
    head: [["개선 제안", "우선순위", "내용"]],
    body: report.recommendations.map((r) => [r.title, r.priority, r.detail]),
    theme: "grid",
    headStyles: { fillColor: [201, 148, 0] },
    columnStyles: { 2: { cellWidth: 90 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (report.riskAlerts.length > 0) {
    doc.setFontSize(12);
    doc.text("리스크 경고", 14, y);
    y += 6;
    doc.setFontSize(10);
    report.riskAlerts.forEach((alert, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${alert}`, 180);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 2;
    });
    y += 6;
  }

  chartImages.forEach(({ label, dataUrl }) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.text(label, 14, y);
    y += 4;
    doc.addImage(dataUrl, "PNG", 14, y, 180, 70);
    y += 78;
  });

  doc.save(`erp-report-${Date.now()}.pdf`);
}
