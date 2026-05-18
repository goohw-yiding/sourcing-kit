import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";

export async function getAuthTenantId(): Promise<{ tenantId: string } | NextResponse> {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as { tenantId?: string } | undefined)?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  return { tenantId };
}
