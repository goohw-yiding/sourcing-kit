"use client";

import { useState } from "react";
import { X, Calculator } from "lucide-react";

interface Props {
  onApply: (cbm: number) => void;
  onClose: () => void;
  initialCbm?: number;
}

export function CbmCalculator({ onApply, onClose, initialCbm }: Props) {
  const [unit, setUnit] = useState<"cm" | "m">("cm");
  const [w, setW] = useState("");
  const [d, setD] = useState("");
  const [h, setH] = useState("");
  const [qty, setQty] = useState("1"); // 박스 수량

  const toM = (v: string) => {
    const n = parseFloat(v) || 0;
    return unit === "cm" ? n / 100 : n;
  };

  const oneCbm = toM(w) * toM(d) * toM(h);
  const totalCbm = oneCbm * (parseInt(qty) || 1);

  const ready = oneCbm > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-sm pb-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-gray-900">CBM 계산기</span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 단위 선택 */}
          <div className="flex gap-2">
            {(["cm", "m"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  unit === u
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "bg-white border-gray-200 text-gray-500"
                }`}
              >
                {u === "cm" ? "cm (센티미터)" : "m (미터)"}
              </button>
            ))}
          </div>

          {/* 가로 × 세로 × 높이 */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">박스 크기 (1개)</p>
            {[
              { label: "가로 (W)", val: w, set: setW },
              { label: "세로 (D)", val: d, set: setD },
              { label: "높이 (H)", val: h, set: setH },
            ].map(({ label, val, set }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-20 shrink-0">{label}</span>
                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    placeholder="0"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-base font-mono text-right focus:outline-none focus:border-orange-400 bg-white"
                  />
                  <span className="text-sm text-gray-400 w-6">{unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 박스 수량 */}
          <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3">
            <span className="text-sm text-blue-700 font-medium flex-1">박스 수량</span>
            <input
              type="number"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-20 border border-blue-200 rounded-xl px-3 py-2 text-base font-mono text-right focus:outline-none focus:border-blue-400 bg-white"
            />
            <span className="text-sm text-blue-600">박스</span>
          </div>

          {/* 계산 결과 */}
          <div className={`rounded-2xl p-4 transition-colors ${ready ? "bg-orange-50 border-2 border-orange-200" : "bg-gray-50 border-2 border-gray-100"}`}>
            {ready ? (
              <>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm text-orange-600">박스 1개</span>
                  <span className="text-base font-bold text-orange-700">{oneCbm.toFixed(4)} m³</span>
                </div>
                {parseInt(qty) > 1 && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-orange-600">{qty}박스 합계</span>
                    <span className="text-xl font-bold text-orange-700">{totalCbm.toFixed(4)} m³</span>
                  </div>
                )}
                {parseInt(qty) === 1 && (
                  <div className="text-xs text-orange-400 mt-1">
                    {(toM(w) * 100).toFixed(0)}cm × {(toM(d) * 100).toFixed(0)}cm × {(toM(h) * 100).toFixed(0)}cm
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center">가로·세로·높이를 입력하세요</p>
            )}
          </div>

          {/* 적용 버튼 */}
          <button
            onClick={() => { if (ready) { onApply(parseFloat(totalCbm.toFixed(4))); onClose(); } }}
            disabled={!ready}
            className="w-full bg-orange-500 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-2xl py-4 font-bold text-base transition-colors"
          >
            {ready ? `${totalCbm.toFixed(4)} m³ 적용` : "크기를 입력하세요"}
          </button>
        </div>
      </div>
    </div>
  );
}
