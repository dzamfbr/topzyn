"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  TopzynNotice,
  type TopzynNoticeTone,
} from "@/components/ui/topzyn-notice";

type InvoiceResponse = {
  status: "ok" | "error";
  message?: string;
  invoice?: {
    code: string;
    date: string;
    product: string;
    item: string;
    target: string;
    payment_method_code?: string;
    payment_method: string;
    promo_code: string | null;
    promo_discount: number;
    subtotal: number;
    total: number;
    payment_status: string;
    payment_status_code: "pending" | "paid";
    transaction_status: string;
    transaction_status_code: "pending" | "done";
    pay_url: string;
    pay_route: string;
    qris_uploaded: boolean;
    payment_confirmed_by_user: boolean;
    payment_confirmed_at: string | null;
    created_at: string | null;
    expires_at: string | null;
    remaining_seconds: number;
    is_expired: boolean;
    can_pay_now: boolean;
    pay_button_text: string;
  };
};

type TopzynNavKey =
  | "home"
  | "leaderboard"
  | "history"
  | "kalkulator"
  | "profile";

type InvoiceShellProps = {
  children: React.ReactNode;
  activeNav?: TopzynNavKey;
  runningText?: string;
  mainClassName?: string;
};

const NAV_LINKS: Array<{ key: TopzynNavKey; label: string; href: string }> = [
  { key: "home", label: "Home", href: "/" },
  { key: "leaderboard", label: "Leaderboard", href: "/leaderboard" },
  { key: "history", label: "History", href: "/invoice" },
  { key: "kalkulator", label: "Kalkulator", href: "/kalkulator" },
];

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

function ProfileIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19a7 7 0 0 1 14 0" />
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

function InvoiceShell({
  children,
  activeNav = "history",
  runningText = "Cek history transaksi kamu kapan saja di TopZyn dengan kode transaksi.",
  mainClassName = "",
}: InvoiceShellProps) {
  return (
    <div className="min-h-screen bg-white pb-[86px] text-zinc-900 md:pb-0">
      <nav className="fixed inset-x-0 top-0 z-[999] bg-[#293275] shadow-[0_8px_18px_rgba(14,16,22,0.08)]">
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between gap-4 px-4 md:h-[90px] md:px-6">
          <Link href="/" className="inline-flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/topzyn/branding/topzyn-brand-title-logo.png"
              alt="TopZyn"
              className="h-10 w-auto md:h-12"
            />
          </Link>
          <ul className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-base font-semibold transition lg:text-lg",
                    item.key === activeNav
                      ? "text-[#ff711c]"
                      : "text-white hover:text-[#ff711c]",
                  ].join(" ")}
                >
                  {item.key === "home" ? (
                    <HomeIcon className="h-4 w-4" />
                  ) : item.key === "leaderboard" ? (
                    <ChartIcon className="h-4 w-4" />
                  ) : item.key === "history" ? (
                    <HistoryIcon className="h-4 w-4" />
                  ) : (
                    <CalculatorIcon className="h-4 w-4" />
                  )}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden items-center gap-3 md:flex">
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
        </div>

        <div className="flex h-[34px] items-center overflow-hidden border-t border-white/40 bg-[#293275] md:h-10">
          <div className="inline-block whitespace-nowrap pl-[100%] [animation:runningText_15s_linear_infinite]">
            <span className="inline-block px-5 text-sm font-bold text-white md:px-7 md:text-base">
              {runningText}
            </span>
          </div>
        </div>
      </nav>

      <div className="fixed inset-x-0 bottom-0 z-[998] flex h-[76px] items-center justify-around bg-white px-2 shadow-[0_-8px_18px_rgba(14,16,22,0.08)] md:hidden">
        <Link
          href="/"
          className={[
            "flex flex-1 flex-col items-center gap-1.5 text-xs font-bold",
            activeNav === "home" ? "text-[#293275]" : "text-slate-500",
          ].join(" ")}
        >
          <HomeIcon className="h-[22px] w-[22px]" />
          <span>Home</span>
        </Link>
        <Link
          href="/leaderboard"
          className={[
            "flex flex-1 flex-col items-center gap-1.5 text-xs font-bold",
            activeNav === "leaderboard" ? "text-[#293275]" : "text-slate-500",
          ].join(" ")}
        >
          <ChartIcon className="h-[22px] w-[22px]" />
          <span>Leaderboard</span>
        </Link>
        <Link
          href="/invoice"
          className={[
            "flex flex-1 flex-col items-center gap-1.5 text-xs font-bold",
            activeNav === "history" ? "text-[#293275]" : "text-slate-500",
          ].join(" ")}
        >
          <HistoryIcon className="h-[22px] w-[22px]" />
          <span>History</span>
        </Link>
        <Link
          href="/kalkulator"
          className={[
            "flex flex-1 flex-col items-center gap-1.5 text-xs font-bold",
            activeNav === "kalkulator" ? "text-[#293275]" : "text-slate-500",
          ].join(" ")}
        >
          <CalculatorIcon className="h-[22px] w-[22px]" />
          <span>Kalkulator</span>
        </Link>
        <Link
          href="/profile"
          className={[
            "flex flex-1 flex-col items-center gap-1.5 text-xs font-bold",
            activeNav === "profile" ? "text-[#293275]" : "text-slate-500",
          ].join(" ")}
        >
          <ProfileIcon className="h-[22px] w-[22px]" />
          <span>Profile</span>
        </Link>
      </div>

      <main
        className={[
          "min-h-[calc(100vh-86px)] pt-[104px] md:min-h-[calc(100vh-130px)] md:pt-[130px]",
          mainClassName,
        ].join(" ")}
      >
        {children}
      </main>

      <footer className="relative -mb-[86px] mt-10 bg-white text-white after:block after:h-[86px] after:bg-[#293275] md:mb-0 md:mt-16 md:after:hidden">
        <div className="w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/topzyn/branding/topzyn-footer-banner-wave.png"
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
                  href="/invoice"
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
    </div>
  );
}

