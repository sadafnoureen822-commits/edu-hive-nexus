import * as XLSX from "xlsx";

/**
 * Export any array of objects to an Excel (.xlsx) file and trigger download.
 * @param data    Array of row objects
 * @param sheetName  Sheet tab name
 * @param fileName  Downloaded file name (without extension)
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
