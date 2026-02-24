import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2/promise";

import {
  OTP_COOKIE_NAME,
  decodeOtpSession,
  isOtpExpired,
  isValidOtpFormat,
  otpMatches,
} from "@/lib/otp-session";
import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type VerifyBody = {
  otp?: string;
};

function clearOtpCookie(response: NextResponse) {
  response.cookies.set({
    name: OTP_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as VerifyBody;
  const otp = (body.otp ?? "").trim();

  if (!isValidOtpFormat(otp)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Kode OTP harus 6 digit angka.",
      },
      { status: 400 },
    );
  }

  const token = request.cookies.get(OTP_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      {
        status: "error",
        message: "Sesi OTP tidak ditemukan. Silakan daftar lagi.",
      },
      { status: 400 },
    );
  }

  const pending = decodeOtpSession(token);
  if (!pending) {
    const response = NextResponse.json(
      {
        status: "error",
        message: "Sesi OTP tidak valid. Silakan daftar lagi.",
      },
      { status: 400 },
    );
    clearOtpCookie(response);
    return response;
  }

  if (isOtpExpired(pending.otpExpire)) {
    return NextResponse.json(
      {
        status: "error",
        message: "OTP sudah kadaluarsa. Kirim ulang OTP baru.",
      },
      { status: 400 },
    );
  }

  if (!otpMatches(otp, pending.otpCode)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Kode OTP salah.",
      },
      { status: 400 },
    );
  }

  try {
    const db = getDbPool();
    await db.query<ResultSetHeader>(
      "INSERT INTO account (username, email, password_hash) VALUES (?, ?, ?)",
      [pending.username, pending.email, pending.passwordHash],
    );
  } catch (error) {
    const typedError = error as { code?: string };
    if (typedError.code === "ER_DUP_ENTRY") {
      const response = NextResponse.json(
        {
          status: "error",
          message: "Username atau email sudah digunakan.",
        },
        { status: 409 },
      );
      clearOtpCookie(response);
      return response;
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Gagal menyimpan akun ke database.",
      },
      { status: 500 },
    );
  }

  const successRedirect = `/login?type=success&title=${encodeURIComponent(
    "Registrasi Berhasil",
  )}&message=${encodeURIComponent("Akun berhasil diverifikasi. Silakan masuk.")}&delay=2200`;

  const response = NextResponse.json({
    status: "success",
    message: "Verifikasi OTP berhasil.",
    redirect: successRedirect,
  });
  clearOtpCookie(response);
  return response;
}
