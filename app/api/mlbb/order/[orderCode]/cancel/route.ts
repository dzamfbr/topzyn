import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import { removePendingMlbbOrder } from "@/lib/pending-order-store";
import { ACTIVE_ORDER_COOKIE_NAME } from "@/lib/order-lock";
import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type CompletedOrderRow = RowDataPacket & {
  order_number: string;
};

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

    const db = getDbPool();
    const [rows] = await db.query<CompletedOrderRow[]>(
      `
        SELECT order_number
        FROM mlbb_topup_order
        WHERE order_number = ?
        LIMIT 1
      `,
      [orderCode],
    );

    if (rows.length > 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Order sudah diproses dan tidak bisa dibatalkan.",
        },
        { status: 400 },
      );
    }

    const removed = removePendingMlbbOrder(orderCode);
    if (!removed) {
      const response = NextResponse.json(
        { status: "error", message: "Order tidak ditemukan atau sudah dibatalkan." },
        { status: 404 },
      );
      response.cookies.set({
        name: ACTIVE_ORDER_COOKIE_NAME,
        value: "",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const response = NextResponse.json({
      status: "ok",
      message: "Order berhasil dibatalkan.",
    });
    response.cookies.set({
      name: ACTIVE_ORDER_COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("[api/mlbb/order/[orderCode]/cancel] unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal membatalkan order." },
      { status: 500 },
    );
  }
}
