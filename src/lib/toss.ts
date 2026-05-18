/**
 * 토스페이먼츠 서버 유틸리티
 * 공식 문서: https://docs.tosspayments.com
 */

const TOSS_API_BASE = "https://api.tosspayments.com/v1";

function getAuthHeader() {
  const secretKey = process.env.TOSS_SECRET_KEY!;
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

/** 결제 승인 (단건) */
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
) {
  const res = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "결제 승인 실패");
  return data;
}

/** 빌링키 발급 */
export async function issueBillingKey(authKey: string, customerKey: string) {
  const res = await fetch(`${TOSS_API_BASE}/billing/authorizations/issue`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authKey, customerKey }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "빌링키 발급 실패");
  return data; // { billingKey, customerKey, card: {...} }
}

/** 빌링키로 자동결제 */
export async function chargeBillingKey(
  billingKey: string,
  params: {
    customerKey: string;
    amount: number;
    orderId: string;
    orderName: string;
    customerEmail?: string;
    customerName?: string;
  }
) {
  const res = await fetch(`${TOSS_API_BASE}/billing/${billingKey}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "자동결제 실패");
  return data;
}

/** 결제 취소 */
export async function cancelPayment(paymentKey: string, cancelReason: string) {
  const res = await fetch(`${TOSS_API_BASE}/payments/${paymentKey}/cancel`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cancelReason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "결제 취소 실패");
  return data;
}

/** orderId 생성 (날짜 + 랜덤) */
export function generateOrderId(prefix = "sub") {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${date}_${random}`;
}
