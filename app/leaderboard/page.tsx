"use client";

import {
  TopzynNotice,
  type TopzynNoticeTone,
} from "@/components/ui/topzyn-notice";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

const PODIUM_ORDER = [2, 1, 3] as const;

type LeaderboardEntry = {
  id: number;
  rank: number;
  nickname: string;
  username: string;
  emailMasked: string;
  totalTopUp: number;
};

type LeaderboardResponse = {
  status: "success" | "error";
  entries?: LeaderboardEntry[];
  message?: string;
};

function formatRupiah(value: number): string {
  return `Rp ${Math.max(0, Math.floor(value)).toLocaleString("id-ID")}`;
}

function getMonthlyCountdownData(now: Date) {
  const nextReset = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
    0,
    0,
    0,
    0,
  );
  const totalSeconds = Math.max(
    0,
    Math.floor((nextReset.getTime() - now.getTime()) / 1000),
  );
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const countdownLabel =
    days > 0
      ? `Reset bulanan dalam ${days} hari ${hh}:${mm}:${ss}`
      : `Reset bulanan dalam ${hh}:${mm}:${ss}`;

  const resetLabel = nextReset.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return { countdownLabel, resetLabel };
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
    <Icon className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 19a8 8 0 0 1 16 0" />
    </Icon>
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

function TrophyIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M8 5h8v2a4 4 0 0 1-8 0z" />
      <path d="M8 7H6a2 2 0 0 1-2-2V4h4" />
      <path d="M16 7h2a2 2 0 0 0 2-2V4h-4" />
      <path d="M12 11v5" />
      <path d="M9 20h6" />
    </Icon>
  );
}

function HelpCircleIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.75 9a2.25 2.25 0 1 1 3.53 1.86c-.73.5-1.28.92-1.28 1.89" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

