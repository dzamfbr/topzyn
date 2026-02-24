import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({
    status: "success",
    message: "Logout berhasil.",
  });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });

  return response;
}

