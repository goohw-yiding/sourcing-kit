import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_TENANT_ID, ensureDefaultTenant } from "@/lib/db";
import { calcLandedCost } from "@/lib/calc";

export async function GET() {
  await ensureDefaultTenant();
  const products = await prisma.product.findMany({
    where: { tenantId: DEFAULT_TENANT_ID },
    include: { supplier: { select: { name: true, marketArea: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  try {
    await ensureDefaultTenant();
    const body = await req.json();

    // 숫자 파싱 (form이 string으로 전송할 수 있음)
    const n = (v: unknown, def = 0) => parseFloat(String(v ?? def)) || def;

    // supplierName이 있으면 동명 거래처 찾거나 새로 생성
    let supplierId: string | null = body.supplierId || null;
    if (!supplierId && body.supplierName?.trim()) {
      const name = body.supplierName.trim();
      const existing = await prisma.supplier.findFirst({
        where: { tenantId: DEFAULT_TENANT_ID, name },
      });
      if (existing) {
        supplierId = existing.id;
      } else {
        const created = await prisma.supplier.create({
          data: { tenantId: DEFAULT_TENANT_ID, name },
        });
        supplierId = created.id;
      }
    }

    const calc = calcLandedCost({
      costCny: n(body.costCny),
      exchangeRate: n(body.exchangeRate),
      packagingCost: n(body.packagingCost),
      chinaShipping: n(body.chinaShipping),
      agentFeeRate: n(body.agentFeeRate),
      cbm: n(body.cbm),
      cbmRate: n(body.cbmRate, 90000),
      hasCoOrigin: !!body.hasCoOrigin,
      coOriginCost: n(body.coOriginCost),
      customsRate: n(body.customsRate, 0.08),
      inlandShipping: n(body.inlandShipping),
    });

    const product = await prisma.product.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        nameKr: body.nameKr,
        nameCn: body.nameCn || null,
        imageUrl: body.imageUrl || null,
        memo: body.memo || null,
        supplierId,
        costCny: n(body.costCny),
        exchangeRate: n(body.exchangeRate),
        packagingCost: n(body.packagingCost),
        chinaShipping: n(body.chinaShipping),
        agentFeeRate: n(body.agentFeeRate),
        cbm: n(body.cbm),
        cbmRate: n(body.cbmRate, 90000),
        hasCoOrigin: !!body.hasCoOrigin,
        coOriginCost: n(body.coOriginCost),
        customsRate: n(body.customsRate, 0.08),
        hsCode: body.hsCode || null,
        hsDescription: body.hsDescription || null,
        moq: body.moq ? parseInt(String(body.moq)) : null,
        inlandShipping: n(body.inlandShipping),
        costKrw: calc.costKrw,
        agentFee: calc.agentFee,
        cbmShipping: calc.cbmShipping,
        customsDuty: calc.customsDuty,
        vat: calc.vat,
        landedCost: calc.landedCost,
        status: body.status ?? "sourcing",
      },
      include: { supplier: { select: { name: true, marketArea: true } } },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("[POST /api/products] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
