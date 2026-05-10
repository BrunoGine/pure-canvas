import jsPDF from "jspdf";
import { BalanceSheet, formatBRL } from "./balanceSheet";

export function downloadBalanceSheetPdf(
  bs: BalanceSheet,
  companyName: string,
) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  // Header band
  pdf.setFillColor(28, 45, 92);
  pdf.rect(0, 0, pageW, 32, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("Balanço Patrimonial", margin, 15);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(`${companyName} • Exercício ${bs.year}`, margin, 23);
  pdf.setFontSize(9);
  pdf.text(
    `Emitido em ${new Date().toLocaleDateString("pt-BR")}`,
    pageW - margin,
    23,
    { align: "right" },
  );

  y = 42;
  pdf.setTextColor(20, 20, 20);

  const sectionTitle = (label: string) => {
    if (y > pageH - 40) { pdf.addPage(); y = margin; }
    pdf.setFillColor(235, 240, 250);
    pdf.rect(margin, y - 5, pageW - margin * 2, 8, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(28, 45, 92);
    pdf.text(label, margin + 3, y + 1);
    y += 9;
    pdf.setTextColor(20, 20, 20);
  };

  const row = (label: string, amount: number, opts?: { bold?: boolean; indent?: number }) => {
    if (y > pageH - 25) { pdf.addPage(); y = margin; }
    pdf.setFont("helvetica", opts?.bold ? "bold" : "normal");
    pdf.setFontSize(10);
    pdf.text(label, margin + (opts?.indent ?? 0), y);
    pdf.text(formatBRL(amount), pageW - margin, y, { align: "right" });
    y += 6;
  };

  const divider = () => {
    pdf.setDrawColor(220, 224, 232);
    pdf.line(margin, y - 2, pageW - margin, y - 2);
  };

  // ATIVO
  sectionTitle("ATIVO");
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(10);
  pdf.text("Ativo Circulante", margin, y); y += 6;
  bs.ativoCirculante.forEach((a) => row(a.label, a.amount, { indent: 4 }));
  divider();
  row("Total Ativo Circulante", bs.ativoCirculante.reduce((s, a) => s + a.amount, 0), { bold: true });

  y += 2;
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(10);
  pdf.text("Ativo Não Circulante", margin, y); y += 6;
  bs.ativoNaoCirculante.forEach((a) => row(a.label, a.amount, { indent: 4 }));
  divider();
  row("Total Ativo Não Circulante", bs.ativoNaoCirculante.reduce((s, a) => s + a.amount, 0), { bold: true });

  y += 2;
  divider();
  row("TOTAL DO ATIVO", bs.totals.ativo, { bold: true });

  y += 4;
  // PASSIVO
  sectionTitle("PASSIVO");
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(10);
  pdf.text("Passivo Circulante", margin, y); y += 6;
  bs.passivoCirculante.forEach((p) => row(p.label, p.amount, { indent: 4 }));
  divider();
  row("Total Passivo Circulante", bs.totals.passivo, { bold: true });

  y += 2;
  divider();
  row("Patrimônio Líquido", bs.totals.patrimonio, { bold: true });
  divider();
  row("TOTAL DO PASSIVO + PL", bs.totals.passivo + bs.totals.patrimonio, { bold: true });

  y += 4;
  // RESULTADO
  sectionTitle("DEMONSTRAÇÃO DE RESULTADO");
  row("Receita Bruta", bs.totalRevenue);
  row("(–) Despesas Totais", bs.totalExpenses);
  divider();
  row(bs.result >= 0 ? "Lucro do Exercício" : "Prejuízo do Exercício", bs.result, { bold: true });

  if (bs.expensesByCategory.length) {
    y += 4;
    sectionTitle("DESPESAS POR CATEGORIA");
    bs.expensesByCategory.forEach((e) => row(e.category, e.amount, { indent: 4 }));
  }

  // Footer disclaimer
  if (y > pageH - 30) { pdf.addPage(); y = margin; }
  y = Math.max(y, pageH - 22);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    "Este relatório é gerado automaticamente a partir das transações registradas no aplicativo e não substitui a análise de um contador habilitado.",
    margin,
    pageH - 12,
    { maxWidth: pageW - margin * 2 },
  );

  pdf.save(`balanco_${companyName.replace(/\s+/g, "_")}_${bs.year}.pdf`);
}
