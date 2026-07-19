import { env } from "@/lib/env";
import { getPilotOrder, getOrderGroup } from "@/lib/pilot";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { SurveyType } from "@/types";

export type PilotStatus = {
  order: SurveyType[];
  orderGroup: "scenario_first" | "simple_first";
  completed: Record<SurveyType, boolean>;
  modeTestCompleted: boolean;
  nextPath: string;
  pilotCompleted: boolean;
};

export async function getPilotStatus(employeeId: string): Promise<PilotStatus> {
  const [completionResult, modeTestResult] = await Promise.all([
    supabaseAdmin
      .from("participant_completions")
      .select("survey_type")
      .eq("employee_id", employeeId)
      .eq("survey_version", env.SURVEY_VERSION),
    supabaseAdmin
      .from("pilot_final_feedback")
      .select("employee_id")
      .eq("employee_id", employeeId)
      .eq("survey_version", env.SURVEY_VERSION)
      .maybeSingle(),
  ]);

  if (completionResult.error) throw completionResult.error;
  if (modeTestResult.error) throw modeTestResult.error;

  const completionTypes = new Set(
    (completionResult.data ?? []).map((row) => row.survey_type as SurveyType),
  );

  const completed = {
    scenario: completionTypes.has("scenario"),
    simple: completionTypes.has("simple"),
  };
  const order = getPilotOrder(employeeId);
  const bothSurveysCompleted = order.every((type) => completed[type]);
  const modeTestCompleted = Boolean(modeTestResult.data);

  let nextPath = "/pilot/mode-test";
  for (const surveyType of order) {
    if (!completed[surveyType]) {
      nextPath = `/survey/${surveyType}`;
      break;
    }
  }

  if (bothSurveysCompleted) {
    nextPath = modeTestCompleted ? "/completed" : "/pilot/mode-test";
  }

  return {
    order,
    orderGroup: getOrderGroup(employeeId),
    completed,
    modeTestCompleted,
    nextPath,
    pilotCompleted: bothSurveysCompleted && modeTestCompleted,
  };
}
