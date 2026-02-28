"use client";

import Image from "next/image";
import { type ClipboardEvent, type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { TopzynNotice } from "@/components/ui/topzyn-notice";

type NotificationType = "success" | "error";

type NotificationPayload = {
  type: NotificationType;
  title: string;
  message: string;
  redirect: string;
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
    if (!notification?.redirect) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.location.href = notification.redirect;
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notification]);

  const openNotification = (payload: NotificationPayload) => {
    setNotification(payload);
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
      });
    } catch (error) {
      openNotification({
        type: "error",
        title: "Gagal Kirim OTP",
        message:
          error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim ulang OTP.",
        redirect: "",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#e8ecff_0%,#f8fafc_42%,#eef2ff_100%)] px-4 py-6">
      <section className="w-full max-w-[360px] rounded-2xl border border-[#293275]/20 bg-white/95 px-6 py-7 text-center shadow-[0_16px_38px_rgba(41,50,117,0.16)] sm:px-7">
        <div className="mb-5 mt-2 flex justify-center">
          <Image
            src="/images/verifikasi_otp_topzyn.png"
            alt="OTP verification"
            width={100}
            height={100}
            className="h-[84px] w-[84px] rounded-xl object-cover sm:h-[100px] sm:w-[100px]"
            priority
          />
        </div>

        <h2 className="mb-2 text-[26px] font-semibold text-[#1d2761]">Verifikasi Email</h2>
        <p className="mb-5 text-sm text-slate-600">
          Kode OTP telah dikirim ke email{" "}
          <span className="font-semibold text-[#293275]">{email || "-"}</span>
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
                className="h-[50px] w-[45px] rounded-lg border-2 border-[#c7d2fe] bg-[#f8faff] text-center text-[22px] font-semibold text-[#1d2761] outline-none transition focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/20 sm:h-[46px] sm:w-[40px] sm:text-xl"
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
                ? "cursor-pointer bg-[#ff711c] hover:bg-[#293275]"
                : "cursor-not-allowed bg-[#9aa6b2]",
            ].join(" ")}
          >
            {isVerifying ? "Memverifikasi..." : "Verifikasi"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-slate-600">
          <span>Belum dapat kode?</span>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending}
            className={[
              "border-none bg-transparent p-0 text-[13px] font-semibold",
              isResending
                ? "cursor-not-allowed text-zinc-400"
                : "cursor-pointer text-[#ff711c] hover:text-[#293275]",
            ].join(" ")}
          >
            {isResending ? "Mengirim..." : "Kirim ulang"}
          </button>
        </div>

        <p
          className={[
            "mt-2 text-[13px] font-semibold",
            isExpired ? "text-red-600" : "text-[#293275]",
          ].join(" ")}
        >
          {expireAt > 0 ? (isExpired ? "OTP kadaluarsa" : formatRemaining(remainingSeconds)) : ""}
        </p>
      </section>
      <TopzynNotice
        open={Boolean(notification)}
        tone={notification?.type === "success" ? "success" : "error"}
        title={notification?.title ?? ""}
        message={notification?.message ?? ""}
        autoHideMs={notification?.redirect ? 1300 : 5000}
        onClose={() => setNotification(null)}
      />
    </main>
  );
}
