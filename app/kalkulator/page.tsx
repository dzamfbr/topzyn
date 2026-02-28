"use client";

import {
  TopzynNotice,
  type TopzynNoticeTone,
} from "@/components/ui/topzyn-notice";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";

type UserSession = {
  id: number;
  username: string;
  email: string;
  role: string;
} | null;

type MeResponse = {
  status: "success" | "error";
  user: UserSession;
};

type NoticeState = {
  tone: TopzynNoticeTone;
  title: string;
  message: string;
} | null;

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "History", href: "/riwayat" },
  { label: "Kalkulator", href: "/kalkulator" },
];

type CalculatorErrors = {
  totalMatches?: string;
  currentWinRate?: string;
  targetWinRate?: string;
};

function calculateNeededWins(
  totalMatches: number,
  currentWinRate: number,
  targetWinRate: number,
): number {
  const currentWins = (currentWinRate / 100) * totalMatches;
  if (targetWinRate <= currentWinRate) {
    return 0;
  }
  if (targetWinRate >= 100) {
    return Number.POSITIVE_INFINITY;
  }
  const required =
    ((targetWinRate / 100) * totalMatches - currentWins) /
    (1 - targetWinRate / 100);
  return Math.max(0, Math.ceil(required));
}

function sanitizeIntegerInput(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function sanitizeDecimalInput(value: string): string {
  const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = normalized.split(".");
  if (decimalParts.length === 0) {
    return integerPart;
  }
  return `${integerPart}.${decimalParts.join("")}`;
}

function FallbackImage({
  src,
  alt,
  className,
  fallback = "/images/1000x1000.jpg",
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== fallback) {
          setCurrentSrc(fallback);
        }
      }}
    />
  );
}

function Icon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </Icon>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M4 20h16" />
      <path d="M7 17V9" />
      <path d="M12 17V5" />
      <path d="M17 17v-4" />
    </Icon>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 7v6l4 2" />
    </Icon>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8 7.5h8" />
      <path d="M8 11.5h.01" />
      <path d="M12 11.5h.01" />
      <path d="M16 11.5h.01" />
      <path d="M8 15.5h.01" />
      <path d="M12 15.5h.01" />
      <path d="M16 15.5h.01" />
    </Icon>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <span
      className={["iconify inline-block", className ?? ""].join(" ").trim()}
      data-icon="mdi:account-circle-outline"
      aria-hidden="true"
    />
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

function LoginIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" />
      <path d="M14 7l4 5-4 5" />
      <path d="M9 12h9" />
    </Icon>
  );
}

function PlusUserIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 18a5.5 5.5 0 0 1 11 0" />
      <path d="M18 8v6" />
      <path d="M15 11h6" />
    </Icon>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" />
      <path d="M14 7l4 5-4 5" />
      <path d="M9 12h9" />
    </Icon>
  );
}

