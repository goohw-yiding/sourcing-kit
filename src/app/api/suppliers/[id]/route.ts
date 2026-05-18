import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthTenantId } from "@/lib/getAuth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;
  const { id } = await params;
  const body = await req.json();
  const supplier = await prisma.supplier.update({
    where: { id, tenantId },
    data: {
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
  return NextResponse.json(supplier);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;
  const { id } = await params;
  await prisma.supplier.delete({ where: { id, tenantId } });
  return NextResponse.json({ ok: true });
}
