import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Home } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { getEmployeeSession } from "@/lib/auth";
import { getPilotStatus } from "@/lib/pilot-status";

export default async function CompletedPage() {
  const session = await getEmployeeSession();
  if (!session) redirect("/");
  const status = await getPilotStatus(session.employeeId);
  if (!status.pilotCompleted) redirect(status.nextPath);

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <BrandHeader eyebrow="CULTURE SURVEY PILOT" />
        <div className="card mt-8 p-6 text-center sm:p-8 md:p-12">
          <CheckCircle2 className="mx-auto text-emerald-600" size={64} />
          <h1 className="mt-5 text-3xl font-bold">ทดสอบระบบครบแล้ว</h1>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
            คุณได้ทดลองแบบสำรวจทั้ง 2 ชุด และทดลองรูปแบบ Side-by-Side กับ Sequential เรียบร้อยแล้ว
          </p>
          <div className="mt-7 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            ระบบบันทึกผลการตอบและสถานะการทดสอบเรียบร้อย ขอบคุณที่ช่วยตรวจสอบการใช้งานผ่านมือถือ
          </div>
          <Link
            href="/"
            className="focus-ring mt-7 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium"
          >
            <Home size={18} /> กลับหน้าแรก
          </Link>
        </div>
      </div>
    </main>
  );
}
