import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthTenantId } from "@/lib/getAuth";
import { getTenantPlan, PLANS } from "@/lib/subscription";

export async function GET() {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;
  const proposals = await prisma.proposal.findMany({
    where: { tenantId },
    include: { buyer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(proposals);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;

  // ── 무료 플랜 한도 체크 ──────────────────────────────
  const plan = await getTenantPlan(tenantId);
  const limit = PLANS[plan].proposalLimit;
  if (isFinite(limit)) {
    const count = await prisma.proposal.count({ where: { tenantId } });
    if (count >= limit) {
      return NextResponse.json(
        { error: `무료 플랜은 견적서를 최대 ${limit}건까지 생성할 수 있습니다. Pro 플랜으로 업그레이드하세요.`, code: "PLAN_LIMIT" },
        { status: 403 }
      );
    }
  }
  // ─────────────────────────────────────────────────────
  const { buyerId, title, items } = await req.json();

  const proposal = await prisma.proposal.create({
    data: {
      tenantId,
      buyerId,
      title,
      items: {
        create: items.map((item: { productId: string; priceKrw: number; quantity: number; memo?: string }) => ({
          productId: item.productId,
          priceKrw: item.priceKrw,
          quantity: item.quantity ?? 1,
          memo: item.memo ?? null,
        })),
      },
    },
    include: { buyer: true, items: { include: { product: true } } },
  });

  return NextResponse.json(proposal, { status: 201 });
}
