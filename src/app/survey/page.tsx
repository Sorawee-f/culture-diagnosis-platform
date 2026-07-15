import { redirect } from "next/navigation";
import { getEmployeeSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SurveyForm } from "@/components/survey-form";
import { BrandHeader } from "@/components/brand-header";

export default async function SurveyPage() {
  const session = await getEmployeeSession();
  if (!session) redirect("/");
  const { data } = await supabaseAdmin.from("participant_completions").select("employee_id").eq("employee_id", session.employeeId).maybeSingle();
  if (data) redirect("/already-submitted");
  return <main className="min-h-screen px-4 py-6 md:px-8 md:py-10"><div className="mx-auto mb-8 max-w-5xl"><BrandHeader eyebrow="CULTURE DIAGNOSIS SURVEY" /></div><SurveyForm employeeName={session.name} /></main>;
}
