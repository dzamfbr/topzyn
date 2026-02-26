"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TopzynNotice, type TopzynNoticeTone } from "@/components/ui/topzyn-notice";

type PaymentResponse = {
  status: "ok" | "error";
  message?: string;
  payment?: {
    order_number: string;
    item_name?: string;
    total_amount?: number;
    qris_image_url: string | null;
    qris_uploaded: boolean;
    payment_confirmed_by_user: boolean;
    payment_confirmed_at: string | null;
    created_at: string | null;
    expires_at: string | null;
    is_expired: boolean;
    remaining_seconds: number;
    status: string;
  };
};

function formatRupiah(value: number): string {
  return `Rp ${Math.max(0, Math.floor(value)).toLocaleString("id-ID")}`;
}

export default function PaymentPage() {
  const routeParams = useParams<{ invoiceCode: string }>();
  const [orderCode, setOrderCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<TopzynNoticeTone>("info");
  const [warningShown, setWarningShown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentResponse["payment"] | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    const rawCode = routeParams?.invoiceCode;
    if (!rawCode) {
      return;
    }

    let disposed = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const code = decodeURIComponent(rawCode).trim();
        if (!code) {
          throw new Error("Kode order tidak valid.");
        }
        if (!disposed) {
          setOrderCode(code);
        }

        const response = await fetch(`/api/mlbb/payment/${encodeURIComponent(code)}`, {
          method: "GET",
          cache: "no-store",
        });
        const data = (await response.json()) as PaymentResponse;
        if (!response.ok || data.status !== "ok" || !data.payment) {
          throw new Error(data.message ?? "Data pembayaran tidak ditemukan.");
        }
        if (!disposed) {
          setPayment(data.payment);
          setRemainingSeconds(Math.max(0, Number(data.payment.remaining_seconds || 0)));
          setWarningShown(Boolean(data.payment.payment_confirmed_by_user));
        }
      } catch (error) {
        if (!disposed) {
          setErrorMessage(
            error instanceof Error ? error.message : "Gagal memuat halaman pembayaran.",
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
    if (!payment?.expires_at || payment.payment_confirmed_by_user) {
      return;
    }
    const tick = () => {
      const next = Math.max(
        0,
        Math.floor((new Date(payment.expires_at as string).getTime() - Date.now()) / 1000),
      );
      setRemainingSeconds(next);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [payment?.expires_at, payment?.payment_confirmed_by_user]);

  const countdownText = useMemo(() => {
    if (!payment?.expires_at) {
      return "-";
    }
    if (remainingSeconds <= 0) {
      return "00:00:00";
    }
    const hour = String(Math.floor(remainingSeconds / 3600)).padStart(2, "0");
    const minute = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, "0");
    const second = String(remainingSeconds % 60).padStart(2, "0");
    return `${hour}:${minute}:${second}`;
  }, [payment?.expires_at, remainingSeconds]);

  const canConfirmPayment = Boolean(
    payment &&
      payment.qris_uploaded &&
      !payment.payment_confirmed_by_user &&
      !payment.is_expired &&
      remainingSeconds > 0,
  );

  const isCompleted = ["completed", "success", "paid", "done"].includes(
    String(payment?.status ?? "").toLowerCase(),
  );

  const canFinish = Boolean(payment?.payment_confirmed_by_user || warningShown || isCompleted);

  const goToInvoice = () => {
    if (!orderCode) {
      return;
    }
    window.location.href = `/invoice/${encodeURIComponent(orderCode)}`;
  };

  const handleConfirmPayment = async () => {
    if (!orderCode || !canConfirmPayment) {
      return;
    }
    setIsSubmitting(true);
    setNotice("");
    setNoticeTone("info");
    try {
      const response = await fetch(
        `/api/mlbb/payment/${encodeURIComponent(orderCode)}/confirm`,
        {
          method: "POST",
        },
      );
      const data = (await response.json()) as { status: "ok" | "error"; message?: string };
      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message ?? "Konfirmasi pembayaran gagal.");
      }

      setPayment((current) =>
        current
          ? {
              ...current,
              payment_confirmed_by_user: true,
              payment_confirmed_at: new Date().toISOString(),
              status: "payment_submitted",
            }
          : current,
      );
      setWarningShown(true);
      setNoticeTone("success");
      setNotice(
        data.message ??
          "Konfirmasi diterima. Admin tidak bertanggung jawab jika ada kesalahan data atau penipuan.",
      );
    } catch (error) {
      setNoticeTone("error");
      setNotice(error instanceof Error ? error.message : "Konfirmasi pembayaran gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white px-4 py-8">
        <section className="mx-auto max-w-xl animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="aspect-square w-full rounded-xl bg-slate-200" />
          <div className="h-12 rounded bg-slate-200" />
        </section>
      </main>
    );
  }

  if (errorMessage || !payment) {
    return (
      <main className="min-h-screen bg-white px-4 py-8">
        <section className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage || "Data pembayaran tidak ditemukan."}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-[#111827]">
      <TopzynNotice
        open={Boolean(notice)}
        tone={noticeTone}
        title={noticeTone === "error" ? "Konfirmasi Gagal" : "Informasi Pembayaran"}
        message={notice}
        autoHideMs={5000}
        onClose={() => setNotice("")}
      />
      <section className="mx-auto max-w-xl">
        <h1 className="text-center text-2xl font-bold">Pembayaran QRIS</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Kode: {payment.order_number}</p>
        <p className="mt-1 text-center text-sm text-slate-500">
          Batas pembayaran: <strong>{countdownText}</strong>
        </p>
        {warningShown ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-amber-200 bg-[linear-gradient(145deg,#fffaf0_0%,#fff4df_100%)] shadow-[0_8px_22px_rgba(245,158,11,0.14)]">
            <div className="flex items-start gap-2 px-3 py-3 text-sm text-amber-800">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
                <path
                  d="M12 3.2 2.7 20h18.6L12 3.2Zm0 4.6a1 1 0 0 1 1 1v5.6a1 1 0 1 1-2 0V8.8a1 1 0 0 1 1-1Zm0 10a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"
                  fill="currentColor"
                />
              </svg>
              <p>
                Pastikan pembayaran sudah benar. Admin tidak bertanggung jawab atas
                kesalahan data, penipuan, atau pembayaran yang tidak valid.
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          {isCompleted ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
              Order ini sudah diproses/selesai. Kamu bisa kembali ke invoice.
            </div>
          ) : payment.qris_uploaded && payment.qris_image_url ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.qris_image_url}
                alt="QRIS"
                className="aspect-square w-full rounded-lg border border-slate-200 object-cover"
              />
              {payment.item_name ? (
                <p className="text-center text-sm text-slate-600">{payment.item_name}</p>
              ) : null}
              {typeof payment.total_amount === "number" ? (
                <p className="text-center text-sm font-semibold text-[#293275]">
                  Total: {formatRupiah(payment.total_amount)}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-[linear-gradient(145deg,#fffaf0_0%,#fff4df_100%)] px-3 py-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
                  <path
                    d="M12 3.2 2.7 20h18.6L12 3.2Zm0 4.6a1 1 0 0 1 1 1v5.6a1 1 0 1 1-2 0V8.8a1 1 0 0 1 1-1Zm0 10a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"
                    fill="currentColor"
                  />
                </svg>
                <span>QRIS belum diupload oleh admin, harap tunggu.</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={!canConfirmPayment || isSubmitting || isCompleted}
            className="rounded-xl bg-[#293275] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1f265f] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Memproses..." : "Konfirmasi Pembayaran"}
          </button>
          <button
            type="button"
            onClick={goToInvoice}
            disabled={!canFinish}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Selesai
          </button>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Ke Halaman Sebelumnya
          </button>
        </div>
      </section>
    </main>
  );
}
