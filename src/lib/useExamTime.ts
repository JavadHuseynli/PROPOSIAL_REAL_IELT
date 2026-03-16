"use client";

import { useEffect, useState } from "react";

interface ExamSchedule {
  examDate: string;
  startTime: string;
  endTime: string;
}

type ExamStatus = "no_schedule" | "not_started" | "active" | "ended";

export function useExamTime() {
  const [schedule, setSchedule] = useState<ExamSchedule | null>(null);
  const [status, setStatus] = useState<ExamStatus>("no_schedule");
  const [timeUntilStart, setTimeUntilStart] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetch_schedule() {
      try {
        const res = await fetch("/api/exam-schedules/active");
        if (res.ok) {
          const data = await res.json();
          if (data) setSchedule(data);
        }
      } catch {}
      setLoaded(true);
    }
    fetch_schedule();
  }, []);

  useEffect(() => {
    if (!schedule) {
      setStatus("no_schedule");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const dateStr = new Date(schedule.examDate).toISOString().split("T")[0];
      const start = new Date(`${dateStr}T${schedule.startTime}:00`);
      const end = new Date(`${dateStr}T${schedule.endTime}:00`);

      if (now < start) {
        setStatus("not_started");
        const diff = start.getTime() - now.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        if (h > 24) {
          const days = Math.floor(diff / 86400000);
          setTimeUntilStart(`${days} gun ${(h % 24).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
        } else {
          setTimeUntilStart(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
        }
      } else if (now >= start && now <= end) {
        setStatus("active");
        setTimeUntilStart(null);
      } else {
        setStatus("ended");
        setTimeUntilStart(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [schedule]);

  return { schedule, status, timeUntilStart, loaded };
}
