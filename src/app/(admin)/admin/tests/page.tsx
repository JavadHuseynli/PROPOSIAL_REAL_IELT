"use client";

import { useEffect, useState } from "react";
import { TEST_TYPE_LABELS, QUESTION_TYPE_LABELS } from "@/lib/constants";

interface Question {
  id: string;
  testId: string;
  questionText: string;
  questionType: string;
  options: any;
  correctAnswer: string;
  imageUrl: string | null;
  order: number;
  points: number;
}

interface AudioFile {
  id: string;
  testId: string;
  filePath: string;
  duration: number | null;
  section: number;
  order: number;
}

interface WritingTask {
  id: string;
  testId: string;
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
  isActive: boolean;
  duration: number | null;
  createdAt: string;
  questions?: Question[];
  audioFiles?: AudioFile[];
  writingTasks?: WritingTask[];
  _count?: { questions: number };
}

const TEST_TYPES = ["LISTENING", "READING", "WRITING"] as const;
const QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE_NG",
  "MATCHING",
  "FILL_BLANK",
  "YES_NO_NG",
  "SENTENCE_COMPLETION",
  "NOTE_COMPLETION",
] as const;
const WRITING_TASK_TYPES = ["TASK1", "TASK2"] as const;

const emptyTestForm = {
  title: "",
  type: "LISTENING" as string,
  description: "",
  duration: "",
};

const emptyQuestionForm = {
  questionText: "",
  questionType: "MULTIPLE_CHOICE" as string,
  options: ["", "", "", ""],
  correctAnswer: "",
  matchingPairs: "",
  points: "1",
  noteTemplate: "",
  noteAnswers: {} as Record<string, string>,
  imageUrl: "",
  section: "1",
};

const emptyPassageForm = {
  title: "",
  text: "",
  section: "1",
};

const emptyWritingTaskForm = {
  taskType: "TASK1" as string,
  prompt: "",
  minWords: "150",
  maxWords: "300",
  imageUrl: "",
};

