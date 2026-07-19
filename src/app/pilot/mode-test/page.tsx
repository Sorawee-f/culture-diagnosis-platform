import { redirect } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { PilotModeTestForm } from "@/components/pilot-mode-test-form";
import { getEmployeeSession } from "@/lib/auth";
import { getPilotStatus } from "@/lib/pilot-status";

export default async function PilotModeTestPage() {
  const session = await getEmployeeSession();
  if (!session) redirect("/");
  const status = await getPilotStatus(session.employeeId);
  if (status.modeTestCompleted) redirect("/completed");
  if (status.nextPath !== "/pilot/mode-test") redirect(status.nextPath);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto mb-8 max-w-6xl">
        <BrandHeader eyebrow="SURVEY MODE TEST" />
      </div>
      <PilotModeTestForm />
    </main>
  );
}
