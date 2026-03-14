"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Answer {
  id: string;
  userAnswer: string;
  isCorrect: boolean;
  points: number;
  question: {
    id: string;
    questionText: string;
    questionType: string;
    correctAnswer: string;
    order: number;
  };
}

interface WritingReview {
  id: string;
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  overallBand: number;
  correctedContent: string | null;
  comments: string | null;
  reviewedAt: string;
  teacher: {
    name: string;
  };
}

interface WritingSubmission {
  id: string;
  content: string;
  wordCount: number;
  submittedAt: string;
  writingTask: {
    id: string;
    taskType: string;
    prompt: string;
  };
  review: WritingReview | null;
}

interface Attempt {
  id: string;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  status: string;
  test: {
    id: string;
    title: string;
    type: string;
    description: string | null;
  };
  answers: Answer[];
  writingSubmissions?: WritingSubmission[];
}

export default function TestResultPage() {
  const params = useParams();
  const testId = params.testId as string;
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchResult() {
      try {
        // Get all attempts for this test, pick the latest completed one
        const res = await fetch(`/api/attempts?testId=${testId}`);
        if (!res.ok) throw new Error("Nəticə yüklənmədi");
        const attempts: Attempt[] = await res.json();

        const completed = attempts.find(
          (a) => a.status === "COMPLETED" || a.status === "GRADED"
        );

        if (!completed) {
          setError("Tamamlanmış cəhd tapılmadı.");
          setLoading(false);
          return;
        }

        // Fetch full attempt details
        const detailRes = await fetch(`/api/attempts/${completed.id}`);
        if (!detailRes.ok) throw new Error("Nəticə detalları yüklənmədi");
        const data = await detailRes.json();
        setAttempt(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [testId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Yüklənir...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-destructive">{error}</p>
        <Link href="/student/tests" className="text-primary hover:underline">
          Testlərə qayıt
        </Link>
      </div>
    );
  }

  if (!attempt) return null;

  const isWriting = attempt.test.type === "WRITING";
  const isListeningOrReading =
    attempt.test.type === "LISTENING" || attempt.test.type === "READING";

  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const totalCount = attempt.answers.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {attempt.test.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {attempt.completedAt
              ? `Tamamlandı: ${formatDate(attempt.completedAt)}`
              : `Başlandı: ${formatDate(attempt.startedAt)}`}
          </p>
        </div>
        <Link
          href="/student/tests"
          className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Geri
        </Link>
      </div>

      {/* Listening / Reading Results */}
      {isListeningOrReading && (
        <>
          {/* Score Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Band Score</p>
              <p className="mt-1 text-4xl font-bold text-primary">
                {attempt.score !== null ? attempt.score : "-"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Doğru cavablar</p>
              <p className="mt-1 text-4xl font-bold text-green-600">
                {correctCount}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalCount} sualdan
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Yanlış cavablar</p>
              <p className="mt-1 text-4xl font-bold text-destructive">
                {totalCount - correctCount}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalCount} sualdan
              </p>
            </div>
          </div>

          {/* Answer Breakdown */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border p-4">
              <h2 className="text-lg font-semibold text-foreground">
                Cavab Detalları
              </h2>
            </div>
            <div className="divide-y divide-border">
              {attempt.answers
                .sort((a, b) => a.question.order - b.question.order)
                .map((ans, idx) => (
                  <div
                    key={ans.id}
                    className={`flex items-start gap-4 p-4 ${
                      ans.isCorrect ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        ans.isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        {ans.question.questionText}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs">
                        <span>
                          <span className="text-muted-foreground">
                            Sizin cavab:{" "}
                          </span>
                          <span
                            className={
                              ans.isCorrect
                                ? "font-medium text-green-700"
                                : "font-medium text-red-700"
                            }
                          >
                            {ans.userAnswer || "(cavab verilməyib)"}
                          </span>
                        </span>
                        {!ans.isCorrect && (
                          <span>
                            <span className="text-muted-foreground">
                              Doğru cavab:{" "}
                            </span>
                            <span className="font-medium text-green-700">
                              {ans.question.correctAnswer}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Writing Results */}
      {isWriting && (
        <div className="space-y-6">
          {attempt.writingSubmissions &&
          attempt.writingSubmissions.length > 0 ? (
            attempt.writingSubmissions.map((submission) => (
              <div key={submission.id} className="space-y-4">
                {/* Submission Info */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">
                      {submission.writingTask.taskType === "TASK1"
                        ? "Task 1"
                        : "Task 2"}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        submission.review
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {submission.review
                        ? "Yoxlanılıb"
                        : "Yoxlanma gözlənilir"}
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {submission.writingTask.prompt}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Söz sayı: {submission.wordCount} | Göndərilmə:{" "}
                    {formatDate(submission.submittedAt)}
                  </p>
                </div>

                {/* Review Details */}
                {submission.review && (
                  <>
                    {/* Band Scores */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <div className="rounded-lg border border-border bg-card p-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          Task Achievement
                        </p>
                        <p className="mt-1 text-xl font-bold text-primary">
                          {submission.review.taskAchievement}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          Coherence
                        </p>
                        <p className="mt-1 text-xl font-bold text-primary">
                          {submission.review.coherenceCohesion}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          Lexical
                        </p>
                        <p className="mt-1 text-xl font-bold text-primary">
                          {submission.review.lexicalResource}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          Grammar
                        </p>
                        <p className="mt-1 text-xl font-bold text-primary">
                          {submission.review.grammaticalRange}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          Overall Band
                        </p>
                        <p className="mt-1 text-xl font-bold text-primary">
                          {submission.review.overallBand}
                        </p>
                      </div>
                    </div>

                    {/* Teacher Comments */}
                    {submission.review.comments && (
                      <div className="rounded-lg border border-border bg-card p-6">
                        <h4 className="mb-2 text-sm font-semibold text-foreground">
                          Müəllim rəyi
                        </h4>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {submission.review.comments}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {submission.review.teacher.name} -{" "}
                          {formatDate(submission.review.reviewedAt)}
                        </p>
                      </div>
                    )}

                    {/* Corrected Content */}
                    {submission.review.correctedContent && (
                      <div className="rounded-lg border border-border bg-card p-6">
                        <h4 className="mb-2 text-sm font-semibold text-foreground">
                          Düzəliş edilmiş mətn
                        </h4>
                        <div className="rounded-md bg-green-50 p-4 text-sm text-foreground whitespace-pre-wrap">
                          {submission.review.correctedContent}
                        </div>
                      </div>
                    )}

                    {/* Original Submission */}
                    <div className="rounded-lg border border-border bg-card p-6">
                      <h4 className="mb-2 text-sm font-semibold text-foreground">
                        Sizin cavabınız
                      </h4>
                      <div className="rounded-md bg-muted p-4 text-sm text-foreground whitespace-pre-wrap">
                        {submission.content}
                      </div>
                    </div>
                  </>
                )}

                {/* If not yet reviewed, show the submission content */}
                {!submission.review && (
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h4 className="mb-2 text-sm font-semibold text-foreground">
                      Sizin cavabınız
                    </h4>
                    <div className="rounded-md bg-muted p-4 text-sm text-foreground whitespace-pre-wrap">
                      {submission.content}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                Writing göndərişi tapılmadı.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
