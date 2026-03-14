export const ROLES = {
  ADMIN: "ADMIN",
  DEAN: "DEAN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  DEAN: "Dekan",
  TEACHER: "Müəllim",
  STUDENT: "Tələbə",
};

export const TEST_TYPE_LABELS: Record<string, string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE_NG: "True / False / Not Given",
  MATCHING: "Matching Headings",
  FILL_BLANK: "Fill in the Blank",
  YES_NO_NG: "Yes / No / Not Given",
  SENTENCE_COMPLETION: "Sentence Completion",
  NOTE_COMPLETION: "Note Completion",
};

export const ATTEMPT_STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "Davam edir",
  COMPLETED: "Tamamlanıb",
  GRADED: "Qiymətləndirilib",
};

export const BAND_CRITERIA = [
  { key: "taskAchievement", label: "Task Achievement" },
  { key: "coherenceCohesion", label: "Coherence & Cohesion" },
  { key: "lexicalResource", label: "Lexical Resource" },
  { key: "grammaticalRange", label: "Grammatical Range & Accuracy" },
] as const;
