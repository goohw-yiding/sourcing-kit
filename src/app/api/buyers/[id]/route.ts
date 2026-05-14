import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_TENANT_ID } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const buyer = await prisma.buyer.update({
    where: { id, tenantId: DEFAULT_TENANT_ID },
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
  const { id } = await params;
  await prisma.buyer.delete({ where: { id, tenantId: DEFAULT_TENANT_ID } });
  return NextResponse.json({ ok: true });
}