const ORDER_PROGRESS_DURATION_SECONDS = 2 * 60 * 60;
const ORDER_PROGRESS_TIMER_BG = "/images/topzyn/time.png";

type InvoiceProgressStepKey =
  | "created"
  | "payment"
  | "processing"
  | "completed";

type InvoiceProgressStep = {
  key: InvoiceProgressStepKey;
  title: string;
  description: string;
  done: boolean;
};

function InvoiceProgressIcon({ stepKey }: { stepKey: InvoiceProgressStepKey }) {
  if (stepKey === "created") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M7 7V6a5 5 0 0 1 10 0v1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="5"
          y="7"
          width="14"
          height="12"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (stepKey === "payment") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <rect
          x="3.5"
          y="6"
          width="17"
          height="12"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M3.5 10.5h17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (stepKey === "processing") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.9 5.9l1.6 1.6M16.5 16.5l1.6 1.6M18.1 5.9l-1.6 1.6M7.5 16.5l-1.6 1.6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="m8 12.2 2.5 2.6 5.6-5.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatRupiah(value: number): string {
  return `Rp ${Math.max(0, Math.floor(value)).toLocaleString("id-ID")}`;
}

function getOrderProgressRemainingSeconds(
  createdAt: string | null | undefined,
): number {
  if (!createdAt) {
    return 0;
  }

  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) {
    return 0;
  }

  const deadlineTimeMs =
    createdDate.getTime() + ORDER_PROGRESS_DURATION_SECONDS * 1000;
  return Math.max(0, Math.floor((deadlineTimeMs - Date.now()) / 1000));
}

