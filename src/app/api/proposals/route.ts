import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_TENANT_ID, ensureDefaultTenant } from "@/lib/db";

export async function GET() {
  await ensureDefaultTenant();
  const proposals = await prisma.proposal.findMany({
    where: { tenantId: DEFAULT_TENANT_ID },
    include: { buyer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(proposals);
}

export async function POST(req: NextRequest) {
  await ensureDefaultTenant();
  const { buyerId, title, items } = await req.json();

  const proposal = await prisma.proposal.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
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
