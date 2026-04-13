"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROLE_LABELS, TEST_TYPE_LABELS } from "@/lib/constants";

interface User {
  id: string;
  role: string;
}

interface Group {
  id: string;
  name: string;
  _count: { students: number };
}

interface Test {
  id: string;
  type: string;
  isActive: boolean;
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, groupsRes, testsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/groups"),
          fetch("/api/tests"),
        ]);

        if (!usersRes.ok || !groupsRes.ok || !testsRes.ok) {
          throw new Error("Məlumatları yükləmək mümkün olmadı");
        }

        const [usersData, groupsData, testsData] = await Promise.all([
          usersRes.json(),
          groupsRes.json(),
          testsRes.json(),
        ]);

        setUsers(usersData);
        setGroups(groupsData);
        setTests(testsData);
      } catch (err: any) {
        setError(err.message || "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
      </div>
    );
  }

  const usersByRole = Object.keys(ROLE_LABELS).map((role) => ({
    role,
    label: ROLE_LABELS[role],
    count: users.filter((u) => u.role === role).length,
  }));

  const testsByType = Object.keys(TEST_TYPE_LABELS).map((type) => ({
    type,
    label: TEST_TYPE_LABELS[type],
    count: tests.filter((t) => t.type === type).length,
  }));

  const totalStudents = groups.reduce((sum, g) => sum + g._count.students, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Summary row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Ümumi İstifadəçilər" value={users.length} accent="bg-primary" />
        <SummaryCard title="Ümumi Qruplar" value={groups.length} accent="bg-emerald-600" />
        <SummaryCard title="Ümumi Testlər" value={tests.length} accent="bg-amber-600" />
        <SummaryCard title="Qruplardakı Tələbələr" value={totalStudents} accent="bg-violet-600" />
      </div>

      {/* Users by role */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Rola Görə İstifadəçilər</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {usersByRole.map((item) => (
            <div key={item.role} className="rounded-lg border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className="mt-1 text-2xl font-bold text-foreground">{item.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tests by type */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Tipə Görə Testlər</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {testsByType.map((item) => (
            <div key={item.type} className="rounded-lg border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className="mt-1 text-2xl font-bold text-foreground">{item.count}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                Aktiv: {tests.filter((t) => t.type === item.type && t.isActive).length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Sürətli Başlanğıc</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickStartCard
            step={1}
            title="İstifadəçilər Yaradın"
            description="Müəllim, tələbə, kafedra müdiri hesabları yaradın. Excel ilə toplu import da mümkündür."
            href="/admin/users"
            buttonText="İstifadəçilər"
            done={users.length > 1}
          />
          <QuickStartCard
            step={2}
            title="Qrup Yaradın"
            description="Tələbələri qruplara bölün və hər qrupa müəllim təyin edin."
            href="/admin/groups"
            buttonText="Qruplar"
            done={groups.length > 0}
          />
          <QuickStartCard
            step={3}
            title="Test / Sual Əlavə Edin"
            description="Listening, Reading, Writing testləri yaradın. Hər testə suallar, audio fayllar və şəkillər əlavə edin."
            href="/admin/tests"
            buttonText="Testlər"
            done={tests.length > 0}
          />
          <QuickStartCard
            step={4}
            title="İmtahan Planı"
            description="Qrup üçün imtahan tarixi və vaxtı təyin edin. Tələbələr yalnız bu vaxtda daxil ola bilərlər."
            href="/admin/exam-schedule"
            buttonText="İmtahan Tarixi"
          />
        </div>

        {/* How to add questions - detailed guide */}
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-5">
          <h3 className="mb-3 font-semibold text-blue-900">Sual Əlavə Etmə Təlimatı</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>1.</strong> <Link href="/admin/tests" className="underline">Testlər</Link> səhifəsinə gedin</p>
            <p><strong>2.</strong> &quot;Yeni Test&quot; düyməsinə basın &rarr; Test adı, tipi (Listening/Reading/Writing) və müddəti daxil edin</p>
            <p><strong>3.</strong> Yaradılan testin yanında &quot;Suallar&quot; düyməsinə basın</p>
            <p><strong>4.</strong> &quot;Sual Əlavə Et&quot; düyməsinə basın:</p>
            <ul className="ml-6 list-disc space-y-1">
              <li><strong>Sual tipi</strong> seçin: Multiple Choice, True/False/NG, Fill Blank, Matching, Note Completion və s.</li>
              <li><strong>Sual mətni</strong> yazın</li>
              <li><strong>Düzgün cavab</strong> daxil edin</li>
              <li><strong>Şəkil</strong> əlavə edin (xəritə, qrafik və s. üçün) &mdash; &quot;Şəkil yüklə&quot; düyməsi ilə</li>
              <li><strong>Bölmə (Section)</strong> nömrəsi təyin edin (Part 1=1, Part 2=2 və s.)</li>
            </ul>
            <p><strong>5.</strong> <strong>Listening</strong> testləri üçün: &quot;Audio Əlavə Et&quot; ilə hər Part üçün MP3 fayl yükləyin</p>
            <p><strong>6.</strong> <strong>Reading</strong> testləri üçün: İlk sualda &quot;Passage mətni&quot; sahəsinə mətni yapışdırın</p>
            <p><strong>7.</strong> <strong>Writing</strong> testləri üçün: &quot;Writing Task&quot; bölməsindən Task 1 və Task 2 tapşırıqlarını əlavə edin</p>
          </div>
        </div>
      </div>

      {/* Groups overview */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Qruplar</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Qrup Adı</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Tələbə Sayı</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{group.name}</td>
                  <td className="px-4 py-3 text-foreground">{group._count.students}</td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                    Hələ qrup yoxdur
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QuickStartCard({
  step,
  title,
  description,
  href,
  buttonText,
  done,
}: {
  step: number;
  title: string;
  description: string;
  href: string;
  buttonText: string;
  done?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-5 ${done ? "border-green-200 bg-green-50" : "border-border bg-card"}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${done ? "bg-green-500" : "bg-primary"}`}>
          {done ? "\u2713" : step}
        </span>
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="inline-block rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
      >
        {buttonText} &rarr;
      </Link>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${accent}`} />
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
    </div>
  );
}
