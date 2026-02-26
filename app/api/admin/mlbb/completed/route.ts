import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type CompletedOrderRow = RowDataPacket & {
  order_number: string;
  game_user_id: string;
  game_server: string;
  payment_method_name: string;
  item_name: string;
  total_amount: number | string;
  contact_whatsapp: string;
  status: string;
  created_at: string;
  account_username: string | null;
  account_email: string | null;
};

export async function GET() {
  try {
    const db = getDbPool();
    const [rows] = await db.query<CompletedOrderRow[]>(
      `
        SELECT
          o.order_number,
          o.game_user_id,
          o.game_server,
          o.total_amount,
          o.contact_whatsapp,
          o.status,
          o.created_at,
          i.name AS item_name,
          p.name AS payment_method_name,
          a.username AS account_username,
          a.email AS account_email
        FROM mlbb_topup_order o
        INNER JOIN mlbb_topup_item i ON i.id = o.item_id
        INNER JOIN payment_method p ON p.id = o.payment_method_id
        LEFT JOIN account a ON a.id = o.account_id
        WHERE LOWER(o.status) IN ('completed', 'success', 'paid', 'done')
        ORDER BY o.created_at DESC
      `,
    );

    const orders = rows.map((row) => ({
      order_number: row.order_number,
      item_name: row.item_name,
      target: `${row.game_user_id} (${row.game_server})`,
      payment_method_name: row.payment_method_name,
      total_amount: Number(row.total_amount),
      contact_whatsapp: row.contact_whatsapp,
      status: row.status,
      created_at: row.created_at,
      account_username: row.account_username,
      account_email: row.account_email,
    }));

    return NextResponse.json(
      { status: "ok", orders },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/admin/mlbb/completed] unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal memuat transaksi selesai." },
      { status: 500 },
    );
  }
}
