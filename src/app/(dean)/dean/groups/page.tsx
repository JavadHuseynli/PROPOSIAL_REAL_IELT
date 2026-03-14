"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface GroupSummary {
  id: string;
  name: string;
  teacher: { id: string; name: string; email: string } | null;
  _count: { students: number };
}

interface GroupDetail {
  id: string;
  name: string;
  teacher: { id: string; name: string; email: string } | null;
  students: Student[];
}

interface StudentScores {
  [studentId: string]: {
    listening: number | null;
    reading: number | null;
    writing: number | null;
  };
}

export default function DeanGroupsPage() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [studentScores, setStudentScores] = useState<StudentScores>({});
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch("/api/groups");
        if (!res.ok) throw new Error("Qrupları yükləmək mümkün olmadı");
        const data = await res.json();
        setGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, []);

  async function selectGroup(groupId: string) {
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null);
      return;
    }

    setDetailLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) throw new Error("Qrup məlumatlarını yükləmək mümkün olmadı");
      const data: GroupDetail = await res.json();
      setSelectedGroup(data);

      // Fetch scores for each student
      const scores: StudentScores = {};
      for (const student of data.students) {
        try {
          const attRes = await fetch(`/api/attempts?userId=${student.id}`);
          if (attRes.ok) {
            const attempts = await attRes.json();
            const gradedAttempts = attempts.filter(
              (a: { status: string; score: number | null }) =>
                a.status === "GRADED" && a.score !== null
            );

            const byType: Record<string, number[]> = {};
            for (const att of gradedAttempts) {
              const type = att.test.type as string;
              if (!byType[type]) byType[type] = [];
              byType[type].push(att.score);
            }

            const avg = (arr: number[]) =>
              arr.length > 0
                ? arr.reduce((s, v) => s + v, 0) / arr.length
                : null;

            scores[student.id] = {
              listening: avg(byType["LISTENING"] || []),
              reading: avg(byType["READING"] || []),
              writing: avg(byType["WRITING"] || []),
            };
          }
        } catch {
          scores[student.id] = {
            listening: null,
            reading: null,
            writing: null,
          };
        }
      }
      setStudentScores(scores);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Yüklənir...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  // Group comparison data
  const groupComparison = groups.map((g) => ({
    name: g.name,
    teacher: g.teacher?.name || "—",
    students: g._count.students,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Qruplar</h1>
        <button
          onClick={() => setCompareMode(!compareMode)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            compareMode
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:bg-accent"
          }`}
        >
          {compareMode ? "Siyahı Görünüşü" : "Müqayisə"}
        </button>
      </div>

      {compareMode ? (
        /* Comparison View */
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Qrup
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Müəllim
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Tələbə Sayı
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groupComparison.map((g) => (
                <tr key={g.name} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">{g.name}</td>
                  <td className="px-4 py-3 text-sm">{g.teacher}</td>
                  <td className="px-4 py-3 text-sm">{g.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              Heç bir qrup tapılmadı
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className="rounded-lg border border-border bg-card"
              >
                <button
                  onClick={() => selectGroup(group.id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50"
                >
                  <div>
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Müəllim: {group.teacher?.name || "Təyin edilməyib"}{" "}
                      &mdash; {group._count.students} tələbə
                    </p>
                  </div>
                  <span className="text-muted-foreground">
                    {selectedGroup?.id === group.id ? "▲" : "▼"}
                  </span>
                </button>

                {selectedGroup?.id === group.id && (
                  <div className="border-t border-border">
                    {detailLoading ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        Yüklənir...
                      </div>
                    ) : selectedGroup.students.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        Bu qrupda tələbə yoxdur
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="px-4 py-2 text-left text-xs font-medium">
                              Tələbə
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium">
                              Listening
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium">
                              Reading
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium">
                              Writing
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {selectedGroup.students.map((student) => {
                            const sc = studentScores[student.id];
                            return (
                              <tr
                                key={student.id}
                                className="hover:bg-muted/20"
                              >
                                <td className="px-4 py-2 text-sm">
                                  {student.name}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {sc?.listening !== null && sc?.listening !== undefined
                                    ? sc.listening.toFixed(1)
                                    : "—"}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {sc?.reading !== null && sc?.reading !== undefined
                                    ? sc.reading.toFixed(1)
                                    : "—"}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {sc?.writing !== null && sc?.writing !== undefined
                                    ? sc.writing.toFixed(1)
                                    : "—"}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <Link
                                    href={`/dean/students/${student.id}`}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    Profil
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
