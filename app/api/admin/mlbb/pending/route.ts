import { NextResponse } from "next/server";

import { isPendingOrderExpired, listPendingMlbbOrders } from "@/lib/pending-order-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const orders = listPendingMlbbOrders().map((order) => ({
      order_number: order.order_number,
      item_name: order.item_name,
      target: `${order.game_user_id} (${order.game_server})`,
      payment_method_name: order.payment_method_name,
      total_amount: Number(order.total_amount),
      contact_whatsapp: order.contact_whatsapp,
      created_at: order.created_at,
      expires_at: order.expires_at,
      status: order.status,
      qris_uploaded: Boolean(order.qris_image_data_url),
      qris_image_url: order.qris_image_data_url,
      payment_confirmed_by_user: order.payment_confirmed_by_user,
      payment_confirmed_at: order.payment_confirmed_at,
      is_expired: isPendingOrderExpired(order),
    }));

    return NextResponse.json(
      { status: "ok", orders },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/admin/mlbb/pending] unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal memuat pending order." },
      { status: 500 },
    );
  }
}
