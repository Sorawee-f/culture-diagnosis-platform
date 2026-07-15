"use client";

import { useEffect, useMemo, useState } from "react";
import { ARCHETYPE_META } from "@/data/archetypes";
import { ARCHETYPES, type Archetype } from "@/types";
import { BarChart3, Download, Loader2, RefreshCw, Search, Upload, Users } from "lucide-react";
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
  submitted_at?: string | null;
};

type RankedArchetype = { key: Archetype; value: number; rank: number };
type ThemeSuggestion = { type: string; archetype: Archetype; title: string; detail: string };

type DashboardData = {
  totals: { employees: number; completed: number; responseRate: number };
  filters: { bus: string[]; departments: string[] };
  aggregate: {
    current: Record<Archetype, number>;
    desired: Record<Archetype, number>;
    gaps: Record<Archetype, number>;
    currentRanking: RankedArchetype[];
    desiredRanking: RankedArchetype[];
    gapRanking: RankedArchetype[];
    suggestions: ThemeSuggestion[];
  };
  privacy: { minGroupSize: number; aggregateSuppressed: boolean };
  nonResponders: Employee[];
  recentCompletions: Employee[];
};

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

    return () => {
      ignore = true;
    };
  }, [bu, department, refreshKey]);

  const nonResponders = useMemo(
    () =>
      data?.nonResponders.filter((employee) =>
        `${employee.employee_id} ${employee.name ?? ""} ${employee.surname ?? ""} ${employee.department ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ) ?? [],
    [data, search],
  );

  const chartData = useMemo(
    () =>
      ARCHETYPES.map((key) => ({
        name: ARCHETYPE_META[key].label,
        Current: data?.aggregate.current[key] ?? 0,
        Desired: data?.aggregate.desired[key] ?? 0,
      })),
    [data],
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

  function exportNonResponders() {
    const csv = Papa.unparse(nonResponders);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "non-responders.csv";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Culture Survey Dashboard</h1>
          <p className="text-slate-500">ติดตามการตอบ วิเคราะห์ Culture Profile และ Suggest Culture Themes เบื้องต้น</p>
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
      {data?.privacy.aggregateSuppressed && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          เพื่อป้องกันการระบุตัวบุคคล ระบบซ่อนผล Culture Profile ของกลุ่มที่มีคำตอบน้อยกว่า {data.privacy.minGroupSize} คน แต่ยังแสดงอัตราการตอบและรายชื่อผู้ยังไม่ตอบได้
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={Users} label="Eligible Employees" value={data?.totals.employees ?? 0} />
        <Metric icon={BarChart3} label="Completed" value={data?.totals.completed ?? 0} />
        <Metric icon={BarChart3} label="Response Rate" value={`${data?.totals.responseRate ?? 0}%`} />
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
            {data?.filters.bus.map((item) => <option key={item}>{item}</option>)}
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
            {data?.filters.departments.map((item) => <option key={item}>{item}</option>)}
          </select>
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            ข้อมูลคำตอบเป็น Aggregate และไม่แสดงคำตอบรายบุคคล
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-xl font-semibold">Current vs Desired Culture</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                <Radar name="Current" dataKey="Current" stroke="#0f766e" fill="#0f766e" fillOpacity={0.22} />
                <Radar name="Desired" dataKey="Desired" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.22} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-semibold">Rank by Archetype</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Current" fill="#0f766e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Desired" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-xl font-semibold">Preliminary Culture Theme Suggestions</h2>
        <p className="mt-1 text-sm text-slate-500">ใช้ Gap ระหว่าง Desired และ Current เพื่อช่วยตั้งสมมติฐานเบื้องต้น ไม่ใช่ข้อสรุป Core Values</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {data?.aggregate.suggestions.length ? (
            data.aggregate.suggestions.map((suggestion, index) => (
              <div key={`${suggestion.type}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold text-emerald-700">{suggestion.type}</div>
                <div className="mt-1 font-semibold">{suggestion.title}</div>
                <div className="mt-2 text-sm text-slate-500">{suggestion.detail}</div>
              </div>
            ))
          ) : (
            <div className="text-slate-500">ยังไม่มีข้อมูลเพียงพอ</div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">ผู้ที่ยังไม่ตอบ</h2>
              <p className="text-sm text-slate-500">ใช้สำหรับติดตาม Participation เท่านั้น</p>
            </div>
            <button onClick={exportNonResponders} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
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
          <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="p-3 text-left">รหัส</th>
                  <th className="p-3 text-left">ชื่อ</th>
                  <th className="p-3 text-left">BU</th>
                  <th className="p-3 text-left">ฝ่าย</th>
                </tr>
              </thead>
              <tbody>
                {nonResponders.map((employee) => (
                  <tr key={employee.employee_id} className="border-t border-slate-100">
                    <td className="p-3">{employee.employee_id}</td>
                    <td className="p-3">{[employee.name, employee.surname].filter(Boolean).join(" ")}</td>
                    <td className="p-3">{employee.bu || "-"}</td>
                    <td className="p-3">{employee.department || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-semibold">Import Employee Master</h2>
          <p className="mt-1 text-sm text-slate-500">รองรับ CSV Header: employeeId, name, surname, nickname, email, BU, department, section, jobLevel, status</p>
          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-emerald-400">
            <Upload className="text-emerald-600" />
            <span className="mt-3 text-sm">{file ? file.name : "เลือกไฟล์ CSV"}</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </label>
          <button onClick={importCsv} disabled={!file || importing} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-40">
            {importing ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            นำเข้าข้อมูล
          </button>
          {importMessage && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">{importMessage}</div>}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Icon /></div>
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-3xl font-bold">{value}</div>
      </div>
    </div>
  );
}