function formatPurchaseDate(
  createdAt: string | null | undefined,
  fallback: string,
): string {
  if (!createdAt) {
    return fallback;
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(
    date,
  );
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${day} ${month} ${year}\npukul ${hour}:${minute}:${second}`;
}

function resolveInvoiceProductImage(itemName: string, productName = ""): string {
  const productNormalized = productName.trim().toLowerCase();
  if (productNormalized.includes("free fire")) {
    return "/images/topzyn/products/free-fire/topzyn-free-fire-diamond-item.png";
  }

  const normalized = itemName.trim().toLowerCase();
  if (normalized.includes("weekly") || normalized.includes("wdp")) {
    return "/images/topzyn/products/mobile-legends/topzyn-mobile-legends-weekly-diamond-pass.png";
  }
  return "/images/topzyn/products/mobile-legends/topzyn-mobile-legends-diamond-item.png";
}

function parseInvoiceTarget(target: string): {
  userId: string;
  zoneId: string;
} {
  const normalized = target.trim();
  if (!normalized) {
    return { userId: "-", zoneId: "-" };
  }

  const mainTarget = normalized.split("|")[0]?.trim() ?? "";

  const match = mainTarget.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return {
      userId: match[1].trim() || "-",
      zoneId: match[2].trim() || "-",
    };
  }

  return {
    userId: mainTarget || "-",
    zoneId: "-",
  };
}

function buildInvoiceNotFoundUrl(code: string, message: string): string {
  const safeCode = code.trim();
  return `/invoice/not-found?code=${encodeURIComponent(safeCode)}&message=${encodeURIComponent(
    message,
  )}`;
}

export default function InvoicePage() {
  const routeParams = useParams<{ invoiceCode: string }>();
  const [invoiceCode, setInvoiceCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [invoice, setInvoice] = useState<InvoiceResponse["invoice"] | null>(
    null,
  );
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [orderProgressSeconds, setOrderProgressSeconds] = useState(0);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<TopzynNoticeTone>("info");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const rawCode = routeParams?.invoiceCode;
    if (!rawCode) {
      return;
    }

    let disposed = false;
    let requestedCode = "";

    const load = async () => {
      try {
        const code = decodeURIComponent(rawCode).trim();
        requestedCode = code;
        if (!code) {
          throw new Error("Kode invoice tidak valid.");
        }
        if (!disposed) {
          setInvoiceCode(code);
        }

        const response = await fetch(
          `/api/mlbb/invoice/${encodeURIComponent(code)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );
        const data = (await response.json()) as InvoiceResponse;
        if (!response.ok || data.status !== "ok" || !data.invoice) {
          if (!disposed) {
            window.location.replace(
              buildInvoiceNotFoundUrl(
                code,
                data.message ?? "Invoice tidak ditemukan.",
              ),
            );
          }
          return;
        }
        if (disposed) {
          return;
        }
        setInvoice(data.invoice);
        setRemainingSeconds(
          Math.max(0, Number(data.invoice.remaining_seconds || 0)),
        );
        setOrderProgressSeconds(
          getOrderProgressRemainingSeconds(data.invoice.created_at),
        );
      } catch (error) {
        if (!disposed) {
          const message =
            error instanceof Error ? error.message : "Gagal memuat invoice.";
          const fallbackCode = requestedCode || String(rawCode ?? "").trim();
          if (fallbackCode) {
            window.location.replace(
              buildInvoiceNotFoundUrl(fallbackCode, message),
            );
            return;
          }
          setErrorMessage(message);
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      disposed = true;
    };
  }, [routeParams?.invoiceCode]);

  useEffect(() => {
    if (!invoice?.expires_at) {
      return;
    }

    const tick = () => {
      const nextRemaining = Math.max(
        0,
        Math.floor(
          (new Date(invoice.expires_at as string).getTime() - Date.now()) /
            1000,
        ),
      );
      setRemainingSeconds(nextRemaining);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [invoice?.expires_at]);

  useEffect(() => {
    if (!invoice?.created_at) {
      setOrderProgressSeconds(0);
      return;
    }

    const tick = () => {
      setOrderProgressSeconds(
        getOrderProgressRemainingSeconds(invoice.created_at),
      );
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [invoice?.created_at]);

  useEffect(() => {
    if (!invoice?.expires_at) {
      return;
    }
    if (invoice.transaction_status_code === "done") {
      return;
    }
    if (remainingSeconds > 0) {
      return;
    }

    window.location.replace(
      buildInvoiceNotFoundUrl(
        invoice.code || invoiceCode,
        "Invoice tidak ditemukan. Waktu order sudah habis sebelum pembayaran/penyelesaian.",
      ),
    );
  }, [
    invoice?.code,
    invoice?.expires_at,
    invoice?.transaction_status_code,
    invoiceCode,
    remainingSeconds,
  ]);

  const orderProgressCountdownUnits = useMemo(() => {
    const safeSeconds = Math.max(0, orderProgressSeconds);
    const hour = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
    const minute = String(Math.floor((safeSeconds % 3600) / 60)).padStart(
      2,
      "0",
    );
    const second = String(safeSeconds % 60).padStart(2, "0");
    return [hour, minute, second];
  }, [orderProgressSeconds]);

  const paymentStatusBadgeClass = useMemo(() => {
    if (!invoice) {
      return "border-red-200 bg-red-50 text-red-700";
    }
    return invoice.payment_status_code === "paid"
      ? "border-[#293275]/20 bg-[#eef2ff] text-[#293275]"
      : "border-red-200 bg-red-50 text-red-700";
  }, [invoice]);

  const transactionStatusBadgeClass = useMemo(() => {
    if (!invoice) {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    return invoice.transaction_status_code === "done"
      ? "border-[#293275]/20 bg-[#eef2ff] text-[#293275]"
      : "border-amber-200 bg-amber-50 text-amber-700";
  }, [invoice]);

  const shouldHidePayButton = useMemo(() => {
    if (!invoice) {
      return false;
    }
    const paymentCode = String(invoice.payment_method_code ?? "").toUpperCase();
    const paymentName = String(invoice.payment_method ?? "").toUpperCase();
    const isCashPayment =
      paymentCode.includes("COD") ||
      paymentCode.includes("CASH") ||
      paymentName.includes("COD") ||
      paymentName.includes("CASH");

    return (
      isCashPayment ||
      invoice.payment_status_code === "paid" ||
      invoice.transaction_status_code === "done"
    );
  }, [invoice]);

  const isCashPayment = useMemo(() => {
    if (!invoice) {
      return false;
    }
    const paymentCode = String(invoice.payment_method_code ?? "").toUpperCase();
    const paymentName = String(invoice.payment_method ?? "").toUpperCase();
    return (
      paymentCode.includes("COD") ||
      paymentCode.includes("CASH") ||
      paymentName.includes("COD") ||
      paymentName.includes("CASH")
    );
  }, [invoice]);

  const canCancelOrder = useMemo(() => {
    if (!invoice) {
      return false;
    }
    return !(
      invoice.payment_status_code === "paid" ||
      invoice.transaction_status_code === "done"
    );
  }, [invoice]);

  const invoiceTarget = useMemo(() => {
    return parseInvoiceTarget(invoice?.target ?? "");
  }, [invoice?.target]);

  const purchaseDateText = useMemo(() => {
    return formatPurchaseDate(invoice?.created_at, invoice?.date ?? "-");
  }, [invoice?.created_at, invoice?.date]);

  const invoiceProductImage = useMemo(() => {
    return resolveInvoiceProductImage(invoice?.item ?? "", invoice?.product ?? "");
  }, [invoice?.item, invoice?.product]);

  const displayProductName = useMemo(() => {
    if (!invoice?.product) {
      return "-";
    }
    if (invoice.product.toLowerCase().includes("mobile legends")) {
      return "Mobile Legends: Bang Bang";
    }
    return invoice.product;
  }, [invoice?.product]);

  const isPaymentStepDone = useMemo(() => {
    if (!invoice) {
      return false;
    }
    return (
      invoice.payment_confirmed_by_user ||
      invoice.payment_status_code === "paid" ||
      invoice.transaction_status_code === "done"
    );
  }, [invoice]);

  const isOrderCompleted = useMemo(() => {
    return invoice?.transaction_status_code === "done";
  }, [invoice?.transaction_status_code]);

  const progressSteps = useMemo<InvoiceProgressStep[]>(() => {
    return [
      {
        key: "created",
        title: "Transaksi Dibuat",
        description: "Transaksi telah berhasil dibuat",
        done: true,
      },
      {
        key: "payment",
        title: "Pembayaran",
        description: "Silakan lakukan konfirmasi pembayaran",
        done: isPaymentStepDone,
      },
      {
        key: "processing",
        title: "Sedang Di Proses",
        description: "Pesanan sedang diproses admin",
        done: isOrderCompleted,
      },
      {
        key: "completed",
        title: "Transaksi Selesai",
        description: "Transaksi telah berhasil dilakukan",
        done: isOrderCompleted,
      },
    ];
  }, [isPaymentStepDone, isOrderCompleted]);

  const handleCopyInvoice = async () => {
    const text = (invoice?.code || invoiceCode).trim();
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setNoticeTone("success");
      setNotice("Kode invoice berhasil disalin.");
    } catch {
      setNoticeTone("error");
      setNotice("Gagal menyalin kode invoice.");
    }
  };

  const handleCopyTotalPayment = async () => {
    if (!invoice) {
      return;
    }

    try {
      await navigator.clipboard.writeText(String(invoice.total));
      setNoticeTone("success");
      setNotice("Total pembayaran berhasil disalin.");
    } catch {
      setNoticeTone("error");
      setNotice("Gagal menyalin total pembayaran.");
    }
  };

  const handlePayNow = () => {
    if (
      !invoice?.pay_route ||
      !invoice.can_pay_now ||
      remainingSeconds <= 0 ||
      isCashPayment
    ) {
      return;
    }
    window.location.href = invoice.pay_route;
  };

  const handleCancelOrder = async () => {
    if (!invoice?.code || isCancelling) {
      return;
    }

    setIsCancelling(true);
    setNotice("");
    setNoticeTone("info");
    try {
      const response = await fetch(
        `/api/mlbb/order/${encodeURIComponent(invoice.code)}/cancel`,
        {
          method: "DELETE",
        },
      );
      const data = (await response.json()) as {
        status: "ok" | "error";
        message?: string;
      };
      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message ?? "Gagal membatalkan order.");
      }

      setNoticeTone("success");
      setNotice(data.message ?? "Order berhasil dibatalkan.");
      setShowCancelModal(false);

      window.setTimeout(() => {
        window.location.href = "/";
      }, 900);
    } catch (error) {
      setNoticeTone("error");
      setNotice(
        error instanceof Error ? error.message : "Gagal membatalkan order.",
      );
      setShowCancelModal(false);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <InvoiceShell
        activeNav="history"
        mainClassName="bg-[#ececec] px-4 pb-12 text-[#111827]"
      >
        <section className="mx-auto mt-3 w-full max-w-[1080px] animate-pulse space-y-4 rounded-[18px] border-2 border-[#293275]/35 bg-[#f7f7f7] p-6 shadow-[0_20px_45px_rgba(15,23,42,0.1)] md:mt-5">
          <div className="mx-auto h-10 w-40 rounded-xl bg-slate-200" />
          <div className="mx-auto h-9 w-64 rounded-xl bg-slate-200" />
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={`row-loader-${index}`}
              className="h-12 rounded-xl bg-slate-100"
            />
          ))}
          <div className="mx-auto h-11 w-44 rounded-xl bg-slate-200" />
        </section>
      </InvoiceShell>
    );
  }

  if (errorMessage || !invoice) {
    return (
      <InvoiceShell
        activeNav="history"
        mainClassName="bg-[#ececec] px-4 pb-12 text-[#111827]"
      >
        <section className="mx-auto mt-3 w-full max-w-[1080px] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm md:mt-5">
          {errorMessage || "Invoice tidak ditemukan."}
        </section>
      </InvoiceShell>
    );
  }

  return (
    <InvoiceShell
      activeNav="history"
      mainClassName="bg-[#ececec] px-4 pb-12 text-[#111827]"
    >
        <TopzynNotice
          open={Boolean(notice)}
          tone={noticeTone}
          title={noticeTone === "error" ? "Aksi Gagal" : "Aksi Berhasil"}
          message={notice}
          autoHideMs={4000}
          onClose={() => setNotice("")}
        />

      <section className="mx-auto mb-4 mt-3 w-full max-w-[1080px] overflow-hidden rounded-[18px] border border-[#293275]/20 bg-[linear-gradient(110deg,#2d2f48_0%,#343250_48%,#2d354f_100%)] px-4 py-4 text-white shadow-[0_18px_35px_rgba(15,23,42,0.22)] sm:px-6 sm:py-5 md:mt-5">
        <h2 className="text-base font-bold text-white/95 sm:text-lg">
          Progress Transaksi
        </h2>

        <div className="mt-4 hidden md:grid md:grid-cols-4 md:gap-4">
          {progressSteps.map((step, index) => (
            <div key={step.key} className="relative">
              {index < progressSteps.length - 1 ? (
                <span
                  className={[
                    "absolute left-8 right-[-16px] top-4 h-[3px] rounded-full",
                    step.done ? "bg-[#ff711c]" : "bg-white/20",
                  ].join(" ")}
                />
              ) : null}
              <span
                className={[
                  "relative z-[1] inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300",
                  step.done
                    ? "border-[#ff711c] bg-[#ff711c] text-white shadow-[0_0_0_4px_rgba(255,113,28,0.2)]"
                    : "border-white/35 bg-[#3a3a56] text-white/70",
                ].join(" ")}
              >
                <InvoiceProgressIcon stepKey={step.key} />
              </span>
              <p
                className={[
                  "mt-3 text-[22px] font-bold",
                  step.done ? "text-[#ff711c]" : "text-white",
                ].join(" ")}
              >
                {step.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/80">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {progressSteps.map((step, index) => (
            <div key={`mobile-${step.key}`} className="relative pl-11">
              {index < progressSteps.length - 1 ? (
                <span
                  className={[
                    "absolute left-[15px] top-8 h-[calc(100%-4px)] w-[2px]",
                    step.done ? "bg-[#ff711c]" : "bg-white/20",
                  ].join(" ")}
                />
              ) : null}
              <span
                className={[
                  "absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full border",
                  step.done
                    ? "border-[#ff711c] bg-[#ff711c] text-white"
                    : "border-white/35 bg-[#3a3a56] text-white/70",
                ].join(" ")}
              >
                <InvoiceProgressIcon stepKey={step.key} />
              </span>
              <p
                className={[
                  "text-sm font-bold",
                  step.done ? "text-[#ff711c]" : "text-white",
                ].join(" ")}
              >
                {step.title}
              </p>
              <p className="text-xs text-white/80">{step.description}</p>
            </div>
          ))}
        </div>

      </section>

      <div className="mx-auto mb-4 w-full max-w-[1080px] px-1 sm:px-0">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {orderProgressCountdownUnits.map((unit, idx) => (
            <div key={`order-progress-timer-${idx}`} className="text-center">
              <div className="relative h-11 w-[50px] overflow-hidden rounded-lg shadow-[0_8px_16px_rgba(0,0,0,0.28)] sm:h-12 sm:w-[58px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ORDER_PROGRESS_TIMER_BG}
                  alt={`Timer order ${idx + 1}`}
                  className="absolute inset-0 h-full w-full object-fill"
                />
                <div className="relative flex h-full items-center justify-center bg-black/10 text-[20px] font-extrabold leading-none text-white sm:text-[22px]">
                  {unit}
                </div>
              </div>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {idx === 0 ? "Jam" : idx === 1 ? "Menit" : "Detik"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <section className="mx-auto w-full max-w-[1080px] overflow-hidden rounded-[18px] border-2 border-[#293275] bg-[#f7f7f7] shadow-[0_20px_45px_rgba(15,23,42,0.1)]">
        <header className="grid gap-4 border-b border-[#293275]/15 bg-[#eef2ff] px-4 py-4 sm:grid-cols-[1.1fr_1.8fr_0.9fr] sm:px-6 sm:py-5">
          <div>
            <p className="text-sm text-slate-500">Tanggal Pembelian</p>
            <p className="mt-1 whitespace-pre-line text-xl font-bold text-slate-900">
              {purchaseDateText}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Nomor Pesanan</p>
            <div className="mt-1 flex items-start gap-2">
              <p className="break-all text-xl font-extrabold tracking-[0.01em] text-slate-900">
                {invoice.code}
              </p>
              <button
                type="button"
                aria-label="Salin nomor order"
                onClick={handleCopyInvoice}
                className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#293275] transition hover:bg-[#dde4ff]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-current"
                  aria-hidden="true"
                >
                  <path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H10V7h9v14z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-slate-500">Metode Pembayaran</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {invoice.payment_method}
            </p>
          </div>
        </header>

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
            <div>
              <div className="flex items-center gap-3 border-b border-[#d9d9d9] pb-5 sm:gap-4 sm:pb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={invoiceProductImage}
                  alt={invoice.item}
                  className="h-[84px] w-[84px] rounded-xl border border-[#293275]/15 bg-slate-100 object-cover p-1 sm:h-[90px] sm:w-[90px]"
                />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-lg font-bold leading-tight text-slate-900 sm:text-[30px]">
                    {displayProductName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 sm:text-[26px]">
                    {invoice.item}
                  </p>
                </div>
              </div>

              <div className="pt-5 sm:pt-6">
                <h2 className="text-2xl font-bold text-[#293275] sm:text-[30px]">
                  Details
                </h2>
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#293275]/20 bg-white/90">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-medium text-slate-500 sm:text-base">
                      Item
                    </p>
                    <p className="text-right text-sm font-semibold text-slate-900 sm:text-lg">
                      {invoice.item}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-medium text-slate-500 sm:text-base">
                      Price
                    </p>
                    <p className="text-right text-sm font-semibold text-[#ff711c] sm:text-lg">
                      {formatRupiah(invoice.subtotal)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-medium text-slate-500 sm:text-base">
                      Kode Promo
                    </p>
                    <p
                      className={[
                        "text-right text-sm font-semibold sm:text-lg",
                        invoice.promo_code ? "text-[#293275]" : "text-slate-500",
                      ].join(" ")}
                    >
                      {invoice.promo_code ?? "-"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-medium text-slate-500 sm:text-base">
                      Diskon
                    </p>
                    <p className="text-right text-sm font-semibold text-[#293275] sm:text-lg">
                      {invoice.promo_discount > 0
                        ? `- ${formatRupiah(invoice.promo_discount)}`
                        : formatRupiah(0)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-medium text-slate-500 sm:text-base">
                      USER ID
                    </p>
                    <p className="text-right text-sm font-semibold text-slate-900 sm:text-lg">
                      {invoiceTarget.userId}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <p className="text-sm font-medium text-slate-500 sm:text-base">
                      ZONE ID
                    </p>
                    <p className="text-right text-sm font-semibold text-slate-900 sm:text-lg">
                      {invoiceTarget.zoneId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#293275]/20 bg-[#eef2ff] px-4 py-3">
                <p className="text-xs text-slate-500 sm:text-sm">Total Payment</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xl font-bold text-[#ff711c] sm:text-2xl">
                    {formatRupiah(invoice.total)}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyTotalPayment}
                    aria-label="Salin total pembayaran"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#293275] transition hover:bg-[#dde4ff]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 fill-current"
                      aria-hidden="true"
                    >
                      <path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H10V7h9v14z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <aside className="space-y-3 lg:border-l lg:border-[#d9d9d9] lg:pl-5">
              <div className="rounded-2xl border border-[#293275]/20 bg-[#f4f6ff] px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#dfe6ff_0%,#f7f9ff_100%)] text-[#293275] ring-1 ring-[#293275]/15 shadow-[0_8px_18px_rgba(41,50,117,0.18)]">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 2.2 4.8 5.4V11c0 4.5 2.9 8.5 7.2 10.4 4.3-1.9 7.2-5.9 7.2-10.4V5.4L12 2.2Z"
                        fill="currentColor"
                        opacity="0.18"
                      />
                      <path
                        d="M12 3.3 5.9 6.1V11c0 3.9 2.4 7.3 6.1 9.1 3.7-1.8 6.1-5.2 6.1-9.1V6.1L12 3.3Z"
                        fill="currentColor"
                      />
                      <path
                        d="m9.2 11.8 2.1 2.2 3.9-4"
                        stroke="#ffffff"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="18.1" cy="6.7" r="2.2" fill="#ff711c" />
                      <path
                        d="m17.3 6.7.6.6 1.1-1.1"
                        stroke="#ffffff"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className="text-lg font-bold text-slate-900 sm:text-[24px]">
                      Transaksi Aman
                    </p>
                    <p className="text-sm leading-[1.45] text-slate-500 sm:text-base">
                      Setiap pembelian produk pilihan kamu aman dan legal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5">
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Payment Status
                  </p>
                  <span
                    className={[
                      "mt-1 inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold sm:text-sm",
                      paymentStatusBadgeClass,
                    ].join(" ")}
                  >
                    {invoice.payment_status}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5">
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Transaction Status
                  </p>
                  <span
                    className={[
                      "mt-1 inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold sm:text-sm",
                      transactionStatusBadgeClass,
                    ].join(" ")}
                  >
                    {invoice.transaction_status}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {!shouldHidePayButton ? (
          <div className="border-t border-[#d9d9d9] bg-white/70 px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
            <div
              className={[
                "grid gap-2",
                canCancelOrder ? "sm:grid-cols-2" : "sm:grid-cols-1",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={handlePayNow}
                disabled={!invoice.can_pay_now || remainingSeconds <= 0}
                className="w-full rounded-xl bg-[#293275] px-7 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(41,50,117,0.28)] transition hover:bg-[#1f265f] sm:text-lg disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {invoice.can_pay_now && remainingSeconds > 0
                  ? invoice.pay_button_text
                  : remainingSeconds <= 0
                    ? "Waktu pembayaran habis"
                    : invoice.pay_button_text}
              </button>
              {canCancelOrder ? (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  disabled={isCancelling}
                  className="w-full rounded-xl bg-red-600 px-7 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(220,38,38,0.25)] transition hover:bg-red-700 sm:text-lg disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  Batalkan Order
                </button>
              ) : null}
            </div>
          </div>
        ) : isCashPayment && canCancelOrder ? (
          <div className="border-t border-[#d9d9d9] bg-white/70 px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
            <div className="space-y-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-700 sm:text-lg">
                Pembayaran Cash diproses manual.
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={isCancelling}
                className="w-full rounded-xl bg-red-600 px-7 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(220,38,38,0.25)] transition hover:bg-red-700 sm:text-lg disabled:cursor-not-allowed disabled:bg-red-300"
              >
                Batalkan Order
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-[#d9d9d9] bg-white/70 px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
            <div className="rounded-xl border border-[#293275]/20 bg-[#eef2ff] px-4 py-3 text-center text-sm font-bold text-[#293275] sm:text-lg">
              Transaksi sudah selesai dan tidak perlu pembayaran lagi.
            </div>
          </div>
        )}
      </section>

      {showCancelModal ? (
        <div
          className="fixed inset-0 z-[1305] flex items-center justify-center bg-black/45 px-4"
          role="presentation"
          onClick={(event) => {
            if (event.currentTarget === event.target && !isCancelling) {
              setShowCancelModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancelInvoiceTitle"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
          >
            <h3
              id="cancelInvoiceTitle"
              className="text-lg font-bold text-slate-900"
            >
              Batalkan Order Ini?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Kalau dibatalkan, order <strong>{invoice.code}</strong> akan
              hilang dari pending admin dan tidak bisa dilanjutkan.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleCancelOrder();
                }}
                disabled={isCancelling}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isCancelling ? "Membatalkan..." : "Ya, Batalkan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </InvoiceShell>
  );
}
