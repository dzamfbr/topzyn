"use client";

import Link from "next/link";
import { type RefObject, useEffect, useRef, useState } from "react";

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

type MlbbCatalogItem = {
  id: number;
  code: string;
  name: string;
  image_url: string;
  base_price: number;
  final_price: number;
  discount_percent: number;
};

type MlbbCatalogResponse = {
  status: "ok" | "error";
  items?: MlbbCatalogItem[];
};

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "History", href: "/riwayat" },
  { label: "Kalkulator", href: "/kalkulator" },
];

const HOME_BANNERS = [
  "/images/topzyn/banners/topzyn-home-banner-slide-01.jpg",
  "/images/topzyn/banners/topzyn-home-banner-slide-02.jpg",
  "/images/topzyn/banners/topzyn-home-banner-slide-03.jpg",
];
const HOME_BANNER_SECTION_BG =
  "/images/topzyn/backgrounds/topzyn-home-banner-background-desktop.jpg";
const HOME_BANNER_SECTION_BG_MOBILE =
  "/images/topzyn/backgrounds/topzyn-home-banner-background-mobile.png";
const FLASH_SALE_TIMER_BG = "/images/topzyn/time.png";
const FLASH_SALE_DISCOUNT_PRICE_BG = "/images/topzyn/harga_diskon.png";
const FLASH_SALE_CARD_LIMIT = 5;
const FLASH_SALE_PRODUCT_CODES = [
  "MLWDP001",
  "MLDM001",
  "MLDM002",
  "MLDM003",
  "MLDM004",
];
const FLASH_SALE_MARQUEE_DURATION_SECONDS = 28;

function getSecondsUntilNextMidnight(): number {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(
    0,
    Math.floor((nextMidnight.getTime() - now.getTime()) / 1000),
  );
}

function formatRupiah(value: number): string {
  return `Rp ${Math.max(0, Math.floor(value)).toLocaleString("id-ID")}`;
}

function resolveFlashSaleItems(
  sourceItems: MlbbCatalogItem[],
  targetCodes: string[],
  cardLimit: number,
): MlbbCatalogItem[] {
  if (!Array.isArray(sourceItems) || sourceItems.length === 0) {
    return [];
  }

  const normalizedCodes = targetCodes
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
  const sourceByCode = new Map(
    sourceItems.map((item) => [(item.code ?? "").toUpperCase(), item]),
  );

  const matchedByCode = normalizedCodes
    .map((code) => sourceByCode.get(code))
    .filter((item): item is MlbbCatalogItem => Boolean(item));

  const fallbackWdpItems = sourceItems.filter((item) => {
    const code = (item.code ?? "").toUpperCase();
    const name = (item.name ?? "").toLowerCase();
    return code.includes("WDP") || name.includes("weekly diamond pass");
  });

  const seedItems =
    normalizedCodes.length > 0 ? matchedByCode : fallbackWdpItems;
  if (seedItems.length === 0) {
    return [];
  }

  const safeLimit = Math.max(1, cardLimit);
  return Array.from(
    { length: safeLimit },
    (_, index) => seedItems[index % seedItems.length],
  );
}

function getDisplayDiscountPercent(item: MlbbCatalogItem): number {
  if (item.discount_percent > 0) {
    return Math.floor(item.discount_percent);
  }

  if (item.base_price <= 0 || item.final_price >= item.base_price) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(((item.base_price - item.final_price) / item.base_price) * 100),
  );
}

function getFlashSaleTargetHref(item: MlbbCatalogItem): string {
  const code = (item.code ?? "").trim().toUpperCase();

  // Flash sale currently serves MLBB catalog. Keep this mapper explicit so
  // future product routes can be added by code prefix.
  if (code.startsWith("ML")) {
    return `/produk/mobile-legends?item=${encodeURIComponent(code)}`;
  }

  return `/produk/mobile-legends?item=${encodeURIComponent(code)}`;
}

