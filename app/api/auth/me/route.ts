import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  type AuthSessionUser,
  parseAuthSessionToken,
} from "@/lib/auth-session";
import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type AccountRow = RowDataPacket & {
  id: number;
  username: string;
  email: string;
  role: string;
};

function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

function createSuccessResponse(user: AuthSessionUser) {
  return NextResponse.json(
    {
      status: "success",
      user,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      {
        status: "success",
        user: null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const sessionUser = parseAuthSessionToken(token);
  if (!sessionUser) {
    const response = NextResponse.json(
      {
        status: "success",
        user: null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
    clearAuthCookie(response);
    return response;
  }

  try {
    const db = getDbPool();
    const [rows] = await db.query<AccountRow[]>(
      "SELECT id, username, email, role FROM account WHERE id = ? LIMIT 1",
      [sessionUser.id],
    );

    if (rows.length === 0) {
      const response = NextResponse.json(
        {
          status: "success",
          user: null,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
      clearAuthCookie(response);
      return response;
    }

    const account = rows[0];
    return createSuccessResponse({
      id: Number(account.id),
      username: account.username,
      email: account.email,
      role: account.role || "user",
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        user: null,
        message: "Gagal memuat data user.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

