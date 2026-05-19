"use client";

/**
 * /payment/billing
 * 토스페이먼츠 결제 완료 후 리다이렉트 페이지
 *
 * planType=taste    → paymentKey + orderId 단건 결제 승인
 * planType=monthly  → authKey + customerKey 빌링키 발급 + Pro 월구독
 * planType=yearly   → authKey + customerKey 빌링키 발급 + Pro 연구독
 */
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  taste: "맛보기 30일 플랜",
  monthly: "Pro 월간 구독",
  yearly: "Pro 연간 구독",
};

export default function PaymentBillingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [planLabel, setPlanLabel] = useState("");

  useEffect(() => {
    const planType = params.get("planType") ?? "monthly";
    setPlanLabel(PLAN_LABELS[planType] ?? "플랜");

    // 맛보기: 단건 결제 승인 (paymentKey + orderId)
    if (planType === "taste") {
      const paymentKey = params.get("paymentKey");
      const orderId = params.get("orderId");

      if (!paymentKey || !orderId) {
        setStatus("error");
        setMessage("결제 정보가 없습니다.");
        return;
      }

      fetch("/api/payment/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "taste", paymentKey, orderId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) {
            setStatus("success");
            setMessage("맛보기 30일이 시작됐습니다!");
            setTimeout(() => router.push("/"), 2500);
          } else {
            setStatus("error");
            setMessage(data.error || "결제에 실패했습니다.");
          }
        })
        .catch(() => {
          setStatus("error");
          setMessage("네트워크 오류가 발생했습니다.");
        });
      return;
    }

    // Pro 월/연: 빌링키 발급 (authKey + customerKey)
    const authKey = params.get("authKey");
    const customerKey = params.get("customerKey");

    if (!authKey || !customerKey) {
      setStatus("error");
      setMessage("인증 정보가 없습니다.");
      return;
    }

    fetch("/api/payment/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planType, authKey, customerKey }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          setMessage(`${PLAN_LABELS[planType] ?? "Pro 플랜"}이 활성화됐습니다!`);
          setTimeout(() => router.push("/"), 2500);
        } else {
          setStatus("error");
          setMessage(data.error || "결제에 실패했습니다.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("네트워크 오류가 발생했습니다.");
      });
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mx-auto" />
            <p className="text-gray-700 font-semibold">결제를 처리하고 있습니다...</p>
            <p className="text-sm text-gray-400">{planLabel && `${planLabel} 활성화 중`}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-gray-800 font-bold text-lg">🎉 {message}</p>
            <p className="text-sm text-gray-400">홈으로 이동합니다...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-gray-800 font-bold">결제 실패</p>
            <p className="text-sm text-red-500">{message}</p>
            <button
              onClick={() => router.push("/pricing")}
              className="mt-2 w-full py-3 rounded-xl bg-[var(--primary)] text-white font-bold"
            >
              다시 시도
            </button>
          </>
        )}
      </div>
    </div>
  );
}
