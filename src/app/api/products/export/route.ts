import { NextRequest, NextResponse } from "next/server";
import { prisma, DEFAULT_TENANT_ID, ensureDefaultTenant } from "@/lib/db";
import * as XLSX from "xlsx";

const STATUS_LABELS: Record<string, string> = {
  sourcing: "시장조사", proposed: "제안완료", ordered: "발주완료",
  shipping: "선적중", shipped: "선적완료", arrived: "입고완료",
};

export async function GET(req: NextRequest) {
  await ensureDefaultTenant();
  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get("from") || "";
  const dateTo   = searchParams.get("to") || "";
  const market   = searchParams.get("market") || "";
  const status   = searchParams.get("status") || "";

  const products = await prisma.product.findMany({
    where: {
      tenantId: DEFAULT_TENANT_ID,
      ...(dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {}),
      ...(dateTo   ? { createdAt: { lte: new Date(dateTo + "T23:59:59") } } : {}),
      ...(status   ? { status } : {}),
      ...(market   ? { supplier: { marketArea: market } } : {}),
    },
    include: { supplier: { select: { name: true, marketArea: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = products.map((p, i) => ({
    "번호": i + 1,
    "상품명(한국어)": p.nameKr,
    "상품명(중국어)": p.nameCn || "",
    "공급업체": p.supplier?.name || "",
    "시장": p.supplier?.marketArea || "",
    "중국 단가(CNY)": p.costCny,
    "환율": p.exchangeRate,
    "원화 단가(KRW)": Math.round(p.costCny * p.exchangeRate),
    "포장비(KRW)": p.packagingCost || 0,
    "중국내 운송비(KRW)": p.chinaShipping || 0,
    "관세율(%)": ((p.customsRate || 0.08) * 100).toFixed(1) + "%",
    "매입원가(KRW)": p.landedCost ? Math.round(p.landedCost) : "",
    "MOQ": p.moq || "",
    "HS코드": p.hsCode || "",
    "상태": STATUS_LABELS[p.status] || p.status,
    "메모": p.memo || "",
    "등록일": new Date(p.createdAt).toLocaleDateString("ko-KR"),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // 컬럼 너비 설정
  ws["!cols"] = [
    { wch: 5 },  // 번호
    { wch: 25 }, // 상품명(한국어)
    { wch: 20 }, // 상품명(중국어)
    { wch: 15 }, // 공급업체
    { wch: 15 }, // 시장
    { wch: 14 }, // 중국 단가
    { wch: 8 },  // 환율
    { wch: 14 }, // 원화 단가
    { wch: 12 }, // 포장비
    { wch: 16 }, // 운송비
    { wch: 10 }, // 관세율
    { wch: 14 }, // 매입원가
    { wch: 8 },  // MOQ
    { wch: 12 }, // HS코드
    { wch: 10 }, // 상태
    { wch: 30 }, // 메모
    { wch: 12 }, // 등록일
  ];

  XLSX.utils.book_append_sheet(wb, ws, "소싱 목록");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `소싱샷_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