function FallbackImage({
  src,
  alt,
  className,
  loading = "lazy",
  fetchPriority = "auto",
  decoding = "async",
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "auto" | "high" | "low";
  decoding?: "sync" | "async" | "auto";
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
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      onError={() => setCurrentSrc("/next.svg")}
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

function ProfileDropdownMenu({
  user,
  menuRef,
  className,
  onCloseDropdown,
  onOpenLogoutModal,
  compact = false,
}: {
  user: NonNullable<UserSession>;
  menuRef: RefObject<HTMLDivElement | null>;
  className: string;
  onCloseDropdown: () => void;
  onOpenLogoutModal: () => void;
  compact?: boolean;
}) {
  return (
    <div ref={menuRef} className={className}>
      <div
        className={[
          "flex border-b border-slate-200",
          compact ? "gap-2.5 p-2" : "gap-3 p-2",
        ].join(" ")}
      >
        <span
          className={[
            "iconify inline-block text-[#293275]",
            compact ? "h-9 w-9" : "h-11 w-11",
          ].join(" ")}
          data-icon="mdi:account-circle"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <strong
            className={[
              "block truncate text-slate-800",
              compact ? "text-xs" : "text-sm",
            ].join(" ")}
          >
            {user.username}
          </strong>
          <p
            className={[
              "truncate text-slate-500",
              compact ? "text-[11px]" : "text-xs",
            ].join(" ")}
          >
            {user.email}
          </p>
        </div>
      </div>

      <Link
        href="/profile"
        onClick={onCloseDropdown}
        className={[
          "mt-2 flex items-center rounded-lg font-semibold text-slate-800 transition hover:bg-slate-100",
          compact ? "gap-1.5 px-2 py-1.5 text-xs" : "gap-2 px-2.5 py-2 text-sm",
        ].join(" ")}
      >
        <UserIcon className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
        Profil Saya
      </Link>

      <button
        type="button"
        onClick={() => {
          onCloseDropdown();
          onOpenLogoutModal();
        }}
        className={[
          "mt-1 flex w-full items-center rounded-lg font-semibold text-red-600 transition hover:bg-red-50",
          compact ? "gap-1.5 px-2 py-1.5 text-xs" : "gap-2 px-2.5 py-2 text-sm",
        ].join(" ")}
      >
        <LogoutIcon className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
        Logout
      </button>
    </div>
  );
}

export default function Home() {
  const bannerCount = HOME_BANNERS.length;
  const [user, setUser] = useState<UserSession>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [flashSaleItems, setFlashSaleItems] = useState<MlbbCatalogItem[]>([]);
  const [isFlashSaleLoading, setIsFlashSaleLoading] = useState(true);
  const [flashSaleError, setFlashSaleError] = useState("");
  const [isFlashSalePaused, setIsFlashSalePaused] = useState(false);
  const [secondsUntilMidnight, setSecondsUntilMidnight] = useState(0);

  const desktopDropdownRef = useRef<HTMLDivElement | null>(null);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);
  const desktopToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let disposed = false;

    const loadMe = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as MeResponse;
        if (disposed) return;

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
    const params = new URLSearchParams(window.location.search);
    if (params.get("logout") === "1") {
      setShowNotification(true);
      params.delete("logout");
      const nextQuery = params.toString();
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, []);

  useEffect(() => {
    if (!showNotification) return;
    const timer = window.setTimeout(() => setShowNotification(false), 2500);
    return () => window.clearTimeout(timer);
  }, [showNotification]);

  useEffect(() => {
    if (!isDropdownOpen) return;

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
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setShowLogoutModal(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

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
    document.body.classList.toggle("overflow-hidden", showLogoutModal);
    return () => document.body.classList.remove("overflow-hidden");
  }, [showLogoutModal]);

  useEffect(() => {
    if (bannerCount <= 1) return;
    const intervalId = window.setInterval(() => {
      setActiveBannerIndex((previous) => (previous + 1) % bannerCount);
    }, 3600);
    return () => window.clearInterval(intervalId);
  }, [bannerCount]);

  useEffect(() => {
    const updateCountdown = () => {
      setSecondsUntilMidnight(getSecondsUntilNextMidnight());
    };

    updateCountdown();
    const timerId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadFlashSaleItems = async () => {
      try {
        setIsFlashSaleLoading(true);
        setFlashSaleError("");

        const response = await fetch("/api/mlbb/catalog", {
          method: "GET",
          cache: "no-store",
        });
        const data = (await response.json()) as MlbbCatalogResponse;

        if (cancelled) return;
        if (!response.ok || data.status !== "ok") {
          setFlashSaleError("Gagal memuat promo hari ini.");
          setFlashSaleItems([]);
          return;
        }

        const sourceItems = Array.isArray(data.items) ? data.items : [];
        const resolvedItems = resolveFlashSaleItems(
          sourceItems,
          FLASH_SALE_PRODUCT_CODES,
          FLASH_SALE_CARD_LIMIT,
        );

        setFlashSaleItems(resolvedItems);
      } catch {
        if (!cancelled) {
          setFlashSaleError("Gagal memuat promo hari ini.");
          setFlashSaleItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsFlashSaleLoading(false);
        }
      }
    };

    void loadFlashSaleItems();

    return () => {
      cancelled = true;
    };
  }, []);

  const goToPreviousBanner = () => {
    if (bannerCount <= 1) return;
    setActiveBannerIndex(
      (previous) => (previous - 1 + bannerCount) % bannerCount,
    );
  };

  const goToNextBanner = () => {
    if (bannerCount <= 1) return;
    setActiveBannerIndex((previous) => (previous + 1) % bannerCount);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    setIsDropdownOpen(false);
    setUser(null);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // keep redirect for consistent UX
    }
    window.location.href = "/?logout=1";
  };

  const countdownHours = String(
    Math.floor(secondsUntilMidnight / 3600),
  ).padStart(2, "0");
  const countdownMinutes = String(
    Math.floor((secondsUntilMidnight % 3600) / 60),
  ).padStart(2, "0");
  const countdownSeconds = String(secondsUntilMidnight % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-white pb-[86px] text-zinc-900 md:pb-0">
      <nav
        className="sticky top-0 z-[999] bg-[#293275] shadow-[0_8px_18px_rgba(14,16,22,0.08)]"
      >
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between gap-4 px-4 md:h-[90px] md:px-6">
          <Link href="/" className="inline-flex items-center">
            <FallbackImage
              src="/images/topzyn/branding/topzyn-brand-title-logo.png"
              alt="TopZyn"
              className="h-10 w-auto md:h-12"
              loading="eager"
              fetchPriority="high"
            />
          </Link>

          <ul className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-base font-semibold transition lg:text-lg",
                    item.label === "Home"
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
                  className="hidden items-center gap-2 rounded-full px-2 py-1 text-white transition hover:bg-white/10 md:flex"
                >
                  <UserIcon className="h-9 w-9" />
                  <span className="font-poppins text-sm font-bold">
                    {user.username}
                  </span>
                  <ChevronDownIcon
                    className={[
                      "h-5 w-5 transition-transform duration-200",
                      isDropdownOpen ? "rotate-180" : "rotate-0",
                    ].join(" ")}
                  />
                </button>

                <ProfileDropdownMenu
                  user={user}
                  menuRef={desktopDropdownRef}
                  onCloseDropdown={() => setIsDropdownOpen(false)}
                  onOpenLogoutModal={() => setShowLogoutModal(true)}
                  className={[
                    "absolute right-0 top-[58px] z-[1000] hidden w-[260px] origin-top-right rounded-xl border border-[#293275] bg-white p-2 shadow-2xl transition duration-200 md:block",
                    isDropdownOpen
                      ? "visible translate-y-0 scale-100 opacity-100 pointer-events-auto"
                      : "invisible -translate-y-2 scale-95 opacity-0 pointer-events-none",
                  ].join(" ")}
                />
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
          <div className="running-text-track inline-block whitespace-nowrap pl-[100%] [animation:runningText_15s_linear_infinite]">
            <span className="inline-block px-5 text-sm font-bold text-white md:px-7 md:text-base">
              TopZyn - Top Up Mudah, Main Makin Seru!
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
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-[#293275]"
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
        <ProfileDropdownMenu
          user={user}
          menuRef={mobileDropdownRef}
          onCloseDropdown={() => setIsDropdownOpen(false)}
          onOpenLogoutModal={() => setShowLogoutModal(true)}
          compact
          className={[
            "fixed bottom-[92px] right-4 z-[1000] w-[220px] origin-bottom-right rounded-xl border border-[#293275] bg-white p-1.5 shadow-2xl transition duration-200 md:hidden",
            isDropdownOpen
              ? "visible translate-y-0 scale-100 opacity-100 pointer-events-auto"
              : "invisible translate-y-2 scale-95 opacity-0 pointer-events-none",
          ].join(" ")}
        />
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
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logoutTitle"
            className="w-full max-w-[420px] rounded-2xl bg-white px-8 py-7 text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 flex h-[86px] w-[86px] items-center justify-center rounded-full bg-amber-100 text-amber-500">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-11 w-11">
                <path
                  d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 13h-1v-2h2v2h-1zm1-4h-2V7h2v4z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h3 id="logoutTitle" className="text-2xl font-bold text-slate-900">
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

      {showNotification ? (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/45 px-4 [animation:fadeIn_0.25s_ease_forwards]"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowNotification(false);
            }
          }}
        >
          <div className="w-full max-w-[320px] rounded-[18px] bg-white px-5 py-5 text-center shadow-[0_20px_45px_rgba(0,0,0,0.22)] sm:max-w-[420px] sm:rounded-2xl sm:px-9 sm:py-8">
            <div className="mx-auto mb-3 flex h-[70px] w-[70px] items-center justify-center rounded-full bg-emerald-50 text-emerald-600 sm:mb-5 sm:h-[90px] sm:w-[90px]">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-9 w-9 sm:h-[46px] sm:w-[46px]"
              >
                <path
                  d="M9.5 16.2L5.8 12.5l-1.4 1.4 5.1 5.1 10-10-1.4-1.4z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900 sm:text-2xl">
              Sukses
            </h3>
            <p className="text-sm text-slate-500">Aksi berhasil diproses.</p>
            <button
              type="button"
              onClick={() => setShowNotification(false)}
              className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 sm:text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}

      <main className="pb-4">
        <section className="relative w-full overflow-hidden">
          <FallbackImage
            src={HOME_BANNER_SECTION_BG}
            alt="Banner background desktop"
            className="absolute inset-0 hidden h-full w-full object-fill md:block"
            fetchPriority="low"
          />
          <FallbackImage
            src={HOME_BANNER_SECTION_BG_MOBILE}
            alt="Banner background mobile"
            className="absolute inset-0 h-full w-full object-fill md:hidden"
            fetchPriority="low"
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:pb-20 sm:pt-12 md:pb-24 md:pt-14">
            <div className="relative mx-auto aspect-[3/1] w-full max-w-[980px]">
              {HOME_BANNERS.map((banner, index) => {
                const total = HOME_BANNERS.length;
                const leftIndex = (activeBannerIndex - 1 + total) % total;
                const rightIndex = (activeBannerIndex + 1) % total;

                const cardClass =
                  index === activeBannerIndex
                    ? "z-30 opacity-100 blur-0 [transform:translateX(-50%)_scale(1)]"
                    : index === leftIndex
                      ? "max-md:hidden z-20 opacity-100 blur-0 [transform:translateX(calc(-50%-28%))_scale(0.86)] hover:[transform:translateX(calc(-50%-28%))_scale(0.93)] focus-visible:[transform:translateX(calc(-50%-28%))_scale(0.93)]"
                      : index === rightIndex
                        ? "max-md:hidden z-20 opacity-100 blur-0 [transform:translateX(calc(-50%+28%))_scale(0.86)] hover:[transform:translateX(calc(-50%+28%))_scale(0.93)] focus-visible:[transform:translateX(calc(-50%+28%))_scale(0.93)]"
                        : "z-10 pointer-events-none opacity-0 [transform:translateX(-50%)_scale(0.82)]";

                return (
                  <article
                    key={`${banner}-${index}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Tampilkan banner ${index + 1}`}
                    onClick={() => setActiveBannerIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveBannerIndex(index);
                      }
                    }}
                    className={[
                      "absolute left-1/2 top-0 h-full w-[88%] max-w-[860px] cursor-pointer overflow-hidden rounded-2xl shadow-[0_18px_34px_rgba(18,24,44,0.25)] outline-none transition-all duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#ff711c] focus-visible:ring-offset-2",
                      cardClass,
                    ].join(" ")}
                  >
                    <FallbackImage
                      src={banner}
                      alt={`Banner ${index + 1}`}
                      className="h-full w-full rounded-2xl object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "low"}
                    />
                  </article>
                );
              })}

              {bannerCount > 1 ? (
                <div className="pointer-events-none absolute left-1/2 top-1/2 z-40 flex w-[88%] max-w-[860px] -translate-x-1/2 -translate-y-1/2 items-center justify-between md:hidden">
                  <button
                    type="button"
                    aria-label="Banner sebelumnya"
                    onClick={goToPreviousBanner}
                    className="pointer-events-auto -ml-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-[0_10px_24px_rgba(0,0,0,0.25)] transition hover:scale-105 active:scale-95"
                  >
                    <FallbackImage
                      src="/images/topzyn/ui/topzyn-banner-arrow-left.png"
                      alt="Prev"
                      className="h-8 w-8 object-contain"
                      loading="eager"
                    />
                  </button>

                  <button
                    type="button"
                    aria-label="Banner berikutnya"
                    onClick={goToNextBanner}
                    className="pointer-events-auto -mr-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-[0_10px_24px_rgba(0,0,0,0.25)] transition hover:scale-105 active:scale-95"
                  >
                    <FallbackImage
                      src="/images/topzyn/ui/topzyn-banner-arrow-right.png"
                      alt="Next"
                      className="h-8 w-8 object-contain"
                      loading="eager"
                    />
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              {HOME_BANNERS.map((_, index) => (
                <button
                  key={`banner-dot-${index}`}
                  type="button"
                  onClick={() => setActiveBannerIndex(index)}
                  aria-label={`Pilih banner ${index + 1}`}
                  className={[
                    "h-[5px] rounded-full transition-all duration-300",
                    index === activeBannerIndex
                      ? "w-10 bg-[#ff711c]"
                      : "w-6 bg-white/75 hover:bg-white",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-6xl px-4 md:mt-10">
          <div className="rounded-[22px] bg-[#dbeafe] p-3.5 shadow-[0_14px_35px_rgba(0,0,0,0.08)] sm:rounded-[24px] sm:p-4.5 md:rounded-[28px] md:p-7">
            <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-display text-[23px] font-extrabold tracking-wide text-[#111827] sm:text-[26px] md:text-[30px]">
                  F<span className="text-[#facc15]">⚡</span>ASH SALE
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-700 sm:text-sm md:text-base">
                  Penawaran terbatas khusus untuk kamu.
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {[countdownHours, countdownMinutes, countdownSeconds].map(
                  (unit, idx) => (
                    <div
                      key={`countdown-unit-${idx}`}
                      className="relative h-12 w-[52px] overflow-hidden rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.18)] sm:h-14 sm:w-[60px] sm:rounded-xl md:h-16 md:w-[68px]"
                    >
                      <FallbackImage
                        src={FLASH_SALE_TIMER_BG}
                        alt={`Timer unit ${idx + 1}`}
                        className="absolute inset-0 h-full w-full object-fill"
                        fetchPriority="low"
                      />
                      <div className="relative flex h-full items-center justify-center bg-black/10 text-[22px] font-extrabold leading-none text-white sm:text-[26px] md:text-[30px]">
                        {unit}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="mt-4 sm:mt-5 md:mt-6">
              {isFlashSaleLoading ? (
                <div className="flex gap-3 overflow-hidden sm:gap-4">
                  {Array.from({ length: FLASH_SALE_CARD_LIMIT }).map(
                    (_, idx) => (
                      <div
                        key={`flash-skeleton-${idx}`}
                        className="h-[132px] w-[260px] shrink-0 animate-pulse rounded-xl bg-white/65 sm:h-[146px] sm:w-[300px] sm:rounded-2xl md:h-[156px] md:w-[320px]"
                      />
                    ),
                  )}
                </div>
              ) : flashSaleError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {flashSaleError}
                </div>
              ) : flashSaleItems.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600">
                  Belum ada produk flash sale untuk hari ini.
                </div>
              ) : (
                <div
                  className="overflow-hidden"
                  onMouseEnter={() => setIsFlashSalePaused(true)}
                  onMouseLeave={() => setIsFlashSalePaused(false)}
                  onFocusCapture={() => setIsFlashSalePaused(true)}
                  onBlurCapture={() => setIsFlashSalePaused(false)}
                >
                  <div
                    className="flex w-max items-stretch gap-3 pr-3 sm:gap-4 sm:pr-4"
                    style={{
                      animation: `topzynFlashSaleMarquee ${FLASH_SALE_MARQUEE_DURATION_SECONDS}s linear infinite`,
                      animationPlayState: isFlashSalePaused
                        ? "paused"
                        : "running",
                    }}
                  >
                    {[...flashSaleItems, ...flashSaleItems].map(
                      (item, index) => {
                        const discountPercent = getDisplayDiscountPercent(item);
                        return (
                          <Link
                            key={`flash-item-${item.id}-${item.code}-${index}`}
                            href={getFlashSaleTargetHref(item)}
                            className="w-[260px] shrink-0 rounded-xl border border-white/80 bg-white px-3 py-2.5 shadow-[0_12px_28px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(17,24,39,0.2)] sm:w-[300px] sm:rounded-2xl sm:px-3.5 sm:py-3 md:w-[320px] md:px-4"
                          >
                            <h3 className="line-clamp-2 min-h-[36px] text-[14px] font-extrabold leading-tight text-slate-900 sm:min-h-[42px] sm:text-[16px] md:min-h-[46px] md:text-[18px]">
                              {item.name}
                            </h3>

                            <div className="mt-2 flex items-center gap-2.5 sm:gap-3">
                              <div className="h-[62px] w-[62px] shrink-0 overflow-hidden rounded-lg bg-slate-100 p-1.5 sm:h-[70px] sm:w-[70px] sm:rounded-xl md:h-[76px] md:w-[76px]">
                                <FallbackImage
                                  src={item.image_url}
                                  alt={item.name}
                                  className="h-full w-full object-contain"
                                  fetchPriority="low"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="relative h-9 min-w-[132px] overflow-hidden rounded-md sm:h-10 sm:min-w-[152px] sm:rounded-lg md:h-11 md:min-w-[170px]">
                                  <FallbackImage
                                    src={FLASH_SALE_DISCOUNT_PRICE_BG}
                                    alt="Background harga diskon"
                                    className="absolute inset-0 h-full w-full object-cover"
                                    fetchPriority="low"
                                  />
                                  <p className="relative z-10 flex h-full items-center justify-center px-2 text-center text-[18px] font-black leading-none text-[#ff711c] sm:text-[21px] md:px-3 md:text-[24px]">
                                    {formatRupiah(item.final_price)}
                                  </p>
                                </div>
                                <p className="mt-1 text-[12px] font-semibold text-slate-500 line-through sm:text-[13px] md:text-[15px]">
                                  {formatRupiah(item.base_price)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2.5 flex justify-end sm:mt-3">
                              <span className="inline-flex items-center rounded-full bg-[#ff711c]/12 px-2.5 py-1 text-[11px] font-extrabold text-[#ff711c] sm:px-3 sm:text-xs">
                                Diskon {discountPercent}%
                              </span>
                            </div>
                          </Link>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative -mb-[86px] mt-20 bg-white text-white after:block after:h-[86px] after:bg-[#293275] md:mb-0 md:mt-24 md:after:hidden">
        <div className="w-full overflow-hidden">
          <FallbackImage
            src="/images/topzyn/branding/topzyn-footer-banner-wave.png"
            alt="Footer Visual"
            className="h-full w-full object-cover"
            fetchPriority="low"
          />
        </div>

        <div className="-mt-1 bg-[#293275] px-4 pb-10 pt-14 md:pt-16">
          <div className="mx-auto max-w-6xl text-center">
            <p className="mx-auto mb-10 max-w-3xl text-base leading-relaxed text-white/80 md:mb-12 md:text-xl font-poppins">
              TopZyn adalah sahabat para gamers dan platform top up game
              terpercaya di Indonesia.
            </p>

            <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-2 md:text-left lg:grid-cols-4">
              <div>
                <h4 className="mb-3 text-xl font-bold text-[#ff711c] font-poppins">
                  Peta Situs
                </h4>
                <Link
                  href="/"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Beranda
                </Link>
                <Link
                  href="/login"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Daftar
                </Link>
                <Link
                  href="/kalkulator"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Kalkulator
                </Link>
                <Link
                  href="/riwayat"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Cek Transaksi
                </Link>
              </div>

              <div>
                <h4 className="mb-3 text-xl font-bold text-[#ff711c] font-poppins">
                  Dukungan
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  WhatsApp
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Email
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Instagram
                </Link>
              </div>

              <div>
                <h4 className="mb-3 text-xl font-bold text-[#ff711c] font-poppins">
                  Legalitas
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Kebijakan Privasi
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Syarat & Ketentuan
                </Link>
              </div>

              <div>
                <h4 className="mb-3 text-xl font-bold text-[#ff711c] font-poppins">
                  Sosial Media
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  TikTok
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Instagram
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Discord
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Email
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  YouTube
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes topzynFlashSaleMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [style*="topzynFlashSaleMarquee"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
