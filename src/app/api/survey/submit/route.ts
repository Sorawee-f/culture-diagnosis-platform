import { NextResponse } from "next/server";
import { z } from "zod";
import { getEmployeeSession } from "@/lib/auth";
import { calculateSummary } from "@/lib/scoring";
import { getSurveyDefinition } from "@/data/surveys";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { env } from "@/lib/env";
import { getOrderGroup } from "@/lib/pilot";
import type { SurveyType } from "@/types";

const answerSchema = z.object({
  questionId: z.string(),
  currentOptionId: z.string(),
  desiredOptionId: z.string(),
});

const schema = z.object({
  surveyType: z.enum(["scenario", "simple"]),
  surveyMode: z.enum(["side_by_side", "sequential"]).default("side_by_side"),
  durationSeconds: z.number().int().min(1).max(14400),
  answers: z.array(answerSchema),
});

export async function POST(request: Request) {
  const session = await getEmployeeSession();
  if (!session) {
    return NextResponse.json(
      { message: "Session หมดอายุ กรุณา Login ใหม่" },
      { status: 401 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "กรุณาตอบแบบประเมินให้ครบทุกข้อ" },
      { status: 400 },
    );
  }

  const surveyType = parsed.data.surveyType as SurveyType;
  const definition = getSurveyDefinition(surveyType);
  if (parsed.data.answers.length !== definition.questions.length) {
    return NextResponse.json(
      { message: "จำนวนคำตอบไม่ครบ" },
      { status: 400 },
    );
  }

  const ids = new Set(parsed.data.answers.map((answer) => answer.questionId));
  if (
    ids.size !== definition.questions.length ||
    definition.questions.some((question) => !ids.has(question.id))
  ) {
    return NextResponse.json(
      { message: "ชุดคำตอบไม่ครบหรือไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  let summary;
  try {
    summary = calculateSummary(parsed.data.answers, surveyType);
  } catch {
    return NextResponse.json(
      { message: "ตัวเลือกคำตอบไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin.rpc("submit_culture_survey", {
    p_employee_id: session.employeeId,
    p_survey_version: env.SURVEY_VERSION,
    p_survey_type: surveyType,
    p_survey_mode: parsed.data.surveyMode,
    p_order_group: getOrderGroup(session.employeeId),
    p_duration_seconds: parsed.data.durationSeconds,
    p_answers: parsed.data.answers,
    p_current_scores: summary.currentScores,
    p_desired_scores: summary.desiredScores,
    p_gaps: summary.gaps,
    p_current_top: summary.currentTop,
    p_desired_top: summary.desiredTop,
  });

  if (error) {
    if (error.message.includes("ALREADY_SUBMITTED")) {
      return NextResponse.json(
        { message: "คุณส่งแบบสำรวจชุดนี้ไปแล้ว" },
        { status: 409 },
      );
    }
    console.error(error);
    return NextResponse.json(
      { message: "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, receipt: data });
}
