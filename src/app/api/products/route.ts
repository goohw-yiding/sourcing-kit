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
  await ensureDefaultTenant();
  const body = await req.json();

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
    costCny: body.costCny,
    exchangeRate: body.exchangeRate,
    packagingCost: body.packagingCost ?? 0,
    chinaShipping: body.chinaShipping ?? 0,
    agentFeeRate: body.agentFeeRate ?? 0,
    cbm: body.cbm ?? 0,
    cbmRate: body.cbmRate ?? 90000,
    hasCoOrigin: body.hasCoOrigin ?? false,
    coOriginCost: body.coOriginCost ?? 0,
    customsRate: body.customsRate ?? 0.08,
    inlandShipping: body.inlandShipping ?? 0,
  });

  const product = await prisma.product.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      nameKr: body.nameKr,
      nameCn: body.nameCn || null,
      imageUrl: body.imageUrl || null,
      memo: body.memo || null,
      supplierId,
      costCny: body.costCny,
      exchangeRate: body.exchangeRate,
      packagingCost: body.packagingCost ?? 0,
      chinaShipping: body.chinaShipping ?? 0,
      agentFeeRate: body.agentFeeRate ?? 0,
      cbm: body.cbm ?? 0,
      cbmRate: body.cbmRate ?? 90000,
      hasCoOrigin: body.hasCoOrigin ?? false,
      coOriginCost: body.coOriginCost ?? 0,
      customsRate: body.customsRate ?? 0.08,
      hsCode: body.hsCode || null,
      hsDescription: body.hsDescription || null,
      moq: body.moq ?? null,
      inlandShipping: body.inlandShipping ?? 0,
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
}
