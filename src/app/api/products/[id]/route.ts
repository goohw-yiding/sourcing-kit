import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_TENANT_ID } from "@/lib/db";
import { calcLandedCost } from "@/lib/calc";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const calc = calcLandedCost({
    costCny: body.costCny,
    exchangeRate: body.exchangeRate,
    packagingCost: body.packagingCost ?? 0,
    chinaShipping: body.chinaShipping ?? 0,
    agentFeeRate: body.agentFeeRate ?? 0.1,
    cbm: body.cbm ?? 0,
    cbmRate: body.cbmRate ?? 90000,
    hasCoOrigin: body.hasCoOrigin ?? false,
    coOriginCost: body.coOriginCost ?? 0,
    customsRate: body.customsRate ?? 0.08,
    inlandShipping: body.inlandShipping ?? 0,
  });

  const product = await prisma.product.update({
    where: { id, tenantId: DEFAULT_TENANT_ID },
    data: {
      nameKr: body.nameKr,
      nameCn: body.nameCn || null,
      imageUrl: body.imageUrl || null,
      memo: body.memo || null,
      supplierId: body.supplierId || null,
      costCny: body.costCny,
      exchangeRate: body.exchangeRate,
      packagingCost: body.packagingCost ?? 0,
      chinaShipping: body.chinaShipping ?? 0,
      agentFeeRate: body.agentFeeRate ?? 0.1,
      cbm: body.cbm ?? 0,
      cbmRate: body.cbmRate ?? 90000,
      hasCoOrigin: body.hasCoOrigin ?? false,
      coOriginCost: body.coOriginCost ?? 0,
      customsRate: body.customsRate ?? 0.08,
      hsCode: body.hsCode || null,
      moq: body.moq ?? null,
      inlandShipping: body.inlandShipping ?? 0,
      costKrw: calc.costKrw,
      agentFee: calc.agentFee,
      cbmShipping: calc.cbmShipping,
      customsDuty: calc.customsDuty,
      vat: calc.vat,
      landedCost: calc.landedCost,
      status: body.status,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.delete({ where: { id, tenantId: DEFAULT_TENANT_ID } });
  return NextResponse.json({ ok: true });
}
