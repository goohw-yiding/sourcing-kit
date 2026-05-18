import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthTenantId } from "@/lib/getAuth";

export async function GET() {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;
  const buyers = await prisma.buyer.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(buyers);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthTenantId();
  if (auth instanceof NextResponse) return auth;
  const { tenantId } = auth;
  const body = await req.json();
  const buyer = await prisma.buyer.create({
    data: {
      tenantId,
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
