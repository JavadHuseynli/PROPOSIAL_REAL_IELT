import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateBandScore(correct: number, total: number): number {
  const percentage = (correct / total) * 100;
  if (percentage >= 95) return 9;
  if (percentage >= 87) return 8.5;
  if (percentage >= 80) return 8;
  if (percentage >= 73) return 7.5;
  if (percentage >= 67) return 7;
  if (percentage >= 60) return 6.5;
  if (percentage >= 53) return 6;
  if (percentage >= 47) return 5.5;
  if (percentage >= 40) return 5;
  if (percentage >= 33) return 4.5;
  if (percentage >= 27) return 4;
  if (percentage >= 20) return 3.5;
  if (percentage >= 13) return 3;
  return 2.5;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("az-AZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}
