import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Layers3,
  Smartphone,
  TestTube2,
} from "lucide-react";
import { SURVEY_DEFINITIONS } from "@/data/surveys";
import type { PilotStatus } from "@/lib/pilot-status";
import type { SurveyType } from "@/types";

export function PilotHub({
  employeeName,
  status,
}: {
  employeeName: string;
  status: PilotStatus;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="card overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 p-6 text-white sm:p-7 md:p-9">
          <div className="text-sm font-semibold text-emerald-100">
            CULTURE SURVEY PILOT
          </div>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            สวัสดี {employeeName}
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-emerald-50">
            กรุณาทดลองแบบสำรวจทั้ง 2 ชุดตามลำดับที่ระบบกำหนด จากนั้นทดลองรูปแบบการตอบ Current และ Desired ในขั้นตอนสุดท้าย
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-3 md:p-8">
          <InfoCard
            icon={Layers3}
            title="2 ชุดคำถาม"
            detail="Scenario-Based และแบบคำถามอย่างง่าย"
          />
          <InfoCard
            icon={Smartphone}
            title="รองรับมือถือ"
            detail="หน้าจอจะเรียงเนื้อหาให้เหมาะกับการตอบผ่านโทรศัพท์"
          />
          <InfoCard
            icon={TestTube2}
            title="ทดสอบ Survey Mode"
            detail="ทดลอง Side-by-Side และ Sequential ในขั้นตอนสุดท้าย"
          />
        </div>
      </section>

      <section className="card p-5 sm:p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">ลำดับการทดลองของคุณ</h2>
            <p className="mt-1 text-sm text-slate-500">
              ระบบจัดลำดับให้อัตโนมัติเพื่อลดผลจากการทำชุดใดชุดหนึ่งก่อน
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {status.orderGroup === "scenario_first"
              ? "กลุ่ม Scenario ก่อน"
              : "กลุ่ม Simple ก่อน"}
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {status.order.map((type, index) => (
            <SurveyStep
              key={type}
              number={index + 1}
              type={type}
              surveyCompleted={status.completed[type]}
            />
          ))}
          <div className="flex gap-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
            <StatusIcon complete={status.modeTestCompleted} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-500">STEP 3</div>
              <div className="mt-1 font-semibold">
                ทดลอง Survey Mode
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                ทดลอง Mini Interactive Mockup ของ Side-by-Side และ Sequential แล้วเลือกแบบที่ใช้งานชัดเจนกว่า
              </p>
            </div>
          </div>
        </div>

        <Link
          href={status.nextPath}
          className="focus-ring mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white hover:bg-emerald-700"
        >
          {status.pilotCompleted ? "ดูหน้าสรุปการเข้าร่วม" : "ดำเนินการต่อ"}
          <ArrowRight size={19} />
        </Link>
      </section>

      <p className="px-2 text-xs leading-5 text-slate-500">
        ผล Culture ถูกเก็บแยกจากรหัสพนักงาน รหัสพนักงานใช้เฉพาะตรวจสอบสิทธิ์ ติดตามการทำครบ และจัดลำดับการทดลองเท่านั้น
      </p>
    </div>
  );
}

function SurveyStep({
  number,
  type,
  surveyCompleted,
}: {
  number: number;
  type: SurveyType;
  surveyCompleted: boolean;
}) {
  const definition = SURVEY_DEFINITIONS[type];

  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
      <StatusIcon complete={surveyCompleted} />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-slate-500">STEP {number}</div>
        <div className="mt-1 font-semibold">{definition.name}</div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{definition.description}</p>
        <div
          className={`mt-3 text-xs font-semibold ${
            surveyCompleted ? "text-emerald-700" : "text-slate-500"
          }`}
        >
          {surveyCompleted ? "ทำแบบสำรวจครบแล้ว" : "ยังไม่ได้เริ่ม"}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ complete }: { complete: boolean }) {
  if (complete) {
    return <CheckCircle2 className="mt-1 shrink-0 text-emerald-600" size={28} />;
  }
  return <Circle className="mt-1 shrink-0 text-slate-300" size={28} />;
}

function InfoCard({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Layers3;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon className="text-emerald-600" size={24} />
      <div className="mt-3 font-semibold">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-500">{detail}</div>
    </div>
  );
}
