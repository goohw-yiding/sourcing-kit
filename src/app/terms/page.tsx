import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "이용약관 | 소싱킷" };

export default function TermsPage() {
  const today = "2026년 5월 19일";
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/" className="p-1 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-gray-900">이용약관</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6 text-sm text-gray-700 leading-relaxed">
        <p className="text-xs text-gray-400">시행일: {today}</p>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">제1조 (목적)</h2>
          <p>본 약관은 이딩컴퍼니(이하 "회사")가 운영하는 소싱킷 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자의 권리·의무·책임사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">제2조 (서비스 내용)</h2>
          <p>서비스는 무역 소싱 관리를 위한 다음 기능을 제공합니다.</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
            <li>AI 기반 상품 원가 분석</li>
            <li>실시간 환율 조회</li>
            <li>공급업체 및 상품 관리</li>
            <li>바이어 제안서 생성</li>
            <li>현장 중국어 회화 지원</li>
            <li>HS코드 조회</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">제3조 (이용계약 체결)</h2>
          <p>이용계약은 이용자가 약관에 동의하고 회원가입을 완료함으로써 성립됩니다. 만 14세 미만의 아동은 서비스를 이용할 수 없습니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">제4조 (유료 서비스 및 결제)</h2>
          <ul className="mt-1 space-y-1 list-disc list-inside text-gray-600">
            <li>유료 서비스는 결제 완료 후 즉시 이용 가능합니다.</li>
            <li>정기 구독은 결제일 기준으로 자동 갱신됩니다.</li>
            <li>구독 취소는 서비스 내 '구독 관리' 메뉴에서 언제든지 가능합니다.</li>
            <li>취소 시 현재 결제 기간 종료일까지 서비스가 유지됩니다.</li>
            <li>디지털 콘텐츠 특성상 서비스 이용 후 환불은 원칙적으로 제한됩니다. 단, 결제 후 7일 이내 미이용 시 전액 환불이 가능합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">제5조 (이용자 의무)</h2>
          <ul className="mt-1 space-y-1 list-disc list-inside text-gray-600">
            <li>타인의 정보를 도용하거나 허위 정보를 입력하지 않을 것</li>
            <li>서비스를 불법적인 목적으로 이용하지 않을 것</li>
            <li>서비스를 무단으로 복제, 배포, 상업적으로 이용하지 않을 것</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">제6조 (서비스 제공 중단)</h2>
          <p>회사는 시스템 정기점검, 설비 교체 및 고장, 통신 두절 등 부득이한 사유가 발생한 경우 서비스 제공을 일시 중단할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">제7조 (책임 제한)</h2>
          <p>회사는 AI 분석 결과, 환율 정보 등 서비스에서 제공하는 정보의 정확성을 보장하지 않으며, 해당 정보를 기반으로 한 이용자의 판단 및 거래에 대해 책임지지 않습니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">제8조 (분쟁 해결)</h2>
          <p>서비스 이용과 관련한 분쟁은 대한민국 법률에 따르며, 관할 법원은 회사 소재지 관할 법원으로 합니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-gray-900 mb-2">문의</h2>
          <div className="bg-gray-100 rounded-xl px-4 py-3 text-gray-600">
            <p>이메일: goohw593@gmail.com</p>
          </div>
        </section>

        <p className="text-xs text-gray-400 pt-4 border-t">본 약관은 {today}부터 적용됩니다.</p>
      </div>
    </div>
  );
}
