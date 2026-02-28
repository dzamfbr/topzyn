import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, parseAuthSessionToken } from "@/lib/auth-session";
import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type AccountRow = RowDataPacket & {
  id: number;
};

type TransactionRow = RowDataPacket & {
  order_number: string;
  total_amount: number | string;
  status: string;
  created_at: string;
  game_user_id: string;
  game_server: string;
  item_name: string | null;
  item_image_url: string | null;
  payment_method_name: string | null;
};

function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

async function getAuthenticatedAccountId(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const sessionUser = parseAuthSessionToken(token);
  if (!sessionUser) {
    return null;
  }

  const db = getDbPool();
  const [rows] = await db.query<AccountRow[]>(
    "SELECT id FROM account WHERE id = ? LIMIT 1",
    [sessionUser.id],
  );

  if (rows.length === 0) {
    return null;
  }

  return Number(rows[0].id);
}

export async function GET(request: NextRequest) {
  try {
    const accountId = await getAuthenticatedAccountId(request);
    if (!accountId) {
      const response = NextResponse.json(
        {
          status: "error",
          message: "Unauthorized.",
        },
        { status: 401 },
      );
      clearAuthCookie(response);
      return response;
    }

    const db = getDbPool();
    const [rows] = await db.query<TransactionRow[]>(
      `
        SELECT
          o.order_number,
          o.total_amount,
          o.status,
          o.created_at,
          o.game_user_id,
          o.game_server,
          i.name AS item_name,
          i.image_url AS item_image_url,
          p.name AS payment_method_name
        FROM mlbb_topup_order o
        LEFT JOIN mlbb_topup_item i ON i.id = o.item_id
        LEFT JOIN payment_method p ON p.id = o.payment_method_id
        WHERE o.account_id = ?
        ORDER BY o.created_at DESC
        LIMIT 200
      `,
      [accountId],
    );

    const transactions = rows.map((row) => ({
      orderNumber: row.order_number,
      itemName: row.item_name || "MLBB Top Up",
      itemImageUrl: row.item_image_url,
      totalAmount: Number(row.total_amount ?? 0),
      status: row.status || "pending",
      createdAt: row.created_at,
      target: `${row.game_user_id} (${row.game_server})`,
      paymentMethod: row.payment_method_name,
    }));

    return NextResponse.json(
      {
        status: "success",
        transactions,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[api/auth/profile/transactions][GET] unexpected error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Gagal memuat history transaksi.",
      },
      { status: 500 },
    );
  }
}

