import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: { buyer: true, items: { include: { product: true } } },
  });
  if (!proposal) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(proposal);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.proposalItem.deleteMany({ where: { proposalId: id } });
  await prisma.proposal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
