import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_TENANT_ID, ensureDefaultTenant } from "@/lib/db";

// GET /api/orders?productId=xxx  — 발주 이력 조회
export async function GET(req: NextRequest) {
  await ensureDefaultTenant();
  const productId = req.nextUrl.searchParams.get("productId");
  const orders = await prisma.order.findMany({
    where: {
      tenantId: DEFAULT_TENANT_ID,
      ...(productId ? { productId } : {}),
    },
    include: {
      product: { select: { nameKr: true, costCny: true, exchangeRate: true } },
    },
    orderBy: { orderedAt: "desc" },
  });
  return NextResponse.json(orders);
}

// POST /api/orders  — 발주 생성
export async function POST(req: NextRequest) {
  try {
    await ensureDefaultTenant();
    const body = await req.json();
    const n = (v: unknown) => {
      const val = parseFloat(String(v ?? ""));
      return isNaN(val) ? null : val;
    };

    const order = await prisma.order.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        productId: body.productId || null,
        buyerId: body.buyerId || null,
        status: body.status || "ordered",
        quantity: body.quantity ? parseInt(String(body.quantity)) : null,
        unitPriceCny: n(body.unitPriceCny),
        totalCny: n(body.totalCny),
        totalKrw: n(body.totalKrw),
        memo: body.memo || null,
        orderedAt: body.orderedAt ? new Date(body.orderedAt) : new Date(),
        expectedArrival: body.expectedArrival ? new Date(body.expectedArrival) : null,
        shippedAt: body.shippedAt ? new Date(body.shippedAt) : null,
      },
      include: {
        product: { select: { nameKr: true, costCny: true, exchangeRate: true } },
      },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
