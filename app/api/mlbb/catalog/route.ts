import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type MlbbItemRow = RowDataPacket & {
  id: number;
  code: string;
  name: string;
  image_url: string;
  base_price: number | string;
  final_price: number | string;
  discount_percent: number | string;
};

type PaymentMethodRow = RowDataPacket & {
  id: number;
  code: string;
  name: string;
  logo_url: string;
};

export async function GET() {
  try {
    const db = getDbPool();

    const [itemRows] = await db.query<MlbbItemRow[]>(
      `
        SELECT id, code, name, image_url, base_price, final_price, discount_percent
        FROM mlbb_topup_item
        WHERE is_active = 1
        ORDER BY sort_order ASC, id ASC
      `,
    );

    const [paymentRows] = await db.query<PaymentMethodRow[]>(
      `
        SELECT id, code, name, logo_url
        FROM payment_method
        WHERE is_active = 1
        ORDER BY sort_order ASC, id ASC
      `,
    );

    return NextResponse.json(
      {
        status: "ok",
        items: itemRows.map((item) => ({
          id: Number(item.id),
          code: item.code,
          name: item.name,
          image_url: item.image_url,
          base_price: Number(item.base_price),
          final_price: Number(item.final_price),
          discount_percent: Number(item.discount_percent ?? 0),
        })),
        payment_methods: paymentRows.map((method) => ({
          id: Number(method.id),
          code: method.code,
          name: method.name,
          logo_url: method.logo_url,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[api/mlbb/catalog] unexpected error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Gagal memuat katalog MLBB. Pastikan tabel database sudah dibuat.",
      },
      { status: 500 },
    );
  }
}

