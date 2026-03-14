"use client";

import { useEffect, useState, useCallback } from "react";

interface Violation {
  id: string;
  type: string;
  detail: string | null;
  duration: number | null;
  createdAt: string;
  attempt?: {
    id: string;
    user: { id: string; name: string; fin: string | null };
    test: { id: string; title: string; type: string };
  };
}

interface ActiveAttempt {
  id: string;
  startedAt: string;
  tabSwitchCount: number;
  user: { id: string; name: string; fin: string | null };
  test: { id: string; title: string; type: string };
  violations: Violation[];
}

interface SuspiciousAttempt {
  id: string;
  tabSwitchCount: number;
  status: string;
  score: number | null;
  user: { id: string; name: string; fin: string | null };
  test: { id: string; title: string; type: string };
  _count: { violations: number };
}

const VIOLATION_LABELS: Record<string, string> = {
  TAB_SWITCH: "Tab dəyişmə",
  WINDOW_BLUR: "Pəncərə dəyişmə",
  COPY_PASTE: "Kopyala/Yapışdır",
  RIGHT_CLICK: "Sağ klik",
};

const VIOLATION_COLORS: Record<string, string> = {
  TAB_SWITCH: "bg-red-100 text-red-700",
  WINDOW_BLUR: "bg-orange-100 text-orange-700",
  COPY_PASTE: "bg-yellow-100 text-yellow-700",
  RIGHT_CLICK: "bg-gray-100 text-gray-700",
};

interface ScreenCapture {
  attemptId: string;
  user: { id: string; name: string; fin: string | null };
  test: { id: string; title: string; type: string };
  startedAt: string;
  tabSwitchCount: number;
  latestScreenshot: string | null;
  capturedAt: string | null;
}

interface AttemptDetail {
  violations: Violation[];
  screenshots: { id: string; screenshot: string; createdAt: string }[];
  attempt: {
    user: { id: string; name: string; fin: string | null };
    test: { id: string; title: string; type: string };
    tabSwitchCount: number;
  };
}

