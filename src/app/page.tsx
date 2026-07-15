import { BrandHeader } from "@/components/brand-header";
import { UserLoginForm } from "@/components/user-login-form";
import { ShieldCheck, Users, BarChart3 } from "lucide-react";

export default function HomePage() {
  const title = process.env.NEXT_PUBLIC_SURVEY_TITLE ?? "Culture Reality vs Expectation Survey";
  return (
    <main className="min-h-screen px-5 py-8 md:py-14">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-7">
          <BrandHeader />
          <div>
            <div className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">Scenario-based Culture Assessment</div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-6xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              สำรวจวัฒนธรรมที่พนักงานพบเห็นในปัจจุบัน และวัฒนธรรมที่อยากเห็นในอนาคต ผ่านสถานการณ์การทำงานจริง
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              [Users, "12 สถานการณ์", "ตอบ Current และ Desired"],
              [ShieldCheck, "ตอบได้ครั้งเดียว", "แยกข้อมูลผู้ตอบออกจากคำตอบ"],
              [BarChart3, "เห็นผลทันที", "สรุป Culture Profile หลังส่ง"],
            ].map(([Icon, titleText, detail]) => {
              const I = Icon as typeof Users;
              return <div key={String(titleText)} className="card p-4"><I className="mb-3 text-emerald-600" /><div className="font-semibold">{String(titleText)}</div><div className="mt-1 text-sm text-slate-500">{String(detail)}</div></div>;
            })}
          </div>
          <p className="text-sm text-slate-500">ข้อมูลรายบุคคลใช้เพื่อตรวจสอบสิทธิ์และติดตามอัตราการตอบเท่านั้น คำตอบถูกจัดเก็บแบบไม่ผูกกับรหัสพนักงาน</p>
        </section>
        <section className="card p-6 md:p-8">
          <h2 className="text-2xl font-semibold">เข้าสู่ระบบพนักงาน</h2>
          <p className="mt-2 mb-7 text-sm text-slate-500">ใช้รหัสพนักงานเพื่อยืนยันสิทธิ์ก่อนเริ่มทำแบบประเมิน</p>
          <UserLoginForm />
          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            ผู้ดูแลระบบ <a href="/admin" className="font-medium text-emerald-700 hover:underline">เข้าสู่ Admin Dashboard</a>
          </div>
        </section>
      </div>
    </main>
  );
}
