"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { calcLandedCost, formatKrw } from "@/lib/calc";

interface Product {
  id: string;
  nameKr: string;
  nameCn?: string | null;
  imageUrl?: string | null;
  costCny: number;
  exchangeRate: number;
  agentFeeRate: number;
  cbm: number;
  cbmRate: number;
  hasCoOrigin: boolean;
  coOriginCost: number;
  customsRate: number;
  inlandShipping: number;
  packagingCost: number;
  chinaShipping: number;
  landedCost?: number | null;
  status: string;
  hsCode?: string | null;
  moq?: number | null;
  memo?: string | null;
  createdAt: string;
  supplier?: { name: string; marketArea?: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  sourcing: "시장조사", proposed: "제안완료", ordered: "발주완료",
  shipping: "선적중", shipped: "선적완료", arrived: "입고완료",
};

function CatalogContent() {
  const searchParams = useSearchParams();
  const type       = searchParams.get("type") || "internal"; // internal | buyer
  const dateFrom   = searchParams.get("from") || "";
  const dateTo     = searchParams.get("to") || "";
  const market     = searchParams.get("market") || "";
  const status     = searchParams.get("status") || "";
  const title      = searchParams.get("title") || (type === "buyer" ? "상품 제안서" : "소싱 카탈로그");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/products");
    let list: Product[] = await res.json();

    // 기간 필터
    if (dateFrom) list = list.filter(p => new Date(p.createdAt) >= new Date(dateFrom));
    if (dateTo)   list = list.filter(p => new Date(p.createdAt) <= new Date(dateTo + "T23:59:59"));
    // 시장 필터
    if (market)   list = list.filter(p => p.supplier?.marketArea === market);
    // 상태 필터
    if (status)   list = list.filter(p => p.status === status);

    setProducts(list);
    setLoading(false);
  }, [dateFrom, dateTo, market, status]);

  useEffect(() => { load(); }, [load]);

  const isBuyer = type === "buyer";
  const today = new Date().toLocaleDateString("ko-KR");

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-gray-400">
      불러오는 중...
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* 인쇄 버튼 — 화면에서만 보임 */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg text-sm flex items-center gap-2"
        >
          🖨️ PDF 저장 / 인쇄
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm"
        >
          닫기
        </button>
      </div>

      {/* 카탈로그 본문 */}
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* 헤더 */}
        <div className="border-b-2 border-gray-900 pb-4 mb-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900">{title}</h1>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                {dateFrom && dateTo && <span>📅 {dateFrom} ~ {dateTo}</span>}
                {dateFrom && !dateTo && <span>📅 {dateFrom} 이후</span>}
                {market && <span>🏪 {market}</span>}
                {status && <span>📌 {STATUS_LABELS[status] || status}</span>}
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div>총 {products.length}개 상품</div>
              <div>{today} 기준</div>
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-lg">
            조건에 맞는 상품이 없습니다
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {products.map((p, idx) => {
              const cr = calcLandedCost({
                costCny: p.costCny, exchangeRate: p.exchangeRate,
                packagingCost: p.packagingCost || 0, chinaShipping: p.chinaShipping || 0,
                agentFeeRate: p.agentFeeRate || 0, cbm: p.cbm || 0, cbmRate: p.cbmRate || 90000,
                hasCoOrigin: p.hasCoOrigin || false, coOriginCost: p.coOriginCost || 0,
                customsRate: p.customsRate || 0.08, inlandShipping: p.inlandShipping || 0,
              });
              const landed = p.landedCost ?? cr.landedCost;

              return (
                <div
                  key={p.id}
                  className="border border-gray-200 rounded-xl overflow-hidden break-inside-avoid"
                  style={{ pageBreakInside: "avoid" }}
                >
                  {/* 상품 이미지 */}
                  <div className="w-full h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.nameKr}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="text-5xl">📦</div>
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="p-4 space-y-2">
                    {/* 번호 + 이름 */}
                    <div className="flex items-start gap-2">
                      <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 shrink-0 font-mono">
                        #{String(idx + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm leading-snug">{p.nameKr}</h3>
                        {p.nameCn && <p className="text-xs text-gray-400 mt-0.5">{p.nameCn}</p>}
                      </div>
                    </div>

                    {/* 공급업체 */}
                    {p.supplier && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        🏪 {p.supplier.name}
                        {p.supplier.marketArea && <span className="text-gray-400">· {p.supplier.marketArea}</span>}
                      </div>
                    )}

                    <hr className="border-gray-100" />

                    {/* 가격 정보 */}
                    {isBuyer ? (
                      /* 바이어용: 판매가만 (원가 숨김) */
                      <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
                        <div className="text-xs text-blue-500 mb-0.5">공급가</div>
                        <div className="text-xl font-black text-blue-700">
                          {formatKrw(Math.ceil(landed * 1.3 / 100) * 100)}
                        </div>
                      </div>
                    ) : (
                      /* 내부용: 원가 전체 표시 */
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-gray-500">
                          <span>중국 단가</span>
                          <span>¥{p.costCny.toFixed(2)} × {p.exchangeRate}원</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 bg-orange-50 rounded px-2 py-1">
                          <span>매입 원가</span>
                          <span className="text-orange-600">{formatKrw(landed)}</span>
                        </div>
                        {p.moq && (
                          <div className="flex justify-between text-gray-400">
                            <span>MOQ</span>
                            <span>{p.moq.toLocaleString()}개</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-400">
                          <span>상태</span>
                          <span>{STATUS_LABELS[p.status] || p.status}</span>
                        </div>
                      </div>
                    )}

                    {/* 메모 */}
                    {p.memo && (
                      <div className="text-xs text-gray-400 bg-gray-50 rounded px-2 py-1.5 leading-relaxed">
                        {p.memo}
                      </div>
                    )}

                    {/* HS코드 (내부용만) */}
                    {!isBuyer && p.hsCode && (
                      <div className="text-xs text-gray-400">HS: {p.hsCode}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 하단 */}
        <div className="mt-12 pt-4 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
          <span>소싱킷 (SourcingKit)</span>
          <span>{today} 출력</span>
        </div>
      </div>

      {/* 인쇄용 CSS */}
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-400">불러오는 중...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
