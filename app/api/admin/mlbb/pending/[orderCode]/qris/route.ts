import { NextResponse } from "next/server";

import {
  getPendingMlbbOrder,
  updatePendingMlbbOrder,
} from "@/lib/pending-order-store";

export const runtime = "nodejs";

const MAX_QRIS_UPLOAD_BYTES = 3 * 1024 * 1024;

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

    const formData = await request.formData();
    const file = formData.get("qris");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { status: "error", message: "File QRIS wajib diunggah." },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { status: "error", message: "Format file harus gambar." },
        { status: 400 },
      );
    }

    if (file.size > MAX_QRIS_UPLOAD_BYTES) {
      return NextResponse.json(
        { status: "error", message: "Ukuran gambar maksimal 3MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    updatePendingMlbbOrder(orderCode, (current) => ({
      ...current,
      qris_image_data_url: dataUrl,
    }));

    return NextResponse.json({
      status: "ok",
      message: "QRIS berhasil diunggah.",
    });
  } catch (error) {
    console.error("[api/admin/mlbb/pending/[orderCode]/qris POST] unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal upload QRIS." },
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
      qris_image_data_url: null,
    }));

    return NextResponse.json({
      status: "ok",
      message: "QRIS berhasil dihapus.",
    });
  } catch (error) {
    console.error("[api/admin/mlbb/pending/[orderCode]/qris DELETE] unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal menghapus QRIS." },
      { status: 500 },
    );
  }
}

