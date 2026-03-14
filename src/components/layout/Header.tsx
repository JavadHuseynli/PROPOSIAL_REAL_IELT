"use client";

import { useSession } from "next-auth/react";
import { ROLE_LABELS } from "@/lib/constants";

export function Header({ title }: { title?: string }) {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-lg font-semibold">{title || "IELTS Hazırlıq"}</h1>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {ROLE_LABELS[session?.user?.role || ""] || session?.user?.role}
        </span>
      </div>
    </header>
  );
}
