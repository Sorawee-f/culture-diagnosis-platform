import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/auth";
import { getPilotStatus } from "@/lib/pilot-status";

export async function GET() {
  const session = await getEmployeeSession();
  if (!session) {
    return NextResponse.json({ message: "Session หมดอายุ กรุณา Login ใหม่" }, { status: 401 });
  }

  try {
    const status = await getPilotStatus(session.employeeId);
    return NextResponse.json({ ...status, employeeName: session.name });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "โหลดสถานะ Pilot ไม่สำเร็จ" }, { status: 500 });
  }
}
