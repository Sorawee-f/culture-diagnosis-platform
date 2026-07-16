"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Loader2,
  Send,
} from "lucide-react";
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
  const currentSelected = Boolean(current?.currentOptionId);
  const desiredSelected = Boolean(current?.desiredOptionId);
  const scenarioComplete = currentSelected && desiredSelected;
  const completed = Object.keys(answers).filter(
    (key) => answers[key].currentOptionId && answers[key].desiredOptionId,
  ).length;
  const progress = Math.round((completed / SCENARIOS.length) * 100);

  const allComplete = useMemo(
    () =>
      SCENARIOS.every(
        (s) => answers[s.id]?.currentOptionId && answers[s.id]?.desiredOptionId,
      ),
    [answers],
  );

  function choose(mode: "current" | "desired", optionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [scenario.id]: {
        scenarioId: scenario.id,
        currentOptionId:
          mode === "current"
            ? optionId
            : prev[scenario.id]?.currentOptionId ?? "",
        desiredOptionId:
          mode === "desired"
            ? optionId
            : prev[scenario.id]?.desiredOptionId ?? "",
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
      if (!response.ok) {
        throw new Error(data.message ?? "ส่งแบบประเมินไม่สำเร็จ");
      }
      sessionStorage.setItem(
        "culture-survey-result",
        JSON.stringify(data.summary),
      );
      router.push("/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">ผู้ประเมิน</div>
          <div className="text-xl font-semibold">{employeeName}</div>
        </div>
        <div className="min-w-56 text-right">
          <div className="mb-2 text-sm text-slate-500">
            ตอบครบแล้ว {completed}/{SCENARIOS.length} สถานการณ์
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium text-emerald-700">
              สถานการณ์ {index + 1} จาก {SCENARIOS.length}
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              {scenario.dimension}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-bold md:text-3xl">
            {scenario.title}
          </h1>
          <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
            {scenario.prompt}
          </p>
        </div>

        <div className="mx-5 mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 md:mx-8">
          <span className="font-semibold">แต่ละสถานการณ์ต้องตอบ 2 มุมมอง:</span>{" "}
          เลือกหนึ่งคำตอบสำหรับสิ่งที่เกิดขึ้นจริงในปัจจุบัน และอีกหนึ่งคำตอบสำหรับสิ่งที่อยากเห็นในอนาคต
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-2 md:gap-0 md:p-8">
          <ChoicePanel
            step="1"
            tone="current"
            title="สิ่งที่เป็นอยู่ในปัจจุบัน"
            subtitle="จากประสบการณ์จริง วันนี้องค์กรมักทำแบบไหน"
            selected={current?.currentOptionId}
            options={scenario.options}
            onSelect={(id) => choose("current", id)}
          />

          <div className="relative border-t border-dashed border-slate-300 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 md:left-0 md:top-8 md:-translate-x-1/2 md:translate-y-0">
              แล้วจึงตอบ
            </div>
            <ChoicePanel
              step="2"
              tone="desired"
              title="อนาคตที่อยากเห็น"
              subtitle="ในอนาคต คุณอยากให้องค์กรทำแบบไหน"
              selected={current?.desiredOptionId}
              options={scenario.options}
              onSelect={(id) => choose("desired", id)}
            />
          </div>
        </div>

        <div className="mx-5 mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:mx-8 md:mb-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <AnswerStatus label="ปัจจุบัน" complete={currentSelected} tone="current" />
              <AnswerStatus label="อนาคต" complete={desiredSelected} tone="desired" />
            </div>
            <div
              className={`text-sm font-semibold ${
                scenarioComplete ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {scenarioComplete
                ? "ตอบครบทั้ง 2 มุมมองแล้ว"
                : `ตอบแล้ว ${Number(currentSelected) + Number(desiredSelected)} จาก 2 มุมมอง`}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5 md:p-6">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-medium disabled:opacity-40"
          >
            <ChevronLeft size={18} /> ก่อนหน้า
          </button>

          <div className="flex gap-2">
            {SCENARIOS.map((s, i) => (
              <button
                key={s.id}
                aria-label={`ไปข้อ ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2.5 w-2.5 rounded-full ${
                  answers[s.id]?.currentOptionId && answers[s.id]?.desiredOptionId
                    ? "bg-emerald-600"
                    : i === index
                      ? "bg-amber-400"
                      : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {index < SCENARIOS.length - 1 ? (
            <div className="text-right">
              <button
                onClick={() =>
                  setIndex((i) => Math.min(SCENARIOS.length - 1, i + 1))
                }
                disabled={!scenarioComplete}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                ถัดไป <ChevronRight size={18} />
              </button>
              {!scenarioComplete && (
                <div className="mt-2 text-xs text-amber-700">
                  กรุณาตอบทั้งปัจจุบันและอนาคตก่อน
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={submit}
              disabled={!allComplete || submitting}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}{" "}
              ส่งแบบประเมิน
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}

function AnswerStatus({
  label,
  complete,
  tone,
}: {
  label: string;
  complete: boolean;
  tone: "current" | "desired";
}) {
  const completeClass =
    tone === "current" ? "text-blue-700" : "text-emerald-700";

  return (
    <div className={`inline-flex items-center gap-2 ${complete ? completeClass : "text-slate-500"}`}>
      {complete ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      <span>
        {label}: {complete ? "เลือกแล้ว" : "ยังไม่ได้เลือก"}
      </span>
    </div>
  );
}

function ChoicePanel({
  step,
  tone,
  title,
  subtitle,
  options,
  selected,
  onSelect,
}: {
  step: string;
  tone: "current" | "desired";
  title: string;
  subtitle: string;
  options: { id: string; label: string }[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  const theme =
    tone === "current"
      ? {
          shell: "border-blue-200 bg-blue-50/40 md:mr-8",
          header: "border-blue-200 bg-blue-50",
          badge: "bg-blue-600 text-white",
          title: "text-blue-900",
          status: "text-blue-700",
          active: "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200",
          hover: "hover:border-blue-300 hover:bg-blue-50/50",
          optionBadge: "bg-blue-600 text-white",
          icon: "text-blue-600",
        }
      : {
          shell: "border-emerald-200 bg-emerald-50/40",
          header: "border-emerald-200 bg-emerald-50",
          badge: "bg-emerald-600 text-white",
          title: "text-emerald-900",
          status: "text-emerald-700",
          active:
            "border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-200",
          hover: "hover:border-emerald-300 hover:bg-emerald-50/50",
          optionBadge: "bg-emerald-600 text-white",
          icon: "text-emerald-600",
        };

  return (
    <div className={`overflow-hidden rounded-3xl border ${theme.shell}`}>
      <div className={`border-b px-5 py-4 ${theme.header}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${theme.badge}`}
            >
              {step}
            </span>
            <div>
              <div className={`font-bold ${theme.title}`}>{title}</div>
              <div className="mt-1 text-sm leading-5 text-slate-600">
                {subtitle}
              </div>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold shadow-sm ${
              selected ? theme.status : "text-slate-500"
            }`}
          >
            {selected ? "เลือกแล้ว" : "ยังไม่ได้เลือก"}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4 md:p-5">
        {options.map((option, idx) => {
          const active = selected === option.id;
          return (
            <button
              type="button"
              key={option.id}
              onClick={() => onSelect(option.id)}
              aria-pressed={active}
              className={`focus-ring flex w-full items-start gap-3 rounded-2xl border bg-white p-4 text-left transition ${
                active ? theme.active : `border-slate-200 ${theme.hover}`
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                  active
                    ? theme.optionBadge
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1 leading-6">{option.label}</span>
              {active && (
                <CheckCircle2 className={`shrink-0 ${theme.icon}`} size={20} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
