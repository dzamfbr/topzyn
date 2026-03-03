"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const DEFAULT_MESSAGE = "Pastikan Anda memasukkan nomor pesanan dengan benar";

function InvoiceNotFoundFallback() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-[#111827]">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-[1080px] items-center justify-center">
        <div className="h-28 w-full max-w-[460px] animate-pulse rounded-xl bg-slate-100" />
      </section>
    </main>
  );
}

function InvoiceNotFoundContent() {
  const searchParams = useSearchParams();
  const searchedCode = (searchParams.get("code") ?? "").trim();
  const messageText = DEFAULT_MESSAGE;

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-[#111827]">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-[1080px] items-center justify-center">
        <div className="flex w-full flex-col items-center justify-center gap-10 md:gap-12">
          <div className="mx-auto flex w-full max-w-[220px] justify-center">
            <div
              className="wifi-loader"
              role="img"
              aria-label="Pastikan Anda memasukkan nomor pesanan dengan benar"
            >
              <svg
                className="circle-outer"
                viewBox="0 0 86 86"
                aria-hidden="true"
              >
                <circle className="back" cx="43" cy="43" r="40" />
                <circle className="front" cx="43" cy="43" r="40" />
                <circle className="new" cx="43" cy="43" r="40" />
              </svg>
              <svg
                className="circle-middle"
                viewBox="0 0 60 60"
                aria-hidden="true"
              >
                <circle className="back" cx="30" cy="30" r="27" />
                <circle className="front" cx="30" cy="30" r="27" />
              </svg>
              <svg
                className="circle-inner"
                viewBox="0 0 34 34"
                aria-hidden="true"
              >
                <circle className="back" cx="17" cy="17" r="14" />
                <circle className="front" cx="17" cy="17" r="14" />
              </svg>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[720px] text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#293275]/65 sm:text-sm">
              Status Transaksi
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#293275] sm:text-3xl">
              Invoice Tidak Ditemukan
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              {messageText}
            </p>

            {searchedCode ? (
              <div className="mt-4 inline-flex max-w-full items-center rounded-full border border-[#293275]/20 bg-[#eef2ff] px-4 py-2 text-xs font-semibold text-[#293275] sm:text-sm">
                <span className="truncate">
                  Kode yang dicari: {searchedCode}
                </span>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/invoice"
                className="inline-flex items-center justify-center rounded-xl bg-[#293275] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1f265f]"
              >
                Cek Kode Lain
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-[#293275]/25 bg-white px-4 py-2.5 text-sm font-bold text-[#293275] transition hover:bg-[#eef2ff]"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .wifi-loader {
          --front-color: #ff711c;
          --back-color: #c3c8de;
          width: 86px;
          height: 86px;
          border-radius: 9999px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .wifi-loader svg {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .wifi-loader svg circle {
          fill: none;
          stroke-width: 6px;
          stroke-linecap: round;
          stroke-linejoin: round;
          transform: rotate(-100deg);
          transform-origin: center;
        }

        .wifi-loader svg circle.back {
          stroke: var(--back-color);
        }

        .wifi-loader svg circle.front {
          stroke: var(--front-color);
        }

        .wifi-loader svg.circle-outer {
          height: 86px;
          width: 86px;
        }

        .wifi-loader svg.circle-outer circle {
          stroke-dasharray: 62.75 188.25;
        }

        .wifi-loader svg.circle-outer circle.back {
          animation: circle-outer 1.8s ease infinite 0.3s;
        }

        .wifi-loader svg.circle-outer circle.front {
          animation: circle-outer 1.8s ease infinite 0.15s;
        }

        .wifi-loader svg.circle-middle {
          height: 60px;
          width: 60px;
        }

        .wifi-loader svg.circle-middle circle {
          stroke-dasharray: 42.5 127.5;
        }

        .wifi-loader svg.circle-middle circle.back {
          animation: circle-middle 1.8s ease infinite 0.25s;
        }

        .wifi-loader svg.circle-middle circle.front {
          animation: circle-middle 1.8s ease infinite 0.1s;
        }

        .wifi-loader svg.circle-inner {
          height: 34px;
          width: 34px;
        }

        .wifi-loader svg.circle-inner circle {
          stroke-dasharray: 22 66;
        }

        .wifi-loader svg.circle-inner circle.back {
          animation: circle-inner 1.8s ease infinite 0.2s;
        }

        .wifi-loader svg.circle-inner circle.front {
          animation: circle-inner 1.8s ease infinite 0.05s;
        }

        @keyframes circle-outer {
          0% {
            stroke-dashoffset: 25;
          }
          25% {
            stroke-dashoffset: 0;
          }
          65% {
            stroke-dashoffset: 301;
          }
          80% {
            stroke-dashoffset: 276;
          }
          100% {
            stroke-dashoffset: 276;
          }
        }

        @keyframes circle-middle {
          0% {
            stroke-dashoffset: 17;
          }
          25% {
            stroke-dashoffset: 0;
          }
          65% {
            stroke-dashoffset: 204;
          }
          80% {
            stroke-dashoffset: 187;
          }
          100% {
            stroke-dashoffset: 187;
          }
        }

        @keyframes circle-inner {
          0% {
            stroke-dashoffset: 9;
          }
          25% {
            stroke-dashoffset: 0;
          }
          65% {
            stroke-dashoffset: 106;
          }
          80% {
            stroke-dashoffset: 97;
          }
          100% {
            stroke-dashoffset: 97;
          }
        }
      `}</style>
    </main>
  );
}

export default function InvoiceNotFoundPage() {
  return (
    <Suspense fallback={<InvoiceNotFoundFallback />}>
      <InvoiceNotFoundContent />
    </Suspense>
  );
}
