"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  RotateCcw,
  Send,
} from "lucide-react";
import { SCENARIO_QUESTIONS } from "@/data/surveys";

const MODE_OPTIONS = [
  { value: "side_by_side", label: "Mode A: Current + Desired ในข้อเดียว" },
  { value: "sequential", label: "Mode B: Sequential" },
  { value: "no_difference", label: "ไม่แตกต่างกัน" },
] as const;

type ModeChoice = (typeof MODE_OPTIONS)[number]["value"];

export function PilotModeTestForm() {
  const router = useRouter();
  const example = SCENARIO_QUESTIONS[0];
  const [modeACurrent, setModeACurrent] = useState("");
  const [modeADesired, setModeADesired] = useState("");
  const [modeBCurrent, setModeBCurrent] = useState("");
  const [modeBDesired, setModeBDesired] = useState("");
  const [modeBPhase, setModeBPhase] = useState<"current" | "desired">("current");
  const [preferredMode, setPreferredMode] = useState<ModeChoice | "">("");
  const [clearerMode, setClearerMode] = useState<ModeChoice | "">("");
  const [completionMode, setCompletionMode] = useState<ModeChoice | "">("");
  const [modeReason, setModeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const modeAComplete = Boolean(modeACurrent && modeADesired);
  const modeBComplete = Boolean(modeBCurrent && modeBDesired);
  const formComplete = Boolean(
    modeAComplete &&
      modeBComplete &&
      preferredMode &&
      clearerMode &&
      completionMode,
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!formComplete) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/pilot/final-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredMode,
          clearerMode,
          completionMode,
          modeReason,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "บันทึกผลการทดลองไม่สำเร็จ");
      }
      router.push("/completed");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl space-y-7">
      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5 sm:p-6 md:p-8">
          <div className="text-sm font-semibold text-emerald-700">
            MINI INTERACTIVE MODE TEST
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            ทดลองตอบรูปแบบหน้าจอ 2 แบบ
          </h1>
          <p className="mt-2 max-w-3xl leading-7 text-slate-500">
            ใช้คำถามตัวอย่างเดียวกันเพื่อเปรียบเทียบประสบการณ์ คำตอบตัวอย่างส่วนนี้จะไม่ถูกนำไปคำนวณผล Culture
          </p>
        </div>

        <div className="grid gap-6 p-4 sm:p-5 md:p-8 xl:grid-cols-2">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-blue-700">MODE A</div>
                <h2 className="mt-1 text-xl font-bold">Current + Desired ในข้อเดียว</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  บนมือถือ Current และ Desired จะเรียงต่อกันในหน้าเดียวกัน
                </p>
              </div>
              {modeAComplete && (
                <CheckCircle2 className="shrink-0 text-emerald-600" />
              )}
            </div>
            <DemoQuestionHeader title={example.title} prompt={example.prompt} />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <DemoChoicePanel
                title="ปัจจุบัน"
                tone="current"
                options={example.options}
                selected={modeACurrent}
                onSelect={setModeACurrent}
              />
              <DemoChoicePanel
                title="อนาคต"
                tone="desired"
                options={example.options}
                selected={modeADesired}
                onSelect={setModeADesired}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50/30 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-violet-700">MODE B</div>
                <h2 className="mt-1 text-xl font-bold">Sequential</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  ตอบ Current ให้ครบก่อน แล้วจึงเข้าสู่ส่วน Desired
                </p>
              </div>
              {modeBComplete && (
                <CheckCircle2 className="shrink-0 text-emerald-600" />
              )}
            </div>
            <DemoQuestionHeader title={example.title} prompt={example.prompt} />
            <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-violet-800">
              {modeBPhase === "current"
                ? "Part 1: สิ่งที่เป็นอยู่ในปัจจุบัน"
                : "Part 2: อนาคตที่อยากเห็น"}
            </div>
            <div className="mt-4">
              <DemoChoicePanel
                title={modeBPhase === "current" ? "ปัจจุบัน" : "อนาคต"}
                tone={modeBPhase}
                options={example.options}
                selected={modeBPhase === "current" ? modeBCurrent : modeBDesired}
                onSelect={modeBPhase === "current" ? setModeBCurrent : setModeBDesired}
              />
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {modeBPhase === "desired" && (
                <button
                  type="button"
                  onClick={() => setModeBPhase("current")}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <RotateCcw size={16} /> กลับไปดู Current
                </button>
              )}
              {modeBPhase === "current" && (
                <button
                  type="button"
                  disabled={!modeBCurrent}
                  onClick={() => setModeBPhase("desired")}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  ไปส่วน Desired <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6 md:p-8">
        <div className="text-sm font-semibold text-emerald-700">
          MODE TEST RESULT
        </div>
        <h2 className="mt-2 text-2xl font-bold">หลังทดลองทั้งสองแบบ</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          กรุณาเลือกจากประสบการณ์ใช้งานหน้าจอ เพื่อช่วยยืนยันรูปแบบที่เหมาะสำหรับการใช้งานจริง
        </p>
        <div className="mt-6 space-y-6">
          <ModeQuestion
            title="รูปแบบใดใช้งานได้สะดวกกว่า"
            value={preferredMode}
            onChange={setPreferredMode}
          />
          <ModeQuestion
            title="รูปแบบใดช่วยให้แยก Current กับ Desired ได้ชัดกว่า"
            value={clearerMode}
            onChange={setClearerMode}
          />
          <ModeQuestion
            title="รูปแบบใดมีโอกาสทำให้พนักงานตอบจบมากกว่า"
            value={completionMode}
            onChange={setCompletionMode}
          />
        </div>

        <label className="mt-6 block font-medium">
          ข้อสังเกตจากการทดสอบหน้าจอ (ไม่บังคับ)
        </label>
        <textarea
          value={modeReason}
          onChange={(event) => setModeReason(event.target.value)}
          rows={3}
          maxLength={1500}
          className="focus-ring mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
          placeholder="เช่น ตัวหนังสือเล็ก ปุ่มกดยาก ต้องเลื่อนหน้าจอมาก หรือแยกสองส่วนแล้วเข้าใจง่ายกว่า"
        />

        {(!modeAComplete || !modeBComplete) && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            กรุณาลองเลือกคำตอบใน Mini Demo ให้ครบทั้ง Mode A และ Mode B ก่อนส่งผลการทดสอบ
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-rose-700">
            {error}
          </div>
        )}
        <button
          disabled={!formComplete || submitting}
          className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? (
            <Loader2 className="animate-spin" size={19} />
          ) : (
            <Send size={19} />
          )}
          ส่งผลการทดสอบระบบ
        </button>
      </section>
    </form>
  );
}

function SelectionButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring rounded-2xl border p-4 text-left font-semibold transition ${
        active
          ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100"
          : "border-slate-200 bg-white hover:border-emerald-300"
      }`}
    >
      {label}
    </button>
  );
}

function ModeQuestion({
  title,
  value,
  onChange,
}: {
  title: string;
  value: ModeChoice | "";
  onChange: (value: ModeChoice) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
      <div className="font-medium leading-6">{title}</div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {MODE_OPTIONS.map((option) => (
          <SelectionButton
            key={option.value}
            active={value === option.value}
            onClick={() => onChange(option.value)}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );
}

function DemoQuestionHeader({ title, prompt }: { title: string; prompt: string }) {
  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
      <div className="font-semibold leading-6">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-500">{prompt}</div>
    </div>
  );
}

function DemoChoicePanel({
  title,
  tone,
  options,
  selected,
  onSelect,
}: {
  title: string;
  tone: "current" | "desired";
  options: { id: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const activeClass =
    tone === "current"
      ? "border-blue-500 bg-blue-50"
      : "border-emerald-500 bg-emerald-50";
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`focus-ring w-full rounded-xl border p-3 text-left text-sm leading-6 transition ${
              selected === option.id
                ? activeClass
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
