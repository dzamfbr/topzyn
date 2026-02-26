"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type InvoiceResponse = {
  status: "ok" | "error";
  message?: string;
  invoice?: {
    code: string;
    date: string;
    product: string;
    item: string;
    target: string;
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

  const invoiceStatusClass = useMemo(() => {
    if (!invoice) {
      return "text-red-500";
    }
    return invoice.payment_status_code === "paid"
      ? "text-emerald-600"
      : "text-red-500";
  }, [invoice]);

  const transactionStatusClass = useMemo(() => {
    if (!invoice) {
      return "text-amber-500";
    }
    return invoice.transaction_status_code === "done"
      ? "text-emerald-600"
      : "text-amber-500";
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
    if (!invoice?.pay_route || !invoice.can_pay_now || remainingSeconds <= 0) {
      return;
    }
    window.location.href = invoice.pay_route;
  };

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[960px] px-4 pb-12 pt-8">
        <section className="animate-pulse space-y-4">
          <div className="mx-auto h-10 w-40 rounded bg-slate-200" />
          <div className="mx-auto h-9 w-56 rounded bg-slate-200" />
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={`row-loader-${index}`}
              className="h-8 rounded bg-slate-100"
            />
          ))}
          <div className="mx-auto h-11 w-40 rounded-xl bg-slate-200" />
        </section>
      </main>
    );
  }

  if (errorMessage || !invoice) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[960px] px-4 pb-12 pt-8">
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage || "Invoice tidak ditemukan."}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[960px] px-4 pb-12 pt-8 text-[#111827]">
      <section>
        <header className="mb-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/web_logo_topzyn.png"
            alt="TopZyn"
            className="mx-auto mb-2.5 h-auto w-[120px]"
          />
          <h1 className="text-2xl tracking-[1px]">INVOICE</h1>
        </header>

        <div className="mb-7 flex items-center justify-center gap-3 text-[#293275]">
          <span id="invoiceCode" className="font-bold">
            {invoice.code}
          </span>
          <button
            type="button"
            id="copyInvoice"
            aria-label="Copy invoice code"
            onClick={handleCopyInvoice}
            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border-none bg-[#293275] text-white outline-none transition hover:bg-[#1f265f]"
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

        <div className="grid gap-3.5">
          <div className="grid items-center gap-2 text-[15px] sm:grid-cols-2 sm:gap-4">
            <span className="text-slate-500">Tanggal</span>
            <strong className="sm:text-right">{invoice.date}</strong>
          </div>
          <div className="grid items-center gap-2 text-[15px] sm:grid-cols-2 sm:gap-4">
            <span className="text-slate-500">Produk</span>
            <strong className="sm:text-right">{invoice.product}</strong>
          </div>
          <div className="grid items-center gap-2 text-[15px] sm:grid-cols-2 sm:gap-4">
            <span className="text-slate-500">Item</span>
            <strong className="sm:text-right">{invoice.item}</strong>
          </div>
          <div className="grid items-center gap-2 text-[15px] sm:grid-cols-2 sm:gap-4">
            <span className="text-slate-500">ID Tujuan</span>
            <strong className="sm:text-right">{invoice.target}</strong>
          </div>
          <div className="grid items-center gap-2 text-[15px] sm:grid-cols-2 sm:gap-4">
            <span className="text-slate-500">Payment Method</span>
            <strong className="sm:text-right">{invoice.payment_method}</strong>
          </div>
          <div className="grid items-center gap-2 text-[15px] sm:grid-cols-2 sm:gap-4">
            <span className="text-slate-500">Batas Orderan</span>
            <strong className="sm:text-right">{countdownText}</strong>
          </div>
          <div className="grid items-center gap-2 text-[15px] sm:grid-cols-2 sm:gap-4">
            <span className="text-slate-500">Total Pembayaran</span>
            <strong className="sm:text-right">
              {formatRupiah(invoice.total)}
            </strong>
          </div>
          <div className="grid items-center gap-2 text-[15px] sm:grid-cols-2 sm:gap-4">
            <span className="text-slate-500">Payment Status</span>
            <strong className={`font-bold sm:text-right ${invoiceStatusClass}`}>
              {invoice.payment_status}
            </strong>
          </div>
          <div className="grid items-center gap-2 text-[15px] sm:grid-cols-2 sm:gap-4">
            <span className="text-slate-500">Status Transaksi</span>
            <strong
              className={`font-bold sm:text-right ${transactionStatusClass}`}
            >
              {invoice.transaction_status}
            </strong>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handlePayNow}
            disabled={!invoice.can_pay_now || remainingSeconds <= 0}
            className="rounded-xl bg-[#293275] px-7 py-3 font-bold text-white transition hover:bg-[#1f265f] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {invoice.can_pay_now && remainingSeconds > 0
              ? invoice.pay_button_text
              : remainingSeconds <= 0
                ? "Waktu pembayaran habis"
                : invoice.pay_button_text}
          </button>
        </div>
      </section>
    </main>
  );
}