export default function MonitoringPage() {
  const [activeAttempts, setActiveAttempts] = useState<ActiveAttempt[]>([]);
  const [recentViolations, setRecentViolations] = useState<Violation[]>([]);
  const [suspiciousAttempts, setSuspiciousAttempts] = useState<SuspiciousAttempt[]>([]);
  const [screenCaptures, setScreenCaptures] = useState<ScreenCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"screens" | "violations">("screens");

  // Detail modal
  const [selectedDetail, setSelectedDetail] = useState<AttemptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);

  // Expanded live screen
  const [expandedScreen, setExpandedScreen] = useState<string | null>(null);

  const openAttemptDetail = async (attemptId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/violations/${attemptId}`);
      if (res.ok) {
        setSelectedDetail(await res.json());
      }
    } catch {}
    setDetailLoading(false);
  };

  const fetchData = useCallback(async () => {
    try {
      const [monRes, capRes] = await Promise.all([
        fetch("/api/monitoring"),
        fetch("/api/screen-capture"),
      ]);
      if (monRes.ok) {
        const data = await monRes.json();
        setActiveAttempts(data.activeAttempts);
        setRecentViolations(data.recentViolations);
        setSuspiciousAttempts(data.suspiciousAttempts);
      }
      if (capRes.ok) {
        setScreenCaptures(await capRes.json());
      }
      setLastUpdate(new Date());
    } catch {}
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nəzarət Paneli</h1>
          <p className="text-sm text-muted-foreground">
            Tələbələrin test zamanı fəaliyyətinə nəzarət
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
            <span className="text-xs text-muted-foreground">
              Canlı | Son yeniləmə: {lastUpdate.toLocaleTimeString("az-AZ")}
            </span>
          </div>
          <button
            onClick={fetchData}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Yenilə
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Aktiv Testlər</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{activeAttempts.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">hazırda test həll edən tələbə</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700">Şübhəli Fəaliyyət</p>
          <p className="mt-1 text-3xl font-bold text-red-700">{suspiciousAttempts.length}</p>
          <p className="mt-1 text-xs text-red-600">pozuntu qeydə alınmış tələbə</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">
          <p className="text-sm text-orange-700">Son Pozuntular</p>
          <p className="mt-1 text-3xl font-bold text-orange-700">{recentViolations.length}</p>
          <p className="mt-1 text-xs text-orange-600">son qeydə alınmış pozuntular</p>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("screens")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "screens" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-accent"
          }`}
        >
          🖥️ Canlı Ekranlar
        </button>
        <button
          onClick={() => setViewMode("violations")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "violations" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-accent"
          }`}
        >
          ⚠️ Pozuntular
        </button>
      </div>

      {/* Live screen captures */}
      {viewMode === "screens" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Canlı Ekran Görüntüləri
            <span className="ml-2 text-sm font-normal text-muted-foreground">(hər 15 saniyədə yenilənir)</span>
          </h2>
          {screenCaptures.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
              <div className="mb-3 text-4xl">🖥️</div>
              <p className="text-sm text-muted-foreground">Hazırda ekran paylaşan tələbə yoxdur</p>
            </div>
          ) : (
            <div className={expandedScreen ? "" : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"}>
              {screenCaptures.map((cap) => {
                const isExpanded = expandedScreen === cap.attemptId;

                // If another card is expanded, hide this one
                if (expandedScreen && !isExpanded) return null;

                return (
                  <div
                    key={cap.attemptId}
                    className={`rounded-lg border bg-card overflow-hidden transition-all duration-300 ${
                      cap.tabSwitchCount > 0 ? "border-red-300" : "border-border"
                    } ${isExpanded ? "w-full" : ""}`}
                  >
                    {/* Screen image - clickable */}
                    <div
                      onClick={() => setExpandedScreen(isExpanded ? null : cap.attemptId)}
                      className={`relative bg-gray-900 cursor-pointer ${isExpanded ? "aspect-[16/9] max-h-[75vh]" : "aspect-video"}`}
                    >
                      {cap.latestScreenshot ? (
                        <img
                          src={`${cap.latestScreenshot}?t=${cap.capturedAt || ""}`}
                          alt={`${cap.user.name} ekranı`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-500">
                          <span className="text-sm">Ekran gözlənilir...</span>
                        </div>
                      )}
                      {/* Live badge */}
                      <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></span>
                        <span className="text-[10px] font-medium text-white">CANLI</span>
                      </div>
                      {/* Violation badge */}
                      {cap.tabSwitchCount > 0 && (
                        <div className="absolute right-2 top-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          ⚠ {cap.tabSwitchCount} pozuntu
                        </div>
                      )}
                      {/* Expand/collapse hint */}
                      <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">
                        {isExpanded ? "Kiçilt ↙" : "Böyüt ↗"}
                      </div>
                    </div>
                    {/* Info */}
                    <div className={`p-3 ${isExpanded ? "flex items-center justify-between" : ""}`}>
                      <div>
                        <p className="font-medium text-foreground">{cap.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cap.user.fin && <span className="font-mono">{cap.user.fin} · </span>}
                          {cap.test.title}
                        </p>
                      </div>
                      <div className={isExpanded ? "text-right" : ""}>
                        {cap.capturedAt && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Son görüntü: {new Date(cap.capturedAt).toLocaleTimeString("az-AZ")}
                          </p>
                        )}
                        {isExpanded && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openAttemptDetail(cap.attemptId); }}
                            className="mt-1 rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                          >
                            Bütün screenshot-lar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Active test takers - show in violations mode */}
      {viewMode === "violations" && <>
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="font-semibold text-foreground">
            Hazırda Test Həll Edən Tələbələr
            {activeAttempts.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                {activeAttempts.length}
              </span>
            )}
          </h2>
        </div>
        {activeAttempts.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Hazırda test həll edən tələbə yoxdur
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeAttempts.map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${attempt.tabSwitchCount > 0 ? "bg-red-500" : "bg-green-500"}`} />
                  <div>
                    <p className="font-medium text-foreground">{attempt.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {attempt.user.fin && <span className="font-mono">{attempt.user.fin} · </span>}
                      {attempt.test.title} ({attempt.test.type})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {attempt.tabSwitchCount > 0 && (
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                      ⚠ {attempt.tabSwitchCount} tab dəyişmə
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(attempt.startedAt).toLocaleTimeString("az-AZ")} -dan
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suspicious attempts */}
      {suspiciousAttempts.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-card">
          <div className="border-b border-red-200 bg-red-50 px-5 py-3">
            <h2 className="font-semibold text-red-800">Şübhəli Fəaliyyət - Pozuntu Siyahısı</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-2 font-medium text-muted-foreground">Tələbə</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">FIN</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Test</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Tab Dəyişmə</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Ümumi Pozuntu</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {suspiciousAttempts.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => openAttemptDetail(a.id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-red-50 transition-colors"
                >
                  <td className="px-4 py-2 font-medium text-foreground">{a.user.name}</td>
                  <td className="px-4 py-2 font-mono text-foreground">{a.user.fin || "—"}</td>
                  <td className="px-4 py-2 text-foreground">{a.test.title}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                      {a.tabSwitchCount}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                      {a._count.violations}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                      a.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                      "bg-purple-100 text-purple-700"
                    }`}>
                      {a.status === "IN_PROGRESS" ? "Davam edir" : a.status === "COMPLETED" ? "Tamamlanıb" : "Qiymətləndirilib"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent violations timeline */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="font-semibold text-foreground">Son Pozuntular (Timeline)</h2>
        </div>
        {recentViolations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Heç bir pozuntu qeydə alınmayıb
          </div>
        ) : (
          <div className="max-h-96 divide-y divide-border overflow-y-auto">
            {recentViolations.map((v) => (
              <div key={v.id} className="flex items-start gap-3 px-5 py-3">
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${VIOLATION_COLORS[v.type] || "bg-gray-100 text-gray-700"}`}>
                  {VIOLATION_LABELS[v.type] || v.type}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <b>{v.attempt?.user.name}</b>
                    {v.attempt?.user.fin && <span className="ml-1 font-mono text-xs text-muted-foreground">({v.attempt.user.fin})</span>}
                    {" — "}{v.attempt?.test.title}
                  </p>
                  {v.detail && <p className="text-xs text-muted-foreground">{v.detail}</p>}
                  {v.duration && v.duration > 0 && (
                    <p className="text-xs text-red-600">Müddət: {v.duration} saniyə</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(v.createdAt).toLocaleTimeString("az-AZ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      </>}

      {/* Detail Modal - screenshots & violations for a specific attempt */}
      {(selectedDetail || detailLoading) && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-10">
          <div className="w-full max-w-5xl rounded-lg bg-white shadow-2xl">
            {detailLoading ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-muted-foreground">Yüklənir...</p>
              </div>
            ) : selectedDetail && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {selectedDetail.attempt.user.name}
                      {selectedDetail.attempt.user.fin && (
                        <span className="ml-2 font-mono text-sm text-gray-500">({selectedDetail.attempt.user.fin})</span>
                      )}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedDetail.attempt.test.title} · {selectedDetail.attempt.test.type}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDetail(null)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Bağla
                  </button>
                </div>

                {/* Screenshots */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Ekran Görüntüləri ({selectedDetail.screenshots.length})
                  </h3>
                  {selectedDetail.screenshots.length === 0 ? (
                    <p className="text-sm text-gray-400">Ekran görüntüsü yoxdur</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                      {selectedDetail.screenshots.map((ss) => (
                        <div
                          key={ss.id}
                          onClick={() => setFullscreenImg(ss.screenshot)}
                          className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-lg"
                        >
                          <div className="relative aspect-video bg-gray-100">
                            <img
                              src={`${ss.screenshot}?t=${ss.createdAt}`}
                              alt="Screenshot"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                              <span className="text-lg text-white opacity-0 transition-opacity group-hover:opacity-100">🔍</span>
                            </div>
                          </div>
                          <div className="px-2 py-1">
                            <p className="text-[10px] text-gray-500">
                              {new Date(ss.createdAt).toLocaleString("az-AZ")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Violations list */}
                <div className="px-6 py-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Pozuntular ({selectedDetail.violations.length})
                  </h3>
                  {selectedDetail.violations.length === 0 ? (
                    <p className="text-sm text-gray-400">Pozuntu qeydə alınmayıb</p>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {selectedDetail.violations.map((v) => (
                        <div key={v.id} className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${VIOLATION_COLORS[v.type] || "bg-gray-100 text-gray-700"}`}>
                            {VIOLATION_LABELS[v.type] || v.type}
                          </span>
                          <span className="flex-1 text-sm text-gray-700">{v.detail || "—"}</span>
                          {v.duration && v.duration > 0 && (
                            <span className="text-xs font-bold text-red-600">{v.duration}s</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(v.createdAt).toLocaleTimeString("az-AZ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen image viewer */}
      {fullscreenImg && (
        <div
          onClick={() => setFullscreenImg(null)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 cursor-pointer"
        >
          <img
            src={fullscreenImg}
            alt="Tam ekran"
            className="max-h-[90vh] max-w-[95vw] rounded-lg shadow-2xl"
          />
          <div className="absolute right-6 top-6 rounded-full bg-white/20 px-4 py-2 text-sm text-white">
            Bağlamaq üçün basın
          </div>
        </div>
      )}
    </div>
  );
}
