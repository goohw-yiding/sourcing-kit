import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthTenantId } from "@/lib/getAuth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;
  const { id } = await params;
  const body = await req.json();
  const buyer = await prisma.buyer.update({
    where: { id, tenantId },
    data: {
      name: body.name,
      contact: body.contact || null,
      phone: body.phone || null,
      kakaoId: body.kakaoId || null,
      email: body.email || null,
      category: body.category || null,
      memo: body.memo || null,
    },
  });
  return NextResponse.json(buyer);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;
  const { id } = await params;
  await prisma.buyer.delete({ where: { id, tenantId } });
  return NextResponse.json({ ok: true });
}
