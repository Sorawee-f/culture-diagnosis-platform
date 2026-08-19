import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchAll } from "@/lib/fetch-all";
import { env } from "@/lib/env";

type EmployeeRow = {
  employee_id: string;
  bu: string | null;
  department: string | null;
  updated_at: string | null;
};

type CompletionRow = {
  employee_id: string;
};

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const employees = await fetchAll<EmployeeRow>((from, to) =>
      supabaseAdmin
        .from("employees")
        .select("employee_id,bu,department,updated_at")
        .eq("status", "active")
        .order("employee_id")
        .range(from, to),
    );

    const activeIds = new Set(employees.map((row) => row.employee_id));
    const completions = (
      await fetchAll<CompletionRow>((from, to) =>
        supabaseAdmin
          .from("participant_completions")
          .select("employee_id")
          .eq("survey_version", env.SURVEY_VERSION)
          .eq("survey_type", "scenario")
          .range(from, to),
      )
    ).filter((row) => activeIds.has(row.employee_id));

    const completedIds = new Set(completions.map((row) => row.employee_id));
    const grouped = new Map<
      string,
      { bu: string; department: string; eligible: number; completed: number }
    >();

    for (const employee of employees) {
      const bu = employee.bu?.trim() || "-";
      const department = employee.department?.trim() || "ไม่ระบุฝ่าย";
      const key = `${bu}\u0000${department}`;
      const current = grouped.get(key) ?? { bu, department, eligible: 0, completed: 0 };
      current.eligible += 1;
      if (completedIds.has(employee.employee_id)) current.completed += 1;
      grouped.set(key, current);
    }

    const departmentProgress = [...grouped.values()]
      .map((row) => ({
        ...row,
        pending: row.eligible - row.completed,
        responseRate: row.eligible
          ? Math.round((row.completed / row.eligible) * 1000) / 10
          : 0,
      }))
      .sort((a, b) => a.responseRate - b.responseRate || b.eligible - a.eligible);

    const lastMasterUpdate = employees.reduce<string | null>((latest, row) => {
      if (!row.updated_at) return latest;
      if (!latest || row.updated_at > latest) return row.updated_at;
      return latest;
    }, null);

    return NextResponse.json({
      employeeMaster: {
        activeEmployees: employees.length,
        lastUpdatedAt: lastMasterUpdate,
      },
      departmentProgress,
    });
  } catch (cause) {
    console.error(cause);
    return NextResponse.json(
      { message: cause instanceof Error ? cause.message : "โหลดข้อมูล Operations ไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
