import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import {
  getPendingMlbbOrder,
  isPendingOrderExpired,
} from "@/lib/pending-order-store";
import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type CompletedOrderRow = RowDataPacket & {
  order_number: string;
  status: string;
};

export async function GET(
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
    if (pending) {
      const isExpired = isPendingOrderExpired(pending);
      const remainingSeconds = Math.max(
        0,
        Math.floor((new Date(pending.expires_at).getTime() - Date.now()) / 1000),
      );

      return NextResponse.json({
        status: "ok",
        payment: {
          order_number: pending.order_number,
          item_name: pending.item_name,
          total_amount: Number(pending.total_amount),
          qris_image_url: pending.qris_image_data_url,
          qris_uploaded: Boolean(pending.qris_image_data_url),
          payment_confirmed_by_user: pending.payment_confirmed_by_user,
          payment_confirmed_at: pending.payment_confirmed_at,
          created_at: pending.created_at,
          expires_at: pending.expires_at,
          is_expired: isExpired,
          remaining_seconds: remainingSeconds,
          status: pending.status,
        },
      });
    }

    const db = getDbPool();
    const [rows] = await db.query<CompletedOrderRow[]>(
      `
        SELECT order_number, status
        FROM mlbb_topup_order
        WHERE order_number = ?
        LIMIT 1
      `,
      [orderCode],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Order tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      status: "ok",
      payment: {
        order_number: rows[0].order_number,
        qris_uploaded: false,
        qris_image_url: null,
        payment_confirmed_by_user: true,
        payment_confirmed_at: null,
        created_at: null,
        expires_at: null,
        is_expired: false,
        remaining_seconds: 0,
        status: rows[0].status,
      },
    });
  } catch (error) {
    console.error("[api/mlbb/payment/[orderCode]] unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal memuat data pembayaran." },
      { status: 500 },
    );
  }
}

