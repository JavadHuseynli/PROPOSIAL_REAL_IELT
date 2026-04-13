"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useExamTime } from "@/lib/useExamTime";

type NavItem = { label: string; href: string };

const navByRole: Record<string, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "İstifadəçilər", href: "/admin/users" },
    { label: "Qruplar", href: "/admin/groups" },
    { label: "Testlər", href: "/admin/tests" },
    { label: "Imtahan Tarixi", href: "/admin/exam-schedule" },
    { label: "Nəzarət", href: "/admin/monitoring" },
    { label: "Hesabatlar", href: "/admin/reports" },
  ],
  DEAN: [
    { label: "Dashboard", href: "/dean/dashboard" },
    { label: "Qruplar", href: "/dean/groups" },
    { label: "Hesabatlar", href: "/dean/reports" },
    { label: "Nəzarət", href: "/dean/monitoring" },
  ],
  TEACHER: [
    { label: "Dashboard", href: "/teacher/dashboard" },
    { label: "Qruplarım", href: "/teacher/groups" },
    { label: "Suallar", href: "/teacher/questions" },
    { label: "Writing Yoxlama", href: "/teacher/writing-review" },
  ],
  STUDENT: [
    { label: "Listening", href: "/student/listening" },
    { label: "Reading", href: "/student/reading" },
    { label: "Writing", href: "/student/writing" },
    { label: "Neticelerim", href: "/student/results" },
  ],
};

interface Progress {
  LISTENING: boolean;
  READING: boolean;
  WRITING: boolean;
  allCompleted: boolean;
}