export default function KalkulatorPage() {
  const [user, setUser] = useState<UserSession>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [totalMatches, setTotalMatches] = useState("");
  const [currentWinRate, setCurrentWinRate] = useState("");
  const [targetWinRate, setTargetWinRate] = useState("");
  const [resultText, setResultText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CalculatorErrors>({});
  const [notice, setNotice] = useState<NoticeState>(null);
  const desktopToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);
  const desktopDropdownRef = useRef<HTMLDivElement | null>(null);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);
  const canCalculate =
    totalMatches.trim() !== "" &&
    currentWinRate.trim() !== "" &&
    targetWinRate.trim() !== "";

  useEffect(() => {
    let disposed = false;

    const loadMe = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });
        const data = (await response.json()) as MeResponse;
        if (disposed) {
          return;
        }
        if (!response.ok || data.status !== "success") {
          setUser(null);
          return;
        }
        setUser(data.user ?? null);
      } catch {
        if (!disposed) {
          setUser(null);
        }
      } finally {
        if (!disposed) {
          setIsAuthResolved(true);
        }
      }
    };

    void loadMe();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (desktopToggleRef.current?.contains(target)) return;
      if (mobileToggleRef.current?.contains(target)) return;
      if (desktopDropdownRef.current?.contains(target)) return;
      if (mobileDropdownRef.current?.contains(target)) return;
      setIsDropdownOpen(false);
    };

    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNavVisibility = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (Math.abs(delta) > 6) {
        if (currentScrollY > 40 && delta > 0) {
          setIsNavHidden(true);
        } else {
          setIsNavHidden(false);
        }
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavVisibility);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle(
      "overflow-hidden",
      showLogoutModal || isDropdownOpen,
    );
    return () => document.body.classList.remove("overflow-hidden");
  }, [showLogoutModal, isDropdownOpen]);

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    setIsDropdownOpen(false);
    setUser(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    window.location.href = "/?logout=1";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: CalculatorErrors = {};

    if (!totalMatches.trim()) {
      errors.totalMatches = "Total pertandingan wajib diisi";
    }
    if (!currentWinRate.trim()) {
      errors.currentWinRate = "Win rate saat ini wajib diisi";
    }
    if (!targetWinRate.trim()) {
      errors.targetWinRate = "Target win rate wajib diisi";
    }

    const parsedTotalMatches = Number(totalMatches);
    const parsedCurrentWinRate = Number(currentWinRate);
    const parsedTargetWinRate = Number(targetWinRate);

    if (
      totalMatches.trim() &&
      (!Number.isFinite(parsedTotalMatches) || parsedTotalMatches <= 0)
    ) {
      errors.totalMatches = "Total pertandingan harus angka lebih dari 0";
    }
    if (
      currentWinRate.trim() &&
      (!Number.isFinite(parsedCurrentWinRate) ||
        parsedCurrentWinRate < 0 ||
        parsedCurrentWinRate > 100)
    ) {
      errors.currentWinRate = "Win rate saat ini harus di antara 0 - 100";
    }
    if (
      targetWinRate.trim() &&
      (!Number.isFinite(parsedTargetWinRate) ||
        parsedTargetWinRate <= 0 ||
        parsedTargetWinRate > 100)
    ) {
      errors.targetWinRate = "Target win rate harus di antara 1 - 100";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setResultText("");
      return;
    }

    const neededWins = calculateNeededWins(
      parsedTotalMatches,
      parsedCurrentWinRate,
      parsedTargetWinRate,
    );

    if (!Number.isFinite(neededWins)) {
      setResultText(
        "Kamu butuh kemenangan tanpa kalah dalam jumlah tak terbatas untuk mencapai win rate 100%.",
      );
      return;
    }

    if (neededWins <= 0) {
      setResultText(
        `Win rate kamu saat ini sudah mencapai target ${parsedTargetWinRate.toFixed(0)}%.`,
      );
      return;
    }

    setResultText(
      `Kamu butuh ${neededWins} kemenangan tanpa kalah untuk mencapai win rate ${parsedTargetWinRate.toFixed(0)}%.`,
    );
  };

  return (
    <main className="min-h-screen bg-white pb-[86px] pt-[104px] text-[#101828] md:pb-0 md:pt-[130px]">
      <TopzynNotice
        open={Boolean(notice)}
        tone={notice?.tone ?? "info"}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        autoHideMs={5000}
        onClose={() => setNotice(null)}
      />

      <nav
        className={[
          "fixed inset-x-0 top-0 z-[999] bg-[#293275] shadow-[0_8px_18px_rgba(14,16,22,0.08)] transition-transform duration-300",
          isNavHidden ? "-translate-y-full" : "translate-y-0",
        ].join(" ")}
      >
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between gap-4 px-4 md:h-[90px] md:px-6">
          <Link href="/" className="inline-flex items-center">
            <FallbackImage
              src="/images/title_logo_topzyn.png"
              alt="TopZyn"
              className="h-10 w-auto md:h-12"
            />
          </Link>

          <ul className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-base font-semibold transition lg:text-lg",
                    item.label === "Kalkulator"
                      ? "text-[#ff711c]"
                      : "text-white hover:text-[#ff711c]",
                  ].join(" ")}
                >
                  {item.label === "Home" ? (
                    <HomeIcon className="h-4 w-4" />
                  ) : item.label === "Leaderboard" ? (
                    <ChartIcon className="h-4 w-4" />
                  ) : item.label === "History" ? (
                    <HistoryIcon className="h-4 w-4" />
                  ) : (
                    <CalculatorIcon className="h-4 w-4" />
                  )}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {isAuthResolved ? (
            user ? (
              <div className="relative">
                <button
                  ref={desktopToggleRef}
                  type="button"
                  aria-expanded={isDropdownOpen}
                  onClick={() => setIsDropdownOpen((value) => !value)}
                  className="hidden items-center gap-2 rounded-full px-2 py-1 text-white transition hover:bg-white/10 md:inline-flex"
                >
                  <UserIcon className="h-9 w-9" />
                  <span className="text-sm font-bold">{user.username}</span>
                  <ChevronDownIcon
                    className={[
                      "h-5 w-5 transition-transform duration-200",
                      isDropdownOpen ? "rotate-180" : "rotate-0",
                    ].join(" ")}
                  />
                </button>

                <div
                  ref={desktopDropdownRef}
                  className={[
                    "absolute right-0 top-[58px] z-[1000] hidden w-[260px] origin-top-right rounded-xl border border-[#293275] bg-white p-2 shadow-2xl transition duration-200 md:block",
                    isDropdownOpen
                      ? "visible translate-y-0 scale-100 opacity-100 pointer-events-auto"
                      : "invisible -translate-y-2 scale-95 opacity-0 pointer-events-none",
                  ].join(" ")}
                >
                  <p className="truncate px-2 py-1 text-sm font-bold text-slate-800">
                    {user.username}
                  </p>
                  <p className="truncate px-2 pb-1 text-xs text-slate-500">
                    {user.email}
                  </p>
                  <Link
                    href="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="mt-1 block rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Profil Saya
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="mt-1 block w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden gap-3 md:flex">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#ff711c] px-5 py-2 text-sm font-semibold text-[#ff711c] transition hover:bg-[#ff711c] hover:text-white"
                >
                  <LoginIcon className="h-4 w-4" />
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#ff711c] bg-[#ff711c] px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  <PlusUserIcon className="h-4 w-4" />
                  Daftar
                </Link>
              </div>
            )
          ) : (
            <div className="hidden md:flex">
              <div className="h-10 w-[170px] animate-pulse rounded-full bg-white/20" />
            </div>
          )}
        </div>

        <div className="flex h-[34px] items-center overflow-hidden border-t border-white/40 bg-[#293275] md:h-10">
          <div className="inline-block whitespace-nowrap pl-[100%] [animation:runningText_15s_linear_infinite]">
            <span className="inline-block px-5 text-sm font-bold text-white md:px-7 md:text-base">
              Gunakan Kalkulator Win Rate TopZyn untuk tahu berapa match menang
              tanpa kalah yang kamu butuhkan.
            </span>
          </div>
        </div>
      </nav>

      <div
        className={[
          "fixed inset-x-0 bottom-0 z-[998] flex h-[76px] items-center justify-around bg-white px-2 shadow-[0_-8px_18px_rgba(14,16,22,0.08)] transition-all duration-300 md:hidden",
          isNavHidden ? "translate-y-full opacity-0 pointer-events-none" : "",
        ].join(" ")}
      >
        <Link
          href="/"
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
        >
          <HomeIcon className="h-[22px] w-[22px]" />
          <span>Home</span>
        </Link>
        <Link
          href="/leaderboard"
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
        >
          <ChartIcon className="h-[22px] w-[22px]" />
          <span>Leaderboard</span>
        </Link>
        <Link
          href="/riwayat"
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
        >
          <HistoryIcon className="h-[22px] w-[22px]" />
          <span>History</span>
        </Link>
        <Link
          href="/kalkulator"
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-[#293275]"
        >
          <CalculatorIcon className="h-[22px] w-[22px]" />
          <span>Kalkulator</span>
        </Link>
        {isAuthResolved ? (
          user ? (
            <button
              ref={mobileToggleRef}
              type="button"
              aria-expanded={isDropdownOpen}
              onClick={() => setIsDropdownOpen((value) => !value)}
              className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
            >
              <UserIcon className="h-[22px] w-[22px]" />
              <span>Profile</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
            >
              <UserIcon className="h-[22px] w-[22px]" />
              <span>Profile</span>
            </Link>
          )
        ) : (
          <div className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-400">
            <UserIcon className="h-[22px] w-[22px]" />
            <span>Profile</span>
          </div>
        )}
      </div>

      {user ? (
        <div
          ref={mobileDropdownRef}
          className={[
            "fixed bottom-[92px] right-4 z-[1000] w-[220px] origin-bottom-right rounded-xl border border-[#293275] bg-white p-1.5 shadow-2xl transition duration-200 md:hidden",
            isDropdownOpen
              ? "visible translate-y-0 scale-100 opacity-100 pointer-events-auto"
              : "invisible translate-y-2 scale-95 opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <p className="truncate px-2 py-1 text-xs font-bold text-slate-800">
            {user.username}
          </p>
          <p className="truncate px-2 pb-1 text-[11px] text-slate-500">
            {user.email}
          </p>
          <Link
            href="/profile"
            onClick={() => setIsDropdownOpen(false)}
            className="mt-1 block rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Profil Saya
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(false);
              setShowLogoutModal(true);
            }}
            className="mt-1 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            <LogoutIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
      ) : null}

      {showLogoutModal ? (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowLogoutModal(false);
            }
          }}
        >
          <div className="w-full max-w-[420px] rounded-2xl bg-white px-8 py-7 text-center shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900">
              Yakin mau logout?
            </h3>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-800 transition hover:bg-slate-200"
              >
                Gajadi
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700"
              >
                Tetap logout
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="px-4 py-8 md:py-12">
        <div className="mx-auto w-full max-w-lg">
          <div className="rounded-3xl border border-[#293275]/15 bg-[linear-gradient(180deg,#f8faff_0%,#ffffff_55%)] p-5 text-[#101828] shadow-[0_24px_60px_rgba(41,50,117,0.16)] backdrop-blur sm:p-7">
            <div className="mb-6 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/web_logo_topzyn.png"
                alt="TopZyn"
                className="mx-auto mb-4 h-auto w-[96px]"
              />
              <h1 className="text-3xl font-extrabold text-[#293275] sm:text-[42px]">
                Kalkulator Win Rate
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 sm:text-base">
                Digunakan untuk menghitung total jumlah pertandingan yang harus
                diambil untuk mencapai target tingkat kemenangan yang
                diinginkan.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="totalMatches"
                  className="mb-2 block text-sm font-semibold text-slate-800 sm:text-base"
                >
                  Total Pertandingan Kamu Saat Ini
                </label>
                <input
                  id="totalMatches"
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 200"
                  autoComplete="off"
                  value={totalMatches}
                  onChange={(event) => {
                    setTotalMatches(sanitizeIntegerInput(event.target.value));
                    setFieldErrors((prev) => ({
                      ...prev,
                      totalMatches: undefined,
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/20"
                />
                {fieldErrors.totalMatches ? (
                  <p className="mt-2 text-xs text-red-600 sm:text-sm">
                    {fieldErrors.totalMatches}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="currentWinRate"
                  className="mb-2 block text-sm font-semibold text-slate-800 sm:text-base"
                >
                  Total Win Rate Kamu Saat Ini
                </label>
                <input
                  id="currentWinRate"
                  type="text"
                  inputMode="decimal"
                  placeholder="Contoh: 50"
                  autoComplete="off"
                  value={currentWinRate}
                  onChange={(event) => {
                    setCurrentWinRate(sanitizeDecimalInput(event.target.value));
                    setFieldErrors((prev) => ({
                      ...prev,
                      currentWinRate: undefined,
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/20"
                />
                {fieldErrors.currentWinRate ? (
                  <p className="mt-2 text-xs text-red-600 sm:text-sm">
                    {fieldErrors.currentWinRate}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="targetWinRate"
                  className="mb-2 block text-sm font-semibold text-slate-800 sm:text-base"
                >
                  Win Rate Total yang Kamu Inginkan
                </label>
                <input
                  id="targetWinRate"
                  type="text"
                  inputMode="decimal"
                  placeholder="Contoh: 90"
                  autoComplete="off"
                  value={targetWinRate}
                  onChange={(event) => {
                    setTargetWinRate(sanitizeDecimalInput(event.target.value));
                    setFieldErrors((prev) => ({
                      ...prev,
                      targetWinRate: undefined,
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/20"
                />
                {fieldErrors.targetWinRate ? (
                  <p className="mt-2 text-xs text-red-600 sm:text-sm">
                    {fieldErrors.targetWinRate}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={!canCalculate}
                className="w-full rounded-xl bg-[#ff711c] px-4 py-3 text-base font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-200"
              >
                Hitung
              </button>

              {resultText ? (
                <p className="pt-2 text-center text-sm font-bold text-[#293275] sm:text-base">
                  {resultText}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </section>

      <footer className="mt-10 bg-white text-white md:mt-16">
        <div className="w-full overflow-hidden">
          <FallbackImage
            src="/images/footer_banner_topzyn.png"
            alt="Footer Visual"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="-mt-1 bg-[#293275] px-4 pb-10 pt-14 md:pt-16">
          <div className="mx-auto max-w-6xl text-center">
            <p className="mx-auto mb-10 max-w-3xl text-base leading-relaxed text-white/80 md:mb-12 md:text-xl">
              TopZyn adalah sahabat para gamers dan platform top up game
              terpercaya di Indonesia.
            </p>

            <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-2 md:text-left lg:grid-cols-4">
              <div>
                <h4 className="mb-3 text-xl font-bold text-[#ff711c]">
                  Peta Situs
                </h4>
                <Link
                  href="/"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Beranda
                </Link>
                <Link
                  href="/login"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Daftar
                </Link>
                <Link
                  href="/riwayat"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Cek Transaksi
                </Link>
              </div>

              <div>
                <h4 className="mb-3 text-xl font-bold text-[#ff711c]">
                  Dukungan
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  WhatsApp
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Email
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Instagram
                </Link>
              </div>

              <div>
                <h4 className="mb-3 text-xl font-bold text-[#ff711c]">
                  Legalitas
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Kebijakan Privasi
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Syarat & Ketentuan
                </Link>
              </div>

              <div>
                <h4 className="mb-3 text-xl font-bold text-[#ff711c]">
                  Sosial Media
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  TikTok
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Instagram
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Discord
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  YouTube
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

