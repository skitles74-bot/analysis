import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const MARGIN_MM = 10;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function exportReportPdf(element: HTMLElement): Promise<void> {
  const dataUrl = await toPng(element, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
    cacheBust: true,
  });

  const img = await loadImage(dataUrl);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const contentWidth = A4_WIDTH_MM - MARGIN_MM * 2;
  const contentHeight = A4_HEIGHT_MM - MARGIN_MM * 2;
  const imgHeightMm = (img.height * contentWidth) / img.width;

  let heightLeft = imgHeightMm;
  let yOffset = MARGIN_MM;

  doc.addImage(dataUrl, "PNG", MARGIN_MM, yOffset, contentWidth, imgHeightMm);
  heightLeft -= contentHeight;

  while (heightLeft > 0) {
    yOffset = MARGIN_MM - (imgHeightMm - heightLeft);
    doc.addPage();
    doc.addImage(dataUrl, "PNG", MARGIN_MM, yOffset, contentWidth, imgHeightMm);
    heightLeft -= contentHeight;
  }

  doc.save(`erp-report-${Date.now()}.pdf`);
}
