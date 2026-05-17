"use client";

import { useState } from "react";
import { ArrowLeft, Search, ExternalLink } from "lucide-react";
import Link from "next/link";

// 주요 카테고리 (한→중)
const CATEGORIES = [
  { kr: "의류", cn: "服装", icon: "👕" },
  { kr: "신발", cn: "鞋子", icon: "👟" },
  { kr: "가방", cn: "包包", icon: "👜" },
  { kr: "모자", cn: "帽子", icon: "🧢" },
  { kr: "잡화", cn: "百货", icon: "🛍️" },
  { kr: "악세서리", cn: "饰品", icon: "💍" },
  { kr: "생활용품", cn: "生活用品", icon: "🏠" },
  { kr: "화장품", cn: "化妆品", icon: "💄" },
  { kr: "전자제품", cn: "电子产品", icon: "📱" },
  { kr: "장난감", cn: "玩具", icon: "🧸" },
  { kr: "식품", cn: "食品", icon: "🍜" },
  { kr: "인테리어", cn: "家居装饰", icon: "🪴" },
];

// 검색 팁 (현지 소싱 표현)
const TIPS = [
  { label: "도매", cn: "批发" },
  { label: "공장직송", cn: "工厂直销" },
  { label: "샘플", cn: "样品" },
  { label: "OEM", cn: "OEM定制" },
];

export default function Page1688() {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const doSearch = (keyword: string) => {
    if (!keyword.trim()) return;
    const url = `https://s.1688.com/selloffer/offerlist.htm?keywords=${encodeURIComponent(keyword.trim())}`;
    // 최근 검색어 저장 (최대 5개)
    setRecentSearches(prev => {
      const next = [keyword.trim(), ...prev.filter(k => k !== keyword.trim())].slice(0, 5);
      return next;
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-24">
      {/* 헤더 */}
      <header className="bg-[#E8251F] px-4 pt-14 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="text-white/80 active:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            {/* 1688 로고 텍스트 */}
            <span className="text-white font-extrabold text-2xl tracking-tight">1688</span>
            <span className="text-white/60 text-sm">소싱 검색</span>
          </div>
          <a
            href="https://www.1688.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-white/70 text-xs active:text-white transition-colors"
          >
            메인 바로가기 <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 검색창 */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="중국어로 검색 (예: 运动服)"
              className="w-full rounded-2xl px-4 py-3 pr-10 text-sm bg-white text-gray-800 placeholder-gray-400 outline-none"
              autoComplete="off"
              lang="zh"
              inputMode="text"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-lg leading-none"
              >×</button>
            )}
          </div>
          <button
            type="submit"
            className="bg-white rounded-2xl px-4 py-3 flex items-center justify-center active:bg-gray-100 transition-colors"
          >
            <Search className="w-5 h-5 text-[#E8251F]" />
          </button>
        </form>

        {/* 검색 팁 칩 */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {TIPS.map(tip => (
            <button
              key={tip.cn}
              onClick={() => setQuery(prev => prev ? `${prev} ${tip.cn}` : tip.cn)}
              className="text-xs bg-white/20 text-white rounded-full px-3 py-1 active:bg-white/30 transition-colors"
            >
              +{tip.label} ({tip.cn})
            </button>
          ))}
        </div>
      </header>

      {/* 최근 검색어 */}
      {recentSearches.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">최근 검색</p>
          <div className="flex gap-2 flex-wrap">
            {recentSearches.map(kw => (
              <button
                key={kw}
                onClick={() => { setQuery(kw); doSearch(kw); }}
                className="text-sm bg-white rounded-xl px-3 py-1.5 text-gray-700 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 카테고리 */}
      <div className="px-4 pt-5">
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">카테고리로 검색</p>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.cn}
              onClick={() => { setQuery(cat.cn); doSearch(cat.cn); }}
              className="bg-white rounded-2xl py-3 px-1 flex flex-col items-center gap-1.5 shadow-sm border border-gray-100 active:scale-95 transition-transform"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-700">{cat.kr}</span>
              <span className="text-[10px] text-gray-400">{cat.cn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 유용한 1688 링크 */}
      <div className="px-4 pt-5">
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">1688 바로가기</p>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {[
            { label: "1688 메인", sub: "www.1688.com", href: "https://www.1688.com", icon: "🏠" },
            { label: "도매 추천", sub: "批发推荐", href: "https://www.1688.com/page/index.html", icon: "⭐" },
            { label: "핫 상품", sub: "热销商品", href: "https://s.1688.com/selloffer/offerlist.htm?keywords=热销", icon: "🔥" },
            { label: "신상품", sub: "新品上市", href: "https://s.1688.com/selloffer/offerlist.htm?keywords=新品", icon: "✨" },
          ].map((item, i, arr) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <span className="text-xl w-8 text-center">{item.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{item.label}</div>
                <div className="text-xs text-gray-400">{item.sub}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-300" />
            </a>
          ))}
        </div>
      </div>

      {/* 검색 가이드 */}
      <div className="px-4 pt-5 pb-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2">💡 검색 팁</p>
          <ul className="text-xs text-amber-600 space-y-1.5">
            <li>• 중국어로 검색할수록 결과가 정확해요</li>
            <li>• <span className="font-medium">+도매(批发)</span> 를 붙이면 도매업체만 나와요</li>
            <li>• <span className="font-medium">+공장(工厂)</span> 를 붙이면 공장 직거래 가능</li>
            <li>• 상품명 뒤에 <span className="font-medium">批发</span> 추가 = 도매가 조회</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
