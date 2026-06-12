import html2canvas from "html2canvas";

export async function captureElementAsPng(element: HTMLElement): Promise<string> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    onclone: (clonedDoc) => {
      const cloned = clonedDoc.querySelector(
        "[data-pdf-export-root]"
      ) as HTMLElement | null;
      if (cloned) {
        cloned.style.fontFamily = "var(--font-noto-sans-kr), sans-serif";
        cloned.style.width = `${element.scrollWidth}px`;
      }
    },
  });

  return canvas.toDataURL("image/png");
}
