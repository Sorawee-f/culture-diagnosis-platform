import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";

export default function AlreadySubmittedPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="card max-w-lg p-8 text-center">
        <CheckCircle2 className="mx-auto text-emerald-600" size={56} />
        <h1 className="mt-4 text-2xl font-bold">คุณทำแบบประเมินเรียบร้อยแล้ว</h1>
        <p className="mt-3 text-slate-500">แบบประเมินนี้สามารถส่งได้เพียง 1 ครั้ง เพื่อรักษาความถูกต้องของข้อมูล</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white">
          <Home size={18} /> กลับหน้าแรก
        </Link>
      </div>
    </main>
  );
}
