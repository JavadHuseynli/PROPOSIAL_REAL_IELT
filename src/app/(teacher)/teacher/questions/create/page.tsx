"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";

interface Test {
  id: string;
  title: string;
  type: string;
}

interface Option {
  label: string;
  value: string;
}

const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS);

export default function CreateQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTestId = searchParams.get("testId") || "";

  const [tests, setTests] = useState<Test[]>([]);
  const [testId, setTestId] = useState(preselectedTestId);
  const [questionType, setQuestionType] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [order, setOrder] = useState(0);
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState<Option[]>([
    { label: "A", value: "" },
    { label: "B", value: "" },
    { label: "C", value: "" },
    { label: "D", value: "" },
  ]);
  const [matchingJson, setMatchingJson] = useState(
    '[\n  {"left": "", "right": ""}\n]'
  );
  const [noteTemplate, setNoteTemplate] = useState("");
  const [noteAnswers, setNoteAnswers] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  function addOption() {
    const nextLabel = String.fromCharCode(65 + options.length);
    setOptions([...options, { label: nextLabel, value: "" }]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    const relabeled = updated.map((o, i) => ({
      ...o,
      label: String.fromCharCode(65 + i),
    }));
    setOptions(relabeled);
    if (correctAnswer === options[index].label) {
      setCorrectAnswer("");
    }
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = { ...updated[index], value };
    setOptions(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (questionType === "NOTE_COMPLETION") {
      if (!testId || !noteTemplate.trim()) {
        setError("Test və qeyd şablonunu daxil edin");
        return;
      }
      const blankMatches = noteTemplate.match(/\{\{(\d+)\}\}/g);
      if (!blankMatches || blankMatches.length === 0) {
        setError("Şablonda ən azı bir boşluq olmalıdır. {{8}} formatında istifadə edin.");
        return;
      }
      const blankNums = blankMatches.map((m) => m.replace(/[{}]/g, ""));
      const missing = blankNums.filter((n) => !noteAnswers[n]?.trim());
      if (missing.length > 0) {
        setError(`Bu boşluqların cavabını daxil edin: ${missing.join(", ")}`);
        return;
      }
    } else if (!testId || !questionType || !questionText || !correctAnswer) {
      setError("Bütün sahələri doldurun");
      return;
    }

    setSubmitting(true);

    try {
      let optionsData: unknown = null;
      let finalQuestionText = questionText;
      let finalCorrectAnswer = correctAnswer;

      if (questionType === "MULTIPLE_CHOICE") {
        optionsData = options.map((o) => ({
          label: o.label,
          value: o.value,
        }));
      } else if (questionType === "MATCHING") {
        try {
          optionsData = JSON.parse(matchingJson);
        } catch {
          setError("Matching JSON formatı yanlışdır");
          setSubmitting(false);
          return;
        }
      } else if (questionType === "NOTE_COMPLETION") {
        finalQuestionText = noteTemplate;
        finalCorrectAnswer = JSON.stringify(noteAnswers);
        const blankMatches = noteTemplate.match(/\{\{(\d+)\}\}/g) || [];
        optionsData = { blanks: blankMatches.map((m) => m.replace(/[{}]/g, "")) };
      }

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId,
          questionText: finalQuestionText,
          questionType,
          options: optionsData,
          correctAnswer: finalCorrectAnswer,
          order,
          points,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Sual yaradıla bilmədi");
      }

      setSuccess("Sual uğurla yaradıldı!");
      setQuestionText("");
      setCorrectAnswer("");
      setOrder((prev) => prev + 1);
      setOptions([
        { label: "A", value: "" },
        { label: "B", value: "" },
        { label: "C", value: "" },
        { label: "D", value: "" },
      ]);
      setMatchingJson('[\n  {"left": "", "right": ""}\n]');
      setNoteTemplate("");
      setNoteAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Yüklənir...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Yeni Sual Yarat</h1>
        <button
          onClick={() => router.push("/teacher/questions")}
          className="text-sm text-muted-foreground hover:underline"
        >
          Geri qayıt
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-100 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Test Selection */}
        <div>
          <label className="mb-1 block text-sm font-medium">Test</label>
          <select
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">Test seçin</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.type})
              </option>
            ))}
          </select>
        </div>

        {/* Question Type */}
        <div>
          <label className="mb-1 block text-sm font-medium">Sual Növü</label>
          <select
            value={questionType}
            onChange={(e) => {
              setQuestionType(e.target.value);
              setCorrectAnswer("");
            }}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">Sual növü seçin</option>
            {QUESTION_TYPES.map((qt) => (
              <option key={qt} value={qt}>
                {QUESTION_TYPE_LABELS[qt]}
              </option>
            ))}
          </select>
        </div>

        {/* Question Text */}
        <div>
          <label className="mb-1 block text-sm font-medium">Sual Mətni</label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        {/* Dynamic Form Based on Type */}
        {questionType === "MULTIPLE_CHOICE" && (
          <div className="space-y-3">
            <label className="block text-sm font-medium">Variantlar</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-sm font-semibold">{opt.label})</span>
                <input
                  type="text"
                  value={opt.value}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className="flex-1 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={`Variant ${opt.label}`}
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="text-sm text-destructive hover:underline"
                  >
                    Sil
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="text-sm text-primary hover:underline"
            >
              + Variant əlavə et
            </button>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Doğru Cavab
              </label>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Doğru cavabı seçin</option>
                {options.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}) {opt.value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {questionType === "TRUE_FALSE_NG" && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Doğru Cavab
            </label>
            <select
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="">Seçin</option>
              <option value="TRUE">TRUE</option>
              <option value="FALSE">FALSE</option>
              <option value="NOT_GIVEN">NOT GIVEN</option>
            </select>
          </div>
        )}

        {questionType === "YES_NO_NG" && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Doğru Cavab
            </label>
            <select
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="">Seçin</option>
              <option value="YES">YES</option>
              <option value="NO">NO</option>
              <option value="NOT_GIVEN">NOT GIVEN</option>
            </select>
          </div>
        )}

        {(questionType === "FILL_BLANK" ||
          questionType === "SENTENCE_COMPLETION") && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Doğru Cavab
            </label>
            <input
              type="text"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Doğru cavabı daxil edin"
              required
            />
          </div>
        )}

        {questionType === "MATCHING" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Matching Variantları (JSON)
              </label>
              <textarea
                value={matchingJson}
                onChange={(e) => setMatchingJson(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-input px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder='[{"left": "...", "right": "..."}]'
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                JSON formatında: [&#123;&quot;left&quot;: &quot;...&quot;,
                &quot;right&quot;: &quot;...&quot;&#125;, ...]
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Doğru Cavab
              </label>
              <input
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Məsələn: 1-C, 2-A, 3-B"
                required
              />
            </div>
          </div>
        )}

        {questionType === "NOTE_COMPLETION" && (() => {
          const blankMatches = noteTemplate.match(/\{\{(\d+)\}\}/g) || [];
          const blankNumbers = blankMatches.map((m) => m.replace(/[{}]/g, ""));
          return (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Qeyd Şablonu
                </label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Boşluqları {"{{8}}"}, {"{{9}}"} formatında yazın. Başlıqlar üçün **başlıq**, alt başlıqlar üçün ##alt başlıq## istifadə edin.
                </p>
                <textarea
                  value={noteTemplate}
                  onChange={(e) => setNoteTemplate(e.target.value)}
                  rows={10}
                  className="w-full rounded-md border border-input px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={`**Margaret Preston's later life**\n\n##Aboriginal influence##\ninterest in Aboriginal art was inspired by seeing rock engravings\nincorporated {{8}} and colours from Aboriginal art`}
                  required
                />
              </div>
              {blankNumbers.length > 0 && (
                <div className="rounded-md border border-border p-4">
                  <label className="mb-3 block text-sm font-medium">
                    Boşluqların Cavabları
                  </label>
                  <div className="space-y-2">
                    {blankNumbers.map((num) => (
                      <div key={num} className="flex items-center gap-3">
                        <span className="w-8 text-center text-sm font-bold text-primary">{num}</span>
                        <input
                          type="text"
                          value={noteAnswers[num] || ""}
                          onChange={(e) =>
                            setNoteAnswers({ ...noteAnswers, [num]: e.target.value })
                          }
                          placeholder={`${num}-ci boşluğun cavabı`}
                          className="flex-1 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Order & Points */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Sıra</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              min={0}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Xal</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              min={1}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Yaradılır..." : "Sual Yarat"}
        </button>
      </form>
    </div>
  );
}
