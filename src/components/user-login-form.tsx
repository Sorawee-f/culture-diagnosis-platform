"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

export function UserLoginForm() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/employee/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      router.push(data.alreadySubmitted ? "/already-submitted" : "/survey");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium">รหัสพนักงาน</label>
        <input
          required
          inputMode="numeric"
          autoComplete="username"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value.trim())}
          className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
          placeholder="เช่น 8011"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">รหัสผ่าน</label>
        <input
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value.trim())}
          className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
          placeholder="พิมพ์รหัสพนักงานอีกครั้ง"
        />
        <p className="mt-2 text-xs text-slate-500">รหัสผ่านตั้งต้นคือรหัสพนักงานของคุณ</p>
      </div>
      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <button disabled={loading} className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
        {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
        เข้าสู่แบบประเมิน
      </button>
    </form>
  );
}
