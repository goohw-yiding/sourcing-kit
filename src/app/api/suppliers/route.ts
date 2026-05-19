import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthTenantId } from "@/lib/getAuth";
import { getTenantPlan, PLANS } from "@/lib/subscription";

export async function GET() {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;
  const suppliers = await prisma.supplier.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;

  // ── 무료 플랜 한도 체크 ──────────────────────────────
  const plan = await getTenantPlan(tenantId);
  const limit = PLANS[plan].supplierLimit;
  if (isFinite(limit)) {
    const count = await prisma.supplier.count({ where: { tenantId } });
    if (count >= limit) {
      return NextResponse.json(
        { error: `무료 플랜은 공급업체를 최대 ${limit}곳까지 등록할 수 있습니다. Pro 플랜으로 업그레이드하세요.`, code: "PLAN_LIMIT" },
        { status: 403 }
      );
    }
  }
  // ─────────────────────────────────────────────────────

  const body = await req.json();
  const supplier = await prisma.supplier.create({
    data: {
      tenantId,
      name: body.name,
      contact: body.contact || null,
      phone: body.phone || null,
      wechatId: body.wechatId || null,
      marketArea: body.marketArea || null,
      address: body.address || null,
      category: body.category || null,
      url1688: body.url1688 || null,
      memo: body.memo || null,
    },
  });
  return NextResponse.json(supplier, { status: 201 });
}
