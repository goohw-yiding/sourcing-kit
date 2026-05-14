import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_TENANT_ID, ensureDefaultTenant } from "@/lib/db";

export async function GET() {
  await ensureDefaultTenant();
  const suppliers = await prisma.supplier.findMany({
    where: { tenantId: DEFAULT_TENANT_ID },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  await ensureDefaultTenant();
  const body = await req.json();
  const supplier = await prisma.supplier.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      name: body.name,
      contact: body.contact || null,
      phone: body.phone || null,
      wechatId: body.wechatId || null,
      marketArea: body.marketArea || null,
      address: body.address || null,
      category: body.category || null,
      url1688: body.url1688 || null,
      memo: body.memo || null,
    },
  });
  return NextResponse.json(supplier, { status: 201 });
}
