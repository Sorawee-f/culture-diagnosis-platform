"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { ARCHETYPE_META } from "@/data/archetypes";
import { ARCHETYPES, type SurveySummary } from "@/types";
import { SCENARIO_QUESTIONS } from "@/data/surveys";
import { CheckCircle2, Home } from "lucide-react";

const subscribe = () => () => undefined;

export function ResultView({ initialSummary = null }: { initialSummary?: SurveySummary | null }) {
  const raw = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem("culture-survey-result"),
    () => null,
  );
  const summary = useMemo<SurveySummary | null>(() => (raw ? JSON.parse(raw) : initialSummary), [raw, initialSummary]);

  if (!summary) {
    return (
      <div className="card p-8 text-center">
        <p>ไม่พบผลสรุปใน Browser นี้</p>
        <Link className="mt-4 inline-block text-emerald-700 underline" href="/">กลับหน้าแรก</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-7 text-center md:p-10">
        <CheckCircle2 className="mx-auto text-emerald-600" size={56} />
        <h1 className="mt-4 text-3xl font-bold">ส่งแบบประเมินเรียบร้อยแล้ว</h1>
        <p className="mt-2 text-slate-500">ขอบคุณที่ช่วยสะท้อนวิธีการทำงานที่เกิดขึ้นจริง และวิธีการทำงานที่อยากเห็นในอนาคต</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileCard title="CURRENT CULTURE" subtitle="โปรไฟล์หลักที่คุณรับรู้ในปัจจุบัน" scores={summary.currentScores} top={summary.currentTop} />
        <ProfileCard title="DESIRED CULTURE" subtitle="โปรไฟล์หลักที่คุณอยากเห็นในอนาคต" scores={summary.desiredScores} top={summary.desiredTop} />
      </div>
      <div className="card p-6">
        <h2 className="text-xl font-semibold">Current–Desired Gap จากคำตอบของคุณ</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ARCHETYPES.map((key) => (
            <div key={key} className="rounded-xl bg-slate-50 p-4">
              <div className="font-medium">{ARCHETYPE_META[key].label}</div>
              <div className={`mt-2 text-2xl font-bold ${summary.gaps[key] > 0 ? "text-emerald-600" : summary.gaps[key] < 0 ? "text-rose-600" : "text-slate-500"}`}>
                {summary.gaps[key] > 0 ? "+" : ""}{summary.gaps[key]}
              </div>
              <div className="text-xs text-slate-500">Desired - Current</div>
            </div>
          ))}
        </div>
      </div>
      <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium">
        <Home size={18} /> กลับหน้าแรก
      </Link>
      <p className="text-xs leading-5 text-slate-500">ผลนี้เป็นภาพสะท้อนจากคำตอบในแบบประเมิน ไม่ใช่การประเมินบุคลิกภาพ ความสามารถ หรือศักยภาพของพนักงาน และควรใช้ร่วมกับข้อมูลระดับฝ่าย/องค์กรในการวิเคราะห์ต่อไป</p>
    </div>
  );
}

function ProfileCard({ title, subtitle, scores, top }: {
  title: string;
  subtitle: string;
  scores: SurveySummary["currentScores"];
  top: SurveySummary["currentTop"];
}) {
  return (
    <div className="card p-6">
      <div className="text-sm font-semibold text-emerald-700">{title}</div>
      <h2 className="mt-1 text-2xl font-bold">{top.map((key) => ARCHETYPE_META[key].label).join(" + ")}</h2>
      <p className="text-sm text-slate-500">{subtitle}</p>
      <div className="mt-6 space-y-4">
        {ARCHETYPES.map((key) => {
          const pct = Math.round((scores[key] / SCENARIO_QUESTIONS.length) * 100);
          return (
            <div key={key}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{ARCHETYPE_META[key].label} — {ARCHETYPE_META[key].thai}</span>
                <span className="font-semibold">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
