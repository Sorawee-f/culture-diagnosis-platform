import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AdminSession, EmployeeSession } from "@/types";
import { env } from "@/lib/env";

const encoder = new TextEncoder();
const key = encoder.encode(env.SESSION_SECRET);
const USER_COOKIE = "culture_user_session";
const ADMIN_COOKIE = "culture_admin_session";

async function sign(payload: EmployeeSession | AdminSession, expiresIn = "8h") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

async function verify<T>(token?: string): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as T;
  } catch {
    return null;
  }
}

export async function setEmployeeSession(session: EmployeeSession) {
  const store = await cookies();
  store.set(USER_COOKIE, await sign(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function setAdminSession(session: AdminSession) {
  const store = await cookies();
  store.set(ADMIN_COOKIE, await sign(session, "12h"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function getEmployeeSession() {
  const store = await cookies();
  return verify<EmployeeSession>(store.get(USER_COOKIE)?.value);
}

export async function getAdminSession() {
  const store = await cookies();
  return verify<AdminSession>(store.get(ADMIN_COOKIE)?.value);
}

export async function clearEmployeeSession() {
  const store = await cookies();
  store.delete(USER_COOKIE);
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
