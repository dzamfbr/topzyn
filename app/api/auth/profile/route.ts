import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  createAuthSessionToken,
  parseAuthSessionToken,
} from "@/lib/auth-session";
import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type AccountProfileRow = RowDataPacket & {
  id: number;
  username: string;
  email: string;
  role: string;
  phone_number: string | null;
  total_top_up: number | string;
  created_at: string;
};

type ProfilePatchBody = {
  username?: string;
  phoneNumber?: string;
};

function normalizePhoneNumber(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

function isValidPhoneNumber(value: string | null): boolean {
  if (value === null) {
    return true;
  }
  return /^[0-9+]{8,20}$/.test(value);
}

function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

async function getAuthenticatedAccount(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const sessionUser = parseAuthSessionToken(token);
  if (!sessionUser) {
    return null;
  }

  const db = getDbPool();
  const [rows] = await db.query<AccountProfileRow[]>(
    "SELECT id, username, email, role, phone_number, total_top_up, created_at FROM account WHERE id = ? LIMIT 1",
    [sessionUser.id],
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

function toProfilePayload(account: AccountProfileRow) {
  return {
    id: Number(account.id),
    username: account.username,
    email: account.email,
    role: account.role || "user",
    phoneNumber: account.phone_number,
    totalTopUp: Number(account.total_top_up ?? 0),
    createdAt: account.created_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const account = await getAuthenticatedAccount(request);
    if (!account) {
      const response = NextResponse.json(
        {
          status: "error",
          message: "Unauthorized.",
        },
        { status: 401 },
      );
      clearAuthCookie(response);
      return response;
    }

    return NextResponse.json({
      status: "success",
      profile: toProfilePayload(account),
    });
  } catch (error) {
    console.error("[api/auth/profile][GET] unexpected error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Gagal memuat profil.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const account = await getAuthenticatedAccount(request);
    if (!account) {
      const response = NextResponse.json(
        {
          status: "error",
          message: "Unauthorized.",
        },
        { status: 401 },
      );
      clearAuthCookie(response);
      return response;
    }

    const body = (await request.json()) as ProfilePatchBody;
    const hasUsernameInput = typeof body.username === "string";
    const hasPhoneInput = typeof body.phoneNumber === "string";

    if (!hasUsernameInput && !hasPhoneInput) {
      return NextResponse.json(
        {
          status: "error",
          message: "Tidak ada data yang diubah.",
        },
        { status: 400 },
      );
    }

    const nextUsername = hasUsernameInput
      ? body.username!.trim()
      : account.username;
    const nextPhone = hasPhoneInput
      ? normalizePhoneNumber(body.phoneNumber ?? "")
      : account.phone_number;

    if (nextUsername.length < 3 || nextUsername.length > 50) {
      return NextResponse.json(
        {
          status: "error",
          message: "Username harus 3-50 karakter.",
        },
        { status: 400 },
      );
    }

    if (!isValidPhoneNumber(nextPhone)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Nomor HP tidak valid. Gunakan 8-20 digit (boleh +).",
        },
        { status: 400 },
      );
    }

    const db = getDbPool();

    const [duplicateRows] = await db.query<RowDataPacket[]>(
      "SELECT id FROM account WHERE username = ? AND id <> ? LIMIT 1",
      [nextUsername, Number(account.id)],
    );

    if (duplicateRows.length > 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Username sudah dipakai akun lain.",
        },
        { status: 409 },
      );
    }

    await db.query(
      "UPDATE account SET username = ?, phone_number = ? WHERE id = ?",
      [nextUsername, nextPhone, Number(account.id)],
    );

    const [updatedRows] = await db.query<AccountProfileRow[]>(
      "SELECT id, username, email, role, phone_number, total_top_up, created_at FROM account WHERE id = ? LIMIT 1",
      [Number(account.id)],
    );

    if (updatedRows.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Profil tidak ditemukan setelah update.",
        },
        { status: 404 },
      );
    }

    const updated = updatedRows[0];
    const session = createAuthSessionToken({
      id: Number(updated.id),
      username: updated.username,
      email: updated.email,
      role: updated.role || "user",
    });

    const response = NextResponse.json({
      status: "success",
      message: "Profil berhasil diperbarui.",
      profile: toProfilePayload(updated),
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
  } catch (error) {
    console.error("[api/auth/profile][PATCH] unexpected error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Gagal menyimpan perubahan profil.",
      },
      { status: 500 },
    );
  }
}
