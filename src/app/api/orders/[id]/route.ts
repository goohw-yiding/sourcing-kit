import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_TENANT_ID } from "@/lib/db";

// PUT /api/orders/[id]  — 발주 상태/날짜 업데이트
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const n = (v: unknown) => {
      const val = parseFloat(String(v ?? ""));
      return isNaN(val) ? null : val;
    };

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.quantity !== undefined) data.quantity = body.quantity ? parseInt(String(body.quantity)) : null;
    if (body.unitPriceCny !== undefined) data.unitPriceCny = n(body.unitPriceCny);
    if (body.totalCny !== undefined) data.totalCny = n(body.totalCny);
    if (body.totalKrw !== undefined) data.totalKrw = n(body.totalKrw);
    if (body.memo !== undefined) data.memo = body.memo || null;
    if (body.orderedAt !== undefined) data.orderedAt = body.orderedAt ? new Date(body.orderedAt) : new Date();
    if (body.shippedAt !== undefined) data.shippedAt = body.shippedAt ? new Date(body.shippedAt) : null;
    if (body.expectedArrival !== undefined) data.expectedArrival = body.expectedArrival ? new Date(body.expectedArrival) : null;

    const order = await prisma.order.update({
      where: { id, tenantId: DEFAULT_TENANT_ID },
      data,
      include: {
        product: { select: { nameKr: true, costCny: true, exchangeRate: true } },
      },
    });
    return NextResponse.json(order);
  } catch (err) {
    console.error("[PUT /api/orders/:id] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/orders/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.order.delete({ where: { id, tenantId: DEFAULT_TENANT_ID } });
  return NextResponse.json({ ok: true });
}
