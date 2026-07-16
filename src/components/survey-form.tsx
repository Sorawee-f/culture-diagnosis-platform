"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import { SCENARIOS } from "@/data/scenarios";
import type { SurveyAnswer } from "@/types";

export function SurveyForm({ employeeName }: { employeeName: string }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const scenario = SCENARIOS[index];
  const current = answers[scenario.id];
  const completed = Object.keys(answers).filter((key) => answers[key].currentOptionId && answers[key].desiredOptionId).length;
  const progress = Math.round((completed / SCENARIOS.length) * 100);

  const allComplete = useMemo(
    () => SCENARIOS.every((s) => answers[s.id]?.currentOptionId && answers[s.id]?.desiredOptionId),
    [answers],
  );

  function choose(mode: "current" | "desired", optionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [scenario.id]: {
        scenarioId: scenario.id,
        currentOptionId: mode === "current" ? optionId : prev[scenario.id]?.currentOptionId ?? "",
        desiredOptionId: mode === "desired" ? optionId : prev[scenario.id]?.desiredOptionId ?? "",
      },
    }));
  }

  async function submit() {
    if (!allComplete) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: SCENARIOS.map((s) => answers[s.id]) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "ส่งแบบประเมินไม่สำเร็จ");
      sessionStorage.setItem("culture-survey-result", JSON.stringify(data.summary));
      router.push("/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><div className="text-sm text-slate-500">ผู้ประเมิน</div><div className="text-xl font-semibold">{employeeName}</div></div>
        <div className="min-w-56 text-right"><div className="mb-2 text-sm text-slate-500">ตอบแล้ว {completed}/{SCENARIOS.length} สถานการณ์</div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} /></div></div>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white p-6 md:p-8">
          <div className="text-sm font-medium text-emerald-700">สถานการณ์ {index + 1} จาก {SCENARIOS.length}</div>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">{scenario.title}</h1>
          <p className="mt-3 text-slate-600">{scenario.prompt}</p>
        </div>

        <div className="mx-5 mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900 md:mx-8">
          ไม่มีคำตอบถูกหรือผิด กรุณาเลือก 1 คำตอบสำหรับสิ่งที่เกิดขึ้นจริงในปัจจุบัน และ 1 คำตอบสำหรับสิ่งที่อยากเห็นในอนาคต
        </div>

        <div className="grid gap-7 p-5 md:grid-cols-2 md:p-8">
          <ChoicePanel
            title="สิ่งที่เป็นอยู่ในปัจจุบัน"
            subtitle="จากประสบการณ์จริง วันนี้องค์กรมักทำแบบไหน"
            selected={current?.currentOptionId}
            options={scenario.options}
            onSelect={(id) => choose("current", id)}
          />
          <ChoicePanel
            title="อนาคตที่อยากเห็น"
            subtitle="ในอนาคต คุณอยากให้องค์กรทำแบบไหน"
            selected={current?.desiredOptionId}
            options={scenario.options}
            onSelect={(id) => choose("desired", id)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5 md:p-6">
          <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-medium disabled:opacity-40"><ChevronLeft size={18} /> ก่อนหน้า</button>
          <div className="flex gap-2">
            {SCENARIOS.map((s, i) => <button key={s.id} aria-label={`ไปข้อ ${i + 1}`} onClick={() => setIndex(i)} className={`h-2.5 w-2.5 rounded-full ${answers[s.id]?.currentOptionId && answers[s.id]?.desiredOptionId ? "bg-emerald-600" : i === index ? "bg-amber-400" : "bg-slate-200"}`} />)}
          </div>
          {index < SCENARIOS.length - 1 ? (
            <button onClick={() => setIndex((i) => Math.min(SCENARIOS.length - 1, i + 1))} disabled={!current?.currentOptionId || !current?.desiredOptionId} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white disabled:opacity-40">ถัดไป <ChevronRight size={18} /></button>
          ) : (
            <button onClick={submit} disabled={!allComplete || submitting} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:opacity-40">{submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} ส่งแบบประเมิน</button>
          )}
        </div>
      </section>
      {error && <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-rose-700">{error}</div>}
    </div>
  );
}

function ChoicePanel({ title, subtitle, options, selected, onSelect }: {
  title: string;
  subtitle: string;
  options: { id: string; label: string }[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-4"><div className="font-semibold text-emerald-700">{title}</div><div className="text-sm text-slate-500">{subtitle}</div></div>
      <div className="space-y-3">
        {options.map((option, idx) => {
          const active = selected === option.id;
          return (
            <button type="button" key={option.id} onClick={() => onSelect(option.id)} className={`focus-ring flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${active ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-300"}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{String.fromCharCode(65 + idx)}</span>
              <span className="flex-1 leading-6">{option.label}</span>
              {active && <CheckCircle2 className="shrink-0 text-emerald-600" size={20} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
