import { NextResponse } from "next/server";

import { isPendingOrderExpired, listPendingMlbbOrders } from "@/lib/pending-order-store";

export const runtime = "nodejs";

function getPaymentKind(codeOrName: string): "qris" | "cash" | "minimarket" {
  const value = codeOrName.trim().toUpperCase();
  if (value.includes("MINIMARKET") || value.includes("ALFA") || value.includes("INDO")) {
    return "minimarket";
  }
  if (value.includes("COD") || value.includes("CASH")) {
    return "cash";
  }
  return "qris";
}

export async function GET() {
  try {
    const orders = listPendingMlbbOrders().map((order) => {
      const paymentKind = getPaymentKind(
        order.payment_method_code || order.payment_method_name,
      );
      const paymentAssetUploaded =
        paymentKind === "qris"
          ? Boolean(order.qris_image_data_url)
          : paymentKind === "minimarket"
            ? Boolean(order.minimarket_payment_code)
            : true;

      return {
        order_number: order.order_number,
        item_name: order.item_name,
        target: `${order.game_user_id} (${order.game_server})`,
        payment_method_code: order.payment_method_code,
        payment_method_name: order.payment_method_name,
        payment_kind: paymentKind,
        total_amount: Number(order.total_amount),
        contact_whatsapp: order.contact_whatsapp,
        created_at: order.created_at,
        expires_at: order.expires_at,
        status: order.status,
        qris_uploaded: Boolean(order.qris_image_data_url),
        qris_image_url: order.qris_image_data_url,
        minimarket_payment_code: order.minimarket_payment_code,
        payment_asset_uploaded: paymentAssetUploaded,
        payment_confirmed_by_user: order.payment_confirmed_by_user,
        payment_confirmed_at: order.payment_confirmed_at,
        is_expired: isPendingOrderExpired(order),
      };
    });

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
