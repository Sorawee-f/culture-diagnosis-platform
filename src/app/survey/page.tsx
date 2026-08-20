import { redirect } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { SurveyExperience } from "@/components/survey-experience";
import { getEmployeeSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { env } from "@/lib/env";

export default async function SurveyPage() {
  const session = await getEmployeeSession();
  if (!session) redirect("/");

  const { data: completion, error } = await supabaseAdmin
    .from("participant_completions")
    .select("employee_id")
    .eq("employee_id", session.employeeId)
    .eq("survey_version", env.SURVEY_VERSION)
    .eq("survey_type", "scenario")
    .maybeSingle();

  if (error) throw error;
  if (completion) redirect("/result");

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto mb-8 max-w-6xl">
        <BrandHeader eyebrow="CULTURE DIAGNOSIS" />
      </div>
      <SurveyExperience
        employeeName={session.name}
        employeeId={session.employeeId}
        surveyVersion={env.SURVEY_VERSION}
      />
    </main>
  );
}
