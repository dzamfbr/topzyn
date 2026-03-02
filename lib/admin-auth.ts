import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  type AuthSessionUser,
  parseAuthSessionToken,
} from "@/lib/auth-session";
import { getDbPool } from "@/lib/tidb";

type AccountRoleRow = RowDataPacket & {
  id: number;
  username: string;
  email: string;
  role: string;
};

type AdminCheckResult =
  | { ok: true; user: AuthSessionUser }
  | { ok: false; response: NextResponse };

function getCookieValue(cookieHeader: string, name: string): string | null {
  const chunks = cookieHeader.split(";");
  for (const chunk of chunks) {
    const [rawKey, ...rawValueParts] = chunk.trim().split("=");
    if (!rawKey) continue;
    if (rawKey !== name) continue;
    const rawValue = rawValueParts.join("=").trim();
    if (!rawValue) return null;
    return decodeURIComponent(rawValue);
  }
  return null;
}

function createDeniedResponse(status: number, message: string): NextResponse {
  return NextResponse.json(
    {
      status: "error",
      message,
    },
    { status },
  );
}

export async function requireAdminRequest(
  request: Request,
): Promise<AdminCheckResult> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = getCookieValue(cookieHeader, AUTH_COOKIE_NAME);

  if (!token) {
    return {
      ok: false,
      response: createDeniedResponse(401, "Login admin diperlukan."),
    };
  }

  const sessionUser = parseAuthSessionToken(token);
  if (!sessionUser) {
    return {
      ok: false,
      response: createDeniedResponse(401, "Sesi login tidak valid."),
    };
  }

  try {
    const db = getDbPool();
    const [rows] = await db.query<AccountRoleRow[]>(
      "SELECT id, username, email, role FROM account WHERE id = ? LIMIT 1",
      [sessionUser.id],
    );

    if (rows.length === 0) {
      return {
        ok: false,
        response: createDeniedResponse(401, "Akun tidak ditemukan."),
      };
    }

    const account = rows[0];
    if ((account.role ?? "").toLowerCase() !== "admin") {
      return {
        ok: false,
        response: createDeniedResponse(
          403,
          "Akses ditolak. Hanya akun admin yang diizinkan.",
        ),
      };
    }

    return {
      ok: true,
      user: {
        id: Number(account.id),
        username: account.username,
        email: account.email,
        role: account.role,
      },
    };
  } catch {
    return {
      ok: false,
      response: createDeniedResponse(500, "Gagal memverifikasi akses admin."),
    };
  }
}
