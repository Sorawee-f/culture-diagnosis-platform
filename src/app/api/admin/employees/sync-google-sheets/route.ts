import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchAll } from "@/lib/fetch-all";
import { env } from "@/lib/env";

type ExistingEmployee = { employee_id: string };

type SheetResponse = {
  ok?: boolean;
  message?: string;
  rows?: Array<Record<string, unknown>>;
  sheetName?: string;
};

function readValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

const normalizedRowSchema = z.object({
  employee_id: z.string().trim().min(1),
  name: z.string(),
  surname: z.string(),
  nickname: z.string(),
  email: z.string(),
  bu: z.string(),
  department: z.string(),
  section: z.string(),
  job_level: z.string(),
  status: z.string(),
});

function normalizeRow(raw: Record<string, unknown>) {
  const employeeId = readValue(raw, [
    "employeeId",
    "employee_id",
    "EmployeeID",
    "Employee Id",
    "รหัสพนักงาน",
  ]);

  const fullName = readValue(raw, ["EmployeeName", "employeeName", "ชื่อ-นามสกุล", "ชื่อพนักงาน"]);
  const name = readValue(raw, ["name", "Name", "ชื่อ"]) || fullName;
  const surname = readValue(raw, ["surname", "Surname", "นามสกุล"]);

  return normalizedRowSchema.safeParse({
    employee_id: employeeId,
    name,
    surname,
    nickname: readValue(raw, ["nickname", "Nickname", "ชื่อเล่น"]),
    email: readValue(raw, ["email", "Email", "EMAIL"]),
    bu: readValue(raw, ["BU", "bu", "BusinessUnit", "Business Unit"]),
    department: readValue(raw, ["department", "Department", "ฝ่าย"]),
    section: readValue(raw, ["section", "Section", "แผนก", "ส่วนงาน"]),
    job_level: readValue(raw, [
      "jobLevel",
      "job_level",
      "JobLevel",
      "Job Level",
      "JobGrade",
      "Job Grade",
      "JobBand",
      "Job Band",
    ]),
    status: (readValue(raw, ["status", "Status", "สถานะ"]) || "active").toLowerCase(),
  });
}

export async function POST() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!env.GOOGLE_SHEETS_WEBHOOK_URL || !env.GOOGLE_SHEETS_SYNC_SECRET) {
    return NextResponse.json(
      { message: "ยังไม่ได้ตั้ง GOOGLE_SHEETS_WEBHOOK_URL / GOOGLE_SHEETS_SYNC_SECRET" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "pull_employee_master",
        secret: env.GOOGLE_SHEETS_SYNC_SECRET,
      }),
      cache: "no-store",
    });

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Google Sheets ตอบกลับไม่ใช่ JSON กรุณาตรวจ Web App deployment");
    }

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Google Sheets ตอบกลับในรูปแบบที่ไม่ถูกต้อง");
    }

    const result = parsed as SheetResponse;
    if (result.ok !== true) {
      throw new Error(result.message || "ดึง Employee Master จาก Google Sheets ไม่สำเร็จ");
    }

    const rawRows = Array.isArray(result.rows) ? result.rows : [];
    if (!rawRows.length) {
      return NextResponse.json(
        { message: `ไม่พบข้อมูลในชีต ${result.sheetName || "Employee_Master"}` },
        { status: 400 },
      );
    }

    const normalized: z.infer<typeof normalizedRowSchema>[] = [];
    for (const rawRow of rawRows) {
      const parsedRow = normalizeRow(rawRow);
      if (parsedRow.success) normalized.push(parsedRow.data);
    }

    if (!normalized.length) {
      return NextResponse.json(
        {
          message:
            "ไม่พบข้อมูลพนักงานที่อ่านได้ กรุณาตรวจ Header โดยอย่างน้อยต้องมี employeeId หรือ EmployeeID",
        },
        { status: 400 },
      );
    }

    const existing = await fetchAll<ExistingEmployee>((from, to) =>
      supabaseAdmin.from("employees").select("employee_id").range(from, to),
    );
    const existingIds = new Set(existing.map((row) => row.employee_id));
    const now = new Date().toISOString();

    const deduplicated = new Map(normalized.map((row) => [row.employee_id, row]));
    const rowsToUpsert = [...deduplicated.values()].map((row) => ({
      employee_id: row.employee_id,
      name: row.name || null,
      surname: row.surname || null,
      nickname: row.nickname || null,
      email: row.email || null,
      bu: row.bu || null,
      department: row.department || null,
      section: row.section || null,
      job_level: row.job_level || null,
      status: row.status || "active",
      updated_at: now,
    }));

    for (let index = 0; index < rowsToUpsert.length; index += 500) {
      const batch = rowsToUpsert.slice(index, index + 500);
      const { error } = await supabaseAdmin
        .from("employees")
        .upsert(batch, { onConflict: "employee_id" });
      if (error) throw new Error(error.message);
    }

    const added = rowsToUpsert.filter((row) => !existingIds.has(row.employee_id)).length;
    const updated = rowsToUpsert.length - added;

    return NextResponse.json({
      ok: true,
      sheetName: result.sheetName || "Employee_Master",
      rowsRead: rawRows.length,
      imported: rowsToUpsert.length,
      skipped: rawRows.length - rowsToUpsert.length,
      added,
      updated,
      syncedAt: now,
    });
  } catch (cause) {
    console.error(cause);
    return NextResponse.json(
      { message: cause instanceof Error ? cause.message : "Sync Employee Master ไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
