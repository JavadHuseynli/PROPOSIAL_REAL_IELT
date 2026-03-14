import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const data = [
    { "Ad Soyad": "Nigar Mammadova", "FIN": "3NM4521" },
    { "Ad Soyad": "Elvin Aliyev", "FIN": "8EA7634" },
    { "Ad Soyad": "", "FIN": "" },
  ];

  const ws = XLSX.utils.json_to_sheet(data);

  // Column widths
  ws["!cols"] = [{ wch: 30 }, { wch: 15 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Telebeler");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=telebe-shablon.xlsx",
    },
  });
}
