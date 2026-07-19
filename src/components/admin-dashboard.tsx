"use client";

import { useEffect, useMemo, useState } from "react";
import { ARCHETYPE_META } from "@/data/archetypes";
import { ARCHETYPES, type Archetype, type Scores, type SurveyType } from "@/types";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  GitCompareArrows,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Upload,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Papa from "papaparse";

type Employee = {
  employee_id: string;
  name: string | null;
  surname: string | null;
  nickname: string | null;
  bu: string | null;
  department: string | null;
  section: string | null;
  job_level: string | null;
  status: string;
  scenario_completed: boolean;
  simple_completed: boolean;
  pilot_completed: boolean;
};

type RankedArchetype = { key: Archetype; value: number; rank: number };
type ThemeSuggestion = {
  type: string;
  archetype: Archetype;
  title: string;
  detail: string;
};
type DimensionResult = {
  id: string;
  dimension: string;
  title: string;
  currentPct: Scores;
  desiredPct: Scores;
  currentTop: Archetype[];
  desiredTop: Archetype[];
};
type SurveyAggregate = {
  responseCount: number;
  current: Scores;
  desired: Scores;
  gaps: Scores;
  currentPct: Scores;
  desiredPct: Scores;
  gapPct: Scores;
  averageDurationSeconds: number;
  currentRanking: RankedArchetype[];
  desiredRanking: RankedArchetype[];
  gapRanking: RankedArchetype[];
  suggestions: ThemeSuggestion[];
  dimensions: DimensionResult[];
};
type Distribution = Record<
  string,
  { count: number; percent: number }
>;
type DashboardData = {
  surveyVersion: string;
  totals: {
    employees: number;
    scenarioCompleted: number;
    simpleCompleted: number;
    completedBoth: number;
    finalCompleted: number;
    responseRateBoth: number;
  };
  filters: { bus: string[]; departments: string[] };
  surveys: Record<SurveyType, SurveyAggregate>;
  comparison: null | {
    currentDifference: Scores;
    desiredDifference: Scores;
    gapDifference: Scores;
    currentMeanAbsoluteDifference: number;
    desiredMeanAbsoluteDifference: number;
    currentTopMatch: boolean;
    desiredTopMatch: boolean;
    gapDirectionMatchCount: number;
    gapDirectionMatchPercent: number;
    matchedSample: boolean;
    scenarioSample: number;
    simpleSample: number;
    pairedSample: number;
  };
  modeTest: {
    count: number;
    preferredMode: Distribution;
    clearerMode: Distribution;
    completionMode: Distribution;
    comments: string[];
  };
  privacy: {
    minGroupSize: number;
    prototypeMode: boolean;
    suppressed: Record<SurveyType, boolean>;
  };
  nonResponders: Employee[];
};

type Tab = "overview" | "scenario" | "simple" | "comparison" | "mode";

