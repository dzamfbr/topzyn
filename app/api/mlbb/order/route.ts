import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, parseAuthSessionToken } from "@/lib/auth-session";
import {
  ACTIVE_ORDER_COOKIE_MAX_AGE_SECONDS,
  ACTIVE_ORDER_COOKIE_NAME,
} from "@/lib/order-lock";
import {
  generateMlbbOrderNumber,
  hasPendingMlbbOrder,
  savePendingMlbbOrder,
  type PendingMlbbOrder,
} from "@/lib/pending-order-store";
import { getDbPool } from "@/lib/tidb";

export const runtime = "nodejs";

type MlbbOrderBody = {
  game_user_id?: string;
  game_server?: string;
  game_nickname?: string;
  item_id?: number | string;
  payment_method_id?: number | string;
  promo_code?: string;
  contact_whatsapp?: string;
};

type ItemRow = RowDataPacket & {
  id: number;
  code: string;
  name: string;
  final_price: number | string;
};

type PaymentMethodRow = RowDataPacket & {
  id: number;
  code: string;
  name: string;
};

type PromoCodeRow = RowDataPacket & {
  code: string;
  discount_type: "amount" | "percent";
  discount_value: number | string;
  min_subtotal: number | string;
  max_discount: number | string | null;
  starts_at: string | null;
  ends_at: string | null;
};

type AccountExistsRow = RowDataPacket & {
  id: number;
};

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parsePositiveInt(value: number | string | undefined): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function isWithinSchedule(
  startsAt: string | null,
  endsAt: string | null,
  now: Date,
): boolean {
  if (startsAt) {
    const startTime = new Date(startsAt).getTime();
    if (Number.isFinite(startTime) && now.getTime() < startTime) {
      return false;
    }
  }

  if (endsAt) {
    const endTime = new Date(endsAt).getTime();
    if (Number.isFinite(endTime) && now.getTime() > endTime) {
      return false;
    }
  }

  return true;
}

function calculateDiscount(promo: PromoCodeRow, subtotal: number): number {
  const discountValue = Math.max(0, toNumber(promo.discount_value));
  if (promo.discount_type === "amount") {
    return Math.min(discountValue, subtotal);
  }

  const percentAmount = Math.floor((subtotal * discountValue) / 100);
  const maxDiscount = toNumber(promo.max_discount);
  if (maxDiscount > 0) {
    return Math.min(percentAmount, maxDiscount, subtotal);
  }
  return Math.min(percentAmount, subtotal);
}

function normalizeWhatsapp(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

function isValidWhatsapp(value: string): boolean {
  return /^(\+62|62|0)[0-9]{8,15}$/.test(value);
}

async function getOptionalAccountId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const sessionUser = parseAuthSessionToken(token);
  if (!sessionUser) {
    return null;
  }

  const db = getDbPool();
  const [rows] = await db.query<AccountExistsRow[]>(
    "SELECT id FROM account WHERE id = ? LIMIT 1",
    [sessionUser.id],
  );

  if (rows.length === 0) {
    return null;
  }

  return Number(rows[0].id);
}

