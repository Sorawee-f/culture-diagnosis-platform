"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { ARCHETYPE_META } from "@/data/archetypes";
import type { Archetype, SurveySummary } from "@/types";
import { CheckCircle2, Home } from "lucide-react";

const subscribe = () => () => undefined;

const RESULT_DESCRIPTION: Record<Archetype, string> = {
  clan: "เน้นความร่วมมือ ความไว้ใจ การช่วยเหลือกัน และความเป็นทีม",
  adhocracy: "เน้นความคล่องตัว การทดลองสิ่งใหม่ การเรียนรู้ และการปรับตัวอย่างรวดเร็ว",
  market: "เน้นเป้าหมาย ผลลัพธ์ ความรับผิดชอบ และการตอบโจทย์ธุรกิจหรือลูกค้า",
  hierarchy: "เน้นบทบาทที่ชัดเจน ขั้นตอน มาตรฐาน และความสม่ำเสมอในการทำงาน",
};

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
        <p className="mt-2 text-slate-500">สรุปภาพที่เด่นที่สุดจากคำตอบของคุณ</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <TopResultCard
          label="CURRENT — ปัจจุบัน"
          sentence="ปัจจุบันคุณมองฝ่ายของคุณเป็น"
          top={summary.currentTop}
          tone="current"
        />
        <TopResultCard
          label="DESIRED — ความคาดหวัง"
          sentence="สิ่งที่คุณอยากเห็นในอนาคตคือ"
          top={summary.desiredTop}
          tone="desired"
        />
      </div>

      <div className="card p-6 text-center md:p-8">
        <p className="text-lg font-semibold text-slate-900">ขอบคุณสำหรับการตอบแบบสำรวจ</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          คำตอบของคุณจะถูกนำไปรวมกับข้อมูลส่วนอื่นเพื่อใช้ประกอบการพัฒนาองค์กรต่อไป
        </p>
      </div>

      <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium">
        <Home size={18} /> กลับหน้าแรก
      </Link>
    </div>
  );
}

function TopResultCard({
  label,
  sentence,
  top,
  tone,
}: {
  label: string;
  sentence: string;
  top: Archetype[];
  tone: "current" | "desired";
}) {
  const shell = tone === "current"
    ? "border-blue-200 bg-blue-50/50"
    : "border-emerald-200 bg-emerald-50/50";
  const labelClass = tone === "current" ? "text-blue-700" : "text-emerald-700";

  return (
    <div className={`rounded-2xl border p-6 md:p-7 ${shell}`}>
      <div className={`text-sm font-semibold ${labelClass}`}>{label}</div>
      <p className="mt-3 text-base text-slate-600">{sentence}</p>
      <div className="mt-3 space-y-4">
        {top.map((key) => (
          <div key={key}>
            <div className="text-2xl font-bold text-slate-950">
              {ARCHETYPE_META[key].label}
              <span className="ml-2 text-base font-medium text-slate-600">— {ARCHETYPE_META[key].thai}</span>
            </div>
            <p className="mt-2 leading-7 text-slate-700">หมายถึง {RESULT_DESCRIPTION[key]}</p>
          </div>
        ))}
      </div>
      {top.length > 1 && (
        <p className="mt-4 text-xs leading-5 text-slate-500">คะแนนสูงสุดเท่ากัน จึงแสดงมากกว่าหนึ่งรูปแบบ</p>
      )}
    </div>
  );
}