const progressIcons: Record<string, string> = {
  Listening: "LISTENING",
  Reading: "READING",
  Writing: "WRITING",
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "STUDENT";
  const items = navByRole[role] || [];
  const { status: examStatus } = useExamTime();
  const examActive = examStatus === "active";
  const [progress, setProgress] = useState<Progress | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState<string | null>(null);
  const [examEnded, setExamEnded] = useState(false);
  const [examEndCountdown, setExamEndCountdown] = useState(5);

  // Fetch student progress
  useEffect(() => {
    if (role !== "STUDENT") return;

    const fetchProgress = async () => {
      try {
        const res = await fetch("/api/student-progress");
        if (res.ok) setProgress(await res.json());
      } catch {}
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 30000);
    return () => clearInterval(interval);
  }, [role]);

  // Exam deadline check - auto logout when time is up
  useEffect(() => {
    if (role !== "STUDENT") return;

    let deadline: Date | null = null;

    async function fetchSchedule() {
      try {
        const res = await fetch("/api/exam-schedules/active");
        if (!res.ok) return;
        const data = await res.json();
        if (!data) return;
        // API returns array — find the currently active schedule
        const schedules = Array.isArray(data) ? data : [data];
        const now = new Date();
        for (const s of schedules) {
          if (!s.examDate || !s.endTime || !s.startTime) continue;
          const dateStr = new Date(s.examDate).toISOString().split("T")[0];
          const start = new Date(`${dateStr}T${s.startTime}:00`);
          const end = new Date(`${dateStr}T${s.endTime}:00`);
          if (end.getTime() <= start.getTime()) end.setDate(end.getDate() + 1);
          if (now >= start && now <= end) {
            deadline = end;
            return;
          }
        }
      } catch {}
    }

    fetchSchedule();

    const interval = setInterval(() => {
      if (!deadline) return;
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setExamTimeLeft(null);
        setExamEnded(true);
        // Auto submit all in-progress attempts
        fetch("/api/attempts").then(r => r.json()).then(attempts => {
          const inProgress = attempts.filter((a: any) => a.status === "IN_PROGRESS");
          for (const a of inProgress) {
            fetch(`/api/attempts/${a.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answers: [], status: "COMPLETED" }),
            }).catch(() => {});
          }
        }).catch(() => {});
        // Countdown then logout
        let count = 5;
        const countInterval = setInterval(() => {
          count--;
          setExamEndCountdown(count);
          if (count <= 0) {
            clearInterval(countInterval);
            signOut({ callbackUrl: "/login" });
          }
        }, 1000);
        clearInterval(interval);
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setExamTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [role]);

  const handleLogout = () => {
    if (role === "STUDENT" && examActive && progress && !progress.allCompleted) {
      setShowExitWarning(true);
      return;
    }
    signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="text-xl font-bold text-primary">
          IELTS Prep
        </Link>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {items.map((item) => {
          const typeKey = progressIcons[item.label];
          const isCompleted = role === "STUDENT" && progress && typeKey && progress[typeKey as keyof Progress];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span>{item.label}</span>
              {role === "STUDENT" && typeKey && (
                <span className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                  isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? "✓" : ""}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Exam time remaining */}
      {role === "STUDENT" && examTimeLeft && (
        <div className="mx-4 mb-2 rounded-md border border-orange-300 bg-orange-50 p-3 text-center">
          <p className="text-[10px] font-medium text-orange-600">Imtahan bitmesine</p>
          <p className="text-lg font-bold text-orange-700">{examTimeLeft}</p>
        </div>
      )}

      {/* Student progress summary */}
      {role === "STUDENT" && progress && (
        <div className="mx-4 rounded-md border border-border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Tamamlama</p>
          <div className="flex gap-2">
            {(["LISTENING", "READING", "WRITING"] as const).map((t) => (
              <div
                key={t}
                className={cn(
                  "flex-1 rounded py-1 text-center text-[10px] font-medium",
                  progress[t]
                    ? "bg-green-100 text-green-700"
                    : "bg-red-50 text-red-500"
                )}
              >
                {t.charAt(0)}
                {progress[t] ? " ✓" : ""}
              </div>
            ))}
          </div>
          {progress.allCompleted && (
            <p className="mt-2 text-center text-[10px] font-medium text-green-600">
              Bütün tapşırıqlar tamamlandı!
            </p>
          )}
        </div>
      )}

      <div className="absolute bottom-0 w-full border-t border-border p-4">
        <div className="mb-1 text-sm font-medium text-foreground">
          {session?.user?.name}
        </div>
        {(() => {
          const u = session?.user as unknown as { groupName?: string } | undefined;
          return u?.groupName ? (
            <div className="mb-2 text-xs text-muted-foreground">{u.groupName}</div>
          ) : null;
        })()}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full rounded-md px-3 py-2 text-sm text-destructive-foreground",
            role === "STUDENT" && examActive && progress && !progress.allCompleted
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-destructive hover:bg-destructive/90"
          )}
        >
          {role === "STUDENT" && examActive && progress && !progress.allCompleted
            ? "Tapşırıqları bitirin"
            : "Çıxış"}
        </button>
      </div>

      {/* Exam ended - auto logout overlay */}
      {examEnded && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80">
          <div className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow-2xl">
            <div className="mb-4 text-5xl">&#9200;</div>
            <h2 className="mb-2 text-xl font-bold text-red-700">Imtahan Vaxti Bitdi!</h2>
            <p className="mb-2 text-sm text-gray-600">
              Butun cavablariniz avtomatik gonderildi.
            </p>
            <p className="text-lg font-bold text-gray-800">
              {examEndCountdown} saniyeye cixish edilecek...
            </p>
            <div className="mt-4 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-red-500 transition-all duration-1000"
                style={{ width: `${((5 - examEndCountdown) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Exit warning modal */}
      {showExitWarning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-2xl">
            <div className="mb-3 text-4xl">🚫</div>
            <h2 className="mb-2 text-lg font-bold text-gray-900">Çıxış mümkün deyil!</h2>
            <p className="mb-1 text-sm text-gray-600">
              Bütün tapşırıqları tamamlamadan sistemdən çıxa bilməzsiniz.
            </p>
            <div className="my-4 space-y-2 text-left">
              {progress && (
                <>
                  <div className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${progress.LISTENING ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {progress.LISTENING ? "✓" : "✗"} Listening
                  </div>
                  <div className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${progress.READING ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {progress.READING ? "✓" : "✗"} Reading
                  </div>
                  <div className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${progress.WRITING ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {progress.WRITING ? "✓" : "✗"} Writing
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setShowExitWarning(false)}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Davam et
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
