"use client";

import { useEffect, useState, useRef } from "react";

interface StudentResult {
  id: string;
  name: string;
  fin: string | null;
  listening: { score: number | null; date: string | null; examDate: string | null } | null;
  reading: { score: number | null; date: string | null; examDate: string | null } | null;
  writing: { score: number | null; date: string | null; examDate: string | null } | null;
  overall: number | null;
}

interface GroupReport {
  id: string;
  name: string;
  teacher: { id: string; name: string } | null;
  studentCount: number;
  avgScore: number | null;
  students: StudentResult[];
}

export default function ReportsPage() {
  const [groups, setGroups] = useState<GroupReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<GroupReport | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) setGroups(await res.json());
      } catch {}
      setLoading(false);
    }
    fetchReport();
  }, []);

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const todayStr = new Date().toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });

  const examDateStr = selectedGroup?.students[0]?.listening?.examDate
    ? formatDate(selectedGroup.students[0].listening.examDate)
    : selectedGroup?.students[0]?.reading?.examDate
      ? formatDate(selectedGroup.students[0].reading.examDate)
      : null;

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>IELTS Hesabat - ${selectedGroup?.name || ""}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; margin: 50px 60px; color: #000; font-size: 14px; line-height: 1.5; }
  .header { text-align: center; margin-bottom: 30px; }
  .header h1 { font-size: 18px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .header h2 { font-size: 16px; font-weight: normal; }
  .info-table { width: 100%; margin-bottom: 20px; }
  .info-table td { padding: 3px 0; font-size: 13px; }
  .info-table td:first-child { width: 150px; font-weight: bold; }
  .results { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .results th, .results td { border: 1px solid #000; padding: 7px 10px; text-align: center; font-size: 13px; }
  .results th { background: #f0f0f0; font-weight: bold; }
  .results td.left { text-align: left; }
  .results tfoot td { font-weight: bold; background: #f8f8f8; }
  .footer { margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { }
  .footer-right { text-align: right; }
  .sign-area { margin-top: 50px; }
  .sign-line { width: 200px; border-bottom: 1px solid #000; margin: 0 0 5px auto; }
  .sign-title { font-size: 13px; margin-bottom: 5px; }
  .sign-name { font-size: 13px; font-style: italic; }
  @media print { body { margin: 30px 40px; } @page { margin: 20mm; } }
</style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Yuklenir...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hesabatlar</h1>
          <p className="text-sm text-muted-foreground">Qruplar uzre imtahan neticeleri</p>
        </div>
        {selectedGroup && (
          <button
            onClick={handlePrint}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Cap et
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Groups list */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Qruplar</h3>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Qrup yoxdur</p>
          ) : (
            groups.map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedGroup(g)}
                className={`cursor-pointer rounded-lg border p-4 transition-colors hover:border-primary ${
                  selectedGroup?.id === g.id ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <p className="font-semibold text-foreground">{g.name}</p>
                <p className="text-xs text-muted-foreground">
                  {g.teacher?.name || "-"} | {g.studentCount} telebe
                </p>
                {g.avgScore !== null && (
                  <p className="mt-1 text-sm font-bold text-primary">Orta: {g.avgScore}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Selected group results */}
        <div className="lg:col-span-3">
          {!selectedGroup ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-card">
              <p className="text-sm text-muted-foreground">Qrup secin</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-bold text-foreground">{selectedGroup.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Muellim: {selectedGroup.teacher?.name || "-"} | {selectedGroup.studentCount} telebe
                  {selectedGroup.avgScore !== null && ` | Orta bal: ${selectedGroup.avgScore}`}
                  {examDateStr && ` | Imtahan tarixi: ${examDateStr}`}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Ad Soyad</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">FIN</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Listening</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Reading</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Writing</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Umumi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.students.map((s, i) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                        <td className="px-4 py-3 font-mono text-foreground">{s.fin || "-"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${s.listening?.score != null ? ((s.listening.score) >= 5 ? "text-green-700" : "text-red-600") : "text-muted-foreground"}`}>
                            {s.listening?.score ?? "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${s.reading?.score != null ? ((s.reading.score) >= 5 ? "text-green-700" : "text-red-600") : "text-muted-foreground"}`}>
                            {s.reading?.score ?? "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${s.writing?.score != null ? ((s.writing.score) >= 5 ? "text-green-700" : "text-red-600") : "text-muted-foreground"}`}>
                            {s.writing?.score ?? "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s.overall !== null ? (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.overall >= 5 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {s.overall}
                            </span>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden printable content */}
      {selectedGroup && (
        <div style={{ display: "none" }}>
          <div ref={printRef}>
            <div className="header">
              <h1>IELTS IMTAHAN NETICELERI</h1>
              <h2>{selectedGroup.name}</h2>
            </div>

            <table className="info-table">
              <tbody>
                <tr><td>Muellim:</td><td>{selectedGroup.teacher?.name || "-"}</td></tr>
                <tr><td>Telebe sayi:</td><td>{selectedGroup.studentCount}</td></tr>
                {examDateStr && <tr><td>Imtahan tarixi:</td><td>{examDateStr}</td></tr>}
                <tr><td>Hesabat tarixi:</td><td>{todayStr}</td></tr>
              </tbody>
            </table>

            <table className="results">
              <thead>
                <tr>
                  <th style={{width: "30px"}}>#</th>
                  <th style={{textAlign: "left"}}>Ad Soyad</th>
                  <th>FIN</th>
                  <th>Listening</th>
                  <th>Reading</th>
                  <th>Writing</th>
                  <th>Umumi</th>
                </tr>
              </thead>
              <tbody>
                {selectedGroup.students.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td className="left">{s.name}</td>
                    <td>{s.fin || "-"}</td>
                    <td>{s.listening?.score ?? "-"}</td>
                    <td>{s.reading?.score ?? "-"}</td>
                    <td>{s.writing?.score ?? "-"}</td>
                    <td><strong>{s.overall ?? "-"}</strong></td>
                  </tr>
                ))}
              </tbody>
              {selectedGroup.avgScore !== null && (
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{textAlign: "right"}}>Qrup ortasi:</td>
                    <td><strong>{selectedGroup.avgScore}</strong></td>
                  </tr>
                </tfoot>
              )}
            </table>

            <div className="footer">
              <div className="footer-left">
                <p>Tarix: {todayStr}</p>
              </div>
              <div className="footer-right">
                <div className="sign-area">
                  <p className="sign-title">Diller kafedrasinin mudiri</p>
                  <div className="sign-line"></div>
                  <p className="sign-name">dos. Sevil Qurbanova</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
