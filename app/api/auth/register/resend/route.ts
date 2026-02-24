import { NextRequest, NextResponse } from "next/server";

import { sendOtpEmail } from "@/lib/mailer";
import {
  OTP_COOKIE_NAME,
  createOtpCode,
  createOtpExpire,
  decodeOtpSession,
  encodeOtpSession,
  getOtpTtlMinutes,
} from "@/lib/otp-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(OTP_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      {
        status: "error",
        message: "Sesi OTP tidak ditemukan. Ulangi registrasi.",
      },
      { status: 400 },
    );
  }

  const pending = decodeOtpSession(token);
  if (!pending) {
    return NextResponse.json(
      {
        status: "error",
        message: "Sesi OTP tidak valid. Ulangi registrasi.",
      },
      { status: 400 },
    );
  }

  try {
    const otpCode = createOtpCode();
    const otpExpire = createOtpExpire();
    const ttlMinutes = getOtpTtlMinutes();

    await sendOtpEmail({
      toEmail: pending.email,
      otpCode,
      ttlMinutes,
    });

    const updatedToken = encodeOtpSession({
      ...pending,
      otpCode,
      otpExpire,
      createdAt: Math.floor(Date.now() / 1000),
    });

    const response = NextResponse.json({
      status: "success",
      expire: otpExpire,
      message: "OTP baru berhasil dikirim.",
    });

    response.cookies.set({
      name: OTP_COOKIE_NAME,
      value: updatedToken,
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
            : "Gagal mengirim ulang OTP. Coba lagi.",
      },
      { status: 500 },
    );
  }
}