const TAB_LABELS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "ภาพรวม Pilot" },
  { key: "scenario", label: "Scenario-Based" },
  { key: "simple", label: "Simple Survey" },
  { key: "comparison", label: "เปรียบเทียบผล" },
  { key: "mode", label: "Survey Mode Test" },
];

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [bu, setBu] = useState("");
  const [department, setDepartment] = useState("");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams();
    if (bu) params.set("bu", bu);
    if (department) params.set("department", department);

    fetch(`/api/admin/dashboard?${params}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message ?? "โหลดข้อมูลไม่สำเร็จ");
        }
        return payload as DashboardData;
      })
      .then((payload) => {
        if (!ignore) {
          setData(payload);
          setError("");
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (!ignore) {
          setError(cause instanceof Error ? cause.message : "โหลดข้อมูลไม่สำเร็จ");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [bu, department, refreshKey]);

  const incompletePeople = useMemo(
    () =>
      data?.nonResponders.filter((employee) => {
        if (employee.pilot_completed) return false;
        return `${employee.employee_id} ${employee.name ?? ""} ${employee.surname ?? ""} ${employee.department ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      }) ?? [],
    [data, search],
  );

  async function importCsv() {
    if (!file) return;
    setImporting(true);
    setImportMessage("");

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          const response = await fetch("/api/admin/employees/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: result.data }),
          });
          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload.message ?? "นำเข้าไม่สำเร็จ");
          }
          setImportMessage(`นำเข้า/อัปเดต ${payload.count} คนสำเร็จ`);
          setFile(null);
          setRefreshKey((value) => value + 1);
        } catch (cause) {
          setImportMessage(
            cause instanceof Error ? cause.message : "นำเข้าไม่สำเร็จ",
          );
        } finally {
          setImporting(false);
        }
      },
      error: () => {
        setImporting(false);
        setImportMessage("อ่านไฟล์ CSV ไม่สำเร็จ");
      },
    });
  }

  function exportIncomplete() {
    const csv = Papa.unparse(incompletePeople);
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "culture-pilot-incomplete.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !data) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="animate-spin text-emerald-600" size={42} />
      </div>
    );
  }

  if (!data) {
    return <div className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Culture Survey Pilot Dashboard</h1>
          <p className="text-slate-500">
            เปรียบเทียบผล Scenario-Based กับ Simple Survey และสรุปผลการทดสอบ Survey Mode
          </p>
          <div className="mt-2 text-xs text-slate-400">
            Survey Version: {data.surveyVersion}
          </div>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            setRefreshKey((value) => value + 1);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>}
      {data.privacy.prototypeMode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <strong>Prototype Result:</strong> ระบบแสดงผลตั้งแต่ผู้ตอบคนแรก เพื่อใช้ทดสอบระบบ ผลกลุ่มตัวอย่างขนาดเล็กยังไม่ควรใช้สรุปเชิงนโยบาย
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={Users} label="Eligible" value={data.totals.employees} />
        <Metric icon={BarChart3} label="Scenario Complete" value={data.totals.scenarioCompleted} />
        <Metric icon={BarChart3} label="Simple Complete" value={data.totals.simpleCompleted} />
        <Metric icon={CheckCircle2} label="ครบทั้ง 2 ชุด" value={`${data.totals.completedBoth} (${data.totals.responseRateBoth}%)`} />
        <Metric icon={GitCompareArrows} label="Mode Test Complete" value={data.totals.finalCompleted} />
      </div>

      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <select
            value={bu}
            onChange={(event) => {
              setBu(event.target.value);
              setDepartment("");
              setLoading(true);
            }}
            className="rounded-xl border border-slate-200 px-4 py-3"
          >
            <option value="">ทุก BU</option>
            {data.filters.bus.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={department}
            onChange={(event) => {
              setDepartment(event.target.value);
              setLoading(true);
            }}
            className="rounded-xl border border-slate-200 px-4 py-3"
          >
            <option value="">ทุกฝ่าย</option>
            {data.filters.departments.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Culture Answers แสดงเฉพาะ Aggregate ไม่แสดงคำตอบรายบุคคล
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TAB_LABELS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${
              tab === item.key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab
          data={data}
          incompletePeople={incompletePeople}
          search={search}
          setSearch={setSearch}
          exportIncomplete={exportIncomplete}
          file={file}
          setFile={setFile}
          importing={importing}
          importMessage={importMessage}
          importCsv={importCsv}
        />
      )}
      {tab === "scenario" && (
        <SurveyResultTab type="scenario" data={data} />
      )}
      {tab === "simple" && <SurveyResultTab type="simple" data={data} />}
      {tab === "comparison" && <ComparisonTab data={data} />}
      {tab === "mode" && <ModeTestTab data={data} />}
    </div>
  );
}

