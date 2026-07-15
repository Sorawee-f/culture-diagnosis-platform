import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { setEmployeeSession } from "@/lib/auth";

const schema = z.object({ employeeId: z.string().trim().min(1).max(30), password: z.string().trim().min(1).max(30) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "กรุณากรอกรหัสพนักงานให้ถูกต้อง" }, { status: 400 });
  const { employeeId, password } = parsed.data;
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;
  const validPassword = password === employeeId;
  const { data: employee } = await supabaseAdmin.from("employees").select("employee_id,name,surname,status").eq("employee_id", employeeId).eq("status", "active").maybeSingle();
  const success = Boolean(validPassword && employee);
  await supabaseAdmin.from("login_events").insert({ actor_type: "employee", employee_id: employee?.employee_id ?? null, success, user_agent: userAgent });
  if (!success || !employee) return NextResponse.json({ message: "ไม่พบข้อมูลพนักงาน หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  await setEmployeeSession({ role: "employee", employeeId: employee.employee_id, name: [employee.name, employee.surname].filter(Boolean).join(" ") || employee.employee_id });
  const { data: completion } = await supabaseAdmin.from("participant_completions").select("employee_id").eq("employee_id", employee.employee_id).maybeSingle();
  return NextResponse.json({ ok: true, alreadySubmitted: Boolean(completion) });
}
