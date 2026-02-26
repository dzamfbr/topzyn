import type { ResultSetHeader } from "mysql2/promise";
import { NextResponse } from "next/server";

import {
  getPendingMlbbOrder,
  removePendingMlbbOrder,
} from "@/lib/pending-order-store";
import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

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

    const removed = removePendingMlbbOrder(orderCode);
    if (!removed) {
      return NextResponse.json(
        { status: "error", message: "Order tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      status: "ok",
      message: "Order dibatalkan dan dihapus dari antrian.",
    });
  } catch (error) {
    console.error("[api/admin/mlbb/pending/[orderCode] DELETE] unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal membatalkan order." },
      { status: 500 },
    );
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ orderCode: string }> },
) {
  const db = getDbPool();
  const connection = await db.getConnection();

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
        { status: "error", message: "Order tidak ditemukan di antrian." },
        { status: 404 },
      );
    }

    if (!pending.payment_confirmed_by_user) {
      return NextResponse.json(
        {
          status: "error",
          message: "User belum konfirmasi pembayaran. Selesaikan belum bisa diproses.",
        },
        { status: 400 },
      );
    }

    await connection.beginTransaction();
    let insertedMainOrder = false;

    try {
      await connection.query<ResultSetHeader>(
        `
          INSERT INTO mlbb_topup_order (
            order_number,
            account_id,
            game_user_id,
            game_server,
            item_id,
            payment_method_id,
            promo_code,
            promo_discount,
            subtotal_amount,
            total_amount,
            contact_whatsapp,
            status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          pending.order_number,
          pending.account_id,
          pending.game_user_id,
          pending.game_server,
          pending.item_id,
          pending.payment_method_id,
          pending.promo_code,
          pending.promo_discount,
          pending.subtotal_amount,
          pending.total_amount,
          pending.contact_whatsapp,
          "completed",
          new Date(pending.created_at),
        ],
      );
      insertedMainOrder = true;
    } catch (error) {
      const maybeCode = (error as { code?: string }).code;
      if (maybeCode !== "ER_DUP_ENTRY") {
        throw error;
      }
    }

    if (insertedMainOrder && pending.account_id) {
      try {
        await connection.query<ResultSetHeader>(
          `
            INSERT INTO topup_transaction (account_id, product_code, amount, status)
            VALUES (?, ?, ?, ?)
          `,
          [pending.account_id, "mlbb", pending.total_amount, "success"],
        );
      } catch (error) {
        const maybeCode = (error as { code?: string }).code;
        if (maybeCode !== "ER_NO_SUCH_TABLE" && maybeCode !== "ER_BAD_FIELD_ERROR") {
          throw error;
        }
        console.warn(
          "[api/admin/mlbb/pending/[orderCode] POST] skip topup_transaction insert:",
          maybeCode,
        );
      }

      try {
        await connection.query<ResultSetHeader>(
          `
            UPDATE account
            SET total_top_up = total_top_up + ?
            WHERE id = ?
          `,
          [pending.total_amount, pending.account_id],
        );
      } catch (error) {
        const maybeCode = (error as { code?: string }).code;
        if (maybeCode !== "ER_BAD_FIELD_ERROR") {
          throw error;
        }
        console.warn(
          "[api/admin/mlbb/pending/[orderCode] POST] skip account.total_top_up update:",
          maybeCode,
        );
      }
    }

    await connection.commit();
    removePendingMlbbOrder(orderCode);

    return NextResponse.json({
      status: "ok",
      message: "Order diselesaikan dan berhasil disimpan ke database.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("[api/admin/mlbb/pending/[orderCode] POST] unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal menyelesaikan order." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
