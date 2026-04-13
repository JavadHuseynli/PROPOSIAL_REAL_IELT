import { Sidebar } from "@/components/layout/Sidebar";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { ExamGate } from "@/components/test/ExamGate";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-64 flex-1 bg-secondary/30 p-6">
          <ExamGate>{children}</ExamGate>
        </main>
      </div>
    </RoleGuard>
  );
}
