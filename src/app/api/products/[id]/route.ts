import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_TENANT_ID } from "@/lib/db";
import { calcLandedCost } from "@/lib/calc";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const n = (v: unknown, def = 0) => parseFloat(String(v ?? def)) || def;

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

    const product = await prisma.product.update({
      where: { id, tenantId: DEFAULT_TENANT_ID },
      data: {
        nameKr: body.nameKr,
        nameCn: body.nameCn || null,
        imageUrl: body.imageUrl || null,
        memo: body.memo || null,
        supplierId: body.supplierId || null,
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
        moq: body.moq ? parseInt(String(body.moq)) : null,
        inlandShipping: n(body.inlandShipping),
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
  } catch (err) {
    console.error("[PUT /api/products/:id] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.delete({ where: { id, tenantId: DEFAULT_TENANT_ID } });
  return NextResponse.json({ ok: true });
}
