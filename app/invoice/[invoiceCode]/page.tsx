"use client";

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

function formatRupiah(value: number): string {
  return `Rp ${Math.max(0, Math.floor(value)).toLocaleString("id-ID")}`;
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

    const load = async () => {
      try {
        const code = decodeURIComponent(rawCode).trim();
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
          throw new Error(data.message ?? "Invoice tidak ditemukan.");
        }
        if (disposed) {
          return;
        }
        setInvoice(data.invoice);
        setRemainingSeconds(
          Math.max(0, Number(data.invoice.remaining_seconds || 0)),
        );
      } catch (error) {
        if (!disposed) {
          setErrorMessage(
            error instanceof Error ? error.message : "Gagal memuat invoice.",
          );
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

  const countdownText = useMemo(() => {
    if (!invoice?.expires_at) {
      return "-";
    }
    if (remainingSeconds <= 0) {
      return "00:00:00";
    }
    const hour = String(Math.floor(remainingSeconds / 3600)).padStart(2, "0");
    const minute = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(
      2,
      "0",
    );
    const second = String(remainingSeconds % 60).padStart(2, "0");
    return `${hour}:${minute}:${second}`;
  }, [invoice?.expires_at, remainingSeconds]);

  const paymentStatusBadgeClass = useMemo(() => {
    if (!invoice) {
      return "border-red-200 bg-red-50 text-red-700";
    }
    return invoice.payment_status_code === "paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-red-200 bg-red-50 text-red-700";
  }, [invoice]);

  const transactionStatusBadgeClass = useMemo(() => {
    if (!invoice) {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    return invoice.transaction_status_code === "done"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
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

  const handleCopyInvoice = async () => {
    const text = (invoice?.code || invoiceCode).trim();
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // keep button static
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
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#dbe6ff_0%,_#eef2ff_35%,_#f8fafc_68%)] px-4 pb-12 pt-8">
        <div className="pointer-events-none absolute -left-14 top-16 h-56 w-56 rounded-full bg-[#293275]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-40 h-56 w-56 rounded-full bg-[#ff711c]/10 blur-3xl" />
        <section className="mx-auto w-full max-w-[980px] animate-pulse space-y-4 rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_30px_70px_rgba(16,24,40,0.14)]">
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
      </main>
    );
  }

  if (errorMessage || !invoice) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#dbe6ff_0%,_#eef2ff_35%,_#f8fafc_68%)] px-4 pb-12 pt-8">
        <section className="mx-auto w-full max-w-[980px] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
          {errorMessage || "Invoice tidak ditemukan."}
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#dbe6ff_0%,_#eef2ff_35%,_#f8fafc_68%)] px-4 pb-12 pt-8 text-[#111827]">
      <TopzynNotice
        open={Boolean(notice)}
        tone={noticeTone}
        title={noticeTone === "error" ? "Aksi Gagal" : "Aksi Berhasil"}
        message={notice}
        autoHideMs={4000}
        onClose={() => setNotice("")}
      />
      <div className="pointer-events-none absolute -left-14 top-16 h-56 w-56 rounded-full bg-[#293275]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-40 h-56 w-56 rounded-full bg-[#ff711c]/10 blur-3xl" />

      <section className="mx-auto w-full max-w-[980px] overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_30px_70px_rgba(16,24,40,0.14)] backdrop-blur-sm">
        <header className="relative border-b border-slate-200/80 bg-[linear-gradient(120deg,#eef2ff_0%,#ffffff_45%,#fff4eb_100%)] px-5 py-6 sm:px-8 sm:py-7">
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[#ff711c]/12 blur-2xl" />
          <div className="relative text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/web_logo_topzyn.png"
              alt="TopZyn"
              className="mx-auto mb-2.5 h-auto w-[110px] sm:w-[120px]"
            />
            <h1 className="text-2xl font-extrabold tracking-[0.08em] text-[#293275]">
              INVOICE
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Detail transaksi top up kamu di TopZyn
            </p>
          </div>

          <div className="relative mt-5 flex items-center justify-center gap-2 sm:gap-3">
            <span
              id="invoiceCode"
              className="rounded-xl border border-[#293275]/20 bg-[#eef1ff] px-3 py-2 font-extrabold tracking-[0.1em] text-[#293275] sm:px-4"
            >
              {invoice.code}
            </span>
            <button
              type="button"
              id="copyInvoice"
              aria-label="Copy invoice code"
              onClick={handleCopyInvoice}
              className="inline-flex h-[36px] w-[36px] items-center justify-center rounded-[11px] border-none bg-[#293275] text-white outline-none shadow-[0_10px_20px_rgba(41,50,117,0.3)] transition hover:bg-[#1f265f]"
            >
              <span className="sr-only">Copy</span>
              <svg
                className="h-[18px] w-[18px] fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H10V7h9v14z" />
              </svg>
            </button>
          </div>
        </header>

        <div className="grid gap-3.5 p-5 sm:p-8">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-slate-500">Tanggal</span>
              <strong className="text-sm sm:text-right">{invoice.date}</strong>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-slate-500">Produk</span>
              <strong className="text-sm sm:text-right">
                {invoice.product}
              </strong>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-slate-500">Item</span>
              <strong className="text-sm sm:text-right">{invoice.item}</strong>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-slate-500">ID Tujuan</span>
              <strong className="text-sm sm:text-right">
                {invoice.target}
              </strong>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-slate-500">Payment Method</span>
              <strong className="text-sm sm:text-right">
                {invoice.payment_method}
              </strong>
            </div>
          </div>
          {!isCashPayment ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-slate-500">Batas Orderan</span>
                <strong
                  className={[
                    "text-sm sm:text-right",
                    remainingSeconds <= 0 ? "text-red-600" : "text-slate-900",
                  ].join(" ")}
                >
                  {countdownText}
                </strong>
              </div>
            </div>
          ) : null}
          <div className="rounded-xl border border-[#ff711c]/25 bg-[linear-gradient(135deg,#fff7f0_0%,#fff3ea_100%)] px-4 py-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-semibold text-slate-600">
                Total Pembayaran
              </span>
              <strong className="text-lg font-extrabold text-[#293275] sm:text-right">
                {formatRupiah(invoice.total)}
              </strong>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-slate-500">Payment Status</span>
              <strong
                className={[
                  "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold sm:ml-auto",
                  paymentStatusBadgeClass,
                ].join(" ")}
              >
                {invoice.payment_status}
              </strong>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-slate-500">Transaction Status</span>
              <strong
                className={[
                  "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold sm:ml-auto",
                  transactionStatusBadgeClass,
                ].join(" ")}
              >
                {invoice.transaction_status}
              </strong>
            </div>
          </div>
        </div>

        {!shouldHidePayButton ? (
          <div className="border-t border-slate-200/80 px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
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
                className="w-full rounded-xl bg-gradient-to-r from-[#293275] to-[#1f265f] px-7 py-3 font-bold text-white shadow-[0_14px_30px_rgba(41,50,117,0.32)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400"
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
                  className="w-full rounded-xl bg-red-600 px-7 py-3 font-bold text-white shadow-[0_14px_30px_rgba(220,38,38,0.25)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  Batalkan Order
                </button>
              ) : null}
            </div>
          </div>
        ) : isCashPayment && canCancelOrder ? (
          <div className="border-t border-slate-200/80 px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
            <div className="space-y-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-700">
                Pembayaran Cash diproses manual.
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={isCancelling}
                className="w-full rounded-xl bg-red-600 px-7 py-3 font-bold text-white shadow-[0_14px_30px_rgba(220,38,38,0.25)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                Batalkan Order
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-200/80 px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
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
    </main>
  );
}
