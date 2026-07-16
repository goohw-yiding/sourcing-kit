import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcLandedCost } from "@/lib/calc";
import { getAuthTenantId } from "@/lib/getAuth";
import { getTenantPlan, PLANS } from "@/lib/subscription";

export async function GET() {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;
  const products = await prisma.product.findMany({
    where: { tenantId },
    include: {
      supplier: { select: { name: true, marketArea: true } },
      sizes: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthTenantId();
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;

    // ── 무료 플랜 한도 체크 ──────────────────────────────
    const plan = await getTenantPlan(tenantId);
    const limit = PLANS[plan].productLimit;
    if (isFinite(limit)) {
      const count = await prisma.product.count({ where: { tenantId } });
      if (count >= limit) {
        return NextResponse.json(
          { error: `무료 플랜은 상품을 최대 ${limit}개까지 등록할 수 있습니다. Pro 플랜으로 업그레이드하세요.`, code: "PLAN_LIMIT" },
          { status: 403 }
        );
      }
    }
    // ─────────────────────────────────────────────────────

    const body = await req.json();

    // 숫자 파싱 (form이 string으로 전송할 수 있음)
    const n = (v: unknown, def = 0) => parseFloat(String(v ?? def)) || def;

    // supplierName이 있으면 동명 거래처 찾거나 새로 생성
    let supplierId: string | null = body.supplierId || null;
    if (!supplierId && body.supplierName?.trim()) {
      const name = body.supplierName.trim();
      const existing = await prisma.supplier.findFirst({
        where: { tenantId, name },
      });
      if (existing) {
        supplierId = existing.id;
      } else {
        const created = await prisma.supplier.create({
          data: { tenantId, name },
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

    // ── 색상: 단순 목록 (가격 무관) ──
    const colors: string[] = Array.isArray(body.colors)
      ? Array.from(
          new Set(
            (body.colors as unknown[])
              .map((c) => String(c ?? "").trim())
              .filter((c) => c.length > 0)
          )
        )
      : [];

    // ── 사이즈 옵션: 가격을 가르는 축 (비우면 상품 기본가 적용) ──
    const numOrNull = (v: unknown): number | null => {
      const s = String(v ?? "").trim();
      if (!s) return null;
      const f = parseFloat(s);
      return isNaN(f) ? null : f;
    };
    const intOrNull = (v: unknown): number | null => {
      const s = String(v ?? "").trim();
      if (!s) return null;
      const i = parseInt(s, 10);
      return isNaN(i) || i <= 0 ? null : i;
    };
    const sizeRows = (Array.isArray(body.sizes) ? (body.sizes as Record<string, unknown>[]) : [])
      .map((s, i) => ({
        name: String(s.name ?? "").trim(),
        widthCm: numOrNull(s.widthCm),
        depthCm: numOrNull(s.depthCm),
        heightCm: numOrNull(s.heightCm),
        costCny: numOrNull(s.costCny),
        moq: intOrNull(s.moq),
        sortOrder: i,
      }))
      .filter((s) => s.name.length > 0);

    const product = await prisma.product.create({
      data: {
        tenantId,
        nameKr: body.nameKr,
        nameCn: body.nameCn || null,
        imageUrl: body.imageUrl || null,
        memo: body.memo || null,
        colors,
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
        ...(sizeRows.length > 0 ? { sizes: { create: sizeRows } } : {}),
      },
      include: {
        supplier: { select: { name: true, marketArea: true } },
        sizes: { orderBy: { sortOrder: "asc" } },
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("[POST /api/products] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
