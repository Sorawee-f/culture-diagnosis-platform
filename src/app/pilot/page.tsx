import { redirect } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { PilotHub } from "@/components/pilot-hub";
import { getEmployeeSession } from "@/lib/auth";
import { getPilotStatus } from "@/lib/pilot-status";

export default async function PilotPage() {
  const session = await getEmployeeSession();
  if (!session) redirect("/");
  const status = await getPilotStatus(session.employeeId);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto mb-8 max-w-5xl">
        <BrandHeader eyebrow="CULTURE SURVEY PILOT" />
      </div>
      <PilotHub employeeName={session.name} status={status} />
    </main>
  );
}
