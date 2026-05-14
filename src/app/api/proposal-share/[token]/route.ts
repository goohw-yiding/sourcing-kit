import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const proposal = await prisma.proposal.findUnique({
    where: { shareToken: token },
    include: {
      buyer: true,
      items: {
        include: { product: { include: { supplier: true } } },
      },
    },
  });
  if (!proposal) return NextResponse.json({ error: "not found" }, { status: 404 });

  // 최초 조회 시 viewedAt 기록
  if (!proposal.viewedAt) {
    await prisma.proposal.update({ where: { id: proposal.id }, data: { viewedAt: new Date() } });
  }

  return NextResponse.json(proposal);
}
