"use client";

import { useEffect, useMemo, useState } from "react";
import { TopzynNotice, type TopzynNoticeTone } from "@/components/ui/topzyn-notice";

type PendingOrder = {
  order_number: string;
  item_name: string;
  target: string;
  payment_method_name: string;
  total_amount: number;
  contact_whatsapp: string;
  created_at: string;
  expires_at: string;
  status: string;
  qris_uploaded: boolean;
  qris_image_url: string | null;
  payment_confirmed_by_user: boolean;
  payment_confirmed_at: string | null;
  is_expired: boolean;
};

type CompletedOrder = {
  order_number: string;
  item_name: string;
  target: string;
  payment_method_name: string;
  total_amount: number;
  contact_whatsapp: string;
  status: string;
  created_at: string;
  account_username: string | null;
  account_email: string | null;
};

type PendingOrderResponse = {
  status: "ok" | "error";
  message?: string;
  orders?: PendingOrder[];
};

type CompletedOrderResponse = {
  status: "ok" | "error";
  message?: string;
  orders?: CompletedOrder[];
};

type ActionResponse = {
  status: "ok" | "error";
  message?: string;
};

type AdminTab = "pending" | "completed";

function formatRupiah(value: number): string {
  return `Rp ${Math.max(0, Math.floor(value)).toLocaleString("id-ID")}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AdminPendingOrderPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("pending");
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionOrderCode, setActionOrderCode] = useState("");
  const [actionType, setActionType] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingCancelOrderCode, setPendingCancelOrderCode] = useState("");
  const [pendingDeleteCompletedOrderCode, setPendingDeleteCompletedOrderCode] =
    useState("");

  const hasPendingOrders = useMemo(
    () => pendingOrders.length > 0,
    [pendingOrders.length],
  );
  const hasCompletedOrders = useMemo(
    () => completedOrders.length > 0,
    [completedOrders.length],
  );
  const noticeTone = useMemo<TopzynNoticeTone>(() => {
    if (!notice) {
      return "info";
    }
    return /gagal|error|tidak/i.test(notice) ? "error" : "success";
  }, [notice]);

  const loadPendingOrders = async (showLoader = true) => {
    if (showLoader) {
      setIsLoadingPending(true);
    }
    setLoadError("");
    try {
      const response = await fetch("/api/admin/mlbb/pending", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as PendingOrderResponse;
      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message ?? "Gagal memuat pending order.");
      }
      setPendingOrders(data.orders ?? []);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Gagal memuat pending order.",
      );
    } finally {
      if (showLoader) {
        setIsLoadingPending(false);
      }
    }
  };

  const loadCompletedOrders = async (showLoader = true) => {
    if (showLoader) {
      setIsLoadingCompleted(true);
    }
    setLoadError("");
    try {
      const response = await fetch("/api/admin/mlbb/completed", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as CompletedOrderResponse;
      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message ?? "Gagal memuat transaksi selesai.");
      }
      setCompletedOrders(data.orders ?? []);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Gagal memuat transaksi selesai.",
      );
    } finally {
      if (showLoader) {
        setIsLoadingCompleted(false);
      }
    }
  };

  useEffect(() => {
    void loadPendingOrders();
    void loadCompletedOrders();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (activeTab === "pending") {
        void loadPendingOrders(false);
        return;
      }
      void loadCompletedOrders(false);
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeTab]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice("");
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notice]);

  const handleCancel = async (orderCode: string) => {
    setActionOrderCode(orderCode);
    setActionType("cancel");
    setNotice("");
    try {
      const response = await fetch(
        `/api/admin/mlbb/pending/${encodeURIComponent(orderCode)}`,
        {
          method: "DELETE",
        },
      );
      const data = (await response.json()) as ActionResponse;
      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message ?? "Gagal membatalkan order.");
      }
      setPendingOrders((current) =>
        current.filter((item) => item.order_number !== orderCode),
      );
      setNotice("Order berhasil dibatalkan.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal membatalkan order.");
    } finally {
      setActionOrderCode("");
      setActionType("");
    }
  };

  const handleComplete = async (orderCode: string) => {
    setActionOrderCode(orderCode);
    setActionType("complete");
    setNotice("");
    try {
      const response = await fetch(
        `/api/admin/mlbb/pending/${encodeURIComponent(orderCode)}`,
        {
          method: "POST",
        },
      );
      const data = (await response.json()) as ActionResponse;
      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message ?? "Gagal menyelesaikan order.");
      }
      setPendingOrders((current) =>
        current.filter((item) => item.order_number !== orderCode),
      );
      void loadCompletedOrders();
      setNotice("Order selesai dan sudah masuk database.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menyelesaikan order.");
    } finally {
      setActionOrderCode("");
      setActionType("");
    }
  };

  const handleDeleteCompleted = async (orderCode: string) => {
    setActionOrderCode(orderCode);
    setActionType("delete-completed");
    setNotice("");
    try {
      const response = await fetch(
        `/api/admin/mlbb/completed/${encodeURIComponent(orderCode)}`,
        {
          method: "DELETE",
        },
      );
      const data = (await response.json()) as ActionResponse;
      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message ?? "Gagal menghapus transaksi.");
      }
      setCompletedOrders((current) =>
        current.filter((item) => item.order_number !== orderCode),
      );
      setNotice("Transaksi berhasil dihapus dari database.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menghapus transaksi.");
    } finally {
      setActionOrderCode("");
      setActionType("");
    }
  };

  const toSquareImageFile = async (file: File): Promise<File> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
      reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal memuat gambar."));
      img.src = dataUrl;
    });

    const size = Math.min(image.naturalWidth, image.naturalHeight);
    const sx = Math.max(0, Math.floor((image.naturalWidth - size) / 2));
    const sy = Math.max(0, Math.floor((image.naturalHeight - size) / 2));

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas context tidak tersedia.");
    }
    context.drawImage(image, sx, sy, size, size, 0, 0, size, size);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png", 0.92);
    });
    if (!blob) {
      throw new Error("Gagal memproses gambar QRIS.");
    }

    return new File([blob], `qris-${Date.now()}.png`, { type: "image/png" });
  };

  const handleUploadQris = async (orderCode: string, rawFile: File | null) => {
    if (!rawFile) {
      return;
    }
    setActionOrderCode(orderCode);
    setActionType("upload");
    setNotice("");
    try {
      const squareFile = await toSquareImageFile(rawFile);
      const formData = new FormData();
      formData.append("qris", squareFile);

      const response = await fetch(
        `/api/admin/mlbb/pending/${encodeURIComponent(orderCode)}/qris`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = (await response.json()) as ActionResponse;
      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message ?? "Gagal upload QRIS.");
      }
      setNotice("QRIS berhasil diunggah (otomatis dibuat rasio 1:1).");
      await loadPendingOrders();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal upload QRIS.");
    } finally {
      setActionOrderCode("");
      setActionType("");
    }
  };

  const handleRefresh = () => {
    if (activeTab === "pending") {
      void loadPendingOrders();
      return;
    }
    void loadCompletedOrders();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <TopzynNotice
        open={Boolean(loadError)}
        tone="error"
        title="Gagal Memuat Data"
        message={loadError}
        autoHideMs={7000}
        onClose={() => setLoadError("")}
      />
      <TopzynNotice
        open={Boolean(notice)}
        tone={noticeTone}
        title={noticeTone === "error" ? "Aksi Gagal" : "Aksi Berhasil"}
        message={notice}
        autoHideMs={5000}
        onClose={() => setNotice("")}
      />

      <section className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#293275]">Admin MLBB</h1>
            <p className="text-sm text-slate-500">
              Kelola pending order dan transaksi yang sudah masuk database.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-lg bg-[#293275] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f265f]"
          >
            Refresh
          </button>
        </header>

        <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={[
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              activeTab === "pending"
                ? "bg-[#293275] text-white"
                : "text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            Pending Order ({pendingOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={[
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              activeTab === "completed"
                ? "bg-[#293275] text-white"
                : "text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            Transaksi Selesai ({completedOrders.length})
          </button>
        </div>

        {activeTab === "pending" ? (
          isLoadingPending ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`pending-loader-${index}`}
                  className="h-40 animate-pulse rounded-xl bg-slate-200"
                />
              ))}
            </div>
          ) : hasPendingOrders ? (
            <div className="grid gap-4">
              {pendingOrders.map((order) => {
                const isBusy = actionOrderCode === order.order_number;
                return (
                  <article
                    key={order.order_number}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-base font-bold text-[#293275]">
                        {order.order_number}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                          {order.is_expired ? "EXPIRED" : "PENDING"}
                        </span>
                        <span
                          className={[
                            "rounded-full px-3 py-1 text-xs font-bold",
                            order.qris_uploaded
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700",
                          ].join(" ")}
                        >
                          QRIS {order.qris_uploaded ? "Uploaded" : "Belum Upload"}
                        </span>
                        <span
                          className={[
                            "rounded-full px-3 py-1 text-xs font-bold",
                            order.payment_confirmed_by_user
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700",
                          ].join(" ")}
                        >
                          {order.payment_confirmed_by_user
                            ? "User Sudah Konfirmasi"
                            : "User Belum Konfirmasi"}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                      <p>
                        <span className="text-slate-500">Tanggal: </span>
                        <strong>{formatDate(order.created_at)}</strong>
                      </p>
                      <p>
                        <span className="text-slate-500">Item: </span>
                        <strong>{order.item_name}</strong>
                      </p>
                      <p>
                        <span className="text-slate-500">Target: </span>
                        <strong>{order.target}</strong>
                      </p>
                      <p>
                        <span className="text-slate-500">Payment: </span>
                        <strong>{order.payment_method_name}</strong>
                      </p>
                      <p>
                        <span className="text-slate-500">Total: </span>
                        <strong>{formatRupiah(order.total_amount)}</strong>
                      </p>
                      <p>
                        <span className="text-slate-500">WA User: </span>
                        <strong>{order.contact_whatsapp}</strong>
                      </p>
                      <p>
                        <span className="text-slate-500">Batas Bayar: </span>
                        <strong>{formatDate(order.expires_at)}</strong>
                      </p>
                      <p>
                        <span className="text-slate-500">Konfirmasi User: </span>
                        <strong>
                          {order.payment_confirmed_at
                            ? formatDate(order.payment_confirmed_at)
                            : "-"}
                        </strong>
                      </p>
                    </div>

                    {order.qris_image_url ? (
                      <div className="mt-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.qris_image_url}
                          alt={`QRIS ${order.order_number}`}
                          className="aspect-square w-full max-w-[180px] rounded-lg border border-slate-200 object-cover"
                        />
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {order.qris_uploaded ? (
                        <span className="inline-flex items-center rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white">
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="h-[18px] w-[18px]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12.5 9.2 16.7 19 7.3" />
                          </svg>
                        </span>
                      ) : (
                        <label
                          className={[
                            "inline-flex cursor-pointer items-center rounded-lg bg-[#293275] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f265f]",
                            isBusy ? "pointer-events-none opacity-60" : "",
                          ].join(" ")}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={isBusy}
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              void handleUploadQris(order.order_number, file);
                              event.currentTarget.value = "";
                            }}
                          />
                          {isBusy && actionType === "upload"
                            ? "Upload..."
                            : "Upload QRIS"}
                        </label>
                      )}
                      <button
                        type="button"
                        onClick={() => setPendingCancelOrderCode(order.order_number)}
                        disabled={isBusy}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                      >
                        Batalkan
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleComplete(order.order_number)}
                        disabled={
                          isBusy ||
                          !order.payment_confirmed_by_user ||
                          order.is_expired
                        }
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                      >
                        {isBusy && actionType === "complete"
                          ? "Memproses..."
                          : "Selesaikan"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-slate-500">
              Belum ada pending order.
            </div>
          )
        ) : isLoadingCompleted ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`completed-loader-${index}`}
                className="h-36 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        ) : hasCompletedOrders ? (
          <div className="grid gap-4">
            {completedOrders.map((order) => {
              const isBusy = actionOrderCode === order.order_number;
              return (
                <article
                  key={order.order_number}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-[#293275]">
                      {order.order_number}
                    </h2>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      {String(order.status || "completed").toUpperCase()}
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                    <p>
                      <span className="text-slate-500">Tanggal: </span>
                      <strong>{formatDate(order.created_at)}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500">Item: </span>
                      <strong>{order.item_name}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500">Target: </span>
                      <strong>{order.target}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500">Payment: </span>
                      <strong>{order.payment_method_name}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500">Total: </span>
                      <strong>{formatRupiah(order.total_amount)}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500">WA User: </span>
                      <strong>{order.contact_whatsapp}</strong>
                    </p>
                    <p className="md:col-span-2">
                      <span className="text-slate-500">Akun: </span>
                      <strong>
                        {order.account_username
                          ? `${order.account_username}${
                              order.account_email ? ` (${order.account_email})` : ""
                            }`
                          : "-"}
                      </strong>
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPendingDeleteCompletedOrderCode(order.order_number)
                      }
                      disabled={isBusy}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                    >
                      {isBusy && actionType === "delete-completed"
                        ? "Menghapus..."
                        : "Hapus Transaksi"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-slate-500">
            Belum ada transaksi selesai di database.
          </div>
        )}
      </section>

      {pendingCancelOrderCode ? (
        <div
          className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/45 px-4"
          role="presentation"
          onClick={(event) => {
            if (event.currentTarget === event.target) {
              setPendingCancelOrderCode("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancelOrderTitle"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
          >
            <h3 id="cancelOrderTitle" className="text-lg font-bold text-slate-900">
              Batalkan Pesanan?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Apakah yakin membatalkan pesanan dengan kode{" "}
              <strong>{pendingCancelOrderCode}</strong>?
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Jika dibatalkan, pesanan akan dihapus dari antrian pending.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingCancelOrderCode("")}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={() => {
                  const orderCode = pendingCancelOrderCode;
                  setPendingCancelOrderCode("");
                  void handleCancel(orderCode);
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteCompletedOrderCode ? (
        <div
          className="fixed inset-0 z-[10011] flex items-center justify-center bg-black/45 px-4"
          role="presentation"
          onClick={(event) => {
            if (event.currentTarget === event.target) {
              setPendingDeleteCompletedOrderCode("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleteCompletedTitle"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
          >
            <h3
              id="deleteCompletedTitle"
              className="text-lg font-bold text-slate-900"
            >
              Hapus Transaksi Selesai?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Apakah yakin menghapus transaksi dengan kode{" "}
              <strong>{pendingDeleteCompletedOrderCode}</strong> dari database?
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Aksi ini akan menghapus data transaksi selesai secara permanen.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteCompletedOrderCode("")}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={() => {
                  const orderCode = pendingDeleteCompletedOrderCode;
                  setPendingDeleteCompletedOrderCode("");
                  void handleDeleteCompleted(orderCode);
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
