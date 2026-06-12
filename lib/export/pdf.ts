import { jsPDF } from "jspdf";
import { captureElementAsPng } from "@/lib/export/capture";

const MARGIN_MM = 10;

export async function exportReportPdf(element: HTMLElement): Promise<void> {
  element.setAttribute("data-pdf-export-root", "true");

  try {
    const dataUrl = await captureElementAsPng(element);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const printableHeight = pageHeight - MARGIN_MM * 2;
    const imgWidth = pageWidth - MARGIN_MM * 2;

    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });

    const imgHeight = (img.height * imgWidth) / img.width;

    let heightLeft = imgHeight;
    let y = MARGIN_MM;

    doc.addImage(dataUrl, "PNG", MARGIN_MM, y, imgWidth, imgHeight);
    heightLeft -= printableHeight;

    while (heightLeft > 0) {
      y = MARGIN_MM - (imgHeight - heightLeft);
      doc.addPage();
      doc.addImage(dataUrl, "PNG", MARGIN_MM, y, imgWidth, imgHeight);
      heightLeft -= printableHeight;
    }

    doc.save(`erp-report-${Date.now()}.pdf`);
  } finally {
    element.removeAttribute("data-pdf-export-root");
  }
}
