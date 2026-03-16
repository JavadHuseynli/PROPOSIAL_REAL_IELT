"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { countWords } from "@/lib/utils";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  options: string[] | null;
  imageUrl: string | null;
  section: number;
  passageText: string | null;
  passageTitle: string | null;
  order: number;
  points: number;
}

interface AudioFile {
  id: string;
  filePath: string;
  duration: number | null;
  section: number;
  order: number;
}

interface WritingTask {
  id: string;
  taskType: string;
  prompt: string;
  imageUrl: string | null;
  minWords: number;
  maxWords: number;
}

interface Test {
  id: string;
  title: string;
  type: string;
  description: string | null;
  duration: number | null;
  questions: Question[];
  audioFiles: AudioFile[];
  writingTasks: WritingTask[];
}

interface Attempt {
  id: string;
  status: string;
  test: {
    id: string;
    title: string;
    type: string;
    duration: number | null;
  };
}

export default function TestTakingPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const STORAGE_KEY = `ielts-test-${testId}`;

  const [test, setTest] = useState<Test | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-answers`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [writingContent, setWritingContent] = useState<Record<string, string>>(
    () => {
      if (typeof window === "undefined") return {};
      try {
        const saved = localStorage.getItem(`${STORAGE_KEY}-writing`);
        return saved ? JSON.parse(saved) : {};
      } catch { return {}; }
    }
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-timeLeft`);
      return saved ? parseInt(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [examDeadline, setExamDeadline] = useState<Date | null>(null);
  const [examTimeLeft, setExamTimeLeft] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch exam schedule deadline
  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch("/api/exam-schedules/active");
        if (!res.ok) return;
        const schedule = await res.json();
        if (schedule?.examDate && schedule?.endTime) {
          const dateStr = new Date(schedule.examDate).toISOString().split("T")[0];
          const deadline = new Date(`${dateStr}T${schedule.endTime}:00`);
          setExamDeadline(deadline);
        }
      } catch {}
    }
    fetchSchedule();
  }, []);

  // Exam deadline countdown + auto-submit
  useEffect(() => {
    if (!examDeadline) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = examDeadline.getTime() - now.getTime();
      if (diff <= 0) {
        setExamTimeLeft("Vaxt bitdi!");
        clearInterval(interval);
        // Auto submit
        if (attempt && !submitting) {
          handleSubmit();
        }
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setExamTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [examDeadline, attempt, submitting]);

  // Auto-save to localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`${STORAGE_KEY}-answers`, JSON.stringify(answers));
    }
  }, [answers, STORAGE_KEY]);

  useEffect(() => {
    if (Object.keys(writingContent).length > 0) {
      localStorage.setItem(`${STORAGE_KEY}-writing`, JSON.stringify(writingContent));
    }
  }, [writingContent, STORAGE_KEY]);

  useEffect(() => {
    if (timeLeft !== null) {
      localStorage.setItem(`${STORAGE_KEY}-timeLeft`, timeLeft.toString());
    }
  }, [timeLeft, STORAGE_KEY]);

  // Fetch test data
  useEffect(() => {
    async function fetchTest() {
      try {
        const res = await fetch(`/api/tests/${testId}`);
        if (!res.ok) throw new Error("Test tapılmadı");
        const data = await res.json();
        setTest(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Xəta baş verdi");
        setLoading(false);
      }
    }
    fetchTest();
  }, [testId]);

  // Start attempt
  useEffect(() => {
    if (!test) return;

    async function startAttempt() {
      try {
        const res = await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testId: test!.id }),
        });
        if (!res.ok) {
          const data = await res.json();
          if (res.status === 409) {
            setError("Bu testi bugun artiq tamamlamisiniz.");
            setLoading(false);
            return;
          }
          throw new Error(data.error || "Cəhd başladıla bilmədi");
        }
        const data = await res.json();
        setAttempt(data);

        if (test!.duration && timeLeft === null) {
          setTimeLeft(test!.duration * 60);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    startAttempt();
  }, [test]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft !== null]);

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && attempt && !submitting) {
      handleSubmit();
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const setAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);

    try {
      // For writing tests, submit writing content first
      if (test?.type === "WRITING" && test.writingTasks.length > 0) {
        for (const task of test.writingTasks) {
          const content = writingContent[task.id] || "";
          if (content.trim()) {
            await fetch("/api/writing-submissions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                attemptId: attempt.id,
                writingTaskId: task.id,
                content,
                wordCount: countWords(content),
              }),
            });
          }
        }
      }

      // Submit answers and complete attempt
      const answerArray = Object.entries(answers).map(
        ([questionId, userAnswer]) => ({
          questionId,
          userAnswer,
        })
      );

      const res = await fetch(`/api/attempts/${attempt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answerArray,
          status: "COMPLETED",
        }),
      });

      if (!res.ok) throw new Error("Cavablar göndərilmədi");

      // Clear saved data on successful submit
      localStorage.removeItem(`${STORAGE_KEY}-answers`);
      localStorage.removeItem(`${STORAGE_KEY}-writing`);
      localStorage.removeItem(`${STORAGE_KEY}-timeLeft`);

      router.push(`/student/tests/${testId}/result`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Test yüklənir...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!test || !attempt) return null;

  const questions = test.questions;

  return (
    <div className="flex gap-6">
      {/* Sidebar - Question Navigation */}
      <div className="w-48 shrink-0">
        <div className="sticky top-6 space-y-4">
          {/* Exam deadline timer */}
          {examTimeLeft && (
            <div className={`rounded-lg border p-4 text-center ${
              examTimeLeft === "Vaxt bitdi!" ? "border-destructive bg-destructive/10" : "border-orange-300 bg-orange-50"
            }`}>
              <p className="text-xs text-muted-foreground">Imtahan bitmesine</p>
              <p className={`text-xl font-bold ${
                examTimeLeft === "Vaxt bitdi!" ? "text-destructive" : "text-orange-700"
              }`}>
                {examTimeLeft}
              </p>
            </div>
          )}

          {/* Test timer */}
          {timeLeft !== null && (
            <div
              className={`rounded-lg border border-border bg-card p-4 text-center ${
                timeLeft < 300 ? "border-destructive" : ""
              }`}
            >
              <p className="text-xs text-muted-foreground">Test vaxti</p>
              <p
                className={`text-2xl font-bold ${
                  timeLeft < 300 ? "text-destructive" : "text-foreground"
                }`}
              >
                {formatTime(timeLeft)}
              </p>
            </div>
          )}

          {/* Question numbers by Part */}
          {test.type !== "WRITING" && questions.filter(q => q.points > 0).length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Suallar</p>
              {(() => {
                const realQs = questions.filter(q => q.points > 0);
                const parts = new Map<number, typeof realQs>();
                for (const q of realQs) {
                  const sec = q.section || 1;
                  if (!parts.has(sec)) parts.set(sec, []);
                  parts.get(sec)!.push(q);
                }
                return Array.from(parts.entries()).sort((a, b) => a[0] - b[0]).map(([partNum, partQs]) => (
                  <div key={partNum} className="mb-2">
                    <p className="mb-1 text-[10px] font-bold text-purple-600">Part {partNum}</p>
                    <div className="grid grid-cols-5 gap-1">
                      {partQs.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => {
                            const el = document.getElementById(`q-${q.id}`);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          className={`flex h-7 w-7 items-center justify-center rounded text-[10px] font-medium transition-colors ${
                            answers[q.id]
                              ? "bg-green-100 text-green-700"
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {q.order}
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Göndərilir..." : "Testi Bitir"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{test.title}</h1>
          <p className="text-sm text-muted-foreground">
            {test.type === "LISTENING"
              ? "Listening Test"
              : test.type === "READING"
                ? "Reading Test"
                : "Writing Test"}
          </p>
        </div>

        {/* LISTENING: Parts with Audio + Questions */}
        {test.type === "LISTENING" && (() => {
          const sections = new Map<number, Question[]>();
          for (const q of questions) {
            const sec = q.section || 1;
            if (!sections.has(sec)) sections.set(sec, []);
            sections.get(sec)!.push(q);
          }
          const sortedParts = Array.from(sections.entries()).sort((a, b) => a[0] - b[0]);

          return (
            <div className="space-y-6">
              {sortedParts.map(([partNum, partQuestions]) => {
                const audio = test.audioFiles.find((a) => a.section === partNum);
                const partTitle = partQuestions[0]?.passageTitle;
                const realQuestions = partQuestions.filter((q) => q.points > 0);

                return (
                  <div key={partNum} className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="border-b border-border bg-purple-50 px-5 py-3">
                      <h3 className="text-sm font-bold text-purple-700">
                        PART {partNum}
                        {partTitle && <span className="ml-2 font-medium text-foreground">{partTitle}</span>}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Questions {realQuestions[0]?.order}-{realQuestions[realQuestions.length - 1]?.order}
                        </span>
                      </h3>
                    </div>

                    {audio && (
                      <div className="border-b border-border bg-purple-50/30 px-5 py-3">
                        <ListeningAudioPlayer
                          src={audio.filePath.startsWith("/") ? audio.filePath : `/uploads/${audio.filePath}`}
                          partNum={partNum}
                        />
                      </div>
                    )}

                    <div className="space-y-4 p-5">
                      {realQuestions.map((q) => (
                        <QuestionRenderer
                          key={q.id}
                          question={q}
                          index={q.order - 1}
                          answer={answers[q.id] || ""}
                          onAnswer={setAnswer}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* READING: All passages with their questions */}
        {test.type === "READING" && (() => {
          // Group questions by section
          const sections = new Map<number, Question[]>();
          for (const q of questions) {
            const sec = q.section || 1;
            if (!sections.has(sec)) sections.set(sec, []);
            sections.get(sec)!.push(q);
          }
          const sortedSections = Array.from(sections.entries()).sort((a, b) => a[0] - b[0]);

          return (
            <div className="space-y-8">
              {sortedSections.map(([secNum, secQuestions]) => {
                // Find passage text - from first question's passageText or test description for section 1
                const firstQ = secQuestions[0];
                const passageText = firstQ?.passageText || (secNum === 1 ? test.description : null);
                const passageTitle = firstQ?.passageTitle || `Passage ${secNum}`;

                return (
                  <div key={secNum} className="rounded-lg border border-border bg-card overflow-hidden">
                    {/* Passage header */}
                    <div className="border-b border-border bg-muted/30 px-6 py-3">
                      <h3 className="text-sm font-bold text-primary">READING PASSAGE {secNum}</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
                      {/* Passage text - left */}
                      <div className="border-r border-border p-6 lg:max-h-[600px] lg:overflow-y-auto">
                        <h4 className="mb-3 text-lg font-bold text-foreground">{passageTitle}</h4>
                        <div className="prose max-w-none text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                          {passageText || "Metn movcud deyil."}
                        </div>
                      </div>

                      {/* Questions - right */}
                      <div className="p-6 lg:max-h-[600px] lg:overflow-y-auto">
                        <h4 className="mb-4 text-sm font-semibold text-muted-foreground">
                          Questions {secQuestions[0]?.order}-{secQuestions[secQuestions.length - 1]?.order}
                        </h4>
                        <div className="space-y-4">
                          {secQuestions.map((q, idx) => (
                            <QuestionRenderer
                              key={q.id}
                              question={q}
                              index={q.order - 1}
                              answer={answers[q.id] || ""}
                              onAnswer={setAnswer}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* WRITING: Prompt + Text Editor */}
        {test.type === "WRITING" && (
          <div className="space-y-6">
            {test.writingTasks.map((task) => (
              <div key={task.id} className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      {task.taskType === "TASK1" ? "Task 1" : "Task 2"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Min: {task.minWords} - Max: {task.maxWords} söz
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {task.prompt}
                  </p>
                  {task.imageUrl && (
                    <img
                      src={task.imageUrl}
                      alt="Writing task image"
                      className="mt-4 max-w-full rounded-md"
                    />
                  )}
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <textarea
                    value={writingContent[task.id] || ""}
                    onChange={(e) =>
                      setWritingContent((prev) => ({
                        ...prev,
                        [task.id]: e.target.value,
                      }))
                    }
                    placeholder="Cavabınızı buraya yazın..."
                    className="min-h-[300px] w-full resize-y rounded-md border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Söz sayı:{" "}
                      {countWords(writingContent[task.id] || "")}
                    </span>
                    <span>
                      {task.minWords}-{task.maxWords} söz tələb olunur
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Question Renderer Component
function QuestionRenderer({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: Question;
  index: number;
  answer: string;
  onAnswer: (questionId: string, value: string) => void;
}) {
  const options: string[] =
    question.options && Array.isArray(question.options)
      ? question.options
      : typeof question.options === "string"
        ? JSON.parse(question.options)
        : [];

  return (
    <div id={`q-${question.id}`} className="rounded-lg border border-border bg-card p-6">
      <p className="mb-4 text-sm font-medium text-foreground">
        <span className="mr-2 text-primary">Sual {index + 1}.</span>
        {question.questionText}
      </p>

      {question.imageUrl && (
        <div className="mb-4">
          <img
            src={question.imageUrl}
            alt={`Sual ${index + 1} şəkli`}
            className="max-w-full rounded-md border border-border"
          />
        </div>
      )}

      {/* MULTIPLE_CHOICE */}
      {question.questionType === "MULTIPLE_CHOICE" && (
        <div className="space-y-2">
          {options.map((opt, i) => (
            <label
              key={i}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-accent"
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                value={opt}
                checked={answer === opt}
                onChange={() => onAnswer(question.id, opt)}
                className="h-4 w-4 text-primary"
              />
              <span className="text-sm text-foreground">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* TRUE_FALSE_NG */}
      {question.questionType === "TRUE_FALSE_NG" && (
        <div className="space-y-2">
          {["True", "False", "Not Given"].map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-accent"
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                value={opt}
                checked={answer === opt}
                onChange={() => onAnswer(question.id, opt)}
                className="h-4 w-4 text-primary"
              />
              <span className="text-sm text-foreground">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* YES_NO_NG */}
      {question.questionType === "YES_NO_NG" && (
        <div className="space-y-2">
          {["Yes", "No", "Not Given"].map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-accent"
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                value={opt}
                checked={answer === opt}
                onChange={() => onAnswer(question.id, opt)}
                className="h-4 w-4 text-primary"
              />
              <span className="text-sm text-foreground">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* FILL_BLANK */}
      {question.questionType === "FILL_BLANK" && (
        <input
          type="text"
          value={answer}
          onChange={(e) => onAnswer(question.id, e.target.value)}
          placeholder="Cavabınızı yazın..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}

      {/* SENTENCE_COMPLETION */}
      {question.questionType === "SENTENCE_COMPLETION" && (
        <input
          type="text"
          value={answer}
          onChange={(e) => onAnswer(question.id, e.target.value)}
          placeholder="Cümləni tamamlayın..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}

      {/* MATCHING */}
      {question.questionType === "MATCHING" && (
        <select
          value={answer}
          onChange={(e) => onAnswer(question.id, e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Seçin...</option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {/* NOTE_COMPLETION */}
      {question.questionType === "NOTE_COMPLETION" && (
        <NoteCompletionRenderer
          template={question.questionText}
          answer={answer}
          onAnswer={(val) => onAnswer(question.id, val)}
        />
      )}
    </div>
  );
}

// Note Completion Renderer
function NoteCompletionRenderer({
  template,
  answer,
  onAnswer,
}: {
  template: string;
  answer: string;
  onAnswer: (value: string) => void;
}) {
  let blankAnswers: Record<string, string> = {};
  try {
    blankAnswers = answer ? JSON.parse(answer) : {};
  } catch {
    blankAnswers = {};
  }

  const updateBlank = (blankNum: string, value: string) => {
    const updated = { ...blankAnswers, [blankNum]: value };
    onAnswer(JSON.stringify(updated));
  };

  // Parse template into structured lines
  const lines = template.split("\n").filter((l) => l.trim());

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Main heading: **text**
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <h3 key={idx} className="mt-4 text-base font-bold text-foreground">
              {trimmed.slice(2, -2)}
            </h3>
          );
        }

        // Sub heading: ##text##
        if (trimmed.startsWith("##") && trimmed.endsWith("##")) {
          return (
            <h4 key={idx} className="mt-3 text-sm font-bold text-foreground">
              {trimmed.slice(2, -2)}
            </h4>
          );
        }

        // Regular line with possible blanks {{N}}
        const parts = trimmed.split(/(\{\{\d+\}\})/g);

        return (
          <div key={idx} className="flex flex-wrap items-center gap-0 py-1 pl-4 text-sm text-foreground before:mr-2 before:content-['•']">
            <span className="flex flex-wrap items-center gap-1">
              {parts.map((part, pIdx) => {
                const blankMatch = part.match(/^\{\{(\d+)\}\}$/);
                if (blankMatch) {
                  const num = blankMatch[1];
                  return (
                    <span key={pIdx} className="inline-flex items-center gap-1">
                      <span className="text-xs font-bold text-primary">{num}</span>
                      <input
                        type="text"
                        value={blankAnswers[num] || ""}
                        onChange={(e) => updateBlank(num, e.target.value)}
                        className="inline-block w-40 rounded border border-input bg-rose-50 px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="..."
                      />
                    </span>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Navigation Buttons
function QuestionNavButtons({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (idx: number) => void;
}) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => onChange(Math.max(0, current - 1))}
        disabled={current === 0}
        className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
      >
        Əvvəlki
      </button>
      <span className="text-sm text-muted-foreground">
        {current + 1} / {total}
      </span>
      <button
        onClick={() => onChange(Math.min(total - 1, current + 1))}
        disabled={current === total - 1}
        className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
      >
        Növbəti
      </button>
    </div>
  );
}

// Listening Audio Player - max 2 plays, no seek
function ListeningAudioPlayer({ src, partNum }: { src: string; partNum: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playCount, setPlayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [started, setStarted] = useState(false);
  const maxPlays = 2;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setPlayCount((prev) => prev + 1);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const handleStart = () => {
    if (playCount >= maxPlays) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (!started) {
      setStarted(true);
      audio.currentTime = 0;
    }
    audio.play();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const exhausted = playCount >= maxPlays;

  return (
    <div>
      <audio ref={audioRef} src={src} preload="metadata" />

      {exhausted ? (
        <div className="rounded-md bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-600">
          Part {partNum} audio limiti bitdi (2/2 dinleme istifade olundu)
        </div>
      ) : !started ? (
        <button
          onClick={handleStart}
          className="w-full rounded-md bg-purple-600 px-4 py-3 text-sm font-medium text-white hover:bg-purple-700"
        >
          Part {partNum} Audio Bashlat ({maxPlays - playCount} dinleme haqqi)
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {!isPlaying ? (
              <button
                onClick={handleStart}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700"
              >
                &#9654;
              </button>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-400 text-white">
                &#9654;
              </div>
            )}
            <div className="flex-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-purple-100">
                <div className="h-2 rounded-full bg-purple-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Part {partNum}</span>
            <span>{playCount + (isPlaying ? 1 : 0)}/{maxPlays} dinleme</span>
          </div>
        </div>
      )}
    </div>
  );
}
