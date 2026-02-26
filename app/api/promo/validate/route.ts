import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type PromoValidateBody = {
  code?: string;
  subtotal?: number;
};

type PromoCodeRow = RowDataPacket & {
  code: string;
  discount_type: "amount" | "percent";
  discount_value: number | string;
  min_subtotal: number | string;
  max_discount: number | string | null;
  starts_at: string | null;
  ends_at: string | null;
};

function normalizePromoCode(value: string): string {
  return value.trim().toUpperCase();
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isWithinSchedule(
  startsAt: string | null,
  endsAt: string | null,
  now: Date,
): boolean {
  if (startsAt) {
    const startTime = new Date(startsAt).getTime();
    if (Number.isFinite(startTime) && now.getTime() < startTime) {
      return false;
    }
  }

  if (endsAt) {
    const endTime = new Date(endsAt).getTime();
    if (Number.isFinite(endTime) && now.getTime() > endTime) {
      return false;
    }
  }

  return true;
}

function calculateDiscount(
  promo: PromoCodeRow,
  subtotal: number,
): number {
  const discountValue = Math.max(0, toNumber(promo.discount_value));
  if (promo.discount_type === "amount") {
    return Math.min(discountValue, subtotal);
  }

  const percentAmount = Math.floor((subtotal * discountValue) / 100);
  const maxDiscount = toNumber(promo.max_discount);
  if (maxDiscount > 0) {
    return Math.min(percentAmount, maxDiscount, subtotal);
  }
  return Math.min(percentAmount, subtotal);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PromoValidateBody;
    const code = normalizePromoCode(body.code ?? "");
    const subtotal = Math.max(0, Math.floor(Number(body.subtotal ?? 0)));

    if (!code) {
      return NextResponse.json(
        {
          status: "error",
          message: "Masukkan kode promo terlebih dahulu.",
        },
        { status: 400 },
      );
    }

    if (subtotal <= 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Subtotal tidak valid.",
        },
        { status: 400 },
      );
    }

    const db = getDbPool();
    const [rows] = await db.query<PromoCodeRow[]>(
      `
        SELECT code, discount_type, discount_value, min_subtotal, max_discount, starts_at, ends_at
        FROM promo_code
        WHERE code = ? AND is_active = 1
        LIMIT 1
      `,
      [code],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Kode promo tidak ditemukan atau tidak aktif.",
        },
        { status: 404 },
      );
    }

    const promo = rows[0];
    const now = new Date();

    if (!isWithinSchedule(promo.starts_at, promo.ends_at, now)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Kode promo belum aktif atau sudah kedaluwarsa.",
        },
        { status: 400 },
      );
    }

    const minSubtotal = Math.max(0, toNumber(promo.min_subtotal));
    if (subtotal < minSubtotal) {
      return NextResponse.json(
        {
          status: "error",
          message: `Minimal transaksi untuk promo ini adalah Rp ${minSubtotal.toLocaleString("id-ID")}.`,
        },
        { status: 400 },
      );
    }

    const discountAmount = calculateDiscount(promo, subtotal);

    return NextResponse.json({
      status: "ok",
      code: promo.code,
      discount_amount: discountAmount,
      subtotal,
      total: Math.max(0, subtotal - discountAmount),
    });
  } catch (error) {
    console.error("[api/promo/validate] unexpected error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Gagal memvalidasi kode promo.",
      },
      { status: 500 },
    );
  }
}

