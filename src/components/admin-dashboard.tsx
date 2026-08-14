"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileSpreadsheet,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ARCHETYPE_META } from "@/data/archetypes";
import { SCENARIO_QUESTIONS } from "@/data/surveys";
import { ARCHETYPES, type Archetype, type Scores, type SurveyAnswer } from "@/types";
import { responseLongRows } from "@/lib/export-data";

type RankedArchetype = { key: Archetype; value: number; rank: number };
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
  dimensions: DimensionResult[];
};
type Participant = {
  employee_id: string;
  name: string | null;
  surname: string | null;
  nickname: string | null;
  bu: string | null;
  department: string | null;
  section: string | null;
  job_level: string | null;
  status: string;
  completed: boolean;
  submitted_at: string | null;
  duration_seconds: number | null;
  answers: SurveyAnswer[] | null;
  current_scores: Scores | null;
  desired_scores: Scores | null;
  gaps: Scores | null;
};
type DashboardData = {
  surveyVersion: string;
  totals: {
    employees: number;
    completed: number;
    pending: number;
    responseRate: number;
    averageDurationSeconds: number;
  };
  filters: { bus: string[]; departments: string[] };
  aggregate: SurveyAggregate;
  participants: Participant[];
};

type Tab = "overview" | "results" | "participants";

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [bu, setBu] = useState("");
  const [department, setDepartment] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [selected, setSelected] = useState<Participant | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams();
    if (bu) params.set("bu", bu);
    if (department) params.set("department", department);

    setLoading(true);
    fetch(`/api/admin/dashboard?${params}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "โหลดข้อมูลไม่สำเร็จ");
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

    return () => { ignore = true; };
  }, [bu, department, refreshKey]);

  const filteredParticipants = useMemo(() => {
    if (!data) return [];
    const keyword = search.trim().toLowerCase();
    return data.participants.filter((participant) => {
      if (statusFilter === "completed" && !participant.completed) return false;
      if (statusFilter === "pending" && participant.completed) return false;
      if (!keyword) return true;
      return `${participant.employee_id} ${participant.name ?? ""} ${participant.surname ?? ""} ${participant.nickname ?? ""} ${participant.bu ?? ""} ${participant.department ?? ""}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [data, search, statusFilter]);

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
          if (!response.ok) throw new Error(payload.message ?? "นำเข้าไม่สำเร็จ");
          setImportMessage(`นำเข้า/อัปเดต ${payload.count} คนสำเร็จ`);
          setFile(null);
          setRefreshKey((value) => value + 1);
        } catch (cause) {
          setImportMessage(cause instanceof Error ? cause.message : "นำเข้าไม่สำเร็จ");
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

  function exportParticipants() {
    const rows = filteredParticipants.map((p) => ({
      employeeId: p.employee_id,
      name: [p.name, p.surname].filter(Boolean).join(" "),
      nickname: p.nickname ?? "",
      BU: p.bu ?? "",
      department: p.department ?? "",
      section: p.section ?? "",
      jobLevel: p.job_level ?? "",
      status: p.completed ? "Completed" : "Pending",
      submittedAt: p.submitted_at ?? "",
      durationSeconds: p.duration_seconds ?? "",
    }));
    downloadCsv(rows, "culture-survey-participants.csv");
  }

  async function exportAllResponses() {
    try {
      const response = await fetch("/api/admin/dashboard");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "โหลดข้อมูลไม่สำเร็จ");
      const rows = responseLongRows((payload as DashboardData).participants);
      if (!rows.length) {
        setSyncMessage("ยังไม่มีคำตอบสำหรับ Export");
        return;
      }
      downloadCsv(rows, `culture-survey-all-responses-${data.surveyVersion}.csv`);
    } catch (cause) {
      setSyncMessage(cause instanceof Error ? cause.message : "Export ไม่สำเร็จ");
    }
  }

  async function syncToGoogleSheets() {
    setSyncingSheets(true);
    setSyncMessage("");
    try {
      const response = await fetch("/api/admin/google-sheets/sync", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Sync ไม่สำเร็จ");
      setSyncMessage(`${payload.message} · ${payload.participants} คน · ${payload.responses} แถวคำตอบ`);
    } catch (cause) {
      setSyncMessage(cause instanceof Error ? cause.message : "Sync ไม่สำเร็จ");
    } finally {
      setSyncingSheets(false);
    }
  }

  if (loading && !data) {
    return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-emerald-600" size={42} /></div>;
  }
  if (!data) return <div className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>;

  const chartData = ARCHETYPES.map((key) => ({
    name: ARCHETYPE_META[key].label,
    Current: data.aggregate.currentPct[key],
    Desired: data.aggregate.desiredPct[key],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Culture Diagnosis Dashboard</h1>
          <p className="text-slate-500">ติดตามสถานะ ดูผลภาพรวม และตรวจสอบคำตอบรายบุคคลสำหรับการวิเคราะห์ภายใน</p>
          <div className="mt-2 text-xs text-slate-400">Survey Version: {data.surveyVersion}</div>
        </div>
        <button onClick={() => setRefreshKey((value) => value + 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={Users} label="Eligible" value={data.totals.employees} />
        <Metric icon={CheckCircle2} label="Completed" value={data.totals.completed} />
        <Metric icon={Users} label="Pending" value={data.totals.pending} />
        <Metric icon={BarChart3} label="Response Rate" value={`${data.totals.responseRate}%`} />
        <Metric icon={Clock3} label="เวลาเฉลี่ย" value={formatDuration(data.totals.averageDurationSeconds)} />
      </div>

      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <select value={bu} onChange={(event) => { setBu(event.target.value); setDepartment(""); }} className="rounded-xl border border-slate-200 px-4 py-3">
            <option value="">ทุก BU</option>
            {data.filters.bus.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={department} onChange={(event) => setDepartment(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3">
            <option value="">ทุกฝ่าย</option>
            {data.filters.departments.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          ["overview", "ภาพรวม"],
          ["results", "ผล Culture"],
          ["participants", "ผู้ตอบรายบุคคล"],
        ] as Array<[Tab, string]>).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === key ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="card p-5">
            <h2 className="text-xl font-semibold">Current vs Desired Culture Profile</h2>
            <p className="mt-1 text-sm text-slate-500">สัดส่วนคำตอบจากผู้ที่ส่งแบบประเมินแล้ว</p>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Current" name="Current" fill="#2563eb" />
                  <Bar dataKey="Desired" name="Desired" fill="#059669" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <h2 className="text-xl font-semibold">สถานะผู้ตอบ</h2>
            <div className="mt-5 space-y-4">
              <StatusBar label="ทำแล้ว" value={data.totals.completed} total={data.totals.employees} />
              <StatusBar label="ยังไม่ทำ" value={data.totals.pending} total={data.totals.employees} />
            </div>
            <button onClick={() => { setStatusFilter("pending"); setTab("participants"); }} className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50">
              ดูรายชื่อผู้ที่ยังไม่ทำ
            </button>
          </div>
        </div>
      )}

      {tab === "results" && <ResultsTab aggregate={data.aggregate} />}

      {tab === "participants" && (
        <div className="space-y-5">
          <div className="card p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหารหัส ชื่อ BU หรือฝ่าย" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4" />
              </div>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-xl border border-slate-200 px-4 py-3">
                <option value="all">ทุกสถานะ</option>
                <option value="completed">ทำแล้ว</option>
                <option value="pending">ยังไม่ทำ</option>
              </select>
              <button onClick={exportParticipants} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold">
                <Download size={18} /> Export Status
              </button>
            </div>
          </div>


          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Data Export & Google Sheets</h2>
                <p className="mt-1 text-sm text-slate-500">Export คำตอบทั้งหมดเพื่อวิเคราะห์ต่อ หรือ Sync ข้อมูลล่าสุดจาก Supabase ไปยัง Google Sheets กลางของ HR</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={exportAllResponses} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold hover:bg-slate-50">
                  <Download size={18} /> Export All Responses (.csv)
                </button>
                <button onClick={syncToGoogleSheets} disabled={syncingSheets} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-50">
                  {syncingSheets ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />} Sync to Google Sheets
                </button>
              </div>
            </div>
            {syncMessage && <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{syncMessage}</div>}
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left">รหัส</th>
                    <th className="p-3 text-left">ชื่อ</th>
                    <th className="p-3 text-left">BU / ฝ่าย</th>
                    <th className="p-3 text-left">ระดับ</th>
                    <th className="p-3 text-center">สถานะ</th>
                    <th className="p-3 text-left">ส่งเมื่อ</th>
                    <th className="p-3 text-center">คำตอบ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((participant) => (
                    <tr key={participant.employee_id} className="border-t border-slate-100">
                      <td className="p-3 font-medium">{participant.employee_id}</td>
                      <td className="p-3">{[participant.name, participant.surname].filter(Boolean).join(" ") || "-"}</td>
                      <td className="p-3">{[participant.bu, participant.department].filter(Boolean).join(" / ") || "-"}</td>
                      <td className="p-3">{participant.job_level || "-"}</td>
                      <td className="p-3 text-center"><StatusBadge complete={participant.completed} /></td>
                      <td className="p-3">{participant.submitted_at ? formatDate(participant.submitted_at) : "-"}</td>
                      <td className="p-3 text-center">
                        <button disabled={!participant.answers} onClick={() => setSelected(participant)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-35">
                          <Eye size={16} /> ดูคำตอบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="text-xl font-semibold">Import Employee Master</h2>
              <p className="mt-1 text-sm text-slate-500">CSV Header: employeeId, name, surname, nickname, email, BU, department, section, jobLevel, status</p>
              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-emerald-400">
                <Upload className="text-emerald-600" />
                <span className="mt-3 text-sm">{file ? file.name : "เลือกไฟล์ CSV"}</span>
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </label>
              <button onClick={importCsv} disabled={!file || importing} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-40">
                {importing ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />} นำเข้าข้อมูล
              </button>
              {importMessage && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">{importMessage}</div>}
            </div>
            <div className="card p-5 text-sm leading-6 text-slate-600">
              <h2 className="text-xl font-semibold text-slate-950">การใช้ข้อมูลรายบุคคล</h2>
              <p className="mt-3">ข้อมูลส่วนนี้เปิดให้เฉพาะ Admin เพื่อใช้ตรวจสอบความครบถ้วน วิเคราะห์ Culture และประกอบการวางแผนภายใน เช่น Engagement, Talent หรือ Succession โดยควรใช้เป็นข้อมูลประกอบ ไม่ใช้คำตอบชุดเดียวตัดสินบุคคลโดยลำพัง</p>
            </div>
          </div>
        </div>
      )}

      {selected && <IndividualResponseModal participant={selected} surveyVersion={data.surveyVersion} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ResultsTab({ aggregate }: { aggregate: SurveyAggregate }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ARCHETYPES.map((key) => (
          <div key={key} className="card p-5">
            <div className="text-sm text-slate-500">{ARCHETYPE_META[key].label}</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><div className="text-xs text-slate-400">Current</div><div className="text-2xl font-bold">{aggregate.currentPct[key]}%</div></div>
              <div><div className="text-xs text-slate-400">Desired</div><div className="text-2xl font-bold">{aggregate.desiredPct[key]}%</div></div>
            </div>
            <div className={`mt-3 text-sm font-semibold ${aggregate.gapPct[key] > 0 ? "text-emerald-700" : aggregate.gapPct[key] < 0 ? "text-rose-700" : "text-slate-500"}`}>
              Gap {aggregate.gapPct[key] > 0 ? "+" : ""}{aggregate.gapPct[key]} จุด
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-semibold">ผลราย Workplace Dimension</h2>
          <p className="mt-1 text-sm text-slate-500">Archetype ที่ถูกเลือกมากที่สุดในแต่ละสถานการณ์</p>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50"><tr><th className="p-3 text-left">ID</th><th className="p-3 text-left">Dimension</th><th className="p-3 text-left">หัวข้อ</th><th className="p-3 text-left">Current Top</th><th className="p-3 text-left">Desired Top</th></tr></thead>
            <tbody>
              {aggregate.dimensions.map((dimension) => (
                <tr key={dimension.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{dimension.id}</td>
                  <td className="p-3">{dimension.dimension}</td>
                  <td className="p-3">{dimension.title}</td>
                  <td className="p-3">{formatArchetypes(dimension.currentTop)}</td>
                  <td className="p-3">{formatArchetypes(dimension.desiredTop)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function IndividualResponseModal({ participant, surveyVersion, onClose }: { participant: Participant; surveyVersion: string; onClose: () => void }) {
  const answers = new Map((participant.answers ?? []).map((answer) => [answer.questionId, answer]));
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="mx-auto flex max-h-[calc(100vh-2rem)] max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <div className="text-xs font-semibold text-emerald-700">INDIVIDUAL RESPONSE</div>
            <h2 className="mt-1 text-2xl font-bold">{[participant.name, participant.surname].filter(Boolean).join(" ") || participant.employee_id}</h2>
            <p className="mt-1 text-sm text-slate-500">{participant.employee_id} · {[participant.bu, participant.department, participant.job_level].filter(Boolean).join(" / ")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const rows = responseLongRows([participant]);
              downloadCsv(rows, `culture-response-${participant.employee_id}-${surveyVersion}.csv`);
            }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">
              <Download size={17} /> Export Individual Response
            </button>
            <button onClick={onClose} className="rounded-xl border border-slate-200 p-2"><X size={20} /></button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          {participant.current_scores && participant.desired_scores && (
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ARCHETYPES.map((key) => (
                <div key={key} className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-semibold">{ARCHETYPE_META[key].label}</div>
                  <div className="mt-2 text-sm text-slate-600">Current {participant.current_scores?.[key] ?? 0} / Desired {participant.desired_scores?.[key] ?? 0}</div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {SCENARIO_QUESTIONS.map((question) => {
              const answer = answers.get(question.id);
              const current = question.options.find((option) => option.id === answer?.currentOptionId);
              const desired = question.options.find((option) => option.id === answer?.desiredOptionId);
              return (
                <div key={question.id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold">{question.id}</span>
                    <span className="text-xs text-slate-500">{question.dimension}</span>
                  </div>
                  <div className="mt-2 font-semibold">{question.title}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-500">{question.prompt}</div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <AnswerBox title="Current" tone="blue" label={current?.label} archetype={current?.archetype} />
                    <AnswerBox title="Desired" tone="emerald" label={desired?.label} archetype={desired?.archetype} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnswerBox({ title, tone, label, archetype }: { title: string; tone: "blue" | "emerald"; label?: string; archetype?: Archetype }) {
  const classes = tone === "blue" ? "border-blue-200 bg-blue-50 text-blue-950" : "border-emerald-200 bg-emerald-50 text-emerald-950";
  return <div className={`rounded-xl border p-4 ${classes}`}><div className="text-xs font-bold">{title}</div><div className="mt-1 text-sm leading-6">{label ?? "-"}</div><div className="mt-2 text-xs font-semibold opacity-70">{archetype ? ARCHETYPE_META[archetype].label : "-"}</div></div>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return <div className="card flex items-center gap-4 p-5"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Icon /></div><div className="min-w-0"><div className="text-sm text-slate-500">{label}</div><div className="truncate text-2xl font-bold">{value}</div></div></div>;
}

function StatusBadge({ complete }: { complete: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{complete ? "ทำแล้ว" : "ยังไม่ทำ"}</span>;
}

function StatusBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 1000) / 10 : 0;
  return <div><div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{value} คน ({pct}%)</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} /></div></div>;
}

function formatDuration(seconds: number) {
  if (!seconds) return "-";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes ? `${minutes} นาที ${remaining} วิ` : `${remaining} วินาที`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatArchetypes(keys: Archetype[]) {
  return keys.length ? keys.map((key) => ARCHETYPE_META[key].label).join(" + ") : "-";
}

function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
