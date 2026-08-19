import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin-login-form";
import { BrandHeader } from "@/components/brand-header";
export default async function AdminPage(){ if(await getAdminSession()) redirect('/admin/dashboard'); return <main className="grid min-h-screen place-items-center px-5"><div className="card w-full max-w-md p-7"><BrandHeader eyebrow="ADMIN PORTAL"/><h1 className="mt-8 text-2xl font-bold">Admin Login</h1><p className="mb-6 mt-2 text-sm text-slate-500">สำหรับ HR / OD ที่ได้รับสิทธิ์เท่านั้น</p><AdminLoginForm /></div></main>; }
