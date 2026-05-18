import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthTenantId } from "@/lib/getAuth";

export async function GET() {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;
  const suppliers = await prisma.supplier.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;
  const body = await req.json();
  const supplier = await prisma.supplier.create({
    data: {
      tenantId,
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
