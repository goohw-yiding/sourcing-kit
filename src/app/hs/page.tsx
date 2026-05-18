"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search, Info, ShieldCheck, ShieldX, ShieldAlert, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChinesePhrase } from "@/components/ChinesePhrase";

interface RegulationInfo {
  kcRequired: "필수" | "불필요" | "조건부" | "확인필요";
  laws: string[];
  certType?: string;
  testAgencies?: string[];
  estimatedCost?: string;
  estimatedDays?: string;
  fdaRequired?: boolean;
  etcNotes?: string[];
}

interface FtaRates {
  CN?: number;
  US?: number;
  JP?: number;
  VN?: number;
  SG?: number;
}

interface HsResult {
  hsCode: string;
  description: string;
  reason?: string;
  rate?: number;
  ftaRate?: number;   // 레거시 (사용 안 함)
  ftaRates?: FtaRates;
  importNotes?: string;
  notice?: string;
  unit?: string;
  regulations?: RegulationInfo;
  source?: string;
  sourceLabel?: string;
}

function KcBadge({ status }: { status: RegulationInfo["kcRequired"] }) {
  const map = {
    "필수": { icon: <ShieldAlert className="w-4 h-4" />, bg: "bg-red-100", text: "text-red-700", border: "border-red-200", label: "KC 인증 필수" },
    "불필요": { icon: <ShieldCheck className="w-4 h-4" />, bg: "bg-green-100", text: "text-green-700", border: "border-green-200", label: "KC 인증 불필요" },
    "조건부": { icon: <ShieldAlert className="w-4 h-4" />, bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", label: "KC 인증 조건부" },
    "확인필요": { icon: <ShieldX className="w-4 h-4" />, bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", label: "KC 인증 확인필요" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold ${s.bg} ${s.text} ${s.border}`}>
      {s.icon}{s.label}
    </span>
  );
}

export default function HsPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HsResult[]>([]);
  const [resultSource, setResultSource] = useState<string>("");
  const [aiNote, setAiNote] = useState<string>("");
  const [selected, setSelected] = useState<HsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // ?code=XXXXXXXXXX 파라미터로 진입 시 바로 상세 조회
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const item: HsResult = { hsCode: code, description: code };
      selectCode(item);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSelected(null);
    setResults([]);
    setAiNote("");
    try {
      const res = await fetch(`/api/hs/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.items || []);
      setResultSource(data.source || "");
      setAiNote(data.aiNote || "");
    } finally {
      setLoading(false);
    }
  };

  const selectCode = async (item: HsResult) => {
    setSelected({ ...item });
    setRegLoading(true);
    try {
      const res = await fetch(`/api/hs/rate?hs=${item.hsCode}&name=${encodeURIComponent(item.description)}`);
      const data = await res.json();
      setSelected(prev => prev ? {
        ...prev,
        rate: data.rate,
        ftaRates: data.ftaRates,
        importNotes: data.importNotes,
        unit: data.unit,
        regulations: data.regulations,
        source: data.source,
        sourceLabel: data.sourceLabel,
      } : prev);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-28 bg-[#F4F6FA]">
      <header className="bg-[var(--primary)] text-white px-5 pt-14 pb-5 flex items-center gap-3">
        <Link href="/" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-lg font-bold">HS코드 · 수입규제 조회</h1>
      </header>

      <div className="px-4 py-5 space-y-4">
        <ChinesePhrase phrases={[
          { cn: "这个商品的海关编码是什么？", pinyin: "쩌거 상핀더 하이관 비엔마 스 선머?", kr: "이 상품의 HS코드가 뭐예요?" },
          { cn: "这个可以出口吗？", pinyin: "쩌거 커이 추코우 마?", kr: "이거 수출 가능해요?" },
        ]} />

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-3">
            상품명을 입력하면 <strong>HS코드 · 관세율 · KC인증 · 수입규제</strong>를 한 번에 확인합니다.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="예: 주방용품, LED조명, 어린이 장난감..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-green-400"
            />
            <button
              onClick={search}
              disabled={loading}
              className="bg-green-600 text-white px-4 rounded-xl flex items-center gap-1"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 검색 결과 없음 */}
        {results.length === 0 && !loading && query.trim() && resultSource === "not-found" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center text-gray-400 text-sm py-8">
            검색 결과가 없습니다
          </div>
        )}

        {/* 검색 결과 목록 */}
        {results.length > 0 && !selected && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              {resultSource === "unipass" && (
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">✅ 관세청 공식</span>
              )}
              {resultSource === "local-db" && (
                <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">📋 내부 DB</span>
              )}
              {resultSource === "ai" && (
                <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">🤖 AI 추정</span>
              )}
              <p className="text-sm font-semibold text-gray-700">{results.length}건 — 클릭하면 세율·규제 확인</p>
            </div>
            {aiNote && (
              <div className="px-4 py-2 bg-purple-50 text-xs text-purple-600 border-b border-purple-100">
                ⚠️ {aiNote}
              </div>
            )}
            {results.map((r) => (
              <button
                key={r.hsCode}
                onClick={() => selectCode(r)}
                className="w-full text-left px-4 py-3.5 border-b border-gray-50 last:border-0 active:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-green-600 text-sm font-bold">{r.hsCode}</span>
                  {resultSource === "ai" && (
                    <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">AI추천</span>
                  )}
                </div>
                <div className="text-gray-700 text-sm mt-0.5">{r.description}</div>
                {r.reason && <div className="text-xs text-gray-400 mt-1">📌 {r.reason}</div>}
              </button>
            ))}
          </div>
        )}

        {/* 선택된 HS코드 상세 */}
        {selected && (
          <div className="space-y-3">
            <button onClick={() => setSelected(null)} className="text-sm text-gray-500 flex items-center gap-1">
              ← 목록으로
            </button>

            {/* HS코드 헤더 */}
            <div className="bg-green-600 rounded-2xl p-5 text-white">
              <div className="text-xs text-green-200 mb-1">HS코드</div>
              <div className="font-mono text-2xl font-bold">{selected.hsCode}</div>
              <div className="mt-1 text-green-100">{selected.description}</div>
            </div>

            {/* 로딩 */}
            {regLoading && (
              <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">KC인증·수입규제 분석 중...</p>
              </div>
            )}

            {/* KC인증 & 수입규제 */}
            {!regLoading && selected.regulations && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-gray-700">수입 인증 · 규제 정보</span>
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full ml-auto">AI 분석</span>
                </div>
                <div className="p-4 space-y-4">
                  {/* KC 인증 여부 */}
                  <div>
                    <KcBadge status={selected.regulations.kcRequired} />
                    {selected.regulations.certType && selected.regulations.certType !== "해당없음" && (
                      <p className="text-xs text-gray-500 mt-1.5">인증 종류: <strong className="text-gray-700">{selected.regulations.certType}</strong></p>
                    )}
                  </div>

                  {/* 관련 법령 */}
                  {selected.regulations.laws?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">관련 법령</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.regulations.laws.map((law, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-lg">{law}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 시험기관 + 예상비용 */}
                  {(selected.regulations.testAgencies?.length || selected.regulations.estimatedCost) && (
                    <div className="grid grid-cols-2 gap-3">
                      {selected.regulations.testAgencies && selected.regulations.testAgencies.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">시험기관</p>
                          <div className="flex flex-wrap gap-1">
                            {selected.regulations.testAgencies.map((ag, i) => (
                              <span key={i} className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-1.5 py-0.5 rounded">{ag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(selected.regulations.estimatedCost || selected.regulations.estimatedDays) && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">예상 비용·기간</p>
                          {selected.regulations.estimatedCost && (
                            <p className="text-xs font-bold text-gray-700">{selected.regulations.estimatedCost}</p>
                          )}
                          {selected.regulations.estimatedDays && (
                            <p className="text-xs text-gray-500">{selected.regulations.estimatedDays}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 식약처 신고 */}
                  {selected.regulations.fdaRequired && (
                    <div className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
                      <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-orange-700 font-medium">식품의약품안전처(식약처) 수입신고 필요</p>
                    </div>
                  )}

                  {/* 추가 주의사항 */}
                  {selected.regulations.etcNotes && selected.regulations.etcNotes.length > 0 && (
                    <div className="space-y-1.5">
                      {selected.regulations.etcNotes.map((note, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-gray-600">{note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                    ※ AI 분석 결과입니다. 정확한 요건은 국가기술표준원(KATS) 또는 관할기관에서 최종 확인하세요.
                  </p>
                </div>
              </div>
            )}

            {/* 관세율 카드 */}
            {!regLoading && selected.rate !== undefined && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                {/* 헤더: 기본세율 + 출처 배지 */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">기본 관세율 (일반세율)</div>
                    <div className="text-3xl font-bold text-gray-900">{(selected.rate * 100).toFixed(1)}%</div>
                    {selected.unit && (
                      <div className="text-xs text-gray-400 mt-0.5">단위: <span className="text-gray-600 font-medium">{selected.unit}</span></div>
                    )}
                  </div>
                  <div className="text-right">
                    {selected.source === "unipass" ? (
                      <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full">✅ 관세청 공식</span>
                    ) : selected.source === "local-db" ? (
                      <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full">📋 내부 DB</span>
                    ) : (
                      <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-full">🤖 AI 추정</span>
                    )}
                  </div>
                </div>

                {/* FTA 협정세율 국가별 테이블 */}
                {selected.ftaRates && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-600">🤝 FTA 협정세율 <span className="font-normal text-gray-400">(원산지증명서 C/O 제출 시)</span></p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {[
                        { code: "CN", flag: "🇨🇳", country: "중국", agreement: "한-중 FTA" },
                        { code: "JP", flag: "🇯🇵", country: "일본", agreement: "RCEP" },
                        { code: "US", flag: "🇺🇸", country: "미국", agreement: "한-미 FTA" },
                        { code: "VN", flag: "🇻🇳", country: "베트남", agreement: "한-ASEAN" },
                        { code: "SG", flag: "🇸🇬", country: "싱가포르", agreement: "한-ASEAN" },
                      ].map(({ code, flag, country, agreement }) => {
                        const fta = selected.ftaRates?.[code as keyof FtaRates];
                        if (fta === undefined) return null;
                        const saving = selected.rate! - fta;
                        return (
                          <div key={code} className="flex items-center px-3 py-2.5">
                            <span className="text-base mr-2">{flag}</span>
                            <div className="flex-1">
                              <span className="text-sm font-semibold text-gray-800">{country}</span>
                              <span className="text-[10px] text-gray-400 ml-1.5">{agreement}</span>
                            </div>
                            <div className="text-right">
                              <span className={`text-base font-bold ${fta === 0 ? "text-green-600" : "text-blue-600"}`}>
                                {fta === 0 ? "무관세" : `${(fta * 100).toFixed(1)}%`}
                              </span>
                              {saving > 0 && (
                                <span className="text-[10px] text-green-500 ml-1.5">
                                  {(saving * 100).toFixed(1)}%p↓
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-blue-50 px-3 py-2 border-t border-gray-100">
                      <p className="text-[10px] text-blue-600">💡 중국산 수입 시 거래처에 원산지증명서(C/O) 발급 요청하면 FTA 세율 적용</p>
                    </div>
                  </div>
                )}

                {/* 계산 예시 */}
                <div className="bg-orange-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-orange-800 mb-2">계산 예시 (원가 100만원 기준)</div>
                  <div className="space-y-1 text-xs text-orange-700">
                    <div className="flex justify-between">
                      <span>관세 ({(selected.rate * 100).toFixed(1)}%)</span>
                      <span>{Math.round(1000000 * selected.rate).toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span>부가세 10%</span>
                      <span>{Math.round(1000000 * (1 + selected.rate) * 0.1).toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-orange-200 mt-1">
                      <span>세금 합계</span>
                      <span>{Math.round(1000000 * selected.rate + 1000000 * (1 + selected.rate) * 0.1).toLocaleString()}원</span>
                    </div>
                    {selected.ftaRates?.CN !== undefined && selected.ftaRates.CN < selected.rate && (
                      <div className="flex justify-between text-green-700 font-bold pt-1 border-t border-orange-200 mt-1">
                        <span>한-중 FTA 적용 시</span>
                        <span>{Math.round(1000000 * selected.ftaRates.CN + 1000000 * (1 + selected.ftaRates.CN) * 0.1).toLocaleString()}원</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-orange-400 mt-1.5">* 참고용 견적. 실제 세율은 관세청에서 최종 확인</p>
                </div>

                {selected.importNotes && (
                  <div className="flex gap-2 bg-amber-50 rounded-xl px-3 py-2.5">
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                    <div>
                      <div className="text-xs font-semibold text-amber-800 mb-0.5">수입 시 주의</div>
                      <div className="text-xs text-amber-700">{selected.importNotes}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <a href={`https://unipass.customs.go.kr/clip/hsinfosrch/openULS0201005Q.do?searchVal=${selected.hsCode}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full bg-green-600 rounded-xl px-4 py-3.5">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">관세청 CLIP 공식 페이지 열기</div>
                      <div className="text-xs text-green-100 mt-0.5">전체 FTA 협정세율 · 수입요건 · 관세율표 전체 조회</div>
                    </div>
                    <span className="text-white text-lg">↗</span>
                  </a>
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="text-[11px] text-gray-500 font-semibold mb-1.5">📋 CLIP에서 확인 가능한 정보</p>
                    <div className="grid grid-cols-2 gap-1">
                      {["전체 FTA 협정세율 (20+개국)", "수입요건 · 통관조건", "품목분류 상세 설명", "연도별 세율 변동 이력"].map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-green-500 text-xs">✓</span>
                          <span className="text-[11px] text-gray-600">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Link href={`/calculator?customsRate=${selected.rate ?? 0.08}`}
                    className="flex items-center justify-between w-full bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-orange-800">원가 계산기에서 계산하기</div>
                      <div className="text-xs text-orange-600 mt-0.5">관세율 {(selected.rate * 100).toFixed(1)}% 자동 적용</div>
                    </div>
                    <span className="text-orange-600 text-lg">→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 자주 쓰는 품목 */}
        {results.length === 0 && !selected && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-3">자주 쓰는 품목</h3>
            <div className="space-y-2">
              {[
                { code: "6110200000", name: "면 스웨터·니트류" },
                { code: "3304990000", name: "미용·세안용품" },
                { code: "9503000000", name: "완구, 퍼즐류" },
                { code: "8405400000", name: "LED 조명기구" },
                { code: "8504400000", name: "충전기·보조배터리" },
              ].map((item) => (
                <button key={item.code} onClick={() => selectCode({ hsCode: item.code, description: item.name })}
                  className="w-full text-left flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <span className="font-mono text-xs text-green-600 bg-green-50 px-2 py-1 rounded">{item.code}</span>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
