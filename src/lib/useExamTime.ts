"use client";

import { useEffect, useState } from "react";

interface ExamSchedule {
  examDate: string;
  startTime: string;
  endTime: string;
}

type ExamStatus = "no_schedule" | "not_started" | "active" | "ended";

function getScheduleTimes(s: ExamSchedule) {
  const dateStr = new Date(s.examDate).toISOString().split("T")[0];
  const start = new Date(`${dateStr}T${s.startTime}:00`);
  const end = new Date(`${dateStr}T${s.endTime}:00`);
  // If end is before/equal start, exam crosses midnight — push end to next day
  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1);
  }
  return { start, end };
}

function pickBestSchedule(schedules: ExamSchedule[]): ExamSchedule | null {
  const now = new Date();

  // 1. Active schedule (now is between start and end)
  for (const s of schedules) {
    const { start, end } = getScheduleTimes(s);
    if (now >= start && now <= end) return s;
  }

  // 2. Next upcoming schedule (start is in the future, pick the nearest)
  let nearest: ExamSchedule | null = null;
  let nearestStart = Infinity;
  for (const s of schedules) {
    const { start } = getScheduleTimes(s);
    if (start > now && start.getTime() < nearestStart) {
      nearest = s;
      nearestStart = start.getTime();
    }
  }
  if (nearest) return nearest;

  // 3. No active or upcoming — return the most recently ended
  let latestEnded: ExamSchedule | null = null;
  let latestEnd = -Infinity;
  for (const s of schedules) {
    const { end } = getScheduleTimes(s);
    if (end.getTime() > latestEnd) {
      latestEnded = s;
      latestEnd = end.getTime();
    }
  }
  return latestEnded;
}

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
          if (data) {
            // API now returns array of all schedules
            const schedules: ExamSchedule[] = Array.isArray(data) ? data : [data];
            const best = pickBestSchedule(schedules);
            if (best) setSchedule(best);
          }
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
      const { start, end } = getScheduleTimes(schedule);

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
