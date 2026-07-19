"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Loader2,
  Send,
} from "lucide-react";
import { getSurveyDefinition } from "@/data/surveys";
import type { SurveyAnswer, SurveyType } from "@/types";

export function SurveyForm({
  employeeName,
  surveyType,
}: {
  employeeName: string;
  surveyType: SurveyType;
}) {
  const router = useRouter();
  const definition = getSurveyDefinition(surveyType);
  const questions = definition.questions;
  const startedAt = useRef(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const question = questions[index];
  const answer = answers[question.id];
  const currentSelected = Boolean(answer?.currentOptionId);
  const desiredSelected = Boolean(answer?.desiredOptionId);
  const questionComplete = currentSelected && desiredSelected;
  const completed = questions.filter(
    (item) =>
      answers[item.id]?.currentOptionId && answers[item.id]?.desiredOptionId,
  ).length;
  const progress = Math.round((completed / questions.length) * 100);

  const allComplete = useMemo(
    () =>
      questions.every(
        (item) =>
          answers[item.id]?.currentOptionId &&
          answers[item.id]?.desiredOptionId,
      ),
    [answers, questions],
  );

  function choose(mode: "current" | "desired", optionId: string) {
    setAnswers((previous) => ({
      ...previous,
      [question.id]: {
        questionId: question.id,
        currentOptionId:
          mode === "current"
            ? optionId
            : previous[question.id]?.currentOptionId ?? "",
        desiredOptionId:
          mode === "desired"
            ? optionId
            : previous[question.id]?.desiredOptionId ?? "",
      },
    }));
  }

  async function submit() {
    if (!allComplete) return;
    setSubmitting(true);
    setError("");

    try {
      const durationSeconds = Math.max(
        1,
        Math.round((Date.now() - (startedAt.current || Date.now())) / 1000),
      );
      const response = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyType,
          surveyMode: "side_by_side",
          durationSeconds,
          answers: questions.map((item) => answers[item.id]),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "ส่งแบบสำรวจไม่สำเร็จ");
      }
      router.push("/pilot");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">ผู้ทดลอง</div>
          <div className="text-xl font-semibold">{employeeName}</div>
          <div className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            {definition.name}
          </div>
        </div>
        <div className="w-full text-left sm:w-auto sm:min-w-56 sm:text-right">
          <div className="mb-2 text-sm text-slate-500">
            ตอบครบแล้ว {completed}/{questions.length} ข้อ
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
              {definition.itemLabel} {index + 1} จาก {questions.length}
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              {question.dimension}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-bold md:text-3xl">
            {question.title}
          </h1>
          <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
            {question.prompt}
          </p>
        </div>

        <div className="mx-5 mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 md:mx-8">
          <span className="font-semibold">แต่ละข้อต้องตอบ 2 มุมมอง:</span>{" "}
          เลือกหนึ่งคำตอบสำหรับสิ่งที่เกิดขึ้นจริงในปัจจุบัน และอีกหนึ่งคำตอบสำหรับสิ่งที่อยากเห็นในอนาคต
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-2 md:gap-0 md:p-8">
          <ChoicePanel
            step="1"
            tone="current"
            title="สิ่งที่เป็นอยู่ในปัจจุบัน"
            subtitle="จากประสบการณ์จริง วันนี้องค์กรมักทำแบบไหน"
            selected={answer?.currentOptionId}
            options={question.options}
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
              selected={answer?.desiredOptionId}
              options={question.options}
              onSelect={(id) => choose("desired", id)}
            />
          </div>
        </div>

        <div className="mx-5 mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:mx-8 md:mb-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <AnswerStatus
                label="ปัจจุบัน"
                complete={currentSelected}
                tone="current"
              />
              <AnswerStatus
                label="อนาคต"
                complete={desiredSelected}
                tone="desired"
              />
            </div>
            <div
              className={`text-sm font-semibold ${
                questionComplete ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {questionComplete
                ? "ตอบครบทั้ง 2 มุมมองแล้ว"
                : `ตอบแล้ว ${Number(currentSelected) + Number(desiredSelected)} จาก 2 มุมมอง`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 items-center gap-3 border-t border-slate-100 p-5 md:flex md:flex-wrap md:justify-between md:p-6">
          <button
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
            disabled={index === 0}
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-medium disabled:opacity-40 md:w-auto"
          >
            <ChevronLeft size={18} /> ก่อนหน้า
          </button>

          <div className="order-first col-span-2 flex flex-wrap justify-center gap-2 md:order-none md:col-span-1">
            {questions.map((item, itemIndex) => (
              <button
                key={item.id}
                aria-label={`ไปข้อ ${itemIndex + 1}`}
                onClick={() => setIndex(itemIndex)}
                className={`h-2.5 w-2.5 rounded-full ${
                  answers[item.id]?.currentOptionId &&
                  answers[item.id]?.desiredOptionId
                    ? "bg-emerald-600"
                    : itemIndex === index
                      ? "bg-amber-400"
                      : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {index < questions.length - 1 ? (
            <div className="w-full text-right md:w-auto">
              <button
                onClick={() =>
                  setIndex((value) => Math.min(questions.length - 1, value + 1))
                }
                disabled={!questionComplete}
                className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
              >
                ถัดไป <ChevronRight size={18} />
              </button>
              {!questionComplete && (
                <div className="mt-2 text-xs text-amber-700">
                  กรุณาตอบทั้งปัจจุบันและอนาคตก่อน
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={submit}
              disabled={!allComplete || submitting}
              className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}{" "}
              ส่งชุดคำถามนี้
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
    <div
      className={`inline-flex items-center gap-2 ${
        complete ? completeClass : "text-slate-500"
      }`}
    >
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
          title: "text-blue-950",
          selected: "border-blue-500 bg-blue-50 ring-2 ring-blue-100",
          dot: "border-blue-600 bg-blue-600",
        }
      : {
          shell: "border-emerald-200 bg-emerald-50/40",
          header: "border-emerald-200 bg-emerald-50",
          badge: "bg-emerald-600 text-white",
          title: "text-emerald-950",
          selected: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100",
          dot: "border-emerald-600 bg-emerald-600",
        };

  return (
    <div className={`overflow-hidden rounded-2xl border ${theme.shell}`}>
      <div className={`border-b p-4 ${theme.header}`}>
        <div className="flex items-start gap-3">
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${theme.badge}`}
          >
            {step}
          </span>
          <div>
            <h2 className={`font-semibold ${theme.title}`}>{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {options.map((option) => {
          const active = selected === option.id;
          return (
            <button
              type="button"
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`focus-ring flex w-full items-start gap-3 rounded-xl border bg-white p-4 text-left transition ${
                active
                  ? theme.selected
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 ${
                  active ? theme.dot : "border-slate-300 bg-white"
                }`}
              >
                {active && (
                  <span className="block h-full w-full scale-50 rounded-full bg-white" />
                )}
              </span>
              <span className="leading-6">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
