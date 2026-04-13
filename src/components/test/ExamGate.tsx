"use client";

import { useExamTime } from "@/lib/useExamTime";

export function ExamGate({ children }: { children: React.ReactNode }) {
  const { status, timeUntilStart, loaded, schedule } = useExamTime();

  if (!loaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Yuklenir...</p>
      </div>
    );
  }

  // No schedule set - block access
  if (status === "no_schedule") {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
          <div className="mb-4 text-5xl">&#128274;</div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Imtahan planlanmayib</h2>
          <p className="text-sm text-muted-foreground">
            Qrupunuz ucun hele imtahan tarixi teyin olunmayib. Zehmet olmasa muelliminize muraciet edin.
          </p>
        </div>
      </div>
    );
  }

  // Exam not started yet - block
  if (status === "not_started") {
    const dateStr = schedule ? new Date(schedule.examDate).toLocaleDateString("az-AZ", {
      day: "2-digit", month: "long", year: "numeric"
    }) : "";

    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
          <div className="mb-4 text-5xl">&#128338;</div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Imtahan hele baslamayib</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Imtahan {dateStr} tarixinde {schedule?.startTime} - {schedule?.endTime} saatlari arasinda kecirilecek.
          </p>
          <div className="rounded-md bg-primary/10 p-4">
            <p className="text-xs text-muted-foreground">Baslamaya qalan vaxt</p>
            <p className="text-2xl font-bold text-primary">{timeUntilStart}</p>
          </div>
        </div>
      </div>
    );
  }

  // Exam ended - block
  if (status === "ended") {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
          <div className="mb-4 text-5xl">&#9989;</div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Imtahan vaxti bitdi</h2>
          <p className="text-sm text-muted-foreground">
            Imtahan vaxti sona catib. Neticeleriniz avtomatik qeyde alinib.
          </p>
        </div>
      </div>
    );
  }

  // Exam active - allow
  return <>{children}</>;
}
