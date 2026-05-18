import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "이름, 이메일, 비밀번호를 모두 입력해주세요" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "이미 사용 중인 이메일입니다" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 12);
    // Create tenant + user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: `${name}의 소싱킷` },
      });
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name,
          email,
          password: hashed,
          role: "owner",
        },
      });
      return { tenant, user };
    });
    return NextResponse.json({ ok: true, userId: result.user.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/auth/signup]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
