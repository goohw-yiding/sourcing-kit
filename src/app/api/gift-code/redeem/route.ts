import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const tenantId = (session.user as { tenantId?: string }).tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId 없음" }, { status: 400 });
  }

  const { code } = await req.json() as { code: string };
  const trimmedCode = (code ?? "").trim().toUpperCase();

  if (!trimmedCode) {
    return NextResponse.json({ error: "코드를 입력해주세요" }, { status: 400 });
  }

  // 코드 조회
  const giftCode = await prisma.giftCode.findUnique({
    where: { code: trimmedCode },
  });

  if (!giftCode) {
    return NextResponse.json({ error: "유효하지 않은 코드입니다" }, { status: 404 });
  }

  // 만료 확인
  if (giftCode.expiresAt && giftCode.expiresAt < new Date()) {
    return NextResponse.json({ error: "만료된 코드입니다" }, { status: 400 });
  }

  // 사용 횟수 확인
  if (giftCode.usedCount >= giftCode.maxUses) {
    return NextResponse.json({ error: "이미 모두 사용된 코드입니다" }, { status: 400 });
  }

  // 이미 사용 여부 확인
  if (giftCode.usedByTenants.includes(tenantId)) {
    return NextResponse.json({ error: "이미 사용한 코드입니다" }, { status: 400 });
  }

  // 플랜 활성화
  await prisma.$transaction([
    // 구독 업서트
    prisma.subscription.upsert({
      where:  { tenantId },
      create: {
        tenantId,
        plan:        giftCode.plan,
        billingType: "free",
        status:      "active",
        expiresAt:   null, // 무기한
      },
      update: {
        plan:        giftCode.plan,
        billingType: "free",
        status:      "active",
        expiresAt:   null,
        cancelledAt: null,
      },
    }),
    // 코드 사용 횟수 증가 & 사용한 tenantId 기록
    prisma.giftCode.update({
      where: { id: giftCode.id },
      data: {
        usedCount:      { increment: 1 },
        usedByTenants:  { push: tenantId },
      },
    }),
  ]);

  return NextResponse.json({
    ok:   true,
    plan: giftCode.plan,
    message: giftCode.plan === "pro"
      ? "Pro 플랜이 활성화되었습니다! 🎉"
      : "맛보기 플랜이 활성화되었습니다!",
  });
}
