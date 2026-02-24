"use client";

import Image from "next/image";
import { type ClipboardEvent, type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type NotificationType = "success" | "error";

type NotificationPayload = {
  type: NotificationType;
  title: string;
  message: string;
  redirect: string;
  delay: number;
};

type ResendOtpResponse = {
  status: "success" | "error";
  message?: string;
  expire?: number;
};

type VerifyOtpResponse = {
  status: "success" | "error";
  message?: string;
  redirect?: string;
};

const OTP_LENGTH = 6;

function formatRemaining(seconds: number): string {
  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  return `Sisa waktu ${min}:${sec}`;
}

export default function OtpPage() {
  const [email, setEmail] = useState("");
  const [expireAt, setExpireAt] = useState(0);
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: OTP_LENGTH }, () => ""));
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [isNotificationClosing, setIsNotificationClosing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const otpValue = useMemo(() => digits.join(""), [digits]);
  const isOtpReady = otpValue.length === OTP_LENGTH && /^[0-9]{6}$/.test(otpValue);
  const isExpired = expireAt > 0 && remainingSeconds <= 0;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const parsedEmail = params.get("email") ?? "";
      const rawExpire = Number.parseInt(params.get("expire") ?? "0", 10);
      const parsedExpire = Number.isFinite(rawExpire) ? rawExpire : 0;
      const now = Math.floor(Date.now() / 1000);

      setEmail(parsedEmail);
      setExpireAt(parsedExpire);
      setRemainingSeconds(parsedExpire > 0 ? Math.max(0, parsedExpire - now) : 0);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (expireAt <= 0) {
      setRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      setRemainingSeconds(Math.max(0, expireAt - now));
    };

    updateTimer();
    const timerId = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timerId);
  }, [expireAt]);

  useEffect(() => {
    if (!showNotification || !notification) {
      return;
    }

    const hideDelay = notification.delay > 0 ? notification.delay : 2500;
    let hideTimer: number | undefined;
    let closeTimer: number | undefined;
    let redirectTimer: number | undefined;

    if (notification.redirect && notification.delay > 0) {
      hideTimer = window.setTimeout(() => {
        setIsNotificationClosing(true);
      }, Math.max(0, notification.delay - 350));

      redirectTimer = window.setTimeout(() => {
        window.location.href = notification.redirect;
      }, notification.delay);
    } else {
      hideTimer = window.setTimeout(() => {
        setIsNotificationClosing(true);
        closeTimer = window.setTimeout(() => setShowNotification(false), 320);
      }, hideDelay);
    }

    return () => {
      if (hideTimer) {
        window.clearTimeout(hideTimer);
      }
      if (closeTimer) {
        window.clearTimeout(closeTimer);
      }
      if (redirectTimer) {
        window.clearTimeout(redirectTimer);
      }
    };
  }, [notification, showNotification]);

  const openNotification = (payload: NotificationPayload) => {
    setNotification(payload);
    setIsNotificationClosing(false);
    setShowNotification(true);
  };

  const handleDigitInput = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    setDigits((previous) => {
      const next = [...previous];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && digits[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) {
      return;
    }

    event.preventDefault();
    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] ?? "");
    setDigits(nextDigits);

    const targetIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    window.requestAnimationFrame(() => {
      inputRefs.current[targetIndex]?.focus();
    });
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isOtpReady || isExpired || isVerifying) {
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp: otpValue,
          email,
        }),
      });

      const data = (await response.json()) as VerifyOtpResponse;
      if (!response.ok || data.status !== "success") {
        throw new Error(data.message ?? "Verifikasi OTP gagal.");
      }

      openNotification({
        type: "success",
        title: "Verifikasi Berhasil",
        message: data.message ?? "OTP berhasil diverifikasi.",
        redirect: data.redirect ?? "/login",
        delay: 2200,
      });
    } catch (error) {
      openNotification({
        type: "error",
        title: "Verifikasi Gagal",
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memverifikasi OTP.",
        redirect: "",
        delay: 2500,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResending) {
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/register/resend", {
        method: "POST",
      });

      const data = (await response.json()) as ResendOtpResponse;
      if (!response.ok || data.status !== "success") {
        throw new Error(data.message ?? "Gagal mengirim ulang OTP.");
      }

      if (typeof data.expire === "number") {
        setExpireAt(data.expire);
      }
      setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      inputRefs.current[0]?.focus();

      openNotification({
        type: "success",
        title: "OTP Dikirim",
        message: data.message ?? "OTP baru berhasil dikirim ke email kamu.",
        redirect: "",
        delay: 1800,
      });
    } catch (error) {
      openNotification({
        type: "error",
        title: "Gagal Kirim OTP",
        message:
          error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim ulang OTP.",
        redirect: "",
        delay: 2500,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#004370] px-4 py-6">
      <section className="w-full max-w-[360px] rounded-2xl bg-white px-6 py-7 text-center shadow-[0_10px_30px_rgba(0,0,0,0.1)] sm:px-7">
        <div className="mb-5 mt-2 flex justify-center">
          <Image
            src="/images/verifikasi_otp_raypoint.png"
            alt="OTP verification"
            width={100}
            height={100}
            className="h-[84px] w-[84px] rounded-xl object-cover sm:h-[100px] sm:w-[100px]"
            priority
          />
        </div>

        <h2 className="mb-2 text-[26px] font-semibold text-zinc-900">Verifikasi Email</h2>
        <p className="mb-5 text-sm text-zinc-500">
          Kode OTP telah dikirim ke email <span className="font-semibold">{email || "-"}</span>
        </p>

        <form onSubmit={handleVerifyOtp}>
          <div className="mb-5 flex justify-center gap-2.5" onPaste={handlePasteOtp}>
            {digits.map((digit, index) => (
              <input
                key={`otp-${index}`}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                maxLength={1}
                inputMode="numeric"
                value={digit}
                onChange={(event) => handleDigitInput(index, event.target.value)}
                onKeyDown={(event) => handleDigitKeyDown(index, event)}
                className="h-[50px] w-[45px] rounded-lg border-2 border-zinc-300 text-center text-[22px] font-semibold text-zinc-900 outline-none transition focus:border-[#0081d6] sm:h-[46px] sm:w-[40px] sm:text-xl"
                required
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={!isOtpReady || isExpired || isVerifying}
            className={[
              "h-[45px] w-full rounded-lg border-none text-base font-semibold text-white transition",
              isOtpReady && !isExpired && !isVerifying
                ? "cursor-pointer bg-[#0081d6] hover:bg-[#004370]"
                : "cursor-not-allowed bg-[#9aa6b2]",
            ].join(" ")}
          >
            {isVerifying ? "Memverifikasi..." : "Verifikasi"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-zinc-600">
          <span>Belum dapat kode?</span>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending}
            className={[
              "border-none bg-transparent p-0 text-[13px] font-semibold",
              isResending
                ? "cursor-not-allowed text-zinc-400"
                : "cursor-pointer text-[#0081d6] hover:text-[#004370]",
            ].join(" ")}
          >
            {isResending ? "Mengirim..." : "Kirim ulang"}
          </button>
        </div>

        <p
          className={[
            "mt-2 text-[13px] font-semibold",
            isExpired ? "text-red-600" : "text-zinc-600",
          ].join(" ")}
        >
          {expireAt > 0 ? (isExpired ? "OTP kadaluarsa" : formatRemaining(remainingSeconds)) : ""}
        </p>
      </section>

      {showNotification && notification ? (
        <div
          className={[
            "fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4",
            isNotificationClosing
              ? "opacity-0 transition-opacity duration-300"
              : "[animation:fadeIn_0.25s_ease_forwards]",
          ].join(" ")}
        >
          <div className="w-full max-w-[420px] rounded-[22px] bg-white px-9 py-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
            <div
              className={[
                "mx-auto mb-[18px] flex h-[90px] w-[90px] items-center justify-center rounded-full",
                notification.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600",
              ].join(" ")}
            >
              {notification.type === "success" ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[46px] w-[46px]">
                  <path
                    d="M9.5 16.2L5.8 12.5l-1.4 1.4 5.1 5.1 10-10-1.4-1.4z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[46px] w-[46px]">
                  <path d="M11 7h2v6h-2zm0 8h2v2h-2z" fill="currentColor" />
                  <path
                    d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>
            <h3 className="mb-2 text-[22px] font-bold text-slate-900">{notification.title}</h3>
            <p className="text-[15px] text-slate-500">{notification.message}</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
