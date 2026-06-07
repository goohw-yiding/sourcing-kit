import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "goohw593@gmail.com").split(",").map(e => e.trim());

function isAdmin(email?: string | null) {
  return email && ADMIN_EMAILS.includes(email);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tenants = await prisma.tenant.findMany({
    include: {
      users: { select: { id: true, name: true, email: true, createdAt: true } },
      products: {
        select: { id: true, nameKr: true, nameCn: true, status: true, createdAt: true, costCny: true },
        orderBy: { createdAt: "desc" },
      },
      subscription: { select: { plan: true, status: true, expiresAt: true } },
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // AiUsageLog 집계 (tenantId별 총 사용 횟수)
  const aiLogs = await prisma.aiUsageLog.groupBy({
    by: ["tenantId"],
    _sum: { count: true },
  });
  const aiMap = Object.fromEntries(aiLogs.map(l => [l.tenantId, l._sum.count ?? 0]));

  const result = tenants.map(t => ({
    tenantId: t.id,
    tenantName: t.name,
    createdAt: t.createdAt,
    plan: t.subscription?.plan ?? "free",
    planStatus: t.subscription?.status ?? "active",
    planExpiresAt: t.subscription?.expiresAt ?? null,
    users: t.users,
    productCount: t._count.products,
    products: t.products,
    aiUsageTotal: aiMap[t.id] ?? 0,
  }));

  return NextResponse.json(result);
}
