import { NextResponse } from "next/server";

import {
  getPendingMlbbOrder,
  isPendingOrderExpired,
  updatePendingMlbbOrder,
} from "@/lib/pending-order-store";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ orderCode: string }> },
) {
  try {
    const params = await context.params;
    const orderCode = decodeURIComponent(params.orderCode ?? "").trim();
    if (!orderCode) {
      return NextResponse.json(
        { status: "error", message: "Kode order tidak valid." },
        { status: 400 },
      );
    }

    const pending = getPendingMlbbOrder(orderCode);
    if (!pending) {
      return NextResponse.json(
        { status: "error", message: "Order tidak ditemukan atau sudah diproses." },
        { status: 404 },
      );
    }

    if (isPendingOrderExpired(pending)) {
      return NextResponse.json(
        { status: "error", message: "Waktu pembayaran sudah habis." },
        { status: 400 },
      );
    }

    if (!pending.qris_image_data_url) {
      return NextResponse.json(
        {
          status: "error",
          message: "QRIS belum diunggah admin. Silakan tunggu beberapa saat.",
        },
        { status: 400 },
      );
    }

    updatePendingMlbbOrder(orderCode, (current) => ({
      ...current,
      payment_confirmed_by_user: true,
      payment_confirmed_at: new Date().toISOString(),
      status: "payment_submitted",
    }));

    return NextResponse.json({
      status: "ok",
      message:
        "Konfirmasi diterima. Pastikan pembayaran sudah benar. Admin tidak bertanggung jawab jika ada kesalahan data atau penipuan.",
    });
  } catch (error) {
    console.error("[api/mlbb/payment/[orderCode]/confirm] unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal konfirmasi pembayaran." },
      { status: 500 },
    );
  }
}

