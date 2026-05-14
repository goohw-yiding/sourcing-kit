import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_TENANT_ID } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const order = await prisma.order.update({
    where: { id, tenantId: DEFAULT_TENANT_ID },
    data: {
      buyerId: body.buyerId || null,
      orderNo: body.orderNo || null,
      status: body.status,
      totalCny: body.totalCny || null,
      totalKrw: body.totalKrw || null,
      memo: body.memo || null,
    },
    include: { buyer: { select: { name: true } } },
  });
  return NextResponse.json(order);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.order.delete({ where: { id, tenantId: DEFAULT_TENANT_ID } });
  return NextResponse.json({ ok: true });
}
