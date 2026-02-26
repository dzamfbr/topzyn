"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { TopzynNotice } from "@/components/ui/topzyn-notice";

type NotificationType = "success" | "error";

type NotificationPayload = {
  type: NotificationType;
  title: string;
  message: string;
  redirect: string;
};

type LoginResponse = {
  status: "success" | "error";
  message?: string;
  redirect?: string;
};

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

function EyeIcon({ isVisible }: { isVisible: boolean }) {
  if (isVisible) {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path
          d="M2.2 12c1.4-4.2 5.3-7 9.8-7s8.4 2.8 9.8 7c-1.4 4.2-5.3 7-9.8 7s-8.4-2.8-9.8-7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M3.4 3.4 20.6 20.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.2A10.5 10.5 0 0 1 12 5c4.5 0 8.4 2.8 9.8 7a10.7 10.7 0 0 1-2.5 3.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 7.3A10.6 10.6 0 0 0 2.2 12c1.4 4.2 5.3 7 9.8 7 1.6 0 3.1-.4 4.4-1.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isFormReady = email.trim() !== "" && password.trim() !== "";

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const parsed = parseNotification(new URLSearchParams(window.location.search));
      if (!parsed) {
        return;
      }
      setNotification(parsed);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

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
      });
    } catch (error) {
      openNotification({
        type: "error",
        title: "Login Gagal",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat login.",
        redirect: "",
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
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#293275] transition hover:text-[#ff711c]"
            >
              <BackIcon />
              Kembali ke Home
            </Link>
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
              <div className="relative mb-5 mt-2">
                <input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-[10px] border border-zinc-300 px-3.5 py-3 pr-11 text-sm outline-none transition focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((value) => !value)}
                  aria-label={isPasswordVisible ? "Sembunyikan password" : "Lihat password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#293275]"
                >
                  <EyeIcon isVisible={isPasswordVisible} />
                </button>
              </div>

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
