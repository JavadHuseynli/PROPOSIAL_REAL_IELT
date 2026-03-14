"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string };

const navByRole: Record<string, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "İstifadəçilər", href: "/admin/users" },
    { label: "Testlər", href: "/admin/tests" },
    { label: "Nəzarət", href: "/admin/monitoring" },
    { label: "Hesabatlar", href: "/admin/reports" },
  ],
  DEAN: [
    { label: "Dashboard", href: "/dean/dashboard" },
    { label: "Qruplar", href: "/dean/groups" },
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
  const [progress, setProgress] = useState<Progress | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);

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
    const interval = setInterval(fetchProgress, 15000);
    return () => clearInterval(interval);
  }, [role]);

  const handleLogout = () => {
    if (role === "STUDENT" && progress && !progress.allCompleted) {
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
            role === "STUDENT" && progress && !progress.allCompleted
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-destructive hover:bg-destructive/90"
          )}
        >
          {role === "STUDENT" && progress && !progress.allCompleted
            ? "Tapşırıqları bitirin"
            : "Çıxış"}
        </button>
      </div>

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
