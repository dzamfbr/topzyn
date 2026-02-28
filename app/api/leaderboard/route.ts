import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";

import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type LeaderboardRow = RowDataPacket & {
  id: number;
  username: string;
  email: string;
  monthly_total: number | string;
};

function maskEmail(email: string): string {
  const [localPartRaw, domain] = email.split("@");
  if (!localPartRaw || !domain) {
    return email;
  }

  const localPart = localPartRaw.trim();
  if (!localPart) {
    return email;
  }

  const first = localPart.slice(0, 2);
  const last = localPart.slice(-2);
  return `${first}*****${last}@${domain}`;
}

function getCurrentMonthRangeBangkok() {
  const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
  const nowUtc = new Date();
  const nowBangkok = new Date(nowUtc.getTime() + BANGKOK_OFFSET_MS);

  const year = nowBangkok.getUTCFullYear();
  const month = nowBangkok.getUTCMonth();

  const startUtcMs = Date.UTC(year, month, 1, 0, 0, 0, 0) - BANGKOK_OFFSET_MS;
  const endUtcMs = Date.UTC(year, month + 1, 1, 0, 0, 0, 0) - BANGKOK_OFFSET_MS;

  return {
    startUtc: new Date(startUtcMs),
    endUtc: new Date(endUtcMs),
  };
}

export async function GET() {
  try {
    const db = getDbPool();
    const { startUtc, endUtc } = getCurrentMonthRangeBangkok();
    const [rows] = await db.query<LeaderboardRow[]>(
      `
        SELECT
          a.id,
          a.username,
          a.email,
          COALESCE(SUM(o.total_amount), 0) AS monthly_total
        FROM account a
        LEFT JOIN mlbb_topup_order o
          ON o.account_id = a.id
          AND LOWER(COALESCE(o.status, 'completed')) IN ('success', 'completed', 'paid', 'done')
          AND o.created_at >= ?
          AND o.created_at < ?
        WHERE LOWER(COALESCE(a.role, 'user')) <> 'admin'
        GROUP BY a.id, a.username, a.email
        HAVING monthly_total > 0
        ORDER BY monthly_total DESC, a.id ASC
        LIMIT 200
      `,
      [startUtc, endUtc],
    );

    const entries = rows.map((row, index) => ({
      id: Number(row.id),
      rank: index + 1,
      nickname: row.username,
      username: row.username,
      emailMasked: maskEmail(row.email),
      totalTopUp: Number(row.monthly_total ?? 0),
    }));

    return NextResponse.json(
      {
        status: "success",
        entries,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[api/leaderboard][GET] unexpected error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Gagal memuat data leaderboard.",
      },
      {
        status: 500,
      },
    );
  }
}
