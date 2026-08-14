import { redirect } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { ResultView } from "@/components/result-view";
import { getEmployeeSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { env } from "@/lib/env";
import type { SurveySummary } from "@/types";

export default async function ResultPage() {
  const session = await getEmployeeSession();
  if (!session) redirect("/");

  const { data: completion, error: completionError } = await supabaseAdmin
    .from("participant_completions")
    .select("employee_id")
    .eq("employee_id", session.employeeId)
    .eq("survey_version", env.SURVEY_VERSION)
    .eq("survey_type", "scenario")
    .maybeSingle();

  if (completionError) throw completionError;
  if (!completion) redirect("/survey");

  const { data: response, error: responseError } = await supabaseAdmin
    .from("survey_responses")
    .select("current_scores,desired_scores,gaps,current_top,desired_top")
    .eq("employee_id", session.employeeId)
    .eq("survey_version", env.SURVEY_VERSION)
    .eq("survey_type", "scenario")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (responseError) throw responseError;

  const summary = response
    ? ({
        currentScores: response.current_scores,
        desiredScores: response.desired_scores,
        gaps: response.gaps,
        currentTop: response.current_top,
        desiredTop: response.desired_top,
      } as SurveySummary)
    : null;

  return (
    <main className="min-h-screen px-5 py-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <BrandHeader eyebrow="CULTURE DIAGNOSIS" />
        <div className="mt-8">
          <ResultView initialSummary={summary} />
        </div>
      </div>
    </main>
  );
}
