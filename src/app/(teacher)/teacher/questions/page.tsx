"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QUESTION_TYPE_LABELS, TEST_TYPE_LABELS } from "@/lib/constants";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  order: number;
  points: number;
}

interface Test {
  id: string;
  title: string;
  type: string;
  description: string | null;
  isActive: boolean;
  _count: { questions: number };
  createdBy: { id: string; name: string };
}

export default function TeacherQuestionsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [questionsMap, setQuestionsMap] = useState<Record<string, Question[]>>(
    {}
  );
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTests() {
      try {
        const res = await fetch("/api/tests");
        if (!res.ok) throw new Error("Testləri yükləmək mümkün olmadı");
        const data = await res.json();
        setTests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    fetchTests();
  }, []);

  async function toggleExpand(testId: string) {
    if (expandedTest === testId) {
      setExpandedTest(null);
      return;
    }

    setExpandedTest(testId);

    if (!questionsMap[testId]) {
      try {
        const res = await fetch(`/api/questions?testId=${testId}`);
        if (!res.ok) throw new Error("Sualları yükləmək mümkün olmadı");
        const data = await res.json();
        setQuestionsMap((prev) => ({ ...prev, [testId]: data }));
      } catch {
        setQuestionsMap((prev) => ({ ...prev, [testId]: [] }));
      }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Suallar</h1>
        <Link
          href="/teacher/questions/create"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Yeni Sual
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Heç bir test tapılmadı
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <div
              key={test.id}
              className="rounded-lg border border-border bg-card"
            >
              <button
                onClick={() => toggleExpand(test.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50"
              >
                <div>
                  <h3 className="font-semibold">{test.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {TEST_TYPE_LABELS[test.type] || test.type} &mdash;{" "}
                    {test._count.questions} sual
                  </p>
                </div>
                <span className="text-muted-foreground">
                  {expandedTest === test.id ? "▲" : "▼"}
                </span>
              </button>

              {expandedTest === test.id && (
                <div className="border-t border-border">
                  {!questionsMap[test.id] ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      Yüklənir...
                    </div>
                  ) : questionsMap[test.id].length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      Bu testdə hələ sual yoxdur.{" "}
                      <Link
                        href={`/teacher/questions/create?testId=${test.id}`}
                        className="text-primary underline"
                      >
                        Sual əlavə et
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {questionsMap[test.id].map((q, i) => (
                        <div key={q.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {i + 1}. {q.questionText}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {QUESTION_TYPE_LABELS[q.questionType] ||
                                  q.questionType}{" "}
                                &mdash; {q.points} xal
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t border-border p-3">
                    <Link
                      href={`/teacher/questions/create?testId=${test.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      + Yeni sual əlavə et
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
