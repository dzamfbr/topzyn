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
  delay: number;
};

type LoginResponse = {
  status: "success" | "error";
  message?: string;
  redirect?: string;
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
  const delay = Number.parseInt(searchParams.get("delay") ?? "0", 10);

  return {
    type: normalizedType,
    title,
    message,
    redirect,
    delay: Number.isFinite(delay) ? delay : 0,
  };
}

export default function LoginPage() {
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isNotificationClosing, setIsNotificationClosing] = useState(false);

  const isFormReady = email.trim() !== "" && password.trim() !== "";

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

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormReady || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = (await response.json()) as LoginResponse;
      if (!response.ok || data.status !== "success") {
        throw new Error(data.message ?? "Login gagal.");
      }

      openNotification({
        type: "success",
        title: "Berhasil Login",
        message: "Selamat datang di TopZyn Store",
        redirect: data.redirect ?? "/",
        delay: 1800,
      });
    } catch (error) {
      openNotification({
        type: "error",
        title: "Login Gagal",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat login.",
        redirect: "",
        delay: 2600,
      });
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

        <div className="flex w-full items-center justify-center px-5 py-10 lg:w-[45%]">
          <div className="w-full max-w-[420px]">
            <Image
              src="/images/web_logo_topzyn.png"
              alt="TopZyn logo"
              width={80}
              height={80}
              className="mb-5 h-auto w-20"
              priority
            />

            <h1 className="text-[32px] font-bold text-black">Masuk</h1>
            <p className="mb-8 text-[15px] text-zinc-500">
              Silahkan masukkan akun kamu disini
            </p>

            <form className="space-y-0" onSubmit={handleLoginSubmit}>
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
                autoComplete="current-password"
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
                {isSubmitting ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-black">
              Belum Punya Akun?{" "}
              <Link href="/register" className="font-semibold text-[#ff711c] hover:underline">
                Daftar
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
