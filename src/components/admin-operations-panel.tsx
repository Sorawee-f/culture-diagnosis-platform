"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Users } from "lucide-react";

type DepartmentProgress = {
  bu: string;
  department: string;
  eligible: number;
  completed: number;
  pending: number;
  responseRate: number;
};

type OperationsData = {
  employeeMaster: {
    activeEmployees: number;
    lastUpdatedAt: string | null;
  };
  departmentProgress: DepartmentProgress[];
};

type MasterSyncResult = {
  ok: boolean;
  sheetName: string;
  rowsRead: number;
  imported: number;
  skipped: number;
  added: number;
  updated: number;
  syncedAt: string;
};

export function AdminOperationsPanel() {
  const [data, setData] = useState<OperationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/operations", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "โหลดข้อมูลไม่สำเร็จ");
      setData(payload as OperationsData);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function syncEmployeeMaster() {
    setSyncing(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/employees/sync-google-sheets", {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Sync Employee Master ไม่สำเร็จ");
      const result = payload as MasterSyncResult;
      setMessage(
        `Sync สำเร็จจาก ${result.sheetName} · ${result.imported} คน · เพิ่มใหม่ ${result.added} · อัปเดต ${result.updated}` +
          (result.skipped ? ` · ข้าม ${result.skipped}` : ""),
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sync Employee Master ไม่สำเร็จ");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section className="mb-6 space-y-4">
      <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-emerald-700">EMPLOYEE MASTER</div>
              <h2 className="mt-1 text-xl font-bold">ข้อมูลพนักงานที่ระบบใช้งาน</h2>
            </div>
            <Users className="text-emerald-600" size={26} />
          </div>

          {loading && !data ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="animate-spin" size={18} /> กำลังโหลดข้อมูล
            </div>
          ) : (
            <>
              <div className="mt-6 text-4xl font-bold text-slate-950">
                {data?.employeeMaster.activeEmployees ?? 0}
              </div>
              <div className="mt-1 text-sm text-slate-500">Active Employees ใน Supabase</div>
              <div className="mt-4 text-xs text-slate-400">
                อัปเดตข้อมูลล่าสุด: {formatDateTime(data?.employeeMaster.lastUpdatedAt)}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={syncEmployeeMaster}
            disabled={syncing}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {syncing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            Sync Employee Master จาก Google Sheets
          </button>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            ใช้ Tab ชื่อ <strong>Employee_Master</strong> ใน Google Sheet เดียวกับระบบ Sync ข้อมูล
            โดยระบบจะเพิ่มพนักงานใหม่และอัปเดตพนักงานเดิมจาก Employee ID
          </p>
        </div>

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <div className="text-sm font-semibold text-emerald-700">RESPONSE PROGRESS</div>
              <h2 className="mt-1 text-xl font-bold">อัตราการตอบรายฝ่าย</h2>
              <p className="mt-1 text-sm text-slate-500">เรียงฝ่ายที่มี Response Rate ต่ำขึ้นก่อน เพื่อใช้ Follow-up</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>

          <div className="max-h-[360px] overflow-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="p-3 text-left">BU</th>
                  <th className="p-3 text-left">ฝ่าย</th>
                  <th className="p-3 text-right">Eligible</th>
                  <th className="p-3 text-right">Completed</th>
                  <th className="p-3 text-right">Pending</th>
                  <th className="p-3 text-right">Response Rate</th>
                </tr>
              </thead>
              <tbody>
                {(data?.departmentProgress ?? []).map((row) => (
                  <tr key={`${row.bu}-${row.department}`} className="border-t border-slate-100">
                    <td className="p-3">{row.bu}</td>
                    <td className="p-3 font-medium">{row.department}</td>
                    <td className="p-3 text-right">{row.eligible}</td>
                    <td className="p-3 text-right">{row.completed}</td>
                    <td className="p-3 text-right">{row.pending}</td>
                    <td className="p-3 text-right">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${rateClass(row.responseRate)}`}>
                        {row.responseRate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && (data?.departmentProgress.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">ยังไม่มีข้อมูลพนักงาน</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {message && (
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> {message}
        </div>
      )}
      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    </section>
  );
}

function rateClass(rate: number) {
  if (rate >= 80) return "bg-emerald-100 text-emerald-800";
  if (rate >= 60) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
