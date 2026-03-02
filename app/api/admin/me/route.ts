import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const adminCheck = await requireAdminRequest(request);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  return NextResponse.json(
    {
      status: "success",
      user: adminCheck.user,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
