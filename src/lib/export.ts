import jsPDF from "jspdf";

type ExportData = {
  projectName: string;
  projectDescription: string | null;
  documents: { title: string; content: string; wordCount: number; type: string }[];
  memos?: { title: string; content: string; wordCount: number }[];
  codes: { name: string; color: string; count: number }[];
  codings: { documentTitle: string; codeName: string; selectedText: string; memo: string | null; isMemo?: boolean }[];
  themes?: { name: string; color: string; description: string | null; codes: string[] }[];
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportMarkdown(data: ExportData) {
  const lines: string[] = [];
  const now = new Date().toLocaleDateString("pt-BR");
  const slug = data.projectName.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

  // YAML frontmatter
  lines.push("---");
  lines.push(`title: "${data.projectName}"`);
  lines.push(`date: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`documents: ${data.documents.length}`);
  if (data.memos?.length) lines.push(`memos: ${data.memos.length}`);
  lines.push(`codes: ${data.codes.length}`);
  lines.push(`codings: ${data.codings.length}`);
  if (data.themes?.length) lines.push(`themes: ${data.themes.length}`);
  lines.push("---\n");

  lines.push(`# ${data.projectName}`);
  lines.push(`**Exportado em:** ${now}`);
  if (data.projectDescription) lines.push(`\n${data.projectDescription}`);

  // Themes section
  if (data.themes?.length) {
    lines.push(`\n---\n\n## Temas (${data.themes.length})\n`);
    data.themes.forEach((t) => {
      lines.push(`### ${t.name}\n`);
      if (t.description) lines.push(`${t.description}\n`);
      lines.push(`**Códigos:** ${t.codes.join(", ")}\n`);
      const themeCodingsByDoc = new Map<string, typeof data.codings>();
      data.codings.forEach((c) => {
        if (t.codes.includes(c.codeName)) {
          const list = themeCodingsByDoc.get(c.documentTitle) || [];
          list.push(c);
          themeCodingsByDoc.set(c.documentTitle, list);
        }
      });
      themeCodingsByDoc.forEach((items, docTitle) => {
        lines.push(`#### ${docTitle}\n`);
        items.forEach((c) => {
          lines.push(`> "${c.selectedText}"\n`);
          lines.push(`**${c.codeName}**${c.memo ? ` · ${c.memo}` : ""}\n`);
        });
      });
    });
  }

  // Codes summary
  lines.push(`\n---\n\n## Códigos (${data.codes.length})\n`);
  data.codes.forEach((c) => {
    lines.push(`- **${c.name}** — ${c.count} ocorrência${c.count !== 1 ? "s" : ""}`);
  });

  // All codings from primary docs
  const primaryCodings = data.codings.filter((c) => !c.isMemo);
  if (primaryCodings.length) {
    lines.push(`\n---\n\n## Codificações — Documentos primários\n`);
    const byDoc = new Map<string, typeof data.codings>();
    primaryCodings.forEach((c) => {
      const l = byDoc.get(c.documentTitle) || [];
      l.push(c);
      byDoc.set(c.documentTitle, l);
    });
    byDoc.forEach((items, docTitle) => {
      lines.push(`### ${docTitle}\n`);
      items.forEach((c) => {
        lines.push(`> "${c.selectedText}"\n`);
        lines.push(`**${c.codeName}**${c.memo ? ` · ${c.memo}` : ""}\n`);
      });
    });
  }

  // Memos section
  const memoCodings = data.codings.filter((c) => c.isMemo);
  if (data.memos?.length) {
    lines.push(`\n---\n\n## Memorandos (${data.memos.length})\n`);
    lines.push(`*Reflexões analíticas da pesquisadora*\n`);
    data.memos.forEach((m) => {
      lines.push(`### ${m.title}\n`);
      lines.push(`${m.content.slice(0, 500)}${m.content.length > 500 ? "..." : ""}\n`);
      lines.push(`*${m.wordCount} palavras*\n`);
      // Codings for this memo
      const mc = memoCodings.filter((c) => c.documentTitle === m.title);
      if (mc.length) {
        lines.push(`**Codificações:**\n`);
        mc.forEach((c) => {
          lines.push(`> "${c.selectedText}"\n`);
          lines.push(`**${c.codeName}**${c.memo ? ` · ${c.memo}` : ""}\n`);
        });
      }
    });
  }

  const md = lines.join("\n");
  downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8" }), `trama-${slug}.md`);
}

export function exportPDF(data: ExportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const m = 20;
  const pw = 210 - m * 2;
  let y = m;
  const now = new Date().toLocaleDateString("pt-BR");

  function checkPage(n: number) {
    if (y + n > 280) { doc.addPage(); y = m; }
  }
  function heading(t: string, s: number) {
    checkPage(12);
    doc.setFontSize(s);
    doc.setFont("helvetica", "bold");
    doc.text(t, m, y);
    y += s * 0.5 + 2;
  }
  function body(t: string) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.splitTextToSize(t, pw).forEach((l: string) => { checkPage(5); doc.text(l, m, y); y += 4.5; });
    y += 2;
  }
  function sep() {
    checkPage(8);
    doc.setDrawColor(200);
    doc.line(m, y, 210 - m, y);
    y += 6;
  }
  function colorDot(x: number, yy: number, color: string) {
    doc.setFillColor(parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16));
    doc.circle(x, yy, 1.5, "F");
  }

  // Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(99, 102, 241);
  doc.text("trama", m, y);
  y += 10;
  doc.setTextColor(0);
  heading(data.projectName, 16);
  if (data.projectDescription) body(data.projectDescription);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exportado em ${now}`, m, y);
  doc.setTextColor(0);
  y += 8;
  sep();

  // Themes
  if (data.themes?.length) {
    heading(`Temas (${data.themes.length})`, 13);
    data.themes.forEach((t) => {
      checkPage(20);
      colorDot(m + 2, y - 1.5, t.color);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(t.name, m + 6, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`${t.codes.length} código${t.codes.length !== 1 ? "s" : ""}`, m + 6 + doc.getTextWidth(t.name) + 3, y);
      doc.setTextColor(0);
      y += 5;
      if (t.description) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.splitTextToSize(t.description, pw - 6).forEach((l: string) => { checkPage(4); doc.text(l, m + 6, y); y += 4; });
        doc.setFont("helvetica", "normal");
        y += 2;
      }
      doc.setFontSize(9);
      doc.text(`Códigos: ${t.codes.join(", ")}`, m + 6, y);
      y += 7;
    });
    sep();
  }

  // Codes
  heading(`Códigos (${data.codes.length})`, 13);
  data.codes.forEach((c) => {
    checkPage(6);
    colorDot(m + 2, y - 1.5, c.color);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(c.name, m + 6, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(`${c.count} ocorrência${c.count !== 1 ? "s" : ""}`, m + 6 + doc.getTextWidth(c.name) + 3, y);
    doc.setTextColor(0);
    y += 6;
  });
  sep();

  // Codings from primary docs
  const primaryCodings = data.codings.filter((c) => !c.isMemo);
  if (primaryCodings.length) {
    heading("Codificações — Documentos primários", 13);
    const byDoc = new Map<string, typeof data.codings>();
    primaryCodings.forEach((c) => {
      const l = byDoc.get(c.documentTitle) || [];
      l.push(c);
      byDoc.set(c.documentTitle, l);
    });
    byDoc.forEach((items, docTitle) => {
      heading(docTitle, 11);
      items.forEach((c) => {
        checkPage(16);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.setFont("helvetica", "italic");
        const q = doc.splitTextToSize(`"${c.selectedText}"`, pw - 6);
        doc.setDrawColor(201, 123, 93);
        doc.line(m, y - 2, m, y + q.length * 4);
        q.forEach((l: string) => { checkPage(5); doc.text(l, m + 4, y); y += 4; });
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(c.codeName, m + 4, y + 1);
        if (c.memo) {
          doc.setFont("helvetica", "normal");
          doc.text(` · ${c.memo}`, m + 4 + doc.getTextWidth(c.codeName) + 2, y + 1);
        }
        y += 8;
      });
    });
    sep();
  }

  // Memos section
  const memoCodings = data.codings.filter((c) => c.isMemo);
  if (data.memos?.length) {
    heading(`Memorandos (${data.memos.length})`, 13);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.setFont("helvetica", "italic");
    doc.text("Reflexões analíticas da pesquisadora", m, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    y += 6;

    data.memos.forEach((memo) => {
      checkPage(20);
      // Amber dot for memo
      doc.setFillColor(245, 158, 11);
      doc.circle(m + 2, y - 1.5, 1.5, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(memo.title, m + 6, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`${memo.wordCount} palavras`, m + 6 + doc.getTextWidth(memo.title) + 3, y);
      doc.setTextColor(0);
      y += 5;

      // Content preview
      const preview = memo.content.slice(0, 300) + (memo.content.length > 300 ? "..." : "");
      doc.setFontSize(9);
      doc.splitTextToSize(preview, pw - 6).forEach((l: string) => {
        checkPage(5);
        doc.text(l, m + 6, y);
        y += 4;
      });
      y += 2;

      // Codings from this memo
      const mc = memoCodings.filter((c) => c.documentTitle === memo.title);
      if (mc.length) {
        mc.forEach((c) => {
          checkPage(16);
          doc.setFontSize(9);
          doc.setTextColor(100);
          doc.setFont("helvetica", "italic");
          const q = doc.splitTextToSize(`"${c.selectedText}"`, pw - 10);
          doc.setDrawColor(245, 158, 11);
          doc.line(m + 4, y - 2, m + 4, y + q.length * 4);
          q.forEach((l: string) => { checkPage(5); doc.text(l, m + 8, y); y += 4; });
          doc.setTextColor(0);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(c.codeName, m + 8, y + 1);
          if (c.memo) {
            doc.setFont("helvetica", "normal");
            doc.text(` · ${c.memo}`, m + 8 + doc.getTextWidth(c.codeName) + 2, y + 1);
          }
          y += 8;
        });
      }
      y += 4;
    });
  }

  const slug = data.projectName.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  doc.save(`trama-${slug}.pdf`);
}
