import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type GenericRow = RowDataPacket & Record<string, unknown>;

const LEGACY_IMAGE_MAP: Record<string, string> = {
  "/images/free_fire_diamond.png":
    "/images/topzyn/products/free-fire/topzyn-free-fire-diamond-item.png",
  "/images/qris_topzyn.png":
    "/images/topzyn/payments/topzyn-payment-method-qris.png",
  "/images/cash_topzyn.png":
    "/images/topzyn/payments/topzyn-payment-method-cash-cod.png",
  "/images/alfamart_topzyn.png":
    "/images/topzyn/payments/topzyn-payment-method-alfamart.png",
  "/images/indomaret_topzyn.png":
    "/images/topzyn/payments/topzyn-payment-method-indomaret.png",
};

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickString(row: GenericRow, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return fallback;
}

function isRowActive(row: GenericRow): boolean {
  if (!Object.prototype.hasOwnProperty.call(row, "is_active")) {
    return true;
  }
  return toNumber(row.is_active, 1) === 1;
}

function normalizeImageUrl(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  if (LEGACY_IMAGE_MAP[trimmed]) {
    return LEGACY_IMAGE_MAP[trimmed];
  }

  if (trimmed.startsWith("/images/topzyn/")) {
    return trimmed;
  }

  return fallback;
}

export async function GET() {
  try {
    const db = getDbPool();

    const [itemRows] = await db.query<GenericRow[]>(
      `
        SELECT *
        FROM mlbb_topup_item
        WHERE UPPER(code) LIKE 'FF%'
        ORDER BY sort_order ASC, id ASC
      `,
    );

    const [paymentRows] = await db.query<GenericRow[]>(
      `
        SELECT *
        FROM payment_method
        ORDER BY sort_order ASC, id ASC
      `,
    );

    const mappedItems = itemRows
      .filter(isRowActive)
      .map((item) => {
        const finalPrice = toNumber(
          item.final_price ?? item.price ?? item.base_price ?? 0,
        );
        const basePrice = toNullableNumber(item.base_price ?? item.price);
        const fallbackImage =
          "/images/topzyn/products/free-fire/topzyn-free-fire-diamond-item.png";
        return {
          id: toNumber(item.id),
          code: pickString(item, ["code", "item_code"], `ITEM-${item.id ?? "0"}`),
          name: pickString(item, ["name", "item_name"], "Produk Free Fire"),
          image_url: normalizeImageUrl(
            pickString(item, ["image_url", "img_url", "logo_url"], ""),
            fallbackImage,
          ),
          base_price: basePrice,
          final_price: finalPrice,
          discount_percent: Math.max(0, toNumber(item.discount_percent, 0)),
        };
      })
      .filter((item) => item.id > 0);

    const mappedPayments = paymentRows
      .filter(isRowActive)
      .map((method) => {
        const fallbackLogo = "/images/topzyn/payments/topzyn-payment-method-qris.png";
        return {
          id: toNumber(method.id),
          code: pickString(
            method,
            ["code", "method_code"],
            `PM-${method.id ?? "0"}`,
          ),
          name: pickString(method, ["name", "method_name"], "Metode Pembayaran"),
          logo_url: normalizeImageUrl(
            pickString(method, ["logo_url", "image_url", "img_url"], ""),
            fallbackLogo,
          ),
        };
      })
      .filter((method) => method.id > 0);

    return NextResponse.json(
      {
        status: "ok",
        items: mappedItems,
        payment_methods: mappedPayments,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[api/ff/catalog] unexpected error:", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        message:
          "Gagal memuat katalog Free Fire. Pastikan tabel `mlbb_topup_item` dan `payment_method` sudah dibuat.",
        detail,
      },
      { status: 500 },
    );
  }
}
