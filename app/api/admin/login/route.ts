import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createSessionToken,
  getAdminPassword,
  isValidPassword,
  sessionCookieOptions,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!getAdminPassword()) {
    return NextResponse.json({ error: "Aucun mot de passe configuré (ADMIN_PASSWORD)." }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  const token = createSessionToken();
  if (!token) return NextResponse.json({ error: "Session indisponible." }, { status: 503 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, sessionCookieOptions);
  return response;
}
