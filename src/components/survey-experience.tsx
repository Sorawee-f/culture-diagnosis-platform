"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { SurveyForm } from "@/components/survey-form";

const INTRO_KEY = "culture-survey-intro-accepted";

export function SurveyExperience({
  employeeName,
  employeeId,
  surveyVersion,
}: {
  employeeName: string;
  employeeId: string;
  surveyVersion: string;
}) {
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setAccepted(sessionStorage.getItem(INTRO_KEY) === "true");
    setReady(true);
  }, []);

  function accept() {
    sessionStorage.setItem(INTRO_KEY, "true");
    setAccepted(true);
  }

  if (!ready) return null;

  return (
    <>
      <SurveyForm
        employeeName={employeeName}
        employeeId={employeeId}
        surveyVersion={surveyVersion}
        surveyType="scenario"
      />
      {!accepted && <SurveyIntroModal onAccept={accept} />}
    </>
  );
}

function SurveyIntroModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="survey-intro-title"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-700 to-emerald-500 p-6 text-white sm:p-8">
          <div className="text-sm font-semibold text-emerald-100">ก่อนเริ่มแบบประเมิน</div>
          <h1 id="survey-intro-title" className="mt-1 text-2xl font-bold sm:text-3xl">
            คำอธิบายและวิธีตอบแบบประเมิน
          </h1>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5 text-[15px] leading-7 text-slate-700 sm:p-8">
          <div className="space-y-3">
            <p>
              แบบประเมินนี้ต้องการสำรวจวิธีการทำงานที่ <strong>“เกิดขึ้นจริง”</strong> ในฝ่ายของคุณ และวิธีการทำงานที่คุณ <strong>“อยากเห็น”</strong> ในอนาคต เพื่อให้เข้าใจรูปแบบการทำงานและวัฒนธรรมการทำงานขององค์กรในปัจจุบัน และนำไปใช้เป็นข้อมูลในการกำหนดแนวทางการพัฒนาองค์กรในอนาคต
            </p>
            <p>
              แต่ละข้อจะเป็นสถานการณ์ที่อาจเกิดขึ้นในการทำงาน และมีแนวทางให้เลือก 4 แบบ โดยไม่มีคำตอบที่ถูกหรือผิด
            </p>
            <p>
              ขอให้เลือกคำตอบจาก <strong>“ภาพรวมที่เกิดขึ้นเป็นประจำ”</strong> มากกว่าการนึกถึงเหตุการณ์ใดเหตุการณ์หนึ่งเป็นพิเศษ
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-950">นิยามคำที่ใช้ในแบบประเมิน</h2>
            <ul className="mt-3 space-y-3 pl-5">
              <li className="list-disc">
                <strong>“ฝ่าย”</strong> หมายถึง หน่วยงานที่คุณสังกัดอยู่ในปัจจุบัน โดยให้นึกถึงภาพรวมของวิธีการทำงาน การตัดสินใจ และการทำงานร่วมกันภายในฝ่าย
              </li>
              <li className="list-disc">
                <strong>“ผู้บังคับบัญชาสูงสุดในฝ่าย”</strong> หมายถึง ผู้บริหารหรือหัวหน้าที่รับผิดชอบภาพรวมของฝ่ายที่คุณสังกัดอยู่ เช่น ผู้อำนวยการฝ่าย หรือผู้ที่ทำหน้าที่ในระดับเทียบเท่า
              </li>
              <li className="list-disc">
                <strong>“ลูกค้า”</strong> หมายถึง ผู้ที่ฝ่ายต้องส่งมอบงานหรือผลลัพธ์ให้ ซึ่งอาจเป็นลูกค้าภายนอก ผู้ชม ผู้ใช้บริการ หรือหน่วยงานภายในองค์กร ตามลักษณะงานของแต่ละฝ่าย
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <span className="font-bold">กลุ่มเป้าหมาย:</span> พนักงานอายุงาน 6 เดือนขึ้นไป
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-950">วิธีตอบแบบประเมิน</h2>
            <p className="mt-2">ในแต่ละสถานการณ์ ให้ตอบ 2 มุมมอง ได้แก่</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="font-bold text-blue-950">1. ปัจจุบัน — สิ่งที่เป็นอยู่ในปัจจุบัน</div>
                <p className="mt-1 text-sm leading-6 text-blue-900">
                  เลือกคำตอบที่ใกล้เคียงกับ “สิ่งที่เกิดขึ้นจริงในฝ่ายของคุณมากที่สุด”
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="font-bold text-emerald-950">2. อนาคต — สิ่งที่อยากเห็นในอนาคต</div>
                <p className="mt-1 text-sm leading-6 text-emerald-900">
                  เลือกคำตอบที่ใกล้เคียงกับ “วิธีการทำงานที่คุณอยากเห็นในฝ่ายของคุณในอนาคตมากที่สุด”
                </p>
              </div>
            </div>
            <p className="mt-3 font-semibold text-slate-950">
              กรุณาตอบตามสิ่งที่คุณเห็นและประสบจากการทำงานจริง
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white p-4 sm:p-5">
          <button
            type="button"
            onClick={onAccept}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white hover:bg-emerald-700"
          >
            <CheckCircle2 size={20} /> เข้าใจและตกลง
          </button>
        </div>
      </section>
    </div>
  );
}
