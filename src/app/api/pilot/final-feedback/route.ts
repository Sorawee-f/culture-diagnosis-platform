import { NextResponse } from "next/server";
import { z } from "zod";
import { getEmployeeSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { env } from "@/lib/env";
import { getPilotStatus } from "@/lib/pilot-status";

const modeChoice = z.enum(["side_by_side", "sequential", "no_difference"]);
const schema = z.object({
  preferredMode: modeChoice,
  clearerMode: modeChoice,
  completionMode: modeChoice,
  modeReason: z.string().trim().max(1500).optional().default(""),
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
      { message: "กรุณาเลือกคำตอบให้ครบ" },
      { status: 400 },
    );
  }

  const status = await getPilotStatus(session.employeeId);
  const ready = status.order.every((type) => status.completed[type]);
  if (!ready) {
    return NextResponse.json(
      { message: "กรุณาทำแบบสำรวจทั้งสองชุดให้ครบก่อน" },
      { status: 409 },
    );
  }

  const { error } = await supabaseAdmin.from("pilot_final_feedback").upsert(
    {
      employee_id: session.employeeId,
      survey_version: env.SURVEY_VERSION,
      // เก็บค่าเดิมไว้เพื่อรองรับโครงสร้างตาราง v4 โดยไม่นำไปแสดงผล
      preferred_survey: "no_difference",
      survey_reason: null,
      preferred_mode: parsed.data.preferredMode,
      clearer_mode: parsed.data.clearerMode,
      completion_mode: parsed.data.completionMode,
      mode_reason: parsed.data.modeReason || null,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "employee_id,survey_version" },
  );

  if (error) {
    console.error(error);
    return NextResponse.json(
      { message: "บันทึกผลการทดสอบไม่สำเร็จ" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
