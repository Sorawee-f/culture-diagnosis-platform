import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  aggregateResponses,
  compareAggregates,
  type AggregateResponse,
} from "@/lib/analytics";
import { fetchAll } from "@/lib/fetch-all";
import { effectiveMinGroupSize, env } from "@/lib/env";
import type { SurveyType } from "@/types";

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
  survey_type: SurveyType;
  submitted_at: string;
};

type FilterRow = { bu: string | null; department: string | null };

type ModeTestRow = {
  employee_id: string;
  preferred_mode: string;
  clearer_mode: string;
  completion_mode: string;
  mode_reason: string | null;
};

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
      .select(
        "employee_id,name,surname,nickname,bu,department,section,job_level,status",
      )
      .eq("status", "active")
      .order("employee_id")
      .range(from, to);
    if (bu) query = query.eq("bu", bu);
    if (department) query = query.eq("department", department);
    return query;
  });

  const eligibleIds = new Set(employees.map((employee) => employee.employee_id));

  const completions = await fetchAll<CompletionRow>((from, to) =>
    supabaseAdmin
      .from("participant_completions")
      .select("employee_id,survey_type,submitted_at")
      .eq("survey_version", env.SURVEY_VERSION)
      .order("submitted_at", { ascending: false })
      .range(from, to),
  );
  const completionsInScope = completions.filter((row) =>
    eligibleIds.has(row.employee_id),
  );

  const responses = await fetchAll<AggregateResponse>((from, to) => {
    let query = supabaseAdmin
      .from("survey_responses")
      .select(
        "survey_type,answers,current_scores,desired_scores,gaps,duration_seconds,bu,department,section,job_level,submitted_at",
      )
      .eq("survey_version", env.SURVEY_VERSION)
      .order("submitted_at")
      .range(from, to);
    if (bu) query = query.eq("bu", bu);
    if (department) query = query.eq("department", department);
    return query;
  });

  const scenarioRows = responses.filter((row) => row.survey_type === "scenario");
  const simpleRows = responses.filter((row) => row.survey_type === "simple");
  const scenarioSuppressed =
    scenarioRows.length > 0 && scenarioRows.length < effectiveMinGroupSize;
  const simpleSuppressed =
    simpleRows.length > 0 && simpleRows.length < effectiveMinGroupSize;

  const scenarioAggregate = aggregateResponses(
    scenarioSuppressed ? [] : scenarioRows,
    "scenario",
  );
  const simpleAggregate = aggregateResponses(
    simpleSuppressed ? [] : simpleRows,
    "simple",
  );

  const comparison =
    scenarioSuppressed || simpleSuppressed
      ? null
      : compareAggregates(scenarioAggregate, simpleAggregate);

  const completionSets = {
    scenario: new Set(
      completionsInScope
        .filter((row) => row.survey_type === "scenario")
        .map((row) => row.employee_id),
    ),
    simple: new Set(
      completionsInScope
        .filter((row) => row.survey_type === "simple")
        .map((row) => row.employee_id),
    ),
  };

  const completedBothIds = new Set(
    employees
      .map((employee) => employee.employee_id)
      .filter(
        (id) => completionSets.scenario.has(id) && completionSets.simple.has(id),
      ),
  );

  const modeTestRows = (
    await fetchAll<ModeTestRow>((from, to) =>
      supabaseAdmin
        .from("pilot_final_feedback")
        .select(
          "employee_id,preferred_mode,clearer_mode,completion_mode,mode_reason",
        )
        .eq("survey_version", env.SURVEY_VERSION)
        .range(from, to),
    )
  ).filter((row) => eligibleIds.has(row.employee_id));

  const modeTest = summarizeModeTest(modeTestRows);
  const modeTestCompletedIds = new Set(modeTestRows.map((row) => row.employee_id));

  const nonResponders = employees.map((employee) => ({
    ...employee,
    scenario_completed: completionSets.scenario.has(employee.employee_id),
    simple_completed: completionSets.simple.has(employee.employee_id),
    pilot_completed: modeTestCompletedIds.has(employee.employee_id),
  }));

  const allEmployees = await fetchAll<FilterRow>((from, to) =>
    supabaseAdmin
      .from("employees")
      .select("bu,department")
      .eq("status", "active")
      .range(from, to),
  );

  const bus = [
    ...new Set(
      allEmployees
        .map((employee) => employee.bu)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();
  const departments = [
    ...new Set(
      allEmployees
        .filter((employee) => !bu || employee.bu === bu)
        .map((employee) => employee.department)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();

  return NextResponse.json({
    surveyVersion: env.SURVEY_VERSION,
    totals: {
      employees: employees.length,
      scenarioCompleted: completionSets.scenario.size,
      simpleCompleted: completionSets.simple.size,
      completedBoth: completedBothIds.size,
      finalCompleted: modeTestRows.length,
      responseRateBoth: employees.length
        ? Math.round((completedBothIds.size / employees.length) * 1000) / 10
        : 0,
    },
    filters: { bus, departments },
    surveys: {
      scenario: scenarioAggregate,
      simple: simpleAggregate,
    },
    comparison: comparison
      ? {
          ...comparison,
          matchedSample:
            scenarioRows.length > 0 &&
            scenarioRows.length === completedBothIds.size &&
            simpleRows.length === completedBothIds.size,
          scenarioSample: scenarioRows.length,
          simpleSample: simpleRows.length,
          pairedSample: completedBothIds.size,
        }
      : null,
    modeTest,
    privacy: {
      minGroupSize: effectiveMinGroupSize,
      prototypeMode: env.PROTOTYPE_MODE,
      suppressed: {
        scenario: scenarioSuppressed,
        simple: simpleSuppressed,
      },
    },
    nonResponders,
  });
}

function summarizeModeTest(rows: ModeTestRow[]) {
  return {
    count: rows.length,
    preferredMode: distribution(rows.map((row) => row.preferred_mode)),
    clearerMode: distribution(rows.map((row) => row.clearer_mode)),
    completionMode: distribution(rows.map((row) => row.completion_mode)),
    comments: rows
      .map((row) => row.mode_reason?.trim())
      .filter((value): value is string => Boolean(value))
      .slice(0, 30),
  };
}

function distribution(values: string[]) {
  const counts = values.reduce<Record<string, number>>((accumulator, value) => {
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});
  return Object.fromEntries(
    Object.entries(counts).map(([key, value]) => [
      key,
      {
        count: value,
        percent: values.length
          ? Math.round((value / values.length) * 1000) / 10
          : 0,
      },
    ]),
  );
}
