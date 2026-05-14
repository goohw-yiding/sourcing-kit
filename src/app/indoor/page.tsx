"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Map, ChevronRight, X, ImageIcon } from "lucide-react";
import { YIWU_DISTRICTS, searchProducts, type SearchResult, type FloorData } from "@/lib/yiwuMap";

export default function IndoorMapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDistrict, setActiveDistrict] = useState(1);
  const [activeFloor, setActiveFloor] = useState(1);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalFloor, setModalFloor] = useState<FloorData | null>(null);

  const searchResults = useMemo(() => searchProducts(searchQuery), [searchQuery]);

  const currentDistrict = YIWU_DISTRICTS.find(d => d.district === activeDistrict)!;
  const currentFloor = currentDistrict.floors.find(f => f.floor === activeFloor) || currentDistrict.floors[0];

  const handleDistrictChange = (d: number) => {
    setActiveDistrict(d);
    setActiveFloor(1);
  };

  const openFloorImage = (floor: FloorData) => {
    setModalFloor(floor);
    setShowImageModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-8">
      {/* 헤더 */}
      <header className="bg-[var(--primary)] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/phrases" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">이우 시장 상품지도</h1>
            <p className="text-xs text-white/60">义乌国际商贸城 구별 상품 안내</p>
          </div>
        </div>

        {/* 검색창 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="상품명 검색 (예: 주방용품, 양말, 玩具)"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </header>

      {/* 검색 결과 */}
      {searchQuery && (
        <div className="px-4 py-3">
          {searchResults.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-sm">
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium mb-2">검색 결과 {searchResults.length}건</p>
              {searchResults.map((r: SearchResult, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSearchQuery("");
                    handleDistrictChange(r.district);
                    setActiveFloor(r.floor);
                  }}
                  className="w-full bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm active:bg-gray-50"
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">
                      {r.product.kr}
                      <span className="text-gray-400 font-normal ml-1">({r.product.cn})</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.districtName} · {r.floorLabel} · {r.section}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 구 선택 탭 */}
      {!searchQuery && (
        <>
          <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {YIWU_DISTRICTS.map(d => (
              <button
                key={d.district}
                onClick={() => handleDistrictChange(d.district)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeDistrict === d.district
                    ? "bg-[var(--primary)] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* 구 정보 카드 */}
          <div className="px-4 pt-3 pb-1">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">{currentDistrict.name} ({currentDistrict.nameCn})</p>
                <p className="text-xs text-gray-400 mt-0.5">{currentDistrict.address}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-[var(--primary)]">
                <Map className="w-3.5 h-3.5" />
                <span>{currentDistrict.floors.length}개 층</span>
              </div>
            </div>
          </div>

          {/* 층 선택 */}
          <div className="px-4 py-2 flex gap-2">
            {currentDistrict.floors.map(f => (
              <button
                key={f.floor}
                onClick={() => setActiveFloor(f.floor)}
                className={`flex-shrink-0 px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${
                  activeFloor === f.floor
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {f.floorLabel}
              </button>
            ))}
          </div>

          {/* 평면도 버튼 */}
          <div className="px-4 pb-2">
            <button
              onClick={() => openFloorImage(currentFloor)}
              className="w-full bg-white border border-dashed border-gray-300 rounded-xl py-3 flex items-center justify-center gap-2 text-sm text-gray-500 active:bg-gray-50"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{currentDistrict.name} {currentFloor.floorLabel} 평면도 보기</span>
              {!currentFloor.imageAvailable && (
                <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">준비중</span>
              )}
            </button>
          </div>

          {/* 구역별 상품 목록 */}
          <div className="px-4 space-y-3 pb-8">
            {currentFloor.sections.map(section => (
              <div key={section.section} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary-lighter)] px-2 py-0.5 rounded-full">
                    {section.section}
                  </span>
                  <span className="text-xs text-gray-500">{section.products.length}개 품목</span>
                </div>
                <div className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {section.products.map((p, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {p.kr}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">{p.cn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 평면도 모달 */}
      {showImageModal && modalFloor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-800 text-sm">
                {currentDistrict.name} {modalFloor.floorLabel} 평면도
              </p>
              <button onClick={() => setShowImageModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4">
              {modalFloor.imageAvailable ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/maps/d${currentDistrict.district}/f${modalFloor.floor}.jpg`}
                  alt={`${currentDistrict.name} ${modalFloor.floorLabel} 평면도`}
                  className="w-full rounded-xl object-contain"
                />
              ) : (
                <div className="bg-gray-50 rounded-xl aspect-[4/3] flex flex-col items-center justify-center gap-3">
                  <ImageIcon className="w-12 h-12 text-gray-200" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">평면도 준비중</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {currentDistrict.name} {modalFloor.floorLabel} 이미지를<br />
                      /public/maps/d{currentDistrict.district}/f{modalFloor.floor}.jpg<br />
                      경로에 추가하면 자동으로 표시됩니다
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-400 text-center">
                이 층의 주요 구역: {modalFloor.sections.map(s => s.section).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
