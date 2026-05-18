import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: 이메일 등록
export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "이메일을 입력해주세요" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "올바른 이메일 형식이 아닙니다" }, { status: 400 });
    }

    // 중복 처리: 이미 등록되어 있으면 count만 반환
    const existing = await prisma.waitlist.findUnique({
      where: { email: normalizedEmail },
    });

    const count = await prisma.waitlist.count();

    if (existing) {
      return NextResponse.json({ ok: true, already: true, count });
    }

    await prisma.waitlist.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
      },
    });

    const newCount = await prisma.waitlist.count();
    return NextResponse.json({ ok: true, already: false, count: newCount }, { status: 201 });
  } catch (err) {
    console.error("[waitlist POST]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

// GET: 현재 대기자 수
export async function GET() {
  try {
    const count = await prisma.waitlist.count();
    return NextResponse.json({ count });
  } catch (err) {
    console.error("[waitlist GET]", err);
    return NextResponse.json({ count: 0 });
  }
}
