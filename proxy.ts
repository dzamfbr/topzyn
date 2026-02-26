import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ACTIVE_ORDER_COOKIE_NAME } from "@/lib/order-lock";

type InvoiceStatusResponse = {
  status: "ok" | "error";
  invoice?: {
    payment_status_code?: "pending" | "paid";
    transaction_status_code?: "pending" | "done";
  };
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const normalizedPath = pathname.toLowerCase();
  const isHomeRoute = normalizedPath === "/" || normalizedPath === "/home";

  if (!isHomeRoute) {
    return NextResponse.next();
  }

  const activeOrderCode = request.cookies.get(ACTIVE_ORDER_COOKIE_NAME)?.value?.trim();
  if (!activeOrderCode) {
    return NextResponse.next();
  }

  try {
    const verifyUrl = request.nextUrl.clone();
    verifyUrl.pathname = `/api/mlbb/invoice/${encodeURIComponent(activeOrderCode)}`;
    verifyUrl.search = "";

    const verifyResponse = await fetch(verifyUrl.toString(), {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!verifyResponse.ok) {
      const releaseResponse = NextResponse.next();
      releaseResponse.cookies.set({
        name: ACTIVE_ORDER_COOKIE_NAME,
        value: "",
        path: "/",
        maxAge: 0,
      });
      return releaseResponse;
    }

    const payload = (await verifyResponse.json()) as InvoiceStatusResponse;
    const isDone =
      payload.invoice?.payment_status_code === "paid" ||
      payload.invoice?.transaction_status_code === "done";
    if (isDone) {
      const releaseResponse = NextResponse.next();
      releaseResponse.cookies.set({
        name: ACTIVE_ORDER_COOKIE_NAME,
        value: "",
        path: "/",
        maxAge: 0,
      });
      return releaseResponse;
    }
  } catch {
    // fallback: keep redirect lock when status check failed
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/invoice/${encodeURIComponent(activeOrderCode)}`;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/", "/home"],
};
