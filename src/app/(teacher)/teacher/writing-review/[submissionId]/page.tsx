"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { BAND_CRITERIA } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface InlineComment {
  id?: string;
  startIndex: number;
  endIndex: number;
  originalText: string;
  suggestedText: string;
  comment: string;
}

interface Submission {
  id: string;
  content: string;
  wordCount: number;
  submittedAt: string;
  writingTask: {
    taskType: string;
    prompt: string;
    minWords: number;
    maxWords: number;
  };
  attempt: {
    user: { id: string; name: string; email: string };
    test: { id: string; title: string; type: string };
  };
  review: {
    id: string;
    taskAchievement: number;
    coherenceCohesion: number;
    lexicalResource: number;
    grammaticalRange: number;
    overallBand: number;
    correctedContent: string | null;
    comments: string | null;
    reviewedAt: string;
    teacher: { id: string; name: string; email: string };
    inlineComments: InlineComment[];
  } | null;
}

interface PopupState {
  visible: boolean;
  x: number;
  y: number;
  startIndex: number;
  endIndex: number;
  selectedText: string;
}

function roundToHalf(num: number): number {
  return Math.round(num * 2) / 2;
}

export default function WritingReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;
  const contentRef = useRef<HTMLDivElement>(null);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  // Band scores
  const [taskAchievement, setTaskAchievement] = useState(5);
  const [coherenceCohesion, setCoherenceCohesion] = useState(5);
  const [lexicalResource, setLexicalResource] = useState(5);
  const [grammaticalRange, setGrammaticalRange] = useState(5);

  // Review fields
  const [correctedContent, setCorrectedContent] = useState("");
  const [comments, setComments] = useState("");
  const [inlineComments, setInlineComments] = useState<InlineComment[]>([]);

  // Popup for inline annotation
  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    x: 0,
    y: 0,
    startIndex: 0,
    endIndex: 0,
    selectedText: "",
  });
  const [popupComment, setPopupComment] = useState("");
  const [popupSuggestion, setPopupSuggestion] = useState("");

  // Auto-calculate overall band
  const overallBand = roundToHalf(
    (taskAchievement + coherenceCohesion + lexicalResource + grammaticalRange) /
      4
  );

  const bandSetters: Record<string, (val: number) => void> = {
    taskAchievement: setTaskAchievement,
    coherenceCohesion: setCoherenceCohesion,
    lexicalResource: setLexicalResource,
    grammaticalRange: setGrammaticalRange,
  };

  const bandValues: Record<string, number> = {
    taskAchievement,
    coherenceCohesion,
    lexicalResource,
    grammaticalRange,
  };

  useEffect(() => {
    async function fetchSubmission() {
      try {
        const res = await fetch(`/api/writing-submissions/${submissionId}`);
        if (!res.ok) throw new Error("Təqdimi yükləmək mümkün olmadı");
        const data = await res.json();
        setSubmission(data);

        // If already reviewed, populate fields
        if (data.review) {
          setTaskAchievement(data.review.taskAchievement);
          setCoherenceCohesion(data.review.coherenceCohesion);
          setLexicalResource(data.review.lexicalResource);
          setGrammaticalRange(data.review.grammaticalRange);
          setCorrectedContent(data.review.correctedContent || "");
          setComments(data.review.comments || "");
          setInlineComments(data.review.inlineComments || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    fetchSubmission();
  }, [submissionId]);

  const handleTextSelection = useCallback(() => {
    if (submission?.review) return; // Already reviewed, don't allow new annotations

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentRef.current) return;

    const range = selection.getRangeAt(0);
    const container = contentRef.current;

    // Check that the selection is within our content div
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Calculate character offset within the content
    const preRange = document.createRange();
    preRange.setStart(container, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = preRange.toString().length;
    const endIndex = startIndex + selectedText.length;

    // Get position for popup
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setPopup({
      visible: true,
      x: rect.left - containerRect.left,
      y: rect.bottom - containerRect.top + 4,
      startIndex,
      endIndex,
      selectedText,
    });
    setPopupComment("");
    setPopupSuggestion("");
  }, [submission?.review]);

  function addInlineComment() {
    if (!popupComment.trim()) return;

    const newComment: InlineComment = {
      startIndex: popup.startIndex,
      endIndex: popup.endIndex,
      originalText: popup.selectedText,
      suggestedText: popupSuggestion,
      comment: popupComment,
    };

    setInlineComments((prev) => [...prev, newComment]);
    setPopup((prev) => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  }

  function removeInlineComment(index: number) {
    setInlineComments((prev) => prev.filter((_, i) => i !== index));
  }

  function closePopup() {
    setPopup((prev) => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/writing-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          taskAchievement,
          coherenceCohesion,
          lexicalResource,
          grammaticalRange,
          overallBand,
          correctedContent: correctedContent || null,
          comments: comments || null,
          inlineComments: inlineComments.map((ic) => ({
            startIndex: ic.startIndex,
            endIndex: ic.endIndex,
            originalText: ic.originalText,
            suggestedText: ic.suggestedText || null,
            comment: ic.comment,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Yoxlama göndərilə bilmədi");
      }

      setSuccess("Yoxlama uğurla göndərildi!");
      setTimeout(() => router.push("/teacher/writing-review"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setSubmitting(false);
    }
  }

  // Render content with inline comment highlights
  function renderHighlightedContent(text: string): React.ReactNode {
    if (inlineComments.length === 0) return text;

    // Sort annotations by start index
    const sorted = [...inlineComments].sort(
      (a, b) => a.startIndex - b.startIndex
    );

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((ic, idx) => {
      // Add text before this annotation
      if (ic.startIndex > lastIndex) {
        parts.push(text.slice(lastIndex, ic.startIndex));
      }
      // Add highlighted text
      parts.push(
        <span
          key={idx}
          className="bg-yellow-200 cursor-pointer border-b-2 border-yellow-500"
          title={ic.comment}
        >
          {text.slice(ic.startIndex, ic.endIndex)}
        </span>
      );
      lastIndex = ic.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Yüklənir...</div>
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  if (!submission) return null;

  const isReviewed = !!submission.review;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Writing Yoxlama</h1>
          <p className="text-sm text-muted-foreground">
            {submission.attempt.user.name} &mdash;{" "}
            {submission.attempt.test.title} &mdash;{" "}
            {submission.writingTask.taskType === "TASK1" ? "Task 1" : "Task 2"}
          </p>
        </div>
        <button
          onClick={() => router.push("/teacher/writing-review")}
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

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Panel: Student Writing */}
        <div className="space-y-4">
          {/* Prompt */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              Tapşırıq
            </h3>
            <p className="text-sm">{submission.writingTask.prompt}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Söz sayı: {submission.wordCount} (Min:{" "}
              {submission.writingTask.minWords}, Max:{" "}
              {submission.writingTask.maxWords})
            </p>
            <p className="text-xs text-muted-foreground">
              Tarix: {formatDate(submission.submittedAt)}
            </p>
          </div>

          {/* Student Content */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              Tələbənin Yazısı
              {!isReviewed && (
                <span className="ml-2 font-normal text-primary">
                  (Mətni seçib qeyd əlavə edə bilərsiniz)
                </span>
              )}
            </h3>
            <div
              ref={contentRef}
              onMouseUp={handleTextSelection}
              className="relative whitespace-pre-wrap text-sm leading-relaxed select-text"
            >
              {renderHighlightedContent(submission.content)}

              {/* Inline annotation popup */}
              {popup.visible && (
                <div
                  className="absolute z-50 w-72 rounded-lg border border-border bg-card p-3 shadow-lg"
                  style={{ left: popup.x, top: popup.y }}
                >
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Seçilmiş: &ldquo;{popup.selectedText}&rdquo;
                  </p>
                  <div className="space-y-2">
                    <textarea
                      value={popupComment}
                      onChange={(e) => setPopupComment(e.target.value)}
                      placeholder="Qeyd..."
                      rows={2}
                      className="w-full rounded-md border border-input px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <input
                      type="text"
                      value={popupSuggestion}
                      onChange={(e) => setPopupSuggestion(e.target.value)}
                      placeholder="Təklif olunan düzəliş..."
                      className="w-full rounded-md border border-input px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={closePopup}
                        className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                      >
                        Ləğv et
                      </button>
                      <button
                        type="button"
                        onClick={addInlineComment}
                        className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                      >
                        Əlavə et
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Inline Comments List */}
          {inlineComments.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                Xətti Qeydlər ({inlineComments.length})
              </h3>
              <div className="space-y-3">
                {inlineComments.map((ic, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-border bg-muted/30 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <p className="text-xs">
                          <span className="font-medium text-muted-foreground">
                            Orijinal:
                          </span>{" "}
                          <span className="bg-red-100 px-1 line-through">
                            {ic.originalText}
                          </span>
                        </p>
                        {ic.suggestedText && (
                          <p className="text-xs">
                            <span className="font-medium text-muted-foreground">
                              Təklif:
                            </span>{" "}
                            <span className="bg-green-100 px-1">
                              {ic.suggestedText}
                            </span>
                          </p>
                        )}
                        <p className="text-xs">
                          <span className="font-medium text-muted-foreground">
                            Qeyd:
                          </span>{" "}
                          {ic.comment}
                        </p>
                      </div>
                      {!isReviewed && (
                        <button
                          type="button"
                          onClick={() => removeInlineComment(index)}
                          className="ml-2 text-xs text-destructive hover:underline"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Review Form */}
        <div>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Band Scores */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold">Band Xalları</h3>
              <div className="space-y-3">
                {BAND_CRITERIA.map((criteria) => (
                  <div key={criteria.key}>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">{criteria.label}</label>
                      <span className="text-sm font-semibold">
                        {bandValues[criteria.key].toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={9}
                      step={0.5}
                      value={bandValues[criteria.key]}
                      onChange={(e) =>
                        bandSetters[criteria.key](parseFloat(e.target.value))
                      }
                      disabled={isReviewed}
                      className="w-full accent-primary"
                    />
                  </div>
                ))}
              </div>

              {/* Overall Band */}
              <div className="mt-4 flex items-center justify-between rounded-md bg-primary/10 p-3">
                <span className="text-sm font-semibold">Overall Band</span>
                <span className="text-2xl font-bold text-primary">
                  {overallBand.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Corrected Content */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold">
                Düzəldilmiş Mətn
              </h3>
              <textarea
                value={correctedContent}
                onChange={(e) => setCorrectedContent(e.target.value)}
                rows={8}
                disabled={isReviewed}
                placeholder="Düzəldilmiş mətni bura yapışdırın..."
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            {/* General Comments */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold">Ümumi Rəy</h3>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                disabled={isReviewed}
                placeholder="Ümumi rəyinizi yazın..."
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            {!isReviewed && (
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? "Göndərilir..." : "Yoxlamanı Göndər"}
              </button>
            )}

            {isReviewed && submission.review && (
              <div className="rounded-md bg-green-100 p-3 text-sm text-green-800">
                Bu yazı{" "}
                {formatDate(submission.review.reviewedAt)} tarixində{" "}
                {submission.review.teacher.name} tərəfindən yoxlanılıb.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
