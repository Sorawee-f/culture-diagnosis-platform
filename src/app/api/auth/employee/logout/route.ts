import { NextResponse } from "next/server";
import { clearEmployeeSession } from "@/lib/auth";

export async function GET(request: Request) {
  await clearEmployeeSession();
  return NextResponse.redirect(new URL("/", request.url));
}
