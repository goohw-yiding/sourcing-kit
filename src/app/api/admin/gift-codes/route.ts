import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "goohw593@gmail.com").split(",").map(e => e.trim());

function isAdmin(email?: string | null) {
  return email && ADMIN_EMAILS.includes(email);
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 문자 제외
  const parts = [4, 4].map(() =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );
  return `GIFT-${parts.join("-")}`;
}

// GET: 코드 목록 조회
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const codes = await prisma.giftCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(codes);
}

// POST: 코드 생성
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json() as {
    plan?: string;
    maxUses?: number;
    memo?: string;
    expiresAt?: string | null;
  };

  const code = await prisma.giftCode.create({
    data: {
      code:      generateCode(),
      plan:      body.plan     ?? "pro",
      maxUses:   body.maxUses  ?? 1,
      memo:      body.memo     ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      createdBy: session!.user!.email!,
    },
  });

  return NextResponse.json(code, { status: 201 });
}

// DELETE: 코드 삭제
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await req.json() as { id: string };
  await prisma.giftCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
