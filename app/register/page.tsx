"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

type NotificationType = "success" | "error";

type NotificationPayload = {
  type: NotificationType;
  title: string;
  message: string;
  redirect: string;
};

type RegisterStartResponse = {
  status: "success" | "error";
  message?: string;
  email?: string;
  expire?: number;
};

function parseNotification(searchParams: URLSearchParams): NotificationPayload | null {
  const type = searchParams.get("type");
  const title = searchParams.get("title");
  const message = searchParams.get("message");

  if (!type || !title || !message) {
    return null;
  }

  const normalizedType: NotificationType = type === "success" ? "success" : "error";
  const redirect = searchParams.get("redirect") ?? "";

  return {
    type: normalizedType,
    title,
    message,
    redirect,
  };
}

export default function RegisterPage() {
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isNotificationClosing, setIsNotificationClosing] = useState(false);

  const isFormReady =
    username.trim() !== "" && email.trim() !== "" && password.trim() !== "";

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const parsed = parseNotification(new URLSearchParams(window.location.search));
      if (!parsed) {
        return;
      }
      setNotification(parsed);
      setShowNotification(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (!showNotification || !notification) {
      return;
    }

    if (notification.redirect) {
      window.location.href = notification.redirect;
      return;
    }
  }, [notification, showNotification]);

  const showErrorNotification = (message: string) => {
    setNotification({
      type: "error",
      title: "Registrasi Gagal",
      message,
      redirect: "",
    });
    setIsNotificationClosing(false);
    setShowNotification(true);
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormReady || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = (await response.json()) as RegisterStartResponse;

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message ?? "Gagal mengirim OTP.");
      }

      const otpUrl = new URL("/otp", window.location.origin);
      otpUrl.searchParams.set("email", data.email ?? email.trim().toLowerCase());
      if (typeof data.expire === "number") {
        otpUrl.searchParams.set("expire", String(data.expire));
      }

      window.location.href = otpUrl.toString();
    } catch (error) {
      showErrorNotification(
        error instanceof Error ? error.message : "Terjadi kesalahan saat registrasi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen">
      <section className="flex min-h-screen">
        <div
          className="hidden min-h-screen w-1/2 bg-[#0b0b0b] bg-cover bg-center bg-no-repeat lg:block"
          style={{ backgroundImage: "url('/images/tes1.jpg')" }}
        />

        <div className="flex w-full items-center justify-center px-5 py-10 lg:w-1/2">
          <div className="w-full max-w-[420px]">
            <Image
              src="/images/web_logo_topzyn.png"
              alt="TopZyn logo"
              width={80}
              height={80}
              className="mb-5 h-auto w-20"
              priority
            />

            <h1 className="text-[32px] font-bold text-black">Daftar</h1>
            <p className="mb-8 text-[15px] text-zinc-500">
              Silahkan buat akun baru kamu disini
            </p>

            <form className="space-y-0" onSubmit={handleRegisterSubmit}>
              <label htmlFor="username" className="text-sm font-semibold text-black">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mb-5 mt-2 w-full rounded-[10px] border border-zinc-300 px-3.5 py-3.5 text-sm outline-none transition focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15"
                required
              />

              <label htmlFor="email" className="text-sm font-semibold text-black">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Masukkan Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mb-5 mt-2 w-full rounded-[10px] border border-zinc-300 px-3.5 py-3.5 text-sm outline-none transition focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15"
                required
              />

              <label htmlFor="password" className="text-sm font-semibold text-black">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mb-5 mt-2 w-full rounded-[10px] border border-zinc-300 px-3.5 py-3 text-sm outline-none transition focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15"
                required
              />

              <button
                type="submit"
                disabled={!isFormReady || isSubmitting}
                className={[
                  "mt-1 w-full rounded-xl px-4 py-3.5 text-base font-semibold text-white transition",
                  isFormReady && !isSubmitting
                    ? "cursor-pointer bg-[#ff711c] hover:opacity-90"
                    : "cursor-not-allowed bg-slate-400",
                ].join(" ")}
              >
                {isSubmitting ? "Mengirim OTP..." : "Daftar"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-black">
              Udah Punya Akun?{" "}
              <Link href="/login" className="font-semibold text-[#ff711c] hover:underline">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </section>

      {showNotification && notification ? (
        <div
          className={[
            "fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4",
            isNotificationClosing
              ? "opacity-0 transition-opacity duration-300"
              : "[animation:fadeIn_0.25s_ease_forwards]",
          ].join(" ")}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsNotificationClosing(true);
              window.setTimeout(() => setShowNotification(false), 180);
            }
          }}
        >
          <div className="w-full max-w-[320px] rounded-[18px] bg-white px-5 py-5 text-center shadow-[0_20px_45px_rgba(0,0,0,0.22)] sm:max-w-[420px] sm:rounded-[22px] sm:px-9 sm:py-8">
            <div
              className={[
                "mx-auto mb-3 flex h-[70px] w-[70px] items-center justify-center rounded-full sm:mb-[18px] sm:h-[90px] sm:w-[90px]",
                notification.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600",
              ].join(" ")}
            >
              {notification.type === "success" ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-9 w-9 sm:h-[46px] sm:w-[46px]">
                  <path
                    d="M9.5 16.2L5.8 12.5l-1.4 1.4 5.1 5.1 10-10-1.4-1.4z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-9 w-9 sm:h-[46px] sm:w-[46px]">
                  <path d="M11 7h2v6h-2zm0 8h2v2h-2z" fill="currentColor" />
                  <path
                    d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900 sm:text-[22px]">{notification.title}</h3>
            <p className="text-sm text-slate-500 sm:text-[15px]">{notification.message}</p>
            {!notification.redirect ? (
              <button
                type="button"
                onClick={() => {
                  setIsNotificationClosing(true);
                  window.setTimeout(() => setShowNotification(false), 180);
                }}
                className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 sm:text-sm"
              >
                Tutup
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