export default function AdminTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Test create/edit modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [testForm, setTestForm] = useState(emptyTestForm);
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testFormError, setTestFormError] = useState("");

  // Manage questions / details panel
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Question modal
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionFormError, setQuestionFormError] = useState("");

  // Reading passage modal
  const [showPassageModal, setShowPassageModal] = useState(false);
  const [passageForm, setPassageForm] = useState(emptyPassageForm);
  const [passageSubmitting, setPassageSubmitting] = useState(false);

  // Active section for adding questions
  const [activeSection, setActiveSection] = useState(1);

  // Writing task modal
  const [showWritingTaskModal, setShowWritingTaskModal] = useState(false);
  const [editingWritingTask, setEditingWritingTask] = useState<WritingTask | null>(null);
  const [writingTaskForm, setWritingTaskForm] = useState(emptyWritingTaskForm);
  const [writingTaskSubmitting, setWritingTaskSubmitting] = useState(false);
  const [writingTaskFormError, setWritingTaskFormError] = useState("");

  // Audio upload
  const [audioUploading, setAudioUploading] = useState(false);

  const fetchTests = async () => {
    try {
      const res = await fetch("/api/tests");
      if (!res.ok) throw new Error("Testləri yükləmək mümkün olmadı");
      const data = await res.json();
      setTests(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchTests().finally(() => setLoading(false));
  }, []);

  const fetchTestDetail = async (testId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/tests/${testId}`);
      if (!res.ok) throw new Error("Test məlumatlarını yükləmək mümkün olmadı");
      const data = await res.json();
      setSelectedTest(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Test CRUD ──

  const openCreateTestModal = () => {
    setEditingTest(null);
    setTestForm(emptyTestForm);
    setTestFormError("");
    setShowTestModal(true);
  };

  const openEditTestModal = (test: Test) => {
    setEditingTest(test);
    setTestForm({
      title: test.title,
      type: test.type,
      description: test.description || "",
      duration: test.duration?.toString() || "",
    });
    setTestFormError("");
    setShowTestModal(true);
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSubmitting(true);
    setTestFormError("");

    const payload = {
      title: testForm.title,
      type: testForm.type,
      description: testForm.description || null,
      duration: testForm.duration ? parseInt(testForm.duration) : null,
    };

    try {
      if (editingTest) {
        const res = await fetch(`/api/tests/${editingTest.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Yeniləmə uğursuz oldu");
        }
      } else {
        const res = await fetch("/api/tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Yaratma uğursuz oldu");
        }
      }

      setShowTestModal(false);
      await fetchTests();
      if (selectedTest && editingTest && selectedTest.id === editingTest.id) {
        await fetchTestDetail(editingTest.id);
      }
    } catch (err: any) {
      setTestFormError(err.message);
    } finally {
      setTestSubmitting(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Bu testi silmək istədiyinizdən əminsiniz?")) return;
    try {
      const res = await fetch(`/api/tests/${testId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silmə uğursuz oldu");
      if (selectedTest?.id === testId) setSelectedTest(null);
      await fetchTests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (test: Test) => {
    try {
      const res = await fetch(`/api/tests/${test.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !test.isActive }),
      });
      if (!res.ok) throw new Error("Status dəyişmə uğursuz oldu");
      await fetchTests();
      if (selectedTest?.id === test.id) {
        await fetchTestDetail(test.id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ── Question CRUD ──

  const openCreateQuestionModal = () => {
    setEditingQuestion(null);
    setQuestionForm({ ...emptyQuestionForm, section: String(activeSection) });
    setQuestionFormError("");
    setShowQuestionModal(true);
  };

  const openEditQuestionModal = (q: Question) => {
    setEditingQuestion(q);
    let options = ["", "", "", ""];
    let matchingPairs = "";
    let noteTemplate = "";
    let noteAnswers: Record<string, string> = {};

    if (q.questionType === "MULTIPLE_CHOICE" && Array.isArray(q.options)) {
      options = q.options.length >= 4 ? q.options : [...q.options, ...Array(4 - q.options.length).fill("")];
    } else if (q.questionType === "MATCHING" && q.options) {
      matchingPairs = typeof q.options === "string" ? q.options : JSON.stringify(q.options, null, 2);
    } else if (q.questionType === "NOTE_COMPLETION") {
      noteTemplate = q.questionText;
      try {
        noteAnswers = JSON.parse(q.correctAnswer);
      } catch {
        noteAnswers = {};
      }
    }

    setQuestionForm({
      questionText: q.questionText,
      questionType: q.questionType,
      options,
      correctAnswer: q.correctAnswer,
      matchingPairs,
      points: q.points.toString(),
      noteTemplate: noteTemplate,
      noteAnswers: noteAnswers,
      imageUrl: q.imageUrl || "",
      section: ((q as any).section || 1).toString(),
    });
    setQuestionFormError("");
    setShowQuestionModal(true);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;
    setQuestionSubmitting(true);
    setQuestionFormError("");

    let options: any = null;
    let questionText = questionForm.questionText;
    let correctAnswer = questionForm.correctAnswer;

    if (questionForm.questionType === "MULTIPLE_CHOICE") {
      options = questionForm.options.filter((o) => o.trim() !== "");
      if (options.length < 2) {
        setQuestionFormError("Ən azı 2 seçim daxil edin");
        setQuestionSubmitting(false);
        return;
      }
    } else if (questionForm.questionType === "MATCHING") {
      try {
        options = JSON.parse(questionForm.matchingPairs);
      } catch {
        setQuestionFormError("Uyğunlaşdırma cütləri düzgün JSON formatında olmalıdır");
        setQuestionSubmitting(false);
        return;
      }
    } else if (questionForm.questionType === "NOTE_COMPLETION") {
      if (!questionForm.noteTemplate.trim()) {
        setQuestionFormError("Qeyd şablonunu daxil edin");
        setQuestionSubmitting(false);
        return;
      }
      // Extract blank numbers from template
      const blankMatches = questionForm.noteTemplate.match(/\{\{(\d+)\}\}/g);
      if (!blankMatches || blankMatches.length === 0) {
        setQuestionFormError("Şablonda ən azı bir boşluq olmalıdır. {{8}} formatında istifadə edin.");
        setQuestionSubmitting(false);
        return;
      }
      const blankNumbers = blankMatches.map((m) => m.replace(/[{}]/g, ""));
      const missingAnswers = blankNumbers.filter((n) => !questionForm.noteAnswers[n]?.trim());
      if (missingAnswers.length > 0) {
        setQuestionFormError(`Bu boşluqların cavabını daxil edin: ${missingAnswers.join(", ")}`);
        setQuestionSubmitting(false);
        return;
      }
      questionText = questionForm.noteTemplate;
      correctAnswer = JSON.stringify(questionForm.noteAnswers);
      options = { blanks: blankNumbers };
    }

    const payload = {
      testId: selectedTest.id,
      questionText,
      questionType: questionForm.questionType,
      options,
      correctAnswer,
      imageUrl: questionForm.imageUrl || null,
      section: parseInt(questionForm.section) || 1,
      points: parseInt(questionForm.points) || 1,
      order: editingQuestion
        ? editingQuestion.order
        : (selectedTest.questions?.length || 0) + 1,
    };

    try {
      if (editingQuestion) {
        const res = await fetch(`/api/questions/${editingQuestion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Yeniləmə uğursuz oldu");
        }
      } else {
        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Yaratma uğursuz oldu");
        }
      }

      setShowQuestionModal(false);
      await fetchTestDetail(selectedTest.id);
      await fetchTests();
    } catch (err: any) {
      setQuestionFormError(err.message);
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedTest) return;
    if (!confirm("Bu sualı silmək istədiyinizdən əminsiniz?")) return;
    try {
      const res = await fetch(`/api/questions/${questionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silmə uğursuz oldu");
      await fetchTestDetail(selectedTest.id);
      await fetchTests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ── Writing Task CRUD ──

  const openCreateWritingTaskModal = () => {
    setEditingWritingTask(null);
    setWritingTaskForm(emptyWritingTaskForm);
    setWritingTaskFormError("");
    setShowWritingTaskModal(true);
  };

  const openEditWritingTaskModal = (task: WritingTask) => {
    setEditingWritingTask(task);
    setWritingTaskForm({
      taskType: task.taskType,
      prompt: task.prompt,
      imageUrl: task.imageUrl || "",
      minWords: task.minWords.toString(),
      maxWords: task.maxWords.toString(),
    });
    setWritingTaskFormError("");
    setShowWritingTaskModal(true);
  };

  const handleWritingTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;
    setWritingTaskSubmitting(true);
    setWritingTaskFormError("");

    const payload = {
      testId: selectedTest.id,
      taskType: writingTaskForm.taskType,
      prompt: writingTaskForm.prompt,
      imageUrl: writingTaskForm.imageUrl || null,
      minWords: parseInt(writingTaskForm.minWords) || 150,
      maxWords: parseInt(writingTaskForm.maxWords) || 300,
    };

    try {
      if (editingWritingTask) {
        const res = await fetch(`/api/writing-tasks/${editingWritingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Yeniləmə uğursuz oldu");
        }
      } else {
        const res = await fetch("/api/writing-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Yaratma uğursuz oldu");
        }
      }

      setShowWritingTaskModal(false);
      setEditingWritingTask(null);
      await fetchTestDetail(selectedTest.id);
    } catch (err: any) {
      setWritingTaskFormError(err.message);
    } finally {
      setWritingTaskSubmitting(false);
    }
  };

  const handleDeleteWritingTask = async (taskId: string) => {
    if (!selectedTest) return;
    if (!confirm("Bu tapşırığı silmək istədiyinizdən əminsiniz?")) return;
    try {
      const res = await fetch(`/api/writing-tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silmə uğursuz oldu");
      await fetchTestDetail(selectedTest.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ── Reading Passage ──

  const [passageError, setPassageError] = useState("");

  const handlePassageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassageError("");
    if (!selectedTest) { setPassageError("Evvelce test secin"); return; }
    if (!passageForm.title.trim()) { setPassageError("Bashliq yazin"); return; }
    if (selectedTest.type === "READING" && !passageForm.text.trim()) { setPassageError("Metn yazin"); return; }
    setPassageSubmitting(true);

    const sectionNum = parseInt(passageForm.section) || 1;

    try {
      // Check if passage placeholder already exists for this section
      const existingPassage = (selectedTest.questions || []).find(
        (q: any) => q.section === sectionNum && q.passageText
      );

      if (existingPassage) {
        // Update existing passage
        const res = await fetch(`/api/questions/${existingPassage.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passageTitle: passageForm.title,
            passageText: passageForm.text,
          }),
        });
        if (!res.ok) throw new Error("Passage yenilene bilmedi");
      } else {
        // Create new passage placeholder
        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId: selectedTest.id,
            questionText: `Reading Passage ${sectionNum}`,
            questionType: "FILL_BLANK",
            correctAnswer: "_",
            section: sectionNum,
            passageTitle: passageForm.title,
            passageText: passageForm.text,
            order: 0,
            points: 0,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Passage elave edilemedi");
        }
      }

      setShowPassageModal(false);
      setPassageForm(emptyPassageForm);
      await fetchTestDetail(selectedTest.id);
    } catch (err: any) {
      setPassageError(err.message);
      alert(err.message);
    } finally {
      setPassageSubmitting(false);
    }
  };

  const getPassages = () => {
    if (!selectedTest?.questions) return [];
    const sections = new Map<number, { title: string; text: string; questions: Question[] }>();

    for (const q of selectedTest.questions) {
      const sec = (q as any).section || 1;
      if (!sections.has(sec)) {
        sections.set(sec, { title: "", text: "", questions: [] });
      }
      const s = sections.get(sec)!;
      if ((q as any).passageTitle) s.title = (q as any).passageTitle;
      if ((q as any).passageText) s.text = (q as any).passageText;
      s.questions.push(q);
    }

    return Array.from(sections.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([num, data]) => ({ num, ...data }));
  };

  // ── Audio Upload ──

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTest || !e.target.files?.length) return;
    setAudioUploading(true);

    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    formData.append("testId", selectedTest.id);
    formData.append("section", "1");

    try {
      const res = await fetch("/api/audio", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Audio yükləmə uğursuz oldu");
      await fetchTestDetail(selectedTest.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAudioUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteAudio = async (audioId: string) => {
    if (!selectedTest) return;
    if (!confirm("Bu audio faylı silmək istədiyinizdən əminsiniz?")) return;
    try {
      const res = await fetch(`/api/audio/${audioId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silmə uğursuz oldu");
      await fetchTestDetail(selectedTest.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ── Question form field rendering ──

  const renderQuestionTypeFields = () => {
    const qType = questionForm.questionType;

    if (qType === "MULTIPLE_CHOICE") {
      return (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Seçimlər
            </label>
            {questionForm.options.map((opt, idx) => (
              <div key={idx} className="mb-2 flex items-center gap-2">
                <span className="w-6 text-sm font-medium text-muted-foreground">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...questionForm.options];
                    newOptions[idx] = e.target.value;
                    setQuestionForm({ ...questionForm, options: newOptions });
                  }}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={`Seçim ${String.fromCharCode(65 + idx)}`}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setQuestionForm({
                  ...questionForm,
                  options: [...questionForm.options, ""],
                })
              }
              className="mt-1 text-xs text-primary hover:underline"
            >
              + Seçim əlavə et
            </button>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Doğru Cavab
            </label>
            <select
              value={questionForm.correctAnswer}
              onChange={(e) =>
                setQuestionForm({ ...questionForm, correctAnswer: e.target.value })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Seçin</option>
              {questionForm.options
                .filter((o) => o.trim() !== "")
                .map((opt, idx) => (
                  <option key={idx} value={opt}>
                    {String.fromCharCode(65 + idx)}. {opt}
                  </option>
                ))}
            </select>
          </div>
        </>
      );
    }

    if (qType === "TRUE_FALSE_NG") {
      return (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Doğru Cavab
          </label>
          <select
            value={questionForm.correctAnswer}
            onChange={(e) =>
              setQuestionForm({ ...questionForm, correctAnswer: e.target.value })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seçin</option>
            <option value="TRUE">TRUE</option>
            <option value="FALSE">FALSE</option>
            <option value="NOT_GIVEN">NOT GIVEN</option>
          </select>
        </div>
      );
    }

    if (qType === "YES_NO_NG") {
      return (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Doğru Cavab
          </label>
          <select
            value={questionForm.correctAnswer}
            onChange={(e) =>
              setQuestionForm({ ...questionForm, correctAnswer: e.target.value })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seçin</option>
            <option value="YES">YES</option>
            <option value="NO">NO</option>
            <option value="NOT_GIVEN">NOT GIVEN</option>
          </select>
        </div>
      );
    }

    if (qType === "MATCHING") {
      return (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Uyğunlaşdırma Cütləri (JSON)
            </label>
            <textarea
              value={questionForm.matchingPairs}
              onChange={(e) =>
                setQuestionForm({ ...questionForm, matchingPairs: e.target.value })
              }
              rows={4}
              placeholder={'[{"left": "A", "right": "1"}, {"left": "B", "right": "2"}]'}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Doğru Cavab
            </label>
            <input
              type="text"
              value={questionForm.correctAnswer}
              onChange={(e) =>
                setQuestionForm({ ...questionForm, correctAnswer: e.target.value })
              }
              placeholder="A-1, B-2, C-3"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </>
      );
    }

    if (qType === "NOTE_COMPLETION") {
      // Extract blanks from template
      const blankMatches = questionForm.noteTemplate.match(/\{\{(\d+)\}\}/g) || [];
      const blankNumbers = blankMatches.map((m) => m.replace(/[{}]/g, ""));

      return (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Qeyd Şablonu
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Boşluqları {"{{8}}"}, {"{{9}}"} formatında yazın. Başlıqlar üçün **başlıq**, alt başlıqlar üçün ##alt başlıq## istifadə edin. Hər sətir yeni bullet point-dir.
            </p>
            <textarea
              value={questionForm.noteTemplate}
              onChange={(e) =>
                setQuestionForm({ ...questionForm, noteTemplate: e.target.value })
              }
              rows={12}
              placeholder={`**Margaret Preston's later life**

##Aboriginal influence##
interest in Aboriginal art was inspired by seeing rock engravings close to her Berowra home
incorporated {{8}} and colours from Aboriginal art in her own work
often referred to Aboriginal sources in the {{9}} she gave her artworks

##1953 exhibition##
very old method of {{10}} was used for some prints
was inspired by {{11}} about Chinese art that she had started collecting in 1915`}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {blankNumbers.length > 0 && (
            <div className="rounded-md border border-border p-4">
              <label className="mb-3 block text-sm font-medium text-foreground">
                Boşluqların Cavabları
              </label>
              <div className="space-y-2">
                {blankNumbers.map((num) => (
                  <div key={num} className="flex items-center gap-3">
                    <span className="w-8 text-center text-sm font-bold text-primary">
                      {num}
                    </span>
                    <input
                      type="text"
                      value={questionForm.noteAnswers[num] || ""}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          noteAnswers: {
                            ...questionForm.noteAnswers,
                            [num]: e.target.value,
                          },
                        })
                      }
                      placeholder={`${num}-ci boşluğun cavabı`}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Təlimat (instruction)
            </label>
            <input
              type="text"
              value={questionForm.questionText === questionForm.noteTemplate ? "" : questionForm.questionText}
              onChange={(e) =>
                setQuestionForm({ ...questionForm, questionText: e.target.value || questionForm.noteTemplate })
              }
              placeholder="Complete the notes below. Choose ONE WORD AND/OR A NUMBER..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </>
      );
    }

    // FILL_BLANK and SENTENCE_COMPLETION
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Doğru Cavab
        </label>
        <input
          type="text"
          value={questionForm.correctAnswer}
          onChange={(e) =>
            setQuestionForm({ ...questionForm, correctAnswer: e.target.value })
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Yüklənir...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        {error}
        <button onClick={() => setError("")} className="ml-3 underline">
          Bağla
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Testlər</h1>
        <button
          onClick={openCreateTestModal}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Yeni Test
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Tests table */}
        <div className={selectedTest ? "xl:col-span-1" : "xl:col-span-3"}>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Başlıq</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Tip</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Suallar</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr
                    key={test.id}
                    className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted/30 ${
                      selectedTest?.id === test.id ? "bg-muted/50" : ""
                    }`}
                    onClick={() => fetchTestDetail(test.id)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{test.title}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {TEST_TYPE_LABELS[test.type] || test.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {test._count?.questions ?? test.questions?.length ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          test.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {test.isActive ? "Aktiv" : "Deaktiv"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleActive(test)}
                          className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          {test.isActive ? "Deaktiv et" : "Aktiv et"}
                        </button>
                        <button
                          onClick={() => openEditTestModal(test)}
                          className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDeleteTest(test.id)}
                          className="rounded-md border border-destructive px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      Hələ test yoxdur
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Test detail panel */}
        {selectedTest && (
          <div className="xl:col-span-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedTest.title}
                  </h2>
                  <div className="mt-1 flex gap-2">
                    <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {TEST_TYPE_LABELS[selectedTest.type]}
                    </span>
                    {selectedTest.duration && (
                      <span className="text-xs text-muted-foreground">
                        {selectedTest.duration} dəqiqə
                      </span>
                    )}
                  </div>
                  {selectedTest.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selectedTest.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Bağla
                </button>
              </div>

              {detailLoading ? (
                <div className="py-8 text-center text-muted-foreground">Yüklənir...</div>
              ) : (
                <>
                  {/* WRITING: Writing tasks section */}
                  {selectedTest.type === "WRITING" && (
                    <div className="mb-6">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">
                          Writing Tapşırıqları
                        </h3>
                        <button
                          onClick={openCreateWritingTaskModal}
                          className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          + Tapşırıq
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(selectedTest.writingTasks || []).map((task) => (
                          <div
                            key={task.id}
                            className="rounded-md border border-border bg-muted/30 p-3"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                {task.taskType}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditWritingTaskModal(task)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Redaktə
                                </button>
                                <button
                                  onClick={() => handleDeleteWritingTask(task.id)}
                                  className="text-xs text-destructive hover:underline"
                                >
                                  Sil
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-foreground">{task.prompt}</p>
                            {task.imageUrl && (
                              <img src={task.imageUrl} alt="" className="mt-2 max-h-32 rounded border border-border" />
                            )}
                            <div className="mt-1 text-xs text-muted-foreground">
                              {task.minWords}–{task.maxWords} söz
                            </div>
                          </div>
                        ))}
                        {(selectedTest.writingTasks || []).length === 0 && (
                          <div className="py-4 text-center text-sm text-muted-foreground">
                            Hələ tapşırıq yoxdur
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reading Passages section */}
                  {selectedTest.type === "READING" && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Reading Passage-lar</h3>
                        <button
                          onClick={() => {
                            const passages = getPassages();
                            setPassageForm({ ...emptyPassageForm, section: String(passages.length + 1) });
                            setShowPassageModal(true);
                          }}
                          className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          + Passage
                        </button>
                      </div>

                      {getPassages().length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          Hele passage elave olunmayib. "+ Passage" basib reading metni elave edin.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {getPassages().map((passage) => (
                            <div key={passage.num} className="rounded-md border border-border">
                              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
                                <div>
                                  <span className="text-xs font-bold text-primary">PASSAGE {passage.num}</span>
                                  {passage.title && <span className="ml-2 text-sm font-medium text-foreground">{passage.title}</span>}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setPassageForm({ title: passage.title, text: passage.text, section: String(passage.num) });
                                      setPassageError("");
                                      setShowPassageModal(true);
                                    }}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    Redakte
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Passage ${passage.num} ve butun suallari silinecek. Eminsiniz?`)) return;
                                      // Delete all questions in this section
                                      for (const q of passage.questions) {
                                        await fetch(`/api/questions/${q.id}`, { method: "DELETE" });
                                      }
                                      if (selectedTest) await fetchTestDetail(selectedTest.id);
                                    }}
                                    className="text-xs text-destructive hover:underline"
                                  >
                                    Sil
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveSection(passage.num);
                                      setQuestionForm({ ...emptyQuestionForm, section: String(passage.num) });
                                      openCreateQuestionModal();
                                    }}
                                    className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                                  >
                                    + Sual
                                  </button>
                                </div>
                              </div>
                              {passage.text && (
                                <div className="max-h-32 overflow-y-auto border-b border-border bg-muted/10 px-4 py-2 text-xs text-muted-foreground">
                                  {passage.text.slice(0, 200)}...
                                </div>
                              )}
                              <div className="p-3">
                                {passage.questions
                                  .filter((q) => q.points > 0)
                                  .sort((a, b) => a.order - b.order)
                                  .map((q, idx) => (
                                    <div key={q.id} className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
                                      <div className="flex-1">
                                        <span className="mr-2 text-xs font-bold text-muted-foreground">{q.order}.</span>
                                        <span className="text-xs text-foreground">{q.questionText.slice(0, 80)}</span>
                                      </div>
                                      <div className="flex gap-1">
                                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                          {QUESTION_TYPE_LABELS[q.questionType] || q.questionType}
                                        </span>
                                        <button
                                          onClick={() => openEditQuestionModal(q)}
                                          className="text-[10px] text-primary hover:underline"
                                        >
                                          Redakte
                                        </button>
                                        <button
                                          onClick={() => handleDeleteQuestion(q.id)}
                                          className="text-[10px] text-destructive hover:underline"
                                        >
                                          Sil
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                {passage.questions.filter((q) => q.points > 0).length === 0 && (
                                  <p className="py-2 text-center text-xs text-muted-foreground">Sual yoxdur</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Listening Parts section */}
                  {selectedTest.type === "LISTENING" && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Listening Part-lar</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const parts = getPassages();
                              setPassageForm({ title: "", text: "", section: String(parts.length + 1) });
                              setPassageError("");
                              setShowPassageModal(true);
                            }}
                            className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            + Part
                          </button>
                        </div>
                      </div>

                      {getPassages().length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          Hele part elave olunmayib. "+ Part" basib listening hissesi elave edin.
                          <br />
                          <span className="text-xs">Her Part ucun: bashliq (mes: Part 1 - Children&apos;s Engineering), audio fayl ve suallar elave edin.</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {getPassages().map((part) => {
                            const audio = (selectedTest.audioFiles || []).find((a) => a.section === part.num);
                            return (
                              <div key={part.num} className="rounded-md border border-border">
                                <div className="flex items-center justify-between border-b border-border bg-purple-50 px-4 py-2">
                                  <div>
                                    <span className="text-xs font-bold text-purple-700">PART {part.num}</span>
                                    {part.title && <span className="ml-2 text-sm font-medium text-foreground">{part.title}</span>}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setPassageForm({ title: part.title, text: part.text, section: String(part.num) });
                                        setPassageError("");
                                        setShowPassageModal(true);
                                      }}
                                      className="text-xs text-primary hover:underline"
                                    >
                                      Redakte
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!confirm(`Part ${part.num} ve butun suallari silinecek. Eminsiniz?`)) return;
                                        for (const q of part.questions) {
                                          await fetch(`/api/questions/${q.id}`, { method: "DELETE" });
                                        }
                                        if (selectedTest) await fetchTestDetail(selectedTest.id);
                                      }}
                                      className="text-xs text-destructive hover:underline"
                                    >
                                      Sil
                                    </button>
                                    <label className="cursor-pointer rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-200">
                                      {audio ? "Audio deyish" : "Audio yukle"}
                                      <input type="file" accept="audio/*" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file || !selectedTest) return;
                                        // Delete old audio for this section
                                        if (audio) {
                                          await fetch(`/api/audio/${audio.id}`, { method: "DELETE" });
                                        }
                                        const fd = new FormData();
                                        fd.append("file", file);
                                        fd.append("testId", selectedTest.id);
                                        fd.append("section", String(part.num));
                                        fd.append("order", String(part.num));
                                        const res = await fetch("/api/upload", { method: "POST", body: fd });
                                        if (res.ok) {
                                          await fetchTestDetail(selectedTest.id);
                                        } else {
                                          const err = await res.json().catch(() => ({ error: "Bilinmeyen xeta" }));
                                          alert("Audio yuklenme xetasi: " + (err.error || res.statusText));
                                        }
                                      }} />
                                    </label>
                                    {audio && (
                                      <button
                                        onClick={async () => {
                                          await fetch(`/api/audio/${audio.id}`, { method: "DELETE" });
                                          if (selectedTest) await fetchTestDetail(selectedTest.id);
                                        }}
                                        className="text-xs text-destructive hover:underline"
                                      >
                                        Audio sil
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setActiveSection(part.num);
                                        setQuestionForm({ ...emptyQuestionForm, section: String(part.num) });
                                        openCreateQuestionModal();
                                      }}
                                      className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                                    >
                                      + Sual
                                    </button>
                                  </div>
                                </div>
                                {/* Audio player */}
                                {audio && (
                                  <div className="border-b border-border bg-purple-50/50 px-4 py-3">
                                    <p className="mb-1 text-[10px] text-purple-600">{audio.filePath.split("/").pop()}</p>
                                    <audio controls className="w-full" preload="metadata">
                                      <source src={audio.filePath} type="audio/mpeg" />
                                    </audio>
                                  </div>
                                )}
                                {!audio && (
                                  <div className="border-b border-border bg-yellow-50 px-4 py-2 text-xs text-yellow-700">
                                    Audio yuklenilmeyib. "Audio yukle" basib fayl elave edin.
                                  </div>
                                )}
                                {/* Part description */}
                                {part.text && (
                                  <div className="max-h-20 overflow-y-auto border-b border-border bg-muted/10 px-4 py-2 text-xs text-muted-foreground">
                                    {part.text.slice(0, 200)}...
                                  </div>
                                )}
                                {/* Questions */}
                                <div className="p-3">
                                  {part.questions
                                    .filter((q) => q.points > 0)
                                    .sort((a, b) => a.order - b.order)
                                    .map((q) => (
                                      <div key={q.id} className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
                                        <div className="flex-1">
                                          <span className="mr-2 text-xs font-bold text-muted-foreground">{q.order}.</span>
                                          <span className="text-xs text-foreground">{q.questionText.slice(0, 80)}</span>
                                        </div>
                                        <div className="flex gap-1">
                                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                            {QUESTION_TYPE_LABELS[q.questionType] || q.questionType}
                                          </span>
                                          <button onClick={() => openEditQuestionModal(q)} className="text-[10px] text-primary hover:underline">Redakte</button>
                                          <button onClick={() => handleDeleteQuestion(q.id)} className="text-[10px] text-destructive hover:underline">Sil</button>
                                        </div>
                                      </div>
                                    ))}
                                  {part.questions.filter((q) => q.points > 0).length === 0 && (
                                    <p className="py-2 text-center text-xs text-muted-foreground">Sual yoxdur</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {editingTest ? "Testi Redaktə Et" : "Yeni Test"}
            </h2>

            {testFormError && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {testFormError}
              </div>
            )}

            <form onSubmit={handleTestSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Başlıq</label>
                <input
                  type="text"
                  required
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Tip</label>
                <select
                  value={testForm.type}
                  onChange={(e) => setTestForm({ ...testForm, type: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TEST_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TEST_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Təsvir
                </label>
                <textarea
                  value={testForm.description}
                  onChange={(e) =>
                    setTestForm({ ...testForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Müddət (dəqiqə)
                </label>
                <input
                  type="number"
                  value={testForm.duration}
                  onChange={(e) =>
                    setTestForm({ ...testForm, duration: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={testSubmitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {testSubmitting ? "Gözləyin..." : editingTest ? "Yenilə" : "Yarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {editingQuestion ? "Sualı Redaktə Et" : "Yeni Sual"}
            </h2>

            {questionFormError && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {questionFormError}
              </div>
            )}

            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Sual Mətni
                </label>
                <textarea
                  required
                  value={questionForm.questionText}
                  onChange={(e) =>
                    setQuestionForm({ ...questionForm, questionText: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Question Image Upload */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Şəkil (istəyə bağlı)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("type", "image");
                    try {
                      const res = await fetch("/api/upload", { method: "POST", body: fd });
                      if (!res.ok) throw new Error();
                      const data = await res.json();
                      setQuestionForm({ ...questionForm, imageUrl: data.url });
                    } catch {
                      setQuestionFormError("Şəkil yüklənə bilmədi");
                    }
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:text-primary"
                />
                {questionForm.imageUrl && (
                  <div className="mt-2">
                    <img src={questionForm.imageUrl} alt="Sual şəkli" className="max-h-40 rounded-md border border-border" />
                    <button
                      type="button"
                      onClick={() => setQuestionForm({ ...questionForm, imageUrl: "" })}
                      className="mt-1 text-xs text-destructive hover:underline"
                    >
                      Şəkili sil
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Sual Tipi
                </label>
                <select
                  value={questionForm.questionType}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      questionType: e.target.value,
                      correctAnswer: "",
                    })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {QUESTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {QUESTION_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              {renderQuestionTypeFields()}

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Bal
                </label>
                <input
                  type="number"
                  min="1"
                  value={questionForm.points}
                  onChange={(e) =>
                    setQuestionForm({ ...questionForm, points: e.target.value })
                  }
                  className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={questionSubmitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {questionSubmitting
                    ? "Gözləyin..."
                    : editingQuestion
                      ? "Yenilə"
                      : "Yarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Writing Task Modal */}
      {showWritingTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {editingWritingTask ? "Writing Tapşırığını Redaktə Et" : "Yeni Writing Tapşırığı"}
            </h2>

            {writingTaskFormError && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {writingTaskFormError}
              </div>
            )}

            <form onSubmit={handleWritingTaskSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Tapşırıq Tipi
                </label>
                <select
                  value={writingTaskForm.taskType}
                  onChange={(e) =>
                    setWritingTaskForm({ ...writingTaskForm, taskType: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {WRITING_TASK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Tapşırıq Mətni
                </label>
                <textarea
                  required
                  value={writingTaskForm.prompt}
                  onChange={(e) =>
                    setWritingTaskForm({ ...writingTaskForm, prompt: e.target.value })
                  }
                  rows={5}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Şəkil (diagram, chart və s.)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("type", "image");
                    try {
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      });
                      if (!res.ok) throw new Error("Yükləmə uğursuz oldu");
                      const data = await res.json();
                      setWritingTaskForm({ ...writingTaskForm, imageUrl: data.url });
                    } catch {
                      setWritingTaskFormError("Şəkil yüklənə bilmədi");
                    }
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:text-primary"
                />
                {writingTaskForm.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={writingTaskForm.imageUrl}
                      alt="Yüklənmiş şəkil"
                      className="max-h-48 rounded-md border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setWritingTaskForm({ ...writingTaskForm, imageUrl: "" })}
                      className="mt-1 text-xs text-destructive hover:underline"
                    >
                      Şəkili sil
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Min Söz
                  </label>
                  <input
                    type="number"
                    value={writingTaskForm.minWords}
                    onChange={(e) =>
                      setWritingTaskForm({ ...writingTaskForm, minWords: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Max Söz
                  </label>
                  <input
                    type="number"
                    value={writingTaskForm.maxWords}
                    onChange={(e) =>
                      setWritingTaskForm({ ...writingTaskForm, maxWords: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWritingTaskModal(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={writingTaskSubmitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {writingTaskSubmitting ? "Gözləyin..." : editingWritingTask ? "Yenilə" : "Yarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reading Passage Modal */}
      {showPassageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {selectedTest?.type === "LISTENING" ? `Listening Part ${passageForm.section}` : `Reading Passage ${passageForm.section}`} Elave Et
            </h2>
            {passageError && (
              <div className="mb-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{passageError}</div>
            )}
            <form onSubmit={handlePassageSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Passage Basligi</label>
                <input
                  type="text" required
                  value={passageForm.title}
                  onChange={(e) => setPassageForm({ ...passageForm, title: e.target.value })}
                  placeholder="Mes: Why we need to protect polar bears"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {selectedTest?.type === "LISTENING" ? "Tesvir (istege bagli)" : "Passage Metni"}
                </label>
                <textarea
                  required={selectedTest?.type !== "LISTENING"}
                  value={passageForm.text}
                  onChange={(e) => setPassageForm({ ...passageForm, text: e.target.value })}
                  rows={selectedTest?.type === "LISTENING" ? 4 : 12}
                  placeholder={selectedTest?.type === "LISTENING" ? "Part tesviri (istege bagli)..." : "Reading passage metnini bura yapishdir..."}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowPassageModal(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                  Legv et
                </button>
                <button type="submit" disabled={passageSubmitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {passageSubmitting ? "Elave edilir..." : "Elave Et"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
