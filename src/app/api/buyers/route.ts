import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_TENANT_ID, ensureDefaultTenant } from "@/lib/db";

export async function GET() {
  await ensureDefaultTenant();
  const buyers = await prisma.buyer.findMany({
    where: { tenantId: DEFAULT_TENANT_ID },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(buyers);
}

export async function POST(req: NextRequest) {
  await ensureDefaultTenant();
  const body = await req.json();
  const buyer = await prisma.buyer.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      name: body.name,
      contact: body.contact || null,
      phone: body.phone || null,
      kakaoId: body.kakaoId || null,
      email: body.email || null,
      category: body.category || null,
      memo: body.memo || null,
    },
  });
  return NextResponse.json(buyer, { status: 201 });
}
