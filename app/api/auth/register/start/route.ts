import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import type { RowDataPacket } from "mysql2/promise";

import { sendOtpEmail } from "@/lib/mailer";
import { getDbPool } from "@/lib/tidb";
import {
  OTP_COOKIE_NAME,
  createOtpCode,
  createOtpExpire,
  encodeOtpSession,
  getOtpTtlMinutes,
} from "@/lib/otp-session";

export const runtime = "nodejs";

type RegisterStartBody = {
  username?: string;
  email?: string;
  password?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterStartBody;
    const username = (body.username ?? "").trim();
    const email = normalizeEmail(body.email ?? "");
    const password = (body.password ?? "").trim();

    if (!username || !email || !password) {
      return NextResponse.json(
        {
          status: "error",
          message: "Username, email, dan password wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Format email tidak valid.",
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          status: "error",
          message: "Password minimal 6 karakter.",
        },
        { status: 400 },
      );
    }

    const db = getDbPool();
    const [existingRows] = await db.query<RowDataPacket[]>(
      "SELECT id FROM account WHERE email = ? OR username = ? LIMIT 1",
      [email, username],
    );

    if (existingRows.length > 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Username atau email sudah digunakan.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 10);
    const otpCode = createOtpCode();
    const otpExpire = createOtpExpire();
    const ttlMinutes = getOtpTtlMinutes();

    await sendOtpEmail({
      toEmail: email,
      otpCode,
      ttlMinutes,
    });

    const sessionToken = encodeOtpSession({
      username,
      email,
      passwordHash,
      otpCode,
      otpExpire,
      createdAt: Math.floor(Date.now() / 1000),
    });

    const response = NextResponse.json({
      status: "success",
      email,
      expire: otpExpire,
    });

    response.cookies.set({
      name: OTP_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(otpExpire * 1000),
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengirim OTP. Coba lagi sebentar.",
      },
      { status: 500 },
    );
  }
}
