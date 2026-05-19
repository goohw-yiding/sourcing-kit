import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "개인정보처리방침 | 소싱킷" };

export default function PrivacyPage() {
  const today = "2026년 5월 19일";
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/" className="p-1 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-gray-900">개인정보처리방침</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6 text-sm text-gray-700 leading-relaxed">
        <p className="text-xs text-gray-400">시행일: {today}</p>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">1. 개인정보 수집 항목 및 목적</h2>
          <p>이딩컴퍼니(이하 "회사")가 운영하는 소싱킷은 다음의 목적으로 개인정보를 수집합니다.</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
            <li>이메일, 이름 — 회원 가입 및 서비스 이용, 본인 식별</li>
            <li>소셜 계정 정보(카카오, 구글) — 소셜 로그인 인증</li>
            <li>결제 정보(카드 정보는 PG사에서 처리, 회사는 저장하지 않음) — 유료 서비스 결제</li>
            <li>서비스 이용 기록 — 서비스 개선 및 오류 분석</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">2. 개인정보 보유 및 이용 기간</h2>
          <p>회원 탈퇴 시까지 보유하며, 탈퇴 즉시 지체 없이 파기합니다. 단, 관련 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
            <li>계약 또는 청약철회 기록: 5년 (전자상거래법)</li>
            <li>소비자 불만·분쟁처리 기록: 3년 (전자상거래법)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">3. 개인정보 제3자 제공</h2>
          <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 결제 처리를 위해 토스페이먼츠(주)에 결제 관련 정보가 제공되며, 이는 결제 처리 목적에 한해 사용됩니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">4. 개인정보처리 위탁</h2>
          <ul className="mt-1 space-y-1 list-disc list-inside text-gray-600">
            <li>토스페이먼츠(주) — 결제 처리</li>
            <li>Amazon Web Services(Vercel) — 서버 운영 및 데이터 저장</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">5. 이용자의 권리</h2>
          <p>이용자는 언제든지 자신의 개인정보 조회, 수정, 삭제, 처리 정지를 요청할 수 있습니다. 요청은 아래 이메일로 문의해 주세요.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">6. 개인정보 보호책임자</h2>
          <div className="bg-gray-100 rounded-xl px-4 py-3 text-gray-600">
            <p>회사명: 이딩컴퍼니</p>
            <p>이메일: goohw593@gmail.com</p>
            <p>서비스 주소: https://sourcing-kit.vercel.app</p>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">7. 쿠키 사용</h2>
          <p>서비스는 로그인 세션 유지를 위해 쿠키를 사용합니다. 브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.</p>
        </section>

        <p className="text-xs text-gray-400 pt-4 border-t">본 방침은 {today}부터 적용됩니다.</p>
      </div>
    </div>
  );
}
