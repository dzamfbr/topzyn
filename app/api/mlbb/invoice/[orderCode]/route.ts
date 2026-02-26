import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import {
  ACTIVE_ORDER_COOKIE_MAX_AGE_SECONDS,
  ACTIVE_ORDER_COOKIE_NAME,
} from "@/lib/order-lock";
import { getPendingMlbbOrder, isPendingOrderExpired } from "@/lib/pending-order-store";
import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type CompletedOrderRow = RowDataPacket & {
  order_number: string;
  game_user_id: string;
  game_server: string;
  total_amount: number | string;
  status: string;
  created_at: string;
  item_name: string;
  payment_method_name: string;
};

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeWhatsappTarget(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  if (digits.startsWith("62")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }
  return digits;
}

function buildAdminPayUrl(code: string, itemName: string, totalAmount: number): string {
  const configuredNumber =
    process.env.ADMIN_WHATSAPP_NUMBER ?? process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER ?? "";
  const waTarget = normalizeWhatsappTarget(configuredNumber);
  if (!waTarget) {
    return "";
  }

  const message = [
    "Halo Admin TopZyn, saya ingin melakukan pembayaran.",
    `Kode Invoice: ${code}`,
    `Item: ${itemName}`,
    `Total: Rp ${Math.max(0, Math.floor(totalAmount)).toLocaleString("id-ID")}`,
  ].join("\n");

  return `https://wa.me/${waTarget}?text=${encodeURIComponent(message)}`;
}

function toStatusFlags(statusValue: string): {
  payment_status: string;
  payment_status_code: "pending" | "paid";
  transaction_status: string;
  transaction_status_code: "pending" | "done";
} {
  const normalized = statusValue.trim().toLowerCase();
  const isDone =
    normalized === "completed" ||
    normalized === "success" ||
    normalized === "paid" ||
    normalized === "done";

  if (isDone) {
    return {
      payment_status: "PAID",
      payment_status_code: "paid",
      transaction_status: "COMPLETED",
      transaction_status_code: "done",
    };
  }

  return {
    payment_status: "PENDING",
    payment_status_code: "pending",
    transaction_status: "BELUM DIBAYAR",
    transaction_status_code: "pending",
  };
}

function toPendingInvoiceStatus(args: {
  isExpired: boolean;
  isUserConfirmed: boolean;
}): {
  payment_status: string;
  payment_status_code: "pending" | "paid";
  transaction_status: string;
  transaction_status_code: "pending" | "done";
  can_pay_now: boolean;
  pay_button_text: string;
} {
  if (args.isExpired) {
    return {
      payment_status: "KADALUARSA",
      payment_status_code: "pending",
      transaction_status: "EXPIRED",
      transaction_status_code: "pending",
      can_pay_now: false,
      pay_button_text: "Waktu pembayaran habis",
    };
  }

  if (args.isUserConfirmed) {
    return {
      payment_status: "MENUNGGU VERIFIKASI",
      payment_status_code: "pending",
      transaction_status: "ORDERAN SEDANG DIPROSES",
      transaction_status_code: "pending",
      can_pay_now: false,
      pay_button_text: "Orderan sedang diproses",
    };
  }

  return {
    payment_status: "PENDING",
    payment_status_code: "pending",
    transaction_status: "BELUM DIBAYAR",
    transaction_status_code: "pending",
    can_pay_now: true,
    pay_button_text: "Bayar Sekarang",
  };
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
        { status: "error", message: "Kode invoice tidak valid." },
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
      const statusFlags = toPendingInvoiceStatus({
        isExpired,
        isUserConfirmed: pending.payment_confirmed_by_user,
      });
      const response = NextResponse.json({
        status: "ok",
        invoice: {
          code: pending.order_number,
          date: formatDate(pending.created_at),
          product: "Mobile Legends (MLBB)",
          item: pending.item_name,
          target: `${pending.game_user_id} (${pending.game_server})`,
          payment_method: pending.payment_method_name,
          total: Number(pending.total_amount),
          pay_url: buildAdminPayUrl(
            pending.order_number,
            pending.item_name,
            Number(pending.total_amount),
          ),
          pay_route: `/payment/${encodeURIComponent(pending.order_number)}`,
          qris_uploaded: Boolean(pending.qris_image_data_url),
          payment_confirmed_by_user: pending.payment_confirmed_by_user,
          payment_confirmed_at: pending.payment_confirmed_at,
          created_at: pending.created_at,
          expires_at: pending.expires_at,
          remaining_seconds: remainingSeconds,
          is_expired: isExpired,
          ...statusFlags,
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
          o.game_user_id,
          o.game_server,
          o.total_amount,
          o.status,
          o.created_at,
          i.name AS item_name,
          p.name AS payment_method_name
        FROM mlbb_topup_order o
        INNER JOIN mlbb_topup_item i ON i.id = o.item_id
        INNER JOIN payment_method p ON p.id = o.payment_method_id
        WHERE o.order_number = ?
        LIMIT 1
      `,
      [orderCode],
    );

    if (rows.length === 0) {
      const response = NextResponse.json(
        { status: "error", message: "Invoice tidak ditemukan." },
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

    const row = rows[0];
    const statusFlags = toStatusFlags(row.status);
    const isDone = statusFlags.transaction_status_code === "done";
    const response = NextResponse.json({
      status: "ok",
      invoice: {
        code: row.order_number,
        date: formatDate(row.created_at),
        product: "Mobile Legends (MLBB)",
        item: row.item_name,
        target: `${row.game_user_id} (${row.game_server})`,
        payment_method: row.payment_method_name,
        total: Number(row.total_amount),
        pay_url: buildAdminPayUrl(
          row.order_number,
          row.item_name,
          Number(row.total_amount),
        ),
        pay_route: "",
        qris_uploaded: false,
        payment_confirmed_by_user: true,
        payment_confirmed_at: null,
        created_at: row.created_at,
        expires_at: null,
        remaining_seconds: 0,
        is_expired: false,
        can_pay_now: false,
        pay_button_text: isDone ? "Transaksi selesai" : "Orderan sedang diproses",
        ...statusFlags,
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
    console.error("[api/mlbb/invoice/[orderCode]] unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal memuat invoice." },
      { status: 500 },
    );
  }
}
