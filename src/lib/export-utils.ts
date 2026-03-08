import * as XLSX from "xlsx";
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, WidthType, BorderStyle,
} from "docx";

/**
 * Export data to Excel (.xlsx)
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  sheetName: string,
  fileName: string
) {
  if (!data.length) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Export data to Word (.docx)
 */
export async function exportToWord(
  data: Record<string, unknown>[],
  title: string,
  fileName: string
) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);

  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, size: 20 })],
            }),
          ],
          width: { size: Math.floor(9000 / headers.length), type: WidthType.DXA },
          shading: { fill: "1e40af" },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        })
    ),
    tableHeader: true,
  });

  const dataRows = data.map(
    (row) =>
      new TableRow({
        children: headers.map(
          (h) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: String(row[h] ?? ""),
                      size: 18,
                    }),
                  ],
                }),
              ],
              width: { size: Math.floor(9000 / headers.length), type: WidthType.DXA },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
            })
        ),
      })
  );

  const table = new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 9000, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "e2e8f0" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "e2e8f0" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "e2e8f0" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "e2e8f0" },
    },
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${new Date().toLocaleString()}  ·  ${data.length} record${data.length !== 1 ? "s" : ""}`,
                size: 18,
                color: "64748b",
              }),
            ],
            spacing: { after: 300 },
          }),
          table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
