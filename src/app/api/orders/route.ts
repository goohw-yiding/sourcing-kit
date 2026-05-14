import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_TENANT_ID, ensureDefaultTenant } from "@/lib/db";

export async function GET() {
  await ensureDefaultTenant();
  const orders = await prisma.order.findMany({
    where: { tenantId: DEFAULT_TENANT_ID },
    include: { buyer: { select: { name: true } } },
    orderBy: { orderedAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  await ensureDefaultTenant();
  const body = await req.json();
  const order = await prisma.order.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      buyerId: body.buyerId || null,
      orderNo: body.orderNo || null,
      status: body.status ?? "ordered",
      totalCny: body.totalCny || null,
      totalKrw: body.totalKrw || null,
      memo: body.memo || null,
    },
    include: { buyer: { select: { name: true } } },
  });
  return NextResponse.json(order, { status: 201 });
}
