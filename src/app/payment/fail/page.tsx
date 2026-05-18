"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function PaymentFailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const message = params.get("message") || "결제가 취소되었거나 실패했습니다.";
  const code = params.get("code");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <p className="text-gray-800 font-bold text-lg">결제 실패</p>
        <p className="text-sm text-red-500">{message}</p>
        {code && <p className="text-xs text-gray-400">오류 코드: {code}</p>}
        <button
          onClick={() => router.push("/pricing")}
          className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-bold"
        >
          다시 시도
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full text-sm text-gray-400 underline"
        >
          홈으로
        </button>
      </div>
    </div>
  );
}
