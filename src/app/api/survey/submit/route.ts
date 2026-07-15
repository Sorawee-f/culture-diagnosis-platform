import { NextResponse } from "next/server";
import { z } from "zod";
import { getEmployeeSession } from "@/lib/auth";
import { calculateSummary } from "@/lib/scoring";
import { SCENARIOS } from "@/data/scenarios";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { env } from "@/lib/env";

const answerSchema = z.object({ scenarioId: z.string(), currentOptionId: z.string(), desiredOptionId: z.string() });
const schema = z.object({ answers: z.array(answerSchema).length(SCENARIOS.length) });

export async function POST(request: Request) {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ message: "Session หมดอายุ กรุณา Login ใหม่" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "กรุณาตอบแบบประเมินให้ครบทุกข้อ" }, { status: 400 });
  const ids = new Set(parsed.data.answers.map((a) => a.scenarioId));
  if (ids.size !== SCENARIOS.length || SCENARIOS.some((s) => !ids.has(s.id))) return NextResponse.json({ message: "ชุดคำตอบไม่ครบหรือไม่ถูกต้อง" }, { status: 400 });
  let summary;
  try { summary = calculateSummary(parsed.data.answers); } catch { return NextResponse.json({ message: "ตัวเลือกคำตอบไม่ถูกต้อง" }, { status: 400 }); }
  const { data, error } = await supabaseAdmin.rpc("submit_culture_survey", {
    p_employee_id: session.employeeId,
    p_survey_version: env.SURVEY_VERSION,
    p_answers: parsed.data.answers,
    p_current_scores: summary.currentScores,
    p_desired_scores: summary.desiredScores,
    p_gaps: summary.gaps,
    p_current_top: summary.currentTop,
    p_desired_top: summary.desiredTop,
  });
  if (error) {
    if (error.message.includes("ALREADY_SUBMITTED")) return NextResponse.json({ message: "คุณส่งแบบประเมินไปแล้ว" }, { status: 409 });
    console.error(error);
    return NextResponse.json({ message: "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, summary, receipt: data });
}
