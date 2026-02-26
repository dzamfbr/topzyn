"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

type MlbbItem = {
  id: number;
  code: string;
  name: string;
  image_url: string;
  base_price: number;
  final_price: number;
  discount_percent: number;
};

type PaymentMethod = {
  id: number;
  code: string;
  name: string;
  logo_url: string;
};

type CatalogResponse = {
  status: "ok" | "error";
  message?: string;
  items?: MlbbItem[];
  payment_methods?: PaymentMethod[];
};

type PromoValidateResponse = {
  status: "ok" | "error";
  message?: string;
  code?: string;
  discount_amount?: number;
};

type MlbbOrderResponse = {
  status: "ok" | "error";
  message?: string;
  invoice_url?: string;
  order_number?: string;
};

const WDP_NOTICE_KEY = "topzyn_hide_wdp_notice";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Leaderboard", href: "#" },
  { label: "Riwayat", href: "#" },
  { label: "Kalkulator", href: "#" },
];

function formatRupiah(value: number): string {
  return `Rp ${Math.max(0, Math.floor(value)).toLocaleString("id-ID")}`;
}

function normalizeWhatsapp(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

function isWdpItem(name: string): boolean {
  return /weekly\s*diamond\s*pass|wdp/i.test(name);
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

export default function MobileLegendsProductPage() {
  const [user, setUser] = useState<UserSession>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [items, setItems] = useState<MlbbItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const [gameUserId, setGameUserId] = useState("");
  const [gameServer, setGameServer] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoTone, setPromoTone] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [topNotice, setTopNotice] = useState<{
    id: number;
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [isTopNoticeShown, setIsTopNoticeShown] = useState(false);

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
    null,
  );
  const [promoState, setPromoState] = useState<{
    code: string | null;
    discountAmount: number;
  }>({
    code: null,
    discountAmount: 0,
  });

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showWdpModal, setShowWdpModal] = useState(false);
  const [dismissWdpForever, setDismissWdpForever] = useState(false);
  const [wdpShownOnce, setWdpShownOnce] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const profileButtonRef = useRef<HTMLButtonElement | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);
  const paymentSectionRef = useRef<HTMLDivElement | null>(null);
  const previousReadyRef = useRef(false);
  const topNoticeHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const topNoticeRemoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );
  const selectedPayment = useMemo(
    () =>
      paymentMethods.find((method) => method.id === selectedPaymentId) ?? null,
    [paymentMethods, selectedPaymentId],
  );
  const groupedItems = useMemo(() => {
    const regular: MlbbItem[] = [];
    const wdp: MlbbItem[] = [];

    items.forEach((item) => {
      if (isWdpItem(`${item.name} ${item.code}`)) {
        wdp.push(item);
      } else {
        regular.push(item);
      }
    });

    return { regular, wdp };
  }, [items]);

  const subtotal = selectedItem?.final_price ?? 0;
  const totalAmount = Math.max(0, subtotal - promoState.discountAmount);
  const summaryPromoText = promoState.code
    ? `${promoState.code} (-${formatRupiah(promoState.discountAmount)})`
    : "-";
  const isReadyToPay = Boolean(
    selectedItem && gameUserId.trim() && gameServer.trim(),
  );
  const isModalOpen = showLogoutModal || showOrderModal || showWdpModal;

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
        if (!disposed) setUser(null);
      } finally {
        if (!disposed) setIsAuthResolved(true);
      }
    };
    void loadMe();
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    const loadCatalog = async () => {
      setIsCatalogLoading(true);
      try {
        const response = await fetch("/api/mlbb/catalog", {
          method: "GET",
          cache: "no-store",
        });
        const data = (await response.json()) as CatalogResponse;
        if (disposed) return;
        if (!response.ok || data.status !== "ok") {
          throw new Error(data.message ?? "Gagal memuat katalog.");
        }

        const nextItems = data.items ?? [];
        const nextMethods = data.payment_methods ?? [];
        setItems(nextItems);
        setPaymentMethods(nextMethods);
        if (nextMethods.length > 0) {
          setSelectedPaymentId(nextMethods[0].id);
        }
      } catch (error) {
        if (!disposed) {
          setCatalogError(
            error instanceof Error
              ? error.message
              : "Gagal memuat katalog MLBB.",
          );
        }
      } finally {
        if (!disposed) setIsCatalogLoading(false);
      }
    };
    void loadCatalog();
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileButtonRef.current?.contains(target)) return;
      if (profileDropdownRef.current?.contains(target)) return;
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
    document.body.classList.toggle("overflow-hidden", isModalOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isModalOpen]);

  useEffect(() => {
    if (!selectedItem || wdpShownOnce) return;
    try {
      if (window.localStorage.getItem(WDP_NOTICE_KEY) === "1") return;
      if (isWdpItem(selectedItem.name)) {
        setWdpShownOnce(true);
        setShowWdpModal(true);
      }
    } catch {
      // ignore
    }
  }, [selectedItem, wdpShownOnce]);

  useEffect(() => {
    if (!isReadyToPay) {
      previousReadyRef.current = false;
      return;
    }
    if (!previousReadyRef.current) {
      paymentSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    previousReadyRef.current = true;
  }, [isReadyToPay]);

  useEffect(() => {
    return () => {
      if (topNoticeHideTimerRef.current) {
        clearTimeout(topNoticeHideTimerRef.current);
      }
      if (topNoticeRemoveTimerRef.current) {
        clearTimeout(topNoticeRemoveTimerRef.current);
      }
    };
  }, []);

  const resetPromo = () => {
    setPromoState({ code: null, discountAmount: 0 });
    setPromoTone("idle");
    setPromoMessage("");
  };

  const clearTopNoticeTimers = () => {
    if (topNoticeHideTimerRef.current) {
      clearTimeout(topNoticeHideTimerRef.current);
      topNoticeHideTimerRef.current = null;
    }
    if (topNoticeRemoveTimerRef.current) {
      clearTimeout(topNoticeRemoveTimerRef.current);
      topNoticeRemoveTimerRef.current = null;
    }
  };

  const showTopNotice = (message: string, tone: "error" | "success" = "error") => {
    clearTopNoticeTimers();
    setTopNotice({
      id: Date.now(),
      message,
      tone,
    });
    setIsTopNoticeShown(false);

    requestAnimationFrame(() => {
      setIsTopNoticeShown(true);
    });

    topNoticeHideTimerRef.current = setTimeout(() => {
      setIsTopNoticeShown(false);
    }, 4700);

    topNoticeRemoveTimerRef.current = setTimeout(() => {
      setTopNotice(null);
    }, 5000);
  };

  const validateForm = (): boolean => {
    if (!gameUserId.trim() || !gameServer.trim()) {
      showTopNotice("Lengkapi User ID dan Server.");
      return false;
    }
    if (!selectedItem) {
      showTopNotice("Pilih nominal top up terlebih dahulu.");
      return false;
    }
    if (!selectedPayment) {
      showTopNotice("Pilih metode pembayaran terlebih dahulu.");
      return false;
    }
    if (!/^(\+62|62|0)[0-9]{8,15}$/.test(normalizeWhatsapp(contactWhatsapp))) {
      showTopNotice("Masukkan nomor WhatsApp yang valid.");
      return false;
    }
    clearTopNoticeTimers();
    setIsTopNoticeShown(false);
    setTopNotice(null);
    return true;
  };

  const handleApplyPromo = async () => {
    if (!selectedItem) {
      setPromoTone("error");
      setPromoMessage("Pilih item terlebih dahulu.");
      return;
    }
    if (!promoCode.trim()) {
      setPromoTone("error");
      setPromoMessage("Masukkan kode promo terlebih dahulu.");
      return;
    }

    setPromoTone("idle");
    setPromoMessage("Memeriksa kode promo...");
    try {
      const response = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), subtotal }),
      });
      const data = (await response.json()) as PromoValidateResponse;
      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message ?? "Kode promo tidak valid.");
      }
      const discountAmount = Number(data.discount_amount ?? 0);
      setPromoState({
        code: data.code ?? promoCode.trim().toUpperCase(),
        discountAmount,
      });
      setPromoTone("success");
      setPromoMessage(
        `Promo aktif. Potongan ${formatRupiah(discountAmount)} berhasil diterapkan.`,
      );
    } catch (error) {
      resetPromo();
      setPromoTone("error");
      setPromoMessage(
        error instanceof Error ? error.message : "Gagal memeriksa kode promo.",
      );
    }
  };

  const handleConfirmOrder = async () => {
    if (!validateForm() || !selectedItem || !selectedPayment) return;

    setIsSubmittingOrder(true);
    try {
      const response = await fetch("/api/mlbb/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_user_id: gameUserId.trim(),
          game_server: gameServer.trim(),
          game_nickname: "",
          item_id: selectedItem.id,
          payment_method_id: selectedPayment.id,
          promo_code: promoState.code ?? "",
          contact_whatsapp: normalizeWhatsapp(contactWhatsapp),
        }),
      });
      const data = (await response.json()) as MlbbOrderResponse;
      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message ?? "Order gagal diproses.");
      }
      setShowOrderModal(false);
      window.location.href = data.invoice_url ?? `/invoice/${encodeURIComponent(data.order_number ?? "")}`;
    } catch (error) {
      setShowOrderModal(false);
      showTopNotice(
        error instanceof Error ? error.message : "Order gagal diproses.",
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleLogout = async () => {
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

  const closeWdpModal = () => {
    setShowWdpModal(false);
    if (dismissWdpForever) {
      try {
        window.localStorage.setItem(WDP_NOTICE_KEY, "1");
      } catch {
        // ignore
      }
    }
  };

  const renderNominalCard = (item: MlbbItem) => (
    <button
      key={item.id}
      type="button"
      onClick={() => {
        setSelectedItemId(item.id);
        resetPromo();
      }}
      className={[
        "flex items-start gap-2 rounded-xl border p-2 text-left transition sm:gap-3 sm:rounded-2xl sm:p-3",
        selectedItemId === item.id
          ? "border-[#293275] ring-2 ring-[#293275]/20"
          : "border-slate-200 hover:border-[#293275]/40",
      ].join(" ")}
    >
      <FallbackImage
        src={item.image_url}
        alt={item.name}
        className="h-8 w-8 rounded-md object-cover sm:h-11 sm:w-11 sm:rounded-lg"
      />
      <div className="min-w-0">
        <p className="text-[11px] font-bold leading-tight sm:text-sm">
          {item.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          <p className="text-[11px] font-bold sm:text-sm">
            {formatRupiah(item.final_price)}
          </p>
          {item.discount_percent > 0 ? (
            <span className="inline-flex items-center rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white sm:px-2 sm:text-[11px]">
              -{item.discount_percent}%
            </span>
          ) : null}
        </div>
        <p className="text-[10px] text-slate-400 line-through sm:text-xs">
          {formatRupiah(item.base_price)}
        </p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-[86px] pt-[104px] text-[#101828] md:pb-0 md:pt-[130px]">
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
                  ref={profileButtonRef}
                  type="button"
                  aria-expanded={isDropdownOpen}
                  onClick={() => setIsDropdownOpen((value) => !value)}
                  className="hidden items-center gap-2 rounded-full border border-white/20 px-2 py-1 text-white transition hover:bg-white/10 md:inline-flex"
                >
                  <FallbackImage
                    src="/images/user_icon_topzyn.png"
                    alt="Avatar"
                    className="h-9 w-9 rounded-full border border-white object-cover"
                  />
                  <span className="text-sm font-bold">{user.username}</span>
                  <ChevronDownIcon
                    className={[
                      "h-5 w-5 transition-transform duration-200",
                      isDropdownOpen ? "rotate-180" : "rotate-0",
                    ].join(" ")}
                  />
                </button>

                <div
                  ref={profileDropdownRef}
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

        <div className="flex h-[34px] items-center overflow-hidden border-t border-white/35 bg-[#293275] md:h-10">
          <div className="inline-block whitespace-nowrap pl-[100%] [animation:runningText_15s_linear_infinite]">
            <span className="inline-block px-5 text-sm font-bold text-white md:px-7 md:text-base">
              Top up Mobile Legends cepat dan aman di TopZyn. Pilih nominal,
              bayar QRIS, langsung masuk!
            </span>
          </div>
        </div>
      </nav>

      {topNotice ? (
        <div className="pointer-events-none fixed inset-x-0 top-[110px] z-[10004] flex justify-center px-4 md:top-[136px]">
          <div
            key={topNotice.id}
            className={[
              "pointer-events-auto w-full max-w-md rounded-xl border px-4 py-3 text-sm font-semibold shadow-[0_14px_30px_rgba(16,24,40,0.2)] transition-all duration-300",
              isTopNoticeShown ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0",
              topNotice.tone === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            ].join(" ")}
          >
            {topNotice.message}
          </div>
        </div>
      ) : null}

      <main className="px-3 sm:px-4">
        <section className="mx-auto mt-5 max-w-6xl sm:mt-6">
          <article className="relative overflow-hidden rounded-xl bg-[url('/images/bg_blue.jpg')] bg-cover bg-center p-4 text-white sm:rounded-2xl sm:p-5 md:p-6">
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative grid items-center gap-3 sm:gap-4 md:grid-cols-[auto,1fr]">
              <FallbackImage
                src="/images/mobile_legend_logo.png"
                alt="Mobile Legends"
                className="mx-auto h-[88px] w-[88px] rounded-xl object-cover sm:h-[104px] sm:w-[104px] sm:rounded-2xl md:mx-0 md:h-[120px] md:w-[120px]"
              />
              <div className="text-center md:text-left">
                <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">
                  Mobile Legends: Bang Bang
                </h1>
                <p className="text-xs text-white/90 sm:text-sm md:text-base">
                  Moonton
                </p>
                <span className="mt-2.5 inline-flex rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold sm:mt-3 sm:px-3 sm:text-xs">
                  24/7 Online
                </span>
              </div>
            </div>
          </article>
        </section>

        <section className="mx-auto mt-5 grid max-w-6xl gap-4 pb-8 sm:mt-6 sm:gap-6 sm:pb-10 lg:grid-cols-[minmax(260px,340px)_1fr] lg:items-start">
          <aside className="h-fit px-1 lg:sticky lg:top-[146px]">
            <h3 className="text-base font-bold sm:text-lg">Petunjuk Topup</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-relaxed text-slate-600 sm:text-sm">
              <li>Masukkan User ID dan Server dengan benar.</li>
              <li>Pilih nominal diamonds yang kamu butuhkan.</li>
              <li>Pilih metode pembayaran QRIS.</li>
              <li>Masukkan nomor WhatsApp aktif.</li>
              <li>Klik Order Sekarang lalu selesaikan pembayaran.</li>
            </ol>
          </aside>

          <div className="space-y-5">
            <section className="rounded-2xl bg-white p-4 shadow-[0_12px_30px_rgba(16,24,40,0.08)] sm:p-5">
              <h3 className="text-base font-bold sm:text-lg">
                1. Masukkan ID Game
              </h3>
              <p className="text-xs text-slate-500 sm:text-sm">
                Cek kembali ID dan server agar topup lancar.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="User ID"
                  value={gameUserId}
                  onChange={(event) => setGameUserId(event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15 sm:px-3.5 sm:py-3"
                />
                <input
                  type="text"
                  placeholder="Server"
                  value={gameServer}
                  onChange={(event) => setGameServer(event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15 sm:px-3.5 sm:py-3"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Fitur cek ID belum tersedia. Pastikan data sudah benar.
              </p>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-[0_12px_30px_rgba(16,24,40,0.08)] sm:p-5">
              <h3 className="text-base font-bold sm:text-lg">
                2. Pilih Nominal
              </h3>
              <p className="text-xs text-slate-500 sm:text-sm">
                Pilih item yang ingin kamu top up.
              </p>
              {isCatalogLoading ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`item-loader-${index}`}
                      className="h-[68px] animate-pulse rounded-lg bg-slate-100 sm:h-[84px] sm:rounded-xl"
                    />
                  ))}
                </div>
              ) : items.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {groupedItems.wdp.length > 0 ? (
                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
                        Weekly Diamond Pass
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                        {groupedItems.wdp.map((item) =>
                          renderNominalCard(item),
                        )}
                      </div>
                    </div>
                  ) : null}

                  {groupedItems.regular.length > 0 ? (
                    <div
                      className={
                        groupedItems.wdp.length > 0
                          ? "border-t border-slate-200 pt-4"
                          : ""
                      }
                    >
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
                        Diamond
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                        {groupedItems.regular.map((item) =>
                          renderNominalCard(item),
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  {catalogError || "Belum ada item topup tersedia."}
                </div>
              )}
            </section>

            <section
              ref={paymentSectionRef}
              className="rounded-2xl bg-white p-4 shadow-[0_12px_30px_rgba(16,24,40,0.08)] sm:p-5"
            >
              <h3 className="text-base font-bold sm:text-lg">
                3. Metode Pembayaran
              </h3>
              <p className="text-xs text-slate-500 sm:text-sm">
                Saat ini yang tersedia hanya QRIS.
              </p>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedPaymentId(method.id)}
                    className={[
                      "flex items-center gap-2 rounded-lg border p-2 text-left transition sm:gap-3 sm:rounded-xl sm:p-3",
                      selectedPaymentId === method.id
                        ? "border-[#293275] ring-2 ring-[#293275]/20"
                        : "border-slate-200 hover:border-[#293275]/40",
                    ].join(" ")}
                  >
                    <FallbackImage
                      src={method.logo_url}
                      alt={method.name}
                      className="h-6 w-6 object-contain sm:h-8 sm:w-8"
                    />
                    <span className="text-[11px] font-bold sm:text-sm">
                      {method.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <section className="rounded-2xl bg-white p-4 shadow-[0_12px_30px_rgba(16,24,40,0.08)] sm:p-5">
              <h3 className="text-base font-bold sm:text-lg">4. Kode Promo</h3>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  placeholder="Masukkan kode promo"
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15 sm:px-3.5 sm:py-3"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="rounded-xl bg-[#293275] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1f265f] sm:py-3"
                >
                  Gunakan
                </button>
              </div>
              {promoMessage ? (
                <p
                  className={[
                    "mt-2 text-xs",
                    promoTone === "success"
                      ? "text-emerald-600"
                      : promoTone === "error"
                        ? "text-red-600"
                        : "text-slate-500",
                  ].join(" ")}
                >
                  {promoMessage}
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-[0_12px_30px_rgba(16,24,40,0.08)] sm:p-5">
              <h3 className="text-base font-bold sm:text-lg">5. Kontak</h3>
              <input
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={contactWhatsapp}
                onChange={(event) => setContactWhatsapp(event.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15 sm:px-3.5 sm:py-3"
              />
            </section>

            <section className="rounded-2xl bg-[#fff7f0] p-3.5 shadow-[0_12px_30px_rgba(16,24,40,0.08)] sm:p-4">
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>Item</span>
                  <strong>{selectedItem?.name ?? "-"}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Harga</span>
                  <strong>{formatRupiah(subtotal)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Promo</span>
                  <strong>{summaryPromoText}</strong>
                </div>
                <div className="flex justify-between text-sm font-bold sm:text-base">
                  <span>Total</span>
                  <strong>{formatRupiah(totalAmount)}</strong>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={() => {
                if (validateForm()) {
                  setShowOrderModal(true);
                }
              }}
              className="w-full rounded-xl bg-[#293275] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1f265f] sm:py-3 sm:text-base"
            >
              Order Sekarang
            </button>
          </div>
        </section>
      </main>

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
            <Link
              href="/profile"
              className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
            >
              <UserIcon className="h-[22px] w-[22px]" />
              <span>Profile</span>
            </Link>
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

      {showOrderModal ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-[430px] rounded-2xl bg-white px-6 py-6 shadow-2xl">
            <h3 className="text-center text-2xl font-bold">Order Sekarang?</h3>
            <p className="mt-1 text-center text-sm text-slate-500">
              Pastikan data akun kamu sudah valid dan sesuai.
            </p>
            <div className="mt-4 rounded-xl bg-[#fff7f0] p-4 text-sm">
              <div className="flex justify-between py-1">
                <span>Username</span>
                <strong>{user?.username ?? "Guest"}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>ID</span>
                <strong>{gameUserId || "-"}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Server</span>
                <strong>{gameServer || "-"}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Item</span>
                <strong>{selectedItem?.name ?? "-"}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Harga</span>
                <strong>{formatRupiah(subtotal)}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Payment</span>
                <strong>{selectedPayment?.name ?? "-"}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Promo</span>
                <strong>{summaryPromoText}</strong>
              </div>
              <div className="flex justify-between py-1 text-base font-bold">
                <span>Total</span>
                <strong>{formatRupiah(totalAmount)}</strong>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="flex-1 rounded-xl border-2 border-[#293275] px-4 py-2.5 font-bold text-[#293275]"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isSubmittingOrder}
                className="flex-1 rounded-xl bg-[#293275] px-4 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmittingOrder ? "Memproses..." : "Order Sekarang"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showWdpModal ? (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="px-5 pb-4 pt-5 text-center">
              <h3 className="text-xl font-bold uppercase">
                Yuk dibaca dulu kak
              </h3>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                <FallbackImage
                  src="/images/1780x1000.jpg"
                  alt="Info WDP"
                  className="h-auto w-full object-cover"
                />
              </div>
              <p className="mt-3 text-sm font-bold uppercase leading-relaxed">
                Harap periksa slot WDP kamu sebelum top up ya untuk limit slot
                0/10 akan <span className="text-red-600 underline">hangus</span>
                .
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={dismissWdpForever}
                  onChange={(event) =>
                    setDismissWdpForever(event.target.checked)
                  }
                />
                <span>Jangan tampilkan lagi</span>
              </label>
              <button
                type="button"
                onClick={closeWdpModal}
                className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-bold text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showLogoutModal ? (
        <div className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-[420px] rounded-2xl bg-white px-7 py-7 text-center shadow-2xl">
            <h3 className="text-2xl font-bold">Yakin mau logout?</h3>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 font-bold text-slate-700"
              >
                Gajadi
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white"
              >
                Tetap logout
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="mt-16 bg-white text-white md:mt-20">
        <div className="w-full overflow-hidden">
          <FallbackImage
            src="/images/footer_banner_raypoint.png"
            alt="Footer Visual"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="-mt-1 bg-[#293275] px-4 pb-9 pt-12 md:pb-10 md:pt-14">
          <div className="mx-auto max-w-6xl text-center">
            <p className="mx-auto mb-9 max-w-3xl text-base leading-relaxed text-white/80 md:mb-12 md:text-xl">
              TopZyn adalah sahabat para gamers dan platform top up game
              terpercaya di Indonesia.
            </p>

            <div className="grid grid-cols-1 gap-7 text-center md:grid-cols-2 md:text-left lg:grid-cols-4">
              <div>
                <h4 className="mb-3 text-lg font-bold text-[#ff711c] md:text-xl">
                  Peta Situs
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  Beranda
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  Masuk
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  Daftar
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  Kalkulator
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  Cek Transaksi
                </Link>
              </div>

              <div>
                <h4 className="mb-3 text-lg font-bold text-[#ff711c] md:text-xl">
                  Dukungan
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  WhatsApp
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  Email
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  Instagram
                </Link>
              </div>

              <div>
                <h4 className="mb-3 text-lg font-bold text-[#ff711c] md:text-xl">
                  Legalitas
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  Kebijakan Privasi
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  Syarat & Ketentuan
                </Link>
              </div>

              <div>
                <h4 className="mb-3 text-lg font-bold text-[#ff711c] md:text-xl">
                  Sosial Media
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  TikTok
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  Instagram
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  Discord
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
                >
                  Email
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-sm text-white transition hover:translate-x-1 md:text-base"
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
