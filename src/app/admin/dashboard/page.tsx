import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin-dashboard";
import { BrandHeader } from "@/components/brand-header";
export default async function DashboardPage(){if(!await getAdminSession())redirect('/admin');return <main className="min-h-screen px-4 py-6 md:px-8"><div className="mx-auto max-w-7xl"><div className="mb-7 flex items-center justify-between"><BrandHeader eyebrow="ADMIN DASHBOARD"/><a href="/api/auth/admin/logout" className="text-sm text-slate-500 hover:text-slate-900">ออกจากระบบ</a></div><AdminDashboard/></div></main>}
