import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import {
  ACTIVE_ORDER_COOKIE_MAX_AGE_SECONDS,
  ACTIVE_ORDER_COOKIE_NAME,
} from "@/lib/order-lock";
import {
  getPendingMlbbOrder,
  isPendingOrderExpired,
} from "@/lib/pending-order-store";
import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type CompletedOrderRow = RowDataPacket & {
  order_number: string;
  status: string;
  payment_method_code: string;
  payment_method_name: string;
};

function getPaymentKind(codeOrName: string): "qris" | "cash" | "minimarket" {
  const value = codeOrName.trim().toUpperCase();
  if (
    value.includes("MINIMARKET") ||
    value.includes("ALFA") ||
    value.includes("INDO")
  ) {
    return "minimarket";
  }
  if (value.includes("COD") || value.includes("CASH")) {
    return "cash";
  }
  return "qris";
}

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

      const response = NextResponse.json({
        status: "ok",
        payment: {
          order_number: pending.order_number,
          item_name: pending.item_name,
          total_amount: Number(pending.total_amount),
          payment_method_code: pending.payment_method_code,
          payment_method_name: pending.payment_method_name,
          payment_kind: getPaymentKind(
            pending.payment_method_code || pending.payment_method_name,
          ),
          qris_image_url: pending.qris_image_data_url,
          qris_uploaded: Boolean(pending.qris_image_data_url),
          minimarket_payment_code: pending.minimarket_payment_code,
          minimarket_code_uploaded: Boolean(pending.minimarket_payment_code),
          payment_confirmed_by_user: pending.payment_confirmed_by_user,
          payment_confirmed_at: pending.payment_confirmed_at,
          created_at: pending.created_at,
          expires_at: pending.expires_at,
          is_expired: isExpired,
          remaining_seconds: remainingSeconds,
          status: pending.status,
        },
      });
      response.cookies.set({
        name: ACTIVE_ORDER_COOKIE_NAME,
        value: pending.order_number,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: ACTIVE_ORDER_COOKIE_MAX_AGE_SECONDS,
      });
      return response;
    }

    const db = getDbPool();
    const [rows] = await db.query<CompletedOrderRow[]>(
      `
        SELECT
          o.order_number,
          o.status,
          p.code AS payment_method_code,
          p.name AS payment_method_name
        FROM mlbb_topup_order o
        INNER JOIN payment_method p ON p.id = o.payment_method_id
        WHERE order_number = ?
        LIMIT 1
      `,
      [orderCode],
    );

    if (rows.length === 0) {
      const response = NextResponse.json(
        { status: "error", message: "Order tidak ditemukan." },
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

    const paymentKind = getPaymentKind(
      rows[0].payment_method_code || rows[0].payment_method_name,
    );
    const response = NextResponse.json({
      status: "ok",
      payment: {
        order_number: rows[0].order_number,
        payment_method_code: rows[0].payment_method_code,
        payment_method_name: rows[0].payment_method_name,
        payment_kind: paymentKind,
        qris_uploaded: false,
        qris_image_url: null,
        minimarket_payment_code: null,
        minimarket_code_uploaded: false,
        payment_confirmed_by_user: true,
        payment_confirmed_at: null,
        created_at: null,
        expires_at: null,
        is_expired: false,
        remaining_seconds: 0,
        status: rows[0].status,
      },
    });
    response.cookies.set({
      name: ACTIVE_ORDER_COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("[api/mlbb/payment/[orderCode]] unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal memuat data pembayaran." },
      { status: 500 },
    );
  }
}
