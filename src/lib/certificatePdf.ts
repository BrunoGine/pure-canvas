import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const downloadCertificatePdf = async (
  el: HTMLElement,
  filename: string,
) => {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  pdf.addImage(img, "PNG", 0, 0, w, h);
  pdf.save(filename);
};
