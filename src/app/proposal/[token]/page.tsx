"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Product {
  nameKr: string;
  nameCn?: string | null;
  imageUrl?: string | null;
  supplier?: { name: string; marketArea?: string | null } | null;
}

interface ProposalItem {
  id: string;
  priceKrw: number;
  quantity: number;
  memo?: string | null;
  product: Product;
}

interface Proposal {
  title: string;
  createdAt: string;
  buyer: { name: string };
  items: ProposalItem[];
}

export default function ProposalSharePage() {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/proposal-share/${token}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setProposal)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">불러오는 중...</div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="text-4xl">😕</div>
        <div className="text-gray-600 font-medium">제안서를 찾을 수 없습니다</div>
        <div className="text-gray-400 text-sm">링크가 만료되었거나 잘못된 주소입니다</div>
      </div>
    );
  }

  const total = proposal.items.reduce((s, i) => s + i.priceKrw * i.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-5 pt-12 pb-6">
        <div className="text-xs text-green-300 mb-1">소싱킷 제안서</div>
        <h1 className="text-2xl font-bold">{proposal.title}</h1>
        <div className="text-green-200 text-sm mt-1">
          {proposal.buyer.name} 님께 · {new Date(proposal.createdAt).toLocaleDateString("ko-KR")}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* 요약 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-400">총 {proposal.items.length}개 품목</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">{total.toLocaleString()}원</div>
          </div>
          <div className="text-3xl">📦</div>
        </div>

        {/* 품목 목록 */}
        {proposal.items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            {item.product.imageUrl && (
              <img src={item.product.imageUrl} alt={item.product.nameKr} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <div className="font-bold text-gray-900 text-base">{item.product.nameKr}</div>
              {item.product.nameCn && (
                <div className="text-sm text-gray-400 mt-0.5">{item.product.nameCn}</div>
              )}
              {item.product.supplier && (
                <div className="text-xs text-gray-500 mt-1">
                  🏪 {item.product.supplier.name}
                  {item.product.supplier.marketArea && ` · ${item.product.supplier.marketArea}`}
                </div>
              )}
              {item.memo && (
                <div className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">{item.memo}</div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="text-sm text-gray-500">수량: {item.quantity}개</div>
                <div className="text-lg font-bold text-green-700">{item.priceKrw.toLocaleString()}원</div>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center text-xs text-gray-300 pt-4">Powered by 소싱킷</div>
      </div>
    </div>
  );
}