async function generateUniqueOrderNumber(
  itemName: string,
  itemCode: string,
): Promise<string> {
  const db = getDbPool();

  for (let i = 0; i < 200; i += 1) {
    const candidate = generateMlbbOrderNumber(itemName, itemCode);
    if (hasPendingMlbbOrder(candidate)) {
      continue;
    }

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT 1 FROM mlbb_topup_order WHERE order_number = ? LIMIT 1",
      [candidate],
    );

    if (rows.length === 0) {
      return candidate;
    }
  }

  throw new Error("Gagal membuat kode order unik. Silakan coba lagi.");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MlbbOrderBody;

    const gameUserId = (body.game_user_id ?? "").trim();
    const gameServer = (body.game_server ?? "").trim();
    const gameNickname = (body.game_nickname ?? "").trim() || null;
    const itemId = parsePositiveInt(body.item_id);
    const paymentMethodId = parsePositiveInt(body.payment_method_id);
    const promoCodeInput = normalizeCode(body.promo_code ?? "");
    const contactWhatsapp = normalizeWhatsapp(body.contact_whatsapp ?? "");

    if (!gameUserId || !gameServer) {
      return NextResponse.json(
        {
          status: "error",
          message: "User ID dan Server wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!itemId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Item top up belum dipilih.",
        },
        { status: 400 },
      );
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Metode pembayaran belum dipilih.",
        },
        { status: 400 },
      );
    }

    if (!contactWhatsapp || !isValidWhatsapp(contactWhatsapp)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Nomor WhatsApp tidak valid.",
        },
        { status: 400 },
      );
    }

    const db = getDbPool();
    const accountId = await getOptionalAccountId(request);

    const [itemRows] = await db.query<ItemRow[]>(
      `
        SELECT id, code, name, final_price
        FROM mlbb_topup_item
        WHERE id = ? AND is_active = 1
        LIMIT 1
      `,
      [itemId],
    );
    if (itemRows.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Item top up tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    const [paymentRows] = await db.query<PaymentMethodRow[]>(
      `
        SELECT id, code, name
        FROM payment_method
        WHERE id = ? AND is_active = 1
        LIMIT 1
      `,
      [paymentMethodId],
    );
    if (paymentRows.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Metode pembayaran tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    const selectedItem = itemRows[0];
    const selectedPayment = paymentRows[0];
    const subtotal = Math.max(0, toNumber(selectedItem.final_price));
    let promoCode: string | null = null;
    let promoDiscount = 0;

    if (promoCodeInput) {
      const [promoRows] = await db.query<PromoCodeRow[]>(
        `
          SELECT code, discount_type, discount_value, min_subtotal, max_discount, starts_at, ends_at
          FROM promo_code
          WHERE code = ? AND is_active = 1
          LIMIT 1
        `,
        [promoCodeInput],
      );

      if (promoRows.length === 0) {
        return NextResponse.json(
          {
            status: "error",
            message: "Kode promo tidak ditemukan atau tidak aktif.",
          },
          { status: 400 },
        );
      }

      const promo = promoRows[0];
      if (!isWithinSchedule(promo.starts_at, promo.ends_at, new Date())) {
        return NextResponse.json(
          {
            status: "error",
            message: "Kode promo belum aktif atau sudah kedaluwarsa.",
          },
          { status: 400 },
        );
      }

      const minSubtotal = Math.max(0, toNumber(promo.min_subtotal));
      if (subtotal < minSubtotal) {
        return NextResponse.json(
          {
            status: "error",
            message: `Minimal transaksi promo ini adalah Rp ${minSubtotal.toLocaleString("id-ID")}.`,
          },
          { status: 400 },
        );
      }

      promoCode = promo.code;
      promoDiscount = calculateDiscount(promo, subtotal);
    }

    const totalAmount = Math.max(0, subtotal - promoDiscount);
    const orderNumber = await generateUniqueOrderNumber(
      selectedItem.name,
      selectedItem.code,
    );

    const pendingOrder: PendingMlbbOrder = {
      order_number: orderNumber,
      account_id: accountId,
      game_user_id: gameUserId,
      game_server: gameServer,
      game_nickname: gameNickname,
      item_id: Number(selectedItem.id),
      item_code: selectedItem.code,
      item_name: selectedItem.name,
      payment_method_id: Number(selectedPayment.id),
      payment_method_code: selectedPayment.code,
      payment_method_name: selectedPayment.name,
      promo_code: promoCode,
      promo_discount: promoDiscount,
      subtotal_amount: subtotal,
      total_amount: totalAmount,
      contact_whatsapp: contactWhatsapp,
      status: "pending_payment",
      qris_image_data_url: null,
      minimarket_payment_code: null,
      payment_confirmed_by_user: false,
      payment_confirmed_at: null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
    savePendingMlbbOrder(pendingOrder);

    const response = NextResponse.json({
      status: "ok",
      message: "Order berhasil dibuat. Lanjutkan pembayaran lewat halaman invoice.",
      order_number: orderNumber,
      invoice_url: `/invoice/${encodeURIComponent(orderNumber)}`,
    });
    response.cookies.set({
      name: ACTIVE_ORDER_COOKIE_NAME,
      value: orderNumber,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ACTIVE_ORDER_COOKIE_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("[api/mlbb/order] unexpected error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Order gagal diproses. Coba lagi.",
      },
      { status: 500 },
    );
  }
}
