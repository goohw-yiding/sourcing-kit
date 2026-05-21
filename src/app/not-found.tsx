import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col items-center justify-center px-6 text-center">

      {/* 일러스트 */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full flex items-center justify-center text-6xl"
          style={{ background: "rgba(15,36,64,0.08)" }}>
          📦
        </div>
        <div className="absolute -top-1 -right-1 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl font-black text-red-500 shadow-sm">
          !
        </div>
      </div>

      {/* 텍스트 */}
      <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">404 Not Found</p>
      <h1 className="text-2xl font-black text-gray-900 mb-2">페이지를 찾을 수 없어요</h1>
      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        주소가 잘못됐거나 삭제된 페이지예요.<br />
        아래 버튼을 눌러 홈으로 돌아가세요.
      </p>

      {/* 홈으로 버튼 */}
      <Link href="/"
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white shadow-md active:scale-95 transition-transform"
        style={{ background: "linear-gradient(135deg, #0F2440 0%, #1E3A5F 100%)" }}>
        🏠 홈으로 돌아가기
      </Link>

      {/* 서브 링크 */}
      <div className="flex items-center gap-4 mt-5">
        <Link href="/sourcing" className="text-xs text-gray-400 underline underline-offset-2">소싱 시작</Link>
        <span className="text-gray-300">·</span>
        <Link href="/briefing" className="text-xs text-gray-400 underline underline-offset-2">소싱 브리핑</Link>
        <span className="text-gray-300">·</span>
        <Link href="/hs" className="text-xs text-gray-400 underline underline-offset-2">HS코드</Link>
      </div>
    </div>
  );
}
