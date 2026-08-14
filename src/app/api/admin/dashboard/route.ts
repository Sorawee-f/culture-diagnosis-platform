import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { aggregateResponses, type AggregateResponse } from "@/lib/analytics";
import { fetchAll } from "@/lib/fetch-all";
import { env } from "@/lib/env";
import type { SurveyAnswer } from "@/types";

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

type CompletionRow = {
  employee_id: string;
  submitted_at: string;
};

type ResponseRow = AggregateResponse & {
  id: string;
  employee_id: string | null;
  answers: SurveyAnswer[];
};

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

  const eligibleIds = new Set(employees.map((employee) => employee.employee_id));

  const completions = (
    await fetchAll<CompletionRow>((from, to) =>
      supabaseAdmin
        .from("participant_completions")
        .select("employee_id,submitted_at")
        .eq("survey_version", env.SURVEY_VERSION)
        .eq("survey_type", "scenario")
        .order("submitted_at", { ascending: false })
        .range(from, to),
    )
  ).filter((row) => eligibleIds.has(row.employee_id));

  const responses = await fetchAll<ResponseRow>((from, to) => {
    let query = supabaseAdmin
      .from("survey_responses")
      .select("id,employee_id,survey_type,answers,current_scores,desired_scores,gaps,duration_seconds,bu,department,section,job_level,submitted_at")
      .eq("survey_version", env.SURVEY_VERSION)
      .eq("survey_type", "scenario")
      .order("submitted_at", { ascending: false })
      .range(from, to);
    if (bu) query = query.eq("bu", bu);
    if (department) query = query.eq("department", department);
    return query;
  });

  const aggregate = aggregateResponses(responses, "scenario");
  const completionByEmployee = new Map(completions.map((row) => [row.employee_id, row]));
  const responseByEmployee = new Map(
    responses
      .filter((row) => row.employee_id)
      .map((row) => [row.employee_id as string, row]),
  );

  const participants = employees.map((employee) => {
    const completion = completionByEmployee.get(employee.employee_id);
    const response = responseByEmployee.get(employee.employee_id);
    return {
      ...employee,
      completed: Boolean(completion),
      submitted_at: completion?.submitted_at ?? response?.submitted_at ?? null,
      duration_seconds: response?.duration_seconds ?? null,
      answers: response?.answers ?? null,
      current_scores: response?.current_scores ?? null,
      desired_scores: response?.desired_scores ?? null,
      gaps: response?.gaps ?? null,
    };
  });

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

  const completed = participants.filter((participant) => participant.completed).length;
  const responseRate = employees.length ? Math.round((completed / employees.length) * 1000) / 10 : 0;

  return NextResponse.json({
    surveyVersion: env.SURVEY_VERSION,
    totals: {
      employees: employees.length,
      completed,
      pending: employees.length - completed,
      responseRate,
      averageDurationSeconds: aggregate.averageDurationSeconds,
    },
    filters: { bus, departments },
    aggregate,
    participants,
  });
}
