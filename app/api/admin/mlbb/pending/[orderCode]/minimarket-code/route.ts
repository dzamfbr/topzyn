import { NextResponse } from "next/server";

import {
  getPendingMlbbOrder,
  updatePendingMlbbOrder,
} from "@/lib/pending-order-store";

export const runtime = "nodejs";

function isMinimarketPayment(codeOrName: string): boolean {
  const value = codeOrName.trim().toUpperCase();
  return (
    value.includes("MINIMARKET") ||
    value.includes("ALFA") ||
    value.includes("INDO")
  );
}

function normalizeMinimarketCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export async function POST(
  request: Request,
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
        { status: "error", message: "Order tidak ditemukan." },
        { status: 404 },
      );
    }

    if (
      !isMinimarketPayment(
        pending.payment_method_code || pending.payment_method_name,
      )
    ) {
      return NextResponse.json(
        { status: "error", message: "Order ini bukan metode minimarket." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as { payment_code?: string };
    const paymentCode = normalizeMinimarketCode(body.payment_code ?? "");
    if (!paymentCode) {
      return NextResponse.json(
        { status: "error", message: "Kode pembayaran minimarket wajib diisi." },
        { status: 400 },
      );
    }

    if (paymentCode.length < 6 || paymentCode.length > 32) {
      return NextResponse.json(
        {
          status: "error",
          message: "Kode pembayaran minimarket harus 6-32 karakter.",
        },
        { status: 400 },
      );
    }

    updatePendingMlbbOrder(orderCode, (current) => ({
      ...current,
      minimarket_payment_code: paymentCode,
    }));

    return NextResponse.json({
      status: "ok",
      message: "Kode pembayaran minimarket berhasil disimpan.",
    });
  } catch (error) {
    console.error(
      "[api/admin/mlbb/pending/[orderCode]/minimarket-code POST] unexpected error:",
      error,
    );
    return NextResponse.json(
      { status: "error", message: "Gagal menyimpan kode minimarket." },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
        { status: "error", message: "Order tidak ditemukan." },
        { status: 404 },
      );
    }

    updatePendingMlbbOrder(orderCode, (current) => ({
      ...current,
      minimarket_payment_code: null,
    }));

    return NextResponse.json({
      status: "ok",
      message: "Kode pembayaran minimarket berhasil dihapus.",
    });
  } catch (error) {
    console.error(
      "[api/admin/mlbb/pending/[orderCode]/minimarket-code DELETE] unexpected error:",
      error,
    );
    return NextResponse.json(
      { status: "error", message: "Gagal menghapus kode minimarket." },
      { status: 500 },
    );
  }
}