function OverviewTab({
  data,
  incompletePeople,
  search,
  setSearch,
  exportIncomplete,
  file,
  setFile,
  importing,
  importMessage,
  importCsv,
}: {
  data: DashboardData;
  incompletePeople: Employee[];
  search: string;
  setSearch: (value: string) => void;
  exportIncomplete: () => void;
  file: File | null;
  setFile: (file: File | null) => void;
  importing: boolean;
  importMessage: string;
  importCsv: () => void;
}) {
  const completionData = [
    { name: "Scenario", Completed: data.totals.scenarioCompleted },
    { name: "Simple", Completed: data.totals.simpleCompleted },
    { name: "Both", Completed: data.totals.completedBoth },
    { name: "Mode Test", Completed: data.totals.finalCompleted },
  ];

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="text-xl font-semibold">Pilot Completion Funnel</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="Completed" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">ผู้ที่ยังทำ Pilot ไม่ครบ</h2>
              <p className="text-sm text-slate-500">
                แสดงสถานะของแต่ละชุดและการทดสอบ Survey Mode
              </p>
            </div>
            <button
              onClick={exportIncomplete}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4"
              placeholder="ค้นหารหัส ชื่อ หรือฝ่าย"
            />
          </div>
          <div className="mt-4 max-h-[440px] overflow-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="p-3 text-left">รหัส</th>
                  <th className="p-3 text-left">ชื่อ</th>
                  <th className="p-3 text-left">ฝ่าย</th>
                  <th className="p-3 text-center">Scenario</th>
                  <th className="p-3 text-center">Simple</th>
                  <th className="p-3 text-center">Mode Test</th>
                </tr>
              </thead>
              <tbody>
                {incompletePeople.map((employee) => (
                  <tr key={employee.employee_id} className="border-t border-slate-100">
                    <td className="p-3">{employee.employee_id}</td>
                    <td className="p-3">
                      {[employee.name, employee.surname].filter(Boolean).join(" ")}
                    </td>
                    <td className="p-3">{employee.department || "-"}</td>
                    <StatusCell complete={employee.scenario_completed} />
                    <StatusCell complete={employee.simple_completed} />
                    <StatusCell complete={employee.pilot_completed} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-semibold">Import Employee Master</h2>
          <p className="mt-1 text-sm text-slate-500">
            CSV Header: employeeId, name, surname, nickname, email, BU, department, section, jobLevel, status
          </p>
          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-emerald-400">
            <Upload className="text-emerald-600" />
            <span className="mt-3 text-sm">
              {file ? file.name : "เลือกไฟล์ CSV"}
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <button
            onClick={importCsv}
            disabled={!file || importing}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-40"
          >
            {importing ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Upload size={18} />
            )}
            นำเข้าข้อมูล
          </button>
          {importMessage && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
              {importMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SurveyResultTab({ type, data }: { type: SurveyType; data: DashboardData }) {
  const aggregate = data.surveys[type];
  const suppressed = data.privacy.suppressed[type];
  const chartData = ARCHETYPES.map((key) => ({
    name: ARCHETYPE_META[key].label,
    Current: aggregate.currentPct[key],
    Desired: aggregate.desiredPct[key],
  }));
  const title = type === "scenario" ? "Scenario-Based Survey" : "Simplified Culture Survey";

  if (suppressed) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        ผล {title} ถูกซ่อน เพราะมีคำตอบน้อยกว่า {data.privacy.minGroupSize} คน
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={Users} label="Responses" value={aggregate.responseCount} />
        <Metric icon={Clock3} label="เวลาเฉลี่ย" value={formatDuration(aggregate.averageDurationSeconds)} />
        <Metric
          icon={BarChart3}
          label="Current Top"
          value={aggregate.currentRanking[0]?.key ? ARCHETYPE_META[aggregate.currentRanking[0].key].label : "-"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-xl font-semibold">{title}: Current vs Desired</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar name="Current" dataKey="Current" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                <Radar name="Desired" dataKey="Desired" stroke="#059669" fill="#059669" fillOpacity={0.2} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-xl font-semibold">Culture Profile (%)</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Current" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Desired" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-xl font-semibold">Preliminary Culture Theme Suggestions</h2>
        <p className="mt-1 text-sm text-slate-500">
          ใช้ Gap เพื่อช่วยตั้งสมมติฐานเบื้องต้น ไม่ใช่ข้อสรุป Core Values
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {aggregate.suggestions.length ? (
            aggregate.suggestions.map((suggestion, index) => (
              <div key={`${suggestion.type}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold text-emerald-700">{suggestion.type}</div>
                <div className="mt-1 font-semibold">{suggestion.title}</div>
                <div className="mt-2 text-sm text-slate-500">{suggestion.detail}</div>
              </div>
            ))
          ) : (
            <div className="text-slate-500">ยังไม่มีข้อมูล</div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-semibold">ผลราย Dimension</h2>
          <p className="text-sm text-slate-500">Archetype ที่มีสัดส่วนสูงที่สุดในแต่ละหัวข้อ</p>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Dimension</th>
                <th className="p-3 text-left">หัวข้อ</th>
                <th className="p-3 text-left">Current Top</th>
                <th className="p-3 text-left">Desired Top</th>
              </tr>
            </thead>
            <tbody>
              {aggregate.dimensions.map((dimension) => (
                <tr key={dimension.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{dimension.dimension}</td>
                  <td className="p-3 text-slate-500">{dimension.title}</td>
                  <td className="p-3">{formatTop(dimension.currentTop, dimension.currentPct)}</td>
                  <td className="p-3">{formatTop(dimension.desiredTop, dimension.desiredPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ComparisonTab({ data }: { data: DashboardData }) {
  const comparison = data.comparison;
  if (!comparison) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        ยังเปรียบเทียบไม่ได้จนกว่าทั้งสองชุดจะมีข้อมูลถึงเกณฑ์ขั้นต่ำ
      </div>
    );
  }

  const chartData = ARCHETYPES.map((key) => ({
    name: ARCHETYPE_META[key].label,
    ScenarioCurrent: data.surveys.scenario.currentPct[key],
    SimpleCurrent: data.surveys.simple.currentPct[key],
    ScenarioDesired: data.surveys.scenario.desiredPct[key],
    SimpleDesired: data.surveys.simple.desiredPct[key],
  }));

  return (
    <div className="space-y-6">
      {!comparison.matchedSample && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <strong>Sample ยังไม่ตรงกัน:</strong> ขณะนี้ Scenario {comparison.scenarioSample} คน, Simple {comparison.simpleSample} คน และผู้ที่ทำครบทั้งสองชุด {comparison.pairedSample} คน ผลเปรียบเทียบใช้ดูแนวโน้มชั่วคราวเท่านั้น ควรสรุปหลังกลุ่มตัวอย่างทำครบทั้งสองชุดแล้ว
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Current Top"
          value={comparison.currentTopMatch ? "ตรงกัน" : "ต่างกัน"}
          detail={`Scenario: ${topLabel(data.surveys.scenario.currentRanking)} / Simple: ${topLabel(data.surveys.simple.currentRanking)}`}
        />
        <InsightCard
          label="Desired Top"
          value={comparison.desiredTopMatch ? "ตรงกัน" : "ต่างกัน"}
          detail={`Scenario: ${topLabel(data.surveys.scenario.desiredRanking)} / Simple: ${topLabel(data.surveys.simple.desiredRanking)}`}
        />
        <InsightCard
          label="Gap Direction Match"
          value={`${comparison.gapDirectionMatchPercent}%`}
          detail={`ทิศทางตรงกัน ${comparison.gapDirectionMatchCount} จาก 4 Archetypes`}
        />
        <InsightCard
          label="เวลาเฉลี่ย"
          value={`${formatDuration(data.surveys.scenario.averageDurationSeconds)} / ${formatDuration(data.surveys.simple.averageDurationSeconds)}`}
          detail="Scenario / Simple"
        />
      </div>

      <div className="card p-5">
        <h2 className="text-xl font-semibold">Culture Profile Comparison</h2>
        <p className="mt-1 text-sm text-slate-500">
          เปรียบเทียบสัดส่วนคะแนนจากคนกลุ่มเดียวกันในภาพรวม
        </p>
        <div className="mt-4 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="ScenarioCurrent" name="Scenario Current" fill="#1d4ed8" />
              <Bar dataKey="SimpleCurrent" name="Simple Current" fill="#60a5fa" />
              <Bar dataKey="ScenarioDesired" name="Scenario Desired" fill="#047857" />
              <Bar dataKey="SimpleDesired" name="Simple Desired" fill="#6ee7b7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-semibold">ความแตกต่าง Simple − Scenario</h2>
          <p className="text-sm text-slate-500">
            ค่าบวกหมายถึง Simple ให้สัดส่วนสูงกว่า Scenario
          </p>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Archetype</th>
                <th className="p-3 text-right">Current Diff.</th>
                <th className="p-3 text-right">Desired Diff.</th>
                <th className="p-3 text-right">Gap Diff.</th>
              </tr>
            </thead>
            <tbody>
              {ARCHETYPES.map((key) => (
                <tr key={key} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{ARCHETYPE_META[key].label}</td>
                  <DiffCell value={comparison.currentDifference[key]} />
                  <DiffCell value={comparison.desiredDifference[key]} />
                  <DiffCell value={comparison.gapDifference[key]} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-4 border-t border-slate-100 p-5 md:grid-cols-2">
          <InsightCard
            label="Current Mean Absolute Difference"
            value={`${comparison.currentMeanAbsoluteDifference} จุด`}
            detail="ความต่างเฉลี่ยของ 4 Archetypes"
          />
          <InsightCard
            label="Desired Mean Absolute Difference"
            value={`${comparison.desiredMeanAbsoluteDifference} จุด`}
            detail="ความต่างเฉลี่ยของ 4 Archetypes"
          />
        </div>
      </div>
    </div>
  );
}

function ModeTestTab({ data }: { data: DashboardData }) {
  const labels = {
    side_by_side: "Mode A: Current + Desired ในข้อเดียว",
    sequential: "Mode B: Sequential",
    no_difference: "ไม่แตกต่างกัน",
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        ส่วนนี้สรุปเฉพาะการทดลองรูปแบบหน้าจอหลังทำแบบสำรวจครบทั้ง 2 ชุด ไม่ใช่การให้ผู้ทดสอบเลือกชุดคำถาม
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DistributionCard
          title="รูปแบบที่ใช้งานสะดวกกว่า"
          distribution={data.modeTest.preferredMode}
          labels={labels}
        />
        <DistributionCard
          title="Mode ที่แยก Current/Desired ชัดกว่า"
          distribution={data.modeTest.clearerMode}
          labels={labels}
        />
        <DistributionCard
          title="Mode ที่มีโอกาสตอบจบมากกว่า"
          distribution={data.modeTest.completionMode}
          labels={labels}
        />
      </div>

      <CommentCard
        title="ข้อสังเกตจากการทดสอบหน้าจอ"
        comments={data.modeTest.comments}
      />
    </div>
  );
}

function DistributionCard({
  title,
  distribution,
  labels,
}: {
  title: string;
  distribution: Distribution;
  labels: Record<string, string>;
}) {
  const rows = Object.entries(labels).map(([key, label]) => ({
    key,
    label,
    count: distribution[key]?.count ?? 0,
    percent: distribution[key]?.percent ?? 0,
  }));
  return (
    <div className="card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span>{row.label}</span>
              <span className="font-semibold">{row.count} คน ({row.percent}%)</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${row.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentCard({ title, comments }: { title: string; comments: string[] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <MessageSquareText className="text-emerald-600" size={20} />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="mt-4 max-h-72 space-y-3 overflow-auto">
        {comments.length ? (
          comments.map((comment, index) => (
            <div key={`${comment}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              {comment}
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-400">ยังไม่มีความคิดเห็น</div>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
        <Icon />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="truncate text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

function InsightCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className="mt-2 text-xs leading-5 text-slate-400">{detail}</div>
    </div>
  );
}

function StatusCell({ complete }: { complete: boolean }) {
  return (
    <td className="p-3 text-center">
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
        {complete ? "ครบ" : "ยัง"}
      </span>
    </td>
  );
}

function DiffCell({ value, suffix = " จุด" }: { value: number; suffix?: string }) {
  return (
    <td className={`p-3 text-right font-semibold ${value > 0 ? "text-emerald-700" : value < 0 ? "text-rose-700" : "text-slate-500"}`}>
      {value > 0 ? "+" : ""}{value}{suffix}
    </td>
  );
}

function formatDuration(seconds: number) {
  if (!seconds) return "-";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes ? `${minutes} นาที ${remaining} วิ` : `${remaining} วินาที`;
}

function formatTop(keys: Archetype[], scores: Scores) {
  return keys.map((key) => `${ARCHETYPE_META[key].label} ${scores[key]}%`).join(" + ");
}

function topLabel(ranking: RankedArchetype[]) {
  const key = ranking[0]?.key;
  return key ? ARCHETYPE_META[key].label : "-";
}
