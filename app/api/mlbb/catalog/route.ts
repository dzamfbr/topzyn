import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type GenericRow = RowDataPacket & Record<string, unknown>;

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
  // Backward-compatible: if is_active does not exist, assume active.
  if (!Object.prototype.hasOwnProperty.call(row, "is_active")) {
    return true;
  }
  return toNumber(row.is_active, 1) === 1;
}

export async function GET() {
  try {
    const db = getDbPool();

    const [itemRows] = await db.query<GenericRow[]>(
      `
        SELECT *
        FROM mlbb_topup_item
        ORDER BY id ASC
      `,
    );

    const [paymentRows] = await db.query<GenericRow[]>(
      `
        SELECT *
        FROM payment_method
        ORDER BY id ASC
      `,
    );

    const mappedItems = itemRows
      .filter(isRowActive)
      .map((item) => {
        const basePrice = toNumber(item.base_price ?? item.price ?? 0);
        const finalPrice = toNumber(
          item.final_price ?? item.price ?? item.base_price ?? 0,
        );
        return {
          id: toNumber(item.id),
          code: pickString(item, ["code", "item_code"], `ITEM-${item.id ?? "0"}`),
          name: pickString(item, ["name", "item_name"], "Produk"),
          image_url: pickString(
            item,
            ["image_url", "img_url", "logo_url"],
            "/images/diamond_mobile_legends.png",
          ),
          base_price: basePrice,
          final_price: finalPrice,
          discount_percent: Math.max(
            0,
            toNumber(item.discount_percent, 0),
          ),
        };
      })
      .filter((item) => item.id > 0);

    const mappedPayments = paymentRows
      .filter(isRowActive)
      .map((method) => ({
        id: toNumber(method.id),
        code: pickString(method, ["code", "method_code"], `PM-${method.id ?? "0"}`),
        name: pickString(method, ["name", "method_name"], "Metode Pembayaran"),
        logo_url: pickString(
          method,
          ["logo_url", "image_url", "img_url"],
          "/images/qris_topzyn.png",
        ),
      }))
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
    console.error("[api/mlbb/catalog] unexpected error:", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        message: "Gagal memuat katalog MLBB. Pastikan tabel `mlbb_topup_item` dan `payment_method` sudah dibuat.",
        detail,
      },
      { status: 500 },
    );
  }
}