export default function LeaderboardPage() {
  const [user, setUser] = useState<UserSession>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  const [monthlyCountdown, setMonthlyCountdown] = useState("");
  const [monthlyResetLabel, setMonthlyResetLabel] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isPrizeInfoOpen, setIsPrizeInfoOpen] = useState(false);
  const desktopToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);
  const desktopDropdownRef = useRef<HTMLDivElement | null>(null);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);
  const prizeInfoRef = useRef<HTMLDivElement | null>(null);

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
    if (!isPrizeInfoOpen) {
      return;
    }

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (prizeInfoRef.current?.contains(target)) {
        return;
      }
      setIsPrizeInfoOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPrizeInfoOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isPrizeInfoOpen]);

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

  useEffect(() => {
    let disposed = false;

    const loadLeaderboard = async () => {
      setIsLeaderboardLoading(true);
      try {
        const response = await fetch("/api/leaderboard", {
          method: "GET",
          cache: "no-store",
        });
        const data = (await response.json()) as LeaderboardResponse;
        if (disposed) {
          return;
        }

        if (!response.ok || data.status !== "success") {
          throw new Error(data.message ?? "Gagal memuat data leaderboard.");
        }

        setEntries(Array.isArray(data.entries) ? data.entries : []);
      } catch (error) {
        if (!disposed) {
          setEntries([]);
          setNotice({
            tone: "error",
            title: "Leaderboard Gagal Dimuat",
            message:
              error instanceof Error
                ? error.message
                : "Terjadi kesalahan saat memuat leaderboard.",
          });
        }
      } finally {
        if (!disposed) {
          setIsLeaderboardLoading(false);
        }
      }
    };

    void loadLeaderboard();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const { countdownLabel, resetLabel } = getMonthlyCountdownData(
        new Date(),
      );
      setMonthlyCountdown(countdownLabel);
      setMonthlyResetLabel(resetLabel);
    };

    updateCountdown();
    const timerId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timerId);
  }, []);

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

  const podiumEntries = PODIUM_ORDER.map((rank) =>
    entries.find((entry) => entry.rank === rank),
  );
  const rankedEntriesMap = new Map(entries.map((entry) => [entry.rank, entry]));
  const tableRanks = [4, 5, 6, 7, 8, 9, 10] as const;
  const tableEntries = tableRanks.map((rank) => ({
    rank,
    entry: rankedEntriesMap.get(rank) ?? null,
  }));

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
                    item.label === "Leaderboard"
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
              Pantau peringkat pemain teratas TopZyn dan jadilah juara bulanan
              disini.
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
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-[#293275]"
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
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
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
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-2xl font-extrabold text-[#293275] md:text-4xl">
            Leaderboard
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            Peringkat bulanan berdasarkan total top up tertinggi.
          </p>
          <p className="mt-3 text-sm font-bold text-[#293275] md:text-base">
            {monthlyCountdown}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Reset berikutnya: {monthlyResetLabel}
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-6xl rounded-3xl border border-[#293275]/20 bg-white p-4 text-[#101828] shadow-[0_28px_80px_rgba(17,26,61,0.15)] md:p-8">
          {isLeaderboardLoading ? (
            <div className="py-16 text-center text-sm text-slate-500 md:text-base">
              Memuat data leaderboard...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 items-end gap-2 md:gap-4">
                {podiumEntries.map((entry, index) => {
                  const rank = PODIUM_ORDER[index];
                  const isChampion = rank === 1;
                  return (
                    <article
                      key={`podium-${rank}`}
                      className={[
                        "rounded-xl border border-[#293275]/15 bg-white p-2 shadow-[0_10px_22px_rgba(15,23,42,0.12)] md:rounded-2xl md:p-4 md:shadow-[0_14px_34px_rgba(15,23,42,0.12)]",
                        isChampion
                          ? "pb-3 pt-2 md:order-2 md:pb-7 md:pt-5"
                          : "",
                        rank === 2
                          ? "pb-2 pt-1 md:order-1 md:pb-4 md:pt-3"
                          : "",
                        rank === 3
                          ? "pb-2 pt-1 md:order-3 md:pb-4 md:pt-3"
                          : "",
                      ].join(" ")}
                    >
                      <div className="flex flex-col items-center text-center">
                        <FallbackImage
                          src="/images/user_icon_topzyn.png"
                          alt={entry?.nickname ?? `Rank ${rank}`}
                          className={[
                            "h-10 w-10 rounded-lg object-cover md:h-16 md:w-16 md:rounded-xl",
                            isChampion ? "h-12 w-12 md:h-20 md:w-20" : "",
                          ].join(" ")}
                        />
                        <h3 className="mt-2 line-clamp-1 text-xs font-bold md:mt-3 md:text-lg">
                          {entry?.nickname ?? "Belum ada"}
                        </h3>
                        <p className="line-clamp-1 text-[10px] text-slate-500 md:text-sm">
                          {entry?.emailMasked ?? "-"}
                        </p>
                      </div>

                      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 md:mt-4 md:rounded-xl md:p-3">
                        <div className="mx-auto mb-2 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 md:mb-3 md:rounded-lg md:px-3 md:text-xs">
                          <TrophyIcon
                            className={[
                              "mr-1 h-3 w-3 md:mr-1.5 md:h-4 md:w-4",
                              isChampion ? "text-[#ffcf4d]" : "text-slate-200",
                            ].join(" ")}
                          />
                          #{rank}
                        </div>
                        <p className="text-center text-[10px] text-slate-600 md:text-sm">
                          Total Top Up
                        </p>
                        <p className="mt-1 text-center text-xs font-extrabold text-[#293275] md:text-3xl">
                          {formatRupiah(entry?.totalTopUp ?? 0)}
                        </p>

                        {isChampion ? (
                          <div
                            ref={prizeInfoRef}
                            className="relative mt-2 text-center md:mt-3"
                          >
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#ff711c] md:text-sm">
                              <span className="md:hidden">Prize : WDP</span>
                              <span className="hidden md:inline">
                                Prize : 1x Weekly Diamond Pass
                              </span>
                              <button
                                type="button"
                                aria-label="Info hadiah leaderboard"
                                aria-expanded={isPrizeInfoOpen}
                                onClick={() =>
                                  setIsPrizeInfoOpen((value) => !value)
                                }
                                className="inline-flex h-4 w-4 items-center justify-center text-[#ff711c] md:h-5 md:w-5"
                              >
                                <HelpCircleIcon className="h-3 w-3 md:h-4 md:w-4" />
                              </button>
                            </span>
                            <div
                              className={[
                                "absolute left-1/2 top-full z-20 mt-2 w-64 origin-top -translate-x-1/2 rounded-xl border border-[#293275]/25 bg-white px-3 py-2 text-xs font-semibold text-[#293275] shadow-[0_18px_40px_rgba(41,50,117,0.2)] transition-all duration-300 ease-out",
                                isPrizeInfoOpen
                                  ? "visible translate-y-0 scale-100 opacity-100 pointer-events-auto"
                                  : "invisible -translate-y-1 scale-95 opacity-0 pointer-events-none",
                              ].join(" ")}
                            >
                              <ol className="list-decimal space-y-1.5 pl-4 text-left leading-relaxed">
                                <li>
                                  Minimal top up yang berlaku adalah di atas
                                  Rp100.000. Jika nominal top up kurang dari
                                  Rp100.000, maka prize dinyatakan hangus dan
                                  tidak dapat diklaim.
                                </li>
                                <li>
                                  Prize akan dikirimkan ke akun pemenang pada
                                  tanggal 1 setiap bulannya.
                                </li>
                                <li>
                                  Setiap akun berhak memenangkan prize lebih
                                  dari satu kali, selama memenuhi syarat dan
                                  ketentuan yang berlaku.
                                </li>
                                <li>
                                  Admin akan menghubungi nomor WhatsApp pemenang
                                  untuk konfirmasi prize. Oleh karena itu,
                                  pastikan Anda telah mengisi dan melengkapi
                                  nomor WhatsApp yang aktif pada profil akun
                                  Anda.
                                </li>
                              </ol>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-8 overflow-hidden rounded-2xl border border-[#293275]/15 bg-white">
                <div className="hidden grid-cols-[80px_1.5fr_1.4fr_1fr] items-center border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-600 md:grid">
                  <span>Rank</span>
                  <span>Username</span>
                  <span>Email</span>
                  <span className="text-right">Total Top Up</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {tableEntries.map(({ rank, entry }) => (
                    <div
                      key={`rank-${rank}`}
                      className="grid grid-cols-[64px_1fr_auto] items-center gap-2 px-3 py-2 md:grid-cols-[80px_1.5fr_1.4fr_1fr] md:gap-3 md:px-5 md:py-3"
                    >
                      <div className="text-xs font-bold text-slate-700 md:text-sm">
                        #{rank}
                      </div>

                      <div className="flex items-center gap-3">
                        <FallbackImage
                          src="/images/user_icon_topzyn.png"
                          alt={entry?.username ?? "Belum ada"}
                          className="h-7 w-7 rounded-full object-cover md:h-9 md:w-9"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800 md:text-sm">
                            {entry?.username ?? "Belum ada"}
                          </p>
                          <p className="truncate text-[10px] text-slate-500 md:hidden">
                            {entry?.emailMasked ?? "Belum ada"}
                          </p>
                        </div>
                      </div>

                      <div className="hidden text-sm text-slate-600 md:block">
                        {entry?.emailMasked ?? "Belum ada"}
                      </div>

                      <div className="text-right text-xs font-bold text-[#293275] md:text-sm">
                        {formatRupiah(entry?.totalTopUp ?? 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
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

