"use client";

import { DEFAULT_PRODUCTS, type ProductCategory } from "@/lib/home-products";
import Link from "next/link";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";

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

const BANNERS = [
  "/images/banner1.jpg",
  "/images/banner2.jpg",
  "/images/banner3.jpg",
];
const BANNER_LOOP = [...BANNERS, BANNERS[0]];

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Leaderboard", href: "#" },
  { label: "Riwayat", href: "#" },
  { label: "Kalkulator", href: "#" },
];

const MAX_VISIBLE = 6;

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
    <Icon className={className}>
      <circle cx="12" cy="8.2" r="3.2" />
      <path d="M5.8 19a6.2 6.2 0 0 1 12.4 0" />
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
        <FallbackImage
          src="/images/user_icon_topzyn.png"
          alt="Avatar"
          className={compact ? "h-9 w-9 rounded-full object-cover" : "h-11 w-11 rounded-full object-cover"}
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
  const [user, setUser] = useState<UserSession>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const products = DEFAULT_PRODUCTS;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductCategory>("topup");
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE);
  const [slideIndex, setSlideIndex] = useState(0);
  const [canSlideTransition, setCanSlideTransition] = useState(true);

  const desktopDropdownRef = useRef<HTMLDivElement | null>(null);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);
  const desktopToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);

  const popularProducts = useMemo(
    () => products.filter((item) => item.isPopular).slice(0, 5),
    [products],
  );

  const filteredProducts = useMemo(
    () => products.filter((item) => item.category.includes(activeTab)),
    [activeTab, products],
  );

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredProducts.length;

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
    const frameId = window.requestAnimationFrame(() => {
      const searchParams = new URLSearchParams(window.location.search);
      const hasLogoutQuery = searchParams.get("logout") === "1";
      if (hasLogoutQuery) {
        setShowNotification(true);
        searchParams.delete("logout");

        const nextSearch = searchParams.toString();
        const nextUrl = `${window.location.pathname}${
          nextSearch ? `?${nextSearch}` : ""
        }${window.location.hash}`;
        window.history.replaceState(window.history.state, "", nextUrl);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
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
    const interval = window.setInterval(() => {
      setCanSlideTransition(true);
      setSlideIndex((previous) => previous + 1);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (slideIndex !== BANNER_LOOP.length - 1) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCanSlideTransition(false);
      setSlideIndex(0);
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [slideIndex]);

  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (desktopDropdownRef.current?.contains(target)) {
        return;
      }
      if (mobileDropdownRef.current?.contains(target)) {
        return;
      }
      if (desktopToggleRef.current?.contains(target)) {
        return;
      }
      if (mobileToggleRef.current?.contains(target)) {
        return;
      }
      setIsDropdownOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
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
    document.body.classList.toggle("overflow-hidden", showLogoutModal);
    return () => document.body.classList.remove("overflow-hidden");
  }, [showLogoutModal]);

  const handleTabChange = (category: ProductCategory) => {
    setActiveTab(category);
    setVisibleCount(MAX_VISIBLE);
  };

  const handleLoadMore = () => {
    setVisibleCount(filteredProducts.length);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    setIsDropdownOpen(false);
    setUser(null);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Tetap lanjut redirect supaya state user lokal ter-reset.
    }

    window.location.href = "/?logout=1";
  };

  return (
    <div className="min-h-screen bg-white pb-[86px] pt-[104px] text-zinc-900 md:pb-0 md:pt-[130px]">
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
              loading="eager"
              fetchPriority="high"
            />
          </Link>

          <ul className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="inline-flex items-center rounded-full px-3 py-2 text-base font-semibold text-white transition hover:text-[#ff711c] lg:text-lg"
                >
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
                  className="hidden items-center gap-2 rounded-full border border-white/20 px-2 py-1 text-white transition hover:bg-white/10 md:flex"
                >
                  <FallbackImage
                    src="/images/user_icon_topzyn.png"
                    alt="Avatar"
                    className="h-9 w-9 rounded-full border border-white object-cover"
                  />
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
              Bingung mau top up atau joki game di mana? Tenang, di TopZyn aja!
              Toko top up dan joki terpercaya No.1 se-Indonesia. Cepat, aman,
              dan selalu memuaskan! TopZyn - Top Up Mudah, Main Makin Seru!
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
          href="#"
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
        >
          <ChartIcon className="h-[22px] w-[22px]" />
          <span>Leaderboard</span>
        </Link>
        <Link
          href="#"
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
        >
          <HistoryIcon className="h-[22px] w-[22px]" />
          <span>Riwayat</span>
        </Link>
        <Link
          href="#"
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
            <h3 className="mb-2 text-lg font-bold text-slate-900 sm:text-2xl">Sukses</h3>
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

      <section className="mt-6 px-4 md:mt-16 md:px-0">
        <div className="mx-auto aspect-[16/7] max-w-6xl overflow-hidden">
          <div
            className="flex h-full w-full"
            style={{
              transform: `translateX(-${slideIndex * 100}%)`,
              transition: canSlideTransition ? "transform 0.6s ease" : "none",
            }}
          >
            {BANNER_LOOP.map((banner, index) => (
              <div key={`${banner}-${index}`} className="h-full min-w-full">
                <FallbackImage
                  src={banner}
                  alt={`Banner ${index + 1}`}
                  className="h-full w-full rounded-xl object-cover md:rounded-2xl"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "low"}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="mt-4 px-4 py-8 md:mt-14 md:py-10"
        style={{ contentVisibility: "auto" }}
      >
        <div className="mx-auto mb-5 max-w-6xl">
          <h2 className="text-2xl font-bold md:text-3xl">Populer Sekarang!</h2>
          <p className="text-xs text-zinc-500 md:text-sm">
            Berikut beberapa produk yang paling populer saat ini.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
          {popularProducts.map((item) => (
            <Link
              key={item.name}
              href={item.link}
              className="block no-underline"
            >
              <article className="group relative overflow-hidden rounded-xl bg-white shadow-sm md:rounded-2xl">
                <FallbackImage
                  src={item.popularImage ?? item.image}
                  alt={item.name}
                  className="block h-auto w-full object-contain bg-[#11162e] grayscale transition duration-500 group-hover:grayscale-0"
                  fetchPriority="low"
                />
                <div className="absolute inset-x-0 bottom-0 flex h-[26%] min-h-[44px] flex-col justify-center bg-[#293275]/95 p-2 text-white md:min-h-[52px] md:p-2.5">
                  <span className="block text-xs font-semibold leading-tight md:text-sm lg:text-base">
                    {item.name}
                  </span>
                  <small className="text-[11px] text-white/80">
                    {item.publisher}
                  </small>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl px-4 pb-2"
        style={{ contentVisibility: "auto" }}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("topup")}
            className={[
              "rounded-md px-3 py-2 text-[10px] transition md:text-xs",
              activeTab === "topup"
                ? "bg-[#293275] font-semibold text-white hover:bg-[#293275]/90"
                : "bg-slate-500 font-medium text-white hover:bg-slate-600",
            ].join(" ")}
          >
            ALL PRODUCT
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("ml")}
            className={[
              "rounded-md px-3 py-2 text-[10px] transition md:text-xs",
              activeTab === "ml"
                ? "bg-[#293275] font-semibold text-white hover:bg-[#293275]/90"
                : "bg-slate-500 font-medium text-white hover:bg-slate-600",
            ].join(" ")}
          >
            MLBB/MCGG
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("ff")}
            className={[
              "rounded-md px-3 py-2 text-[10px] transition md:text-xs",
              activeTab === "ff"
                ? "bg-[#293275] font-semibold text-white hover:bg-[#293275]/90"
                : "bg-slate-500 font-medium text-white hover:bg-slate-600",
            ].join(" ")}
          >
            FF
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 md:grid-cols-7 md:gap-4">
          {displayedProducts.map((product, index) => (
            <Link
              key={`${product.name}-${index}`}
              href={product.link}
              className="cards block [perspective:500px]"
            >
              <figure className="card group relative overflow-hidden rounded-md border-2 border-zinc-600 bg-[#16161d] [transform-style:preserve-3d] [will-change:transform] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out hover:[transform:translateZ(6px)_rotateX(8deg)_rotateY(8deg)]">
                <FallbackImage
                  src={product.image}
                  alt={product.name}
                  className="block h-auto w-full object-contain"
                  fetchPriority="low"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 motion-safe:transition-opacity motion-safe:duration-300 group-hover:opacity-100" />
                <figcaption className="card_title pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 motion-safe:transition-opacity motion-safe:duration-300 group-hover:opacity-100">
                  <div className="text-center [transform:translateZ(0)] motion-safe:translate-y-8 motion-safe:transition-transform motion-safe:duration-300 group-hover:[transform:translateZ(20px)] group-hover:translate-y-0">
                    <span className="block text-[13px] font-bold leading-tight [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000] md:text-sm">
                      {product.name}
                    </span>
                    <small className="mt-1 block text-[11px] text-white/80">
                      {product.publisher}
                    </small>
                  </div>
                </figcaption>
              </figure>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className={[
              "rounded-xl bg-[#293275] px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#293275]/90",
              canLoadMore ? "" : "hidden",
            ].join(" ")}
          >
            Tampilkan Lainnya
          </button>
        </div>
      </section>

      <footer
        className="mt-20 bg-white text-white md:mt-24"
        style={{ contentVisibility: "auto" }}
      >
        <div className="w-full overflow-hidden">
          <FallbackImage
            src="/images/footer_banner_raypoint.png"
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
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Beranda
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Masuk
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Daftar
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1 font-poppins"
                >
                  Kalkulator
                </Link>
                <Link
                  href="#"
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
    </div>
  );
}
