import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { aggregateResponses, type AggregateResponse } from "@/lib/analytics";
import { fetchAll } from "@/lib/fetch-all";
import { env } from "@/lib/env";

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
type FilterRow = { bu: string | null; department: string | null };

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const bu = url.searchParams.get("bu") || "";
  const department = url.searchParams.get("department") || "";

  const employees = await fetchAll<EmployeeRow>((from, to) => {
    let query = supabaseAdmin
      .from("employees")
      .select("employee_id,name,surname,nickname,bu,department,section,job_level,status")
      .eq("status", "active")
      .order("employee_id")
      .range(from, to);
    if (bu) query = query.eq("bu", bu);
    if (department) query = query.eq("department", department);
    return query;
  });

  const completions = await fetchAll<CompletionRow>((from, to) =>
    supabaseAdmin
      .from("participant_completions")
      .select("employee_id,submitted_at")
      .order("submitted_at", { ascending: false })
      .range(from, to),
  );

  const completionMap = new Map<string, string>(
    completions.map((completion) => [completion.employee_id, completion.submitted_at]),
  );
  const eligibleIds = new Set(employees.map((employee) => employee.employee_id));
  const completedInScope = completions.filter((completion) => eligibleIds.has(completion.employee_id));

  const responses = await fetchAll<AggregateResponse>((from, to) => {
    let query = supabaseAdmin
      .from("survey_responses")
      .select("current_scores,desired_scores,gaps,bu,department,section,job_level,submitted_at")
      .order("submitted_at")
      .range(from, to);
    if (bu) query = query.eq("bu", bu);
    if (department) query = query.eq("department", department);
    return query;
  });

  const aggregateSuppressed = responses.length > 0 && responses.length < env.MIN_GROUP_SIZE;
  const aggregate = aggregateResponses(aggregateSuppressed ? [] : responses);
  const nonResponders = employees.filter((employee) => !completionMap.has(employee.employee_id));
  const recentCompletions = employees
    .filter((employee) => completionMap.has(employee.employee_id))
    .map((employee) => ({ ...employee, submitted_at: completionMap.get(employee.employee_id) ?? null }))
    .sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)))
    .slice(0, 20);

  const allEmployees = await fetchAll<FilterRow>((from, to) =>
    supabaseAdmin
      .from("employees")
      .select("bu,department")
      .eq("status", "active")
      .range(from, to),
  );

  const bus = [...new Set(allEmployees.map((employee) => employee.bu).filter((value): value is string => Boolean(value)))].sort();
  const departments = [...new Set(
    allEmployees
      .filter((employee) => !bu || employee.bu === bu)
      .map((employee) => employee.department)
      .filter((value): value is string => Boolean(value)),
  )].sort();

  return NextResponse.json({
    totals: {
      employees: employees.length,
      completed: completedInScope.length,
      responseRate: employees.length
        ? Math.round((completedInScope.length / employees.length) * 1000) / 10
        : 0,
    },
    filters: { bus, departments },
    aggregate,
    privacy: { minGroupSize: env.MIN_GROUP_SIZE, aggregateSuppressed },
    nonResponders,
    recentCompletions,
  });
}
