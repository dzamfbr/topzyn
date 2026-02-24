import { compare, hash } from "bcryptjs";
import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, parseAuthSessionToken } from "@/lib/auth-session";
import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type PasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

type AccountPasswordRow = RowDataPacket & {
  id: number;
  password_hash: string;
};

function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        {
          status: "error",
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const sessionUser = parseAuthSessionToken(token);
    if (!sessionUser) {
      const response = NextResponse.json(
        {
          status: "error",
          message: "Sesi login tidak valid.",
        },
        { status: 401 },
      );
      clearAuthCookie(response);
      return response;
    }

    const body = (await request.json()) as PasswordBody;
    const currentPassword = (body.currentPassword ?? "").trim();
    const newPassword = (body.newPassword ?? "").trim();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          status: "error",
          message: "Password lama dan password baru wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          status: "error",
          message: "Password baru minimal 6 karakter.",
        },
        { status: 400 },
      );
    }

    const db = getDbPool();
    const [rows] = await db.query<AccountPasswordRow[]>(
      "SELECT id, password_hash FROM account WHERE id = ? LIMIT 1",
      [sessionUser.id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Akun tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    const account = rows[0];
    const hashValue = account.password_hash ?? "";
    const isCurrentValid = hashValue.startsWith("$2")
      ? await compare(currentPassword, hashValue)
      : hashValue === currentPassword;

    if (!isCurrentValid) {
      return NextResponse.json(
        {
          status: "error",
          message: "Password lama tidak sesuai.",
        },
        { status: 401 },
      );
    }

    const newHash = await hash(newPassword, 10);
    await db.query("UPDATE account SET password_hash = ? WHERE id = ?", [
      newHash,
      sessionUser.id,
    ]);

    return NextResponse.json({
      status: "success",
      message: "Password berhasil diperbarui.",
    });
  } catch (error) {
    console.error("[api/auth/profile/password][POST] unexpected error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Gagal memperbarui password.",
      },
      { status: 500 },
    );
  }
}

