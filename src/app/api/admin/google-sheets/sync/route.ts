import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchAll } from "@/lib/fetch-all";
import { env } from "@/lib/env";
import { participantStatusRows, responseLongRows, responseWideRows, type ExportParticipant } from "@/lib/export-data";
import type { Scores, SurveyAnswer } from "@/types";

type EmployeeRow = {
  employee_id: string;
  name: string | null;
  surname: string | null;
  nickname: string | null;
  bu: string | null;
  department: string | null;
  section: string | null;
  job_level: string | null;
  status: string;
};

type CompletionRow = { employee_id: string; submitted_at: string };
type ResponseRow = {
  employee_id: string | null;
  answers: SurveyAnswer[];
  current_scores: Scores;
  desired_scores: Scores;
  gaps: Scores;
  duration_seconds: number;
  submitted_at: string;
};

export async function POST() {
  if (!(await getAdminSession())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!env.GOOGLE_SHEETS_WEBHOOK_URL || !env.GOOGLE_SHEETS_SYNC_SECRET) {
    return NextResponse.json({ message: "ยังไม่ได้ตั้งค่า Google Sheets Sync ใน Vercel" }, { status: 400 });
  }

  const employees = await fetchAll<EmployeeRow>((from, to) =>
    supabaseAdmin.from("employees")
      .select("employee_id,name,surname,nickname,bu,department,section,job_level,status")
      .eq("status", "active")
      .order("employee_id")
      .range(from, to),
  );
  const completions = await fetchAll<CompletionRow>((from, to) =>
    supabaseAdmin.from("participant_completions")
      .select("employee_id,submitted_at")
      .eq("survey_version", env.SURVEY_VERSION)
      .eq("survey_type", "scenario")
      .range(from, to),
  );
  const responses = await fetchAll<ResponseRow>((from, to) =>
    supabaseAdmin.from("survey_responses")
      .select("employee_id,answers,current_scores,desired_scores,gaps,duration_seconds,submitted_at")
      .eq("survey_version", env.SURVEY_VERSION)
      .eq("survey_type", "scenario")
      .order("submitted_at", { ascending: false })
      .range(from, to),
  );

  const completionByEmployee = new Map(completions.map((r) => [r.employee_id, r]));
  const responseByEmployee = new Map(responses.filter((r) => r.employee_id).map((r) => [r.employee_id as string, r]));
  const participants: ExportParticipant[] = employees.map((e) => {
    const completion = completionByEmployee.get(e.employee_id);
    const response = responseByEmployee.get(e.employee_id);
    return {
      ...e,
      completed: Boolean(completion),
      submitted_at: completion?.submitted_at ?? response?.submitted_at ?? null,
      duration_seconds: response?.duration_seconds ?? null,
      answers: response?.answers ?? null,
      current_scores: response?.current_scores ?? null,
      desired_scores: response?.desired_scores ?? null,
      gaps: response?.gaps ?? null,
    };
  });

  const payload = {
    secret: env.GOOGLE_SHEETS_SYNC_SECRET,
    surveyVersion: env.SURVEY_VERSION,
    syncedAt: new Date().toISOString(),
    sheets: {
      Participants: participantStatusRows(participants),
      Responses_Long: responseLongRows(participants),
      Responses_Wide: responseWideRows(participants),
    },
  };

  try {
    const response = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Google Sheets HTTP ${response.status}: ${text.slice(0, 220)}`);

    let result: { ok?: boolean; message?: string; participants?: number; responsesLong?: number; responsesWide?: number } | null = null;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(`Google Sheets ตอบกลับไม่ใช่ JSON กรุณาตรวจ Web App URL/สิทธิ์ Deploy: ${text.slice(0, 180)}`);
    }
    if (result.ok !== true) throw new Error(result.message || "Google Sheets sync ไม่สำเร็จ");

    return NextResponse.json({
      message: "Sync ไป Google Sheets สำเร็จ",
      participants: result.participants ?? payload.sheets.Participants.length,
      responses: result.responsesLong ?? payload.sheets.Responses_Long.length,
      responsesWide: result.responsesWide ?? payload.sheets.Responses_Wide.length,
      syncedAt: payload.syncedAt,
    });
  } catch (cause) {
    return NextResponse.json({ message: cause instanceof Error ? cause.message : "Google Sheets sync ไม่สำเร็จ" }, { status: 502 });
  }
}
