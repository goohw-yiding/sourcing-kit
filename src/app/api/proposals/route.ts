import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthTenantId } from "@/lib/getAuth";

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
