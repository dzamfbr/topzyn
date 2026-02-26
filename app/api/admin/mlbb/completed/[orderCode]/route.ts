import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type StoredOrderRow = RowDataPacket & {
  id: number;
  account_id: number | null;
  total_amount: number | string;
};

type TopupTransactionRow = RowDataPacket & {
  id: number;
};

function toAmount(value: number | string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
}

export async function DELETE(
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

    await connection.beginTransaction();

    const [orderRows] = await connection.query<StoredOrderRow[]>(
      `
        SELECT id, account_id, total_amount
        FROM mlbb_topup_order
        WHERE order_number = ?
        LIMIT 1
      `,
      [orderCode],
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { status: "error", message: "Transaksi tidak ditemukan." },
        { status: 404 },
      );
    }

    const order = orderRows[0];
    const totalAmount = toAmount(order.total_amount);

    await connection.query<ResultSetHeader>(
      "DELETE FROM mlbb_topup_order WHERE id = ?",
      [order.id],
    );

    if (order.account_id) {
      try {
        const [transactionRows] = await connection.query<TopupTransactionRow[]>(
          `
            SELECT id
            FROM topup_transaction
            WHERE account_id = ? AND product_code = ? AND amount = ?
            ORDER BY created_at DESC
            LIMIT 1
          `,
          [order.account_id, "mlbb", totalAmount],
        );

        if (transactionRows.length > 0) {
          await connection.query<ResultSetHeader>(
            "DELETE FROM topup_transaction WHERE id = ?",
            [transactionRows[0].id],
          );
        }
      } catch (error) {
        const maybeCode = (error as { code?: string }).code;
        if (maybeCode !== "ER_NO_SUCH_TABLE" && maybeCode !== "ER_BAD_FIELD_ERROR") {
          throw error;
        }
        console.warn(
          "[api/admin/mlbb/completed/[orderCode] DELETE] skip topup_transaction cleanup:",
          maybeCode,
        );
      }

      try {
        await connection.query<ResultSetHeader>(
          `
            UPDATE account
            SET total_top_up = CASE
              WHEN total_top_up >= ? THEN total_top_up - ?
              ELSE 0
            END
            WHERE id = ?
          `,
          [totalAmount, totalAmount, order.account_id],
        );
      } catch (error) {
        const maybeCode = (error as { code?: string }).code;
        if (maybeCode !== "ER_BAD_FIELD_ERROR") {
          throw error;
        }
        console.warn(
          "[api/admin/mlbb/completed/[orderCode] DELETE] skip account total_top_up cleanup:",
          maybeCode,
        );
      }
    }

    await connection.commit();
    return NextResponse.json({
      status: "ok",
      message: "Transaksi berhasil dihapus dari database.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("[api/admin/mlbb/completed/[orderCode] DELETE] unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal menghapus transaksi." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
