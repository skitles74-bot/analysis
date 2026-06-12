import {
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import type { ErpReport, KpiSummary } from "@/lib/types";

function formatKrw(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

async function dataUrlToUint8Array(dataUrl: string): Promise<Uint8Array> {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function cell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
  });
}

export async function exportReportDocx(
  report: ErpReport,
  kpis: KpiSummary,
  chartImages: { label: string; dataUrl: string }[]
): Promise<void> {
  const kpiTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [cell("지표", true), cell("값", true)],
      }),
      new TableRow({
        children: [cell("총매출"), cell(formatKrw(kpis.totalRevenue))],
      }),
      new TableRow({
        children: [cell("주문건수"), cell(`${kpis.orderCount.toLocaleString()}건`)],
      }),
      new TableRow({
        children: [cell("평균객단가"), cell(formatKrw(kpis.avgOrderValue))],
      }),
      new TableRow({
        children: [
          cell("활성고객"),
          cell(`${kpis.activeCustomerCount.toLocaleString()}명`),
        ],
      }),
    ],
  });

  const findingsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [cell("발견사항", true), cell("심각도", true), cell("내용", true)],
      }),
      ...report.findings.map(
        (f) =>
          new TableRow({
            children: [cell(f.title), cell(f.severity), cell(f.detail)],
          })
      ),
    ],
  });

  const recTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [cell("개선 제안", true), cell("우선순위", true), cell("내용", true)],
      }),
      ...report.recommendations.map(
        (r) =>
          new TableRow({
            children: [cell(r.title), cell(r.priority), cell(r.detail)],
          })
      ),
    ],
  });

  const chartParagraphs: Paragraph[] = [];
  for (const chart of chartImages) {
    const bytes = await dataUrlToUint8Array(chart.dataUrl);
    chartParagraphs.push(
      new Paragraph({ text: chart.label, heading: HeadingLevel.HEADING_3 }),
      new Paragraph({
        children: [
          new ImageRun({
            data: bytes,
            transformation: { width: 500, height: 220 },
            type: "png",
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "ERP 경영 분석 보고서",
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `생성일: ${new Date(report.generatedAt).toLocaleString("ko-KR")} | 분석 기간: ${kpis.periodStart} ~ ${kpis.periodEnd}`,
                color: "666666",
              }),
            ],
          }),
          new Paragraph({ text: "경영 요약", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: report.executiveSummary }),
          new Paragraph({ text: "핵심 지표", heading: HeadingLevel.HEADING_1 }),
          kpiTable,
          new Paragraph({ text: "핵심 수치 해석", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: report.keyMetrics }),
          new Paragraph({ text: "주요 발견사항", heading: HeadingLevel.HEADING_1 }),
          findingsTable,
          new Paragraph({ text: "개선 제안", heading: HeadingLevel.HEADING_1 }),
          recTable,
          new Paragraph({ text: "리스크 경고", heading: HeadingLevel.HEADING_1 }),
          ...report.riskAlerts.map((a) => new Paragraph({ text: `• ${a}` })),
          ...chartParagraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `erp-report-${Date.now()}.docx`);
}
