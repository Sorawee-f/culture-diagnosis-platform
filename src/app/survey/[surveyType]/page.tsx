import { redirect, notFound } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { SurveyForm } from "@/components/survey-form";
import { getEmployeeSession } from "@/lib/auth";
import { getPilotStatus } from "@/lib/pilot-status";
import type { SurveyType } from "@/types";

export default async function SurveyTypePage({
  params,
}: {
  params: Promise<{ surveyType: string }>;
}) {
  const { surveyType: rawType } = await params;
  if (rawType !== "scenario" && rawType !== "simple") notFound();
  const surveyType = rawType as SurveyType;

  const session = await getEmployeeSession();
  if (!session) redirect("/");
  const status = await getPilotStatus(session.employeeId);

  if (status.completed[surveyType]) redirect("/pilot");
  if (status.nextPath !== `/survey/${surveyType}`) redirect(status.nextPath);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto mb-8 max-w-6xl">
        <BrandHeader eyebrow="CULTURE SURVEY PILOT" />
      </div>
      <SurveyForm employeeName={session.name} surveyType={surveyType} />
    </main>
  );
}
