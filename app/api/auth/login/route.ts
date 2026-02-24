import { compare } from "bcryptjs";
import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, createAuthSessionToken } from "@/lib/auth-session";
import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type LoginBody = {
  email?: string;
  password?: string;
};

type AccountRow = RowDataPacket & {
  id: number;
  username: string;
  email: string;
  role: string;
  password_hash: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const email = normalizeEmail(body.email ?? "");
    const password = (body.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json(
        {
          status: "error",
          message: "Email dan password wajib diisi.",
        },
        { status: 400 },
      );
    }

    const db = getDbPool();
    const [rows] = await db.query<AccountRow[]>(
      "SELECT id, username, email, role, password_hash FROM account WHERE email = ? LIMIT 1",
      [email],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Email atau password salah.",
        },
        { status: 401 },
      );
    }

    const account = rows[0];
    const hashValue = account.password_hash ?? "";

    const passwordMatched = hashValue.startsWith("$2")
      ? await compare(password, hashValue)
      : hashValue === password;

    if (!passwordMatched) {
      return NextResponse.json(
        {
          status: "error",
          message: "Email atau password salah.",
        },
        { status: 401 },
      );
    }

    const session = createAuthSessionToken({
      id: Number(account.id),
      username: account.username,
      email: account.email,
      role: account.role || "user",
    });

    const response = NextResponse.json({
      status: "success",
      message: "Login berhasil.",
      redirect: "/",
      user: {
        id: Number(account.id),
        username: account.username,
        email: account.email,
        role: account.role || "user",
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: session.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(session.expiresAt * 1000),
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Terjadi kesalahan saat login.",
      },
      { status: 500 },
    );
  }
}

