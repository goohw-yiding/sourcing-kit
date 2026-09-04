import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthTenantId } from "@/lib/getAuth";

// GET /api/orders?productId=xxx  — 발주 이력 조회
export async function GET(req: NextRequest) {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;
  const productId = req.nextUrl.searchParams.get("productId");
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      ...(productId ? { productId } : {}),
    },
    include: {
      product: { select: { nameKr: true, costCny: true, exchangeRate: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { orderedAt: "desc" },
  });
  return NextResponse.json(orders);
}

/** 발주 옵션(색상×사이즈) 항목 정규화 — 수량 0/음수는 버린다 */
type RawItem = { color?: string | null; sizeName?: string | null; quantity?: unknown; unitPriceCny?: unknown };

function normalizeItems(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it: RawItem, i) => {
      const qty = parseInt(String(it?.quantity ?? ""));
      const price = parseFloat(String(it?.unitPriceCny ?? ""));
      return {
        color: it?.color ? String(it.color) : null,
        sizeName: it?.sizeName ? String(it.sizeName) : null,
        quantity: isNaN(qty) ? 0 : qty,
        unitPriceCny: isNaN(price) ? null : price,
        sortOrder: i,
      };
    })
    .filter((it) => it.quantity > 0);
}

// POST /api/orders  — 발주 생성
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthTenantId();
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const body = await req.json();
    const n = (v: unknown) => {
      const val = parseFloat(String(v ?? ""));
      return isNaN(val) ? null : val;
    };

    const items = normalizeItems(body.items);
    // 옵션별 수량을 보냈으면 총수량·총액은 그 합계를 정답으로 삼는다
    const itemsQty = items.reduce((s, it) => s + it.quantity, 0);
    const baseUnit = n(body.unitPriceCny);
    const itemsCny = items.reduce(
      (s, it) => s + it.quantity * (it.unitPriceCny ?? baseUnit ?? 0),
      0
    );

    const quantity = items.length
      ? itemsQty
      : body.quantity
      ? parseInt(String(body.quantity))
      : null;
    const totalCny = items.length ? itemsCny : n(body.totalCny);
    const exRate = n(body.exchangeRate);
    const totalKrw =
      items.length && exRate ? Math.round(itemsCny * exRate) : n(body.totalKrw);

    const order = await prisma.order.create({
      data: {
        tenantId,
        productId: body.productId || null,
        buyerId: body.buyerId || null,
        status: body.status || "ordered",
        quantity,
        unitPriceCny: baseUnit,
        totalCny,
        totalKrw,
        memo: body.memo || null,
        orderedAt: body.orderedAt ? new Date(body.orderedAt) : new Date(),
        expectedArrival: body.expectedArrival ? new Date(body.expectedArrival) : null,
        shippedAt: body.shippedAt ? new Date(body.shippedAt) : null,
        ...(items.length ? { items: { create: items } } : {}),
      },
      include: {
        product: { select: { nameKr: true, costCny: true, exchangeRate: true } },
        items: { orderBy: { sortOrder: "asc" } },
      },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
