"use client";
import { useEffect, useState } from "react";

export const LANGS = [
  { id: "ko",    flag: "🇰🇷", country: "한국",    label: "한국어",      name: "한국어" },
  { id: "en",    flag: "🇺🇸", country: "미국",    label: "English",     name: "English" },
  { id: "zh",    flag: "🇨🇳", country: "중국",    label: "中文",        name: "简体中文" },
  { id: "ja",    flag: "🇯🇵", country: "일본",    label: "日本語",      name: "日本語" },
  { id: "vi",    flag: "🇻🇳", country: "베트남",  label: "Tiếng Việt",  name: "Tiếng Việt" },
  { id: "en-SG", flag: "🇸🇬", country: "싱가포르", label: "English",    name: "English (SG)" },
] as const;

export type LangId = (typeof LANGS)[number]["id"];

// ── 번역 사전 ────────────────────────────────────────────────
// en-SG는 translate() 에서 자동으로 en 으로 폴백됨
type Dict = Record<string, Partial<Record<"ko"|"en"|"zh"|"ja"|"vi", string>>>;

const dict: Dict = {
  // ── 온보딩 ──
  "ob.lang_title":    { ko:"국가를 선택하세요", en:"Choose your country", ja:"国を選択してください", zh:"请选择国家", vi:"Chọn quốc gia của bạn" },
  "ob.lang_sub":      { ko:"앱 전체에 적용됩니다", en:"This applies to the whole app", ja:"アプリ全体に適用されます", zh:"将应用于整个应用", vi:"Áp dụng cho toàn bộ ứng dụng" },
  "ob.name_title":    { ko:"어떻게 불러드릴까요? 👋", en:"What should we call you? 👋", ja:"何とお呼びすれば？👋", zh:"我们该怎么称呼您？👋", vi:"Chúng tôi gọi bạn là gì? 👋" },
  "ob.name_sub":      { ko:"업체명, 닉네임, 이름 — 편하신 대로", en:"Company, nickname, or name", ja:"会社名、ニックネーム、名前など", zh:"公司名、昵称或姓名", vi:"Tên công ty, biệt danh hoặc tên" },
  "ob.name_ph":       { ko:"예: 홍길동 / 이우소싱 / 따봉무역", en:"e.g. John / ABC Trading", ja:"例: 山田 / ABC商事", zh:"例: 张先生 / ABC贸易", vi:"VD: Nguyễn / ABC Trading" },
  "ob.theme_title":   { ko:"테마를 선택하세요 🎨", en:"Choose a theme 🎨", ja:"テーマを選択 🎨", zh:"选择主题 🎨", vi:"Chọn giao diện 🎨" },
  "ob.theme_sub":     { ko:"나중에 설정에서 바꿀 수 있어요", en:"You can change this later in settings", ja:"後で設定から変更できます", zh:"稍后可在设置中更改", vi:"Có thể thay đổi sau trong cài đặt" },
  "ob.next":          { ko:"다음", en:"Next", ja:"次へ", zh:"下一步", vi:"Tiếp theo" },
  "ob.start":         { ko:"시작하기 🚀", en:"Get Started 🚀", ja:"始める 🚀", zh:"开始使用 🚀", vi:"Bắt đầu 🚀" },
  "ob.app_name":      { ko:"소싱킷", en:"소싱킷", ja:"소싱킷", zh:"소싱킷", vi:"소싱킷" },
  "ob.app_desc":      { ko:"중국 무역 소싱 관리", en:"China Trade Sourcing Manager", ja:"中国貿易仕入れ管理", zh:"中国贸易采购管理", vi:"Quản lý mua hàng thương mại Trung Quốc" },

  // ── 인삿말 (랜덤) ──
  "greet.0":  { ko:"사장님, 오늘 3만보 목표! 시장 정복 가즈아 🚶", en:"Boss, aim for 30,000 steps today! Conquer the market 🚶", ja:"社長、今日は3万歩目標！市場を制覇しよう 🚶", zh:"老板，今天目标3万步！征服市场出发 🚶", vi:"Sếp ơi, hôm nay mục tiêu 30.000 bước! Chinh phục thị trường 🚶" },
  "greet.1":  { ko:"대표님, 오늘 대박 상품 반드시 찾는다! 🔥", en:"Find that winning product today, no matter what! 🔥", ja:"社長、今日は絶対に売れる商品を見つける！🔥", zh:"老板，今天一定要找到爆款！🔥", vi:"Hôm nay nhất định phải tìm được hàng hot! 🔥" },
  "greet.2":  { ko:"사장님, 발품이 곧 이익이에요 👟", en:"Every step you walk is profit in the making 👟", ja:"社長、足で稼ぐのが仕入れの基本！👟", zh:"老板，多走多赚，迈开腿就是利润 👟", vi:"Sếp ơi, đi nhiều là lợi nhiều 👟" },
  "greet.3":  { ko:"대표님, 1구부터 5구까지 오늘 다 뒤진다! 🗺️", en:"Scanning every section of the market today! 🗺️", ja:"今日は1区から5区まで全部回る！🗺️", zh:"老板，今天从一区扫到五区！🗺️", vi:"Hôm nay quét sạch từ khu 1 đến khu 5! 🗺️" },
  "greet.4":  { ko:"사장님, 거래처 명함 오늘 10장 목표! 📇", en:"Target: collect 10 supplier cards today! 📇", ja:"社長、今日は名刺10枚ゲット目標！📇", zh:"老板，今天目标拿到10张名片！📇", vi:"Hôm nay mục tiêu nhận 10 danh thiếp nhà cung cấp! 📇" },
  "greet.5":  { ko:"대표님, 신상 선점이 곧 경쟁력! 빨리 움직여요 ⚡", en:"First to find new items wins — move fast! ⚡", ja:"新商品を先に見つけたもん勝ち！さあ動こう ⚡", zh:"老板，先下手为强！快去抢先机 ⚡", vi:"Ai tìm hàng mới trước là người thắng! ⚡" },
  "greet.6":  { ko:"사장님, 오늘 가격 협상 강하게 들어가요 💪", en:"Time to negotiate hard today, boss 💪", ja:"社長、今日は価格交渉で強気に行こう！💪", zh:"老板，今天砍价要狠一点！💪", vi:"Hôm nay thương lượng giá thật mạnh! 💪" },
  "greet.7":  { ko:"대표님, 위안화 지금이 기회예요! 환율 확인 📈", en:"Check the CNY rate — now might be the moment! 📈", ja:"社長、今が仕入れのチャンス！為替を確認して 📈", zh:"老板，现在汇率不错，抓紧机会！📈", vi:"Tỷ giá CNY đang tốt! Kiểm tra ngay 📈" },
  "greet.8":  { ko:"사장님, 오늘 소싱한 상품 바로 원가 계산해요 🧮", en:"Log today's finds and crunch the numbers! 🧮", ja:"社長、今日仕入れた商品の原価、すぐ計算！🧮", zh:"老板，今天找到的商品马上核算成本！🧮", vi:"Tính ngay giá vốn hàng tìm được hôm nay! 🧮" },
  "greet.9":  { ko:"대표님, 오늘도 현장이 최고의 교과서! 📚", en:"The market floor is the best classroom — get out there! 📚", ja:"社長、今日も市場が最高の教科書！📚", zh:"老板，市场就是最好的课堂，出发！📚", vi:"Thị trường là trường học tốt nhất! Ra ngoài thôi! 📚" },

  // ── 네비게이션 ──
  "nav.home":     { ko:"홈", en:"Home", ja:"ホーム", zh:"首页", vi:"Trang chủ" },
  "nav.calc":     { ko:"계산기", en:"Calc", ja:"計算機", zh:"计算器", vi:"Tính toán" },
  "nav.sourcing": { ko:"소싱수첩", en:"Sourcing", ja:"仕入帳", zh:"采购本", vi:"Sổ tìm hàng" },
  "nav.field":    { ko:"현장", en:"Field", ja:"現場", zh:"现场", vi:"Thực địa" },
  "nav.hs":       { ko:"HS코드", en:"HS Code", ja:"HSコード", zh:"HS编码", vi:"Mã HS" },
  "nav.more":     { ko:"더보기", en:"More", ja:"もっと", zh:"更多", vi:"Thêm" },

  // ── 홈 ──
  "home.greeting":      { ko:"안녕하세요, {name}님 👋", en:"Hello, {name} 👋", ja:"こんにちは、{name}さん 👋", zh:"您好，{name} 👋", vi:"Xin chào, {name} 👋" },
  "home.greet_no_name": { ko:"안녕하세요 👋", en:"Hello 👋", ja:"こんにちは 👋", zh:"您好 👋", vi:"Xin chào 👋" },
  "home.subtitle":      { ko:"오늘도 좋은 소싱 되세요", en:"Happy sourcing today!", ja:"良い仕入れを！", zh:"祝今天采购顺利！", vi:"Chúc tìm hàng thuận lợi hôm nay!" },
  "home.rate":          { ko:"오늘 환율 (CNY)", en:"Today's Rate (CNY)", ja:"本日レート (CNY)", zh:"今日汇率 (CNY)", vi:"Tỷ giá hôm nay (CNY)" },
  "home.stats":         { ko:"소싱 현황", en:"Sourcing Status", ja:"仕入れ状況", zh:"采购状态", vi:"Tình trạng nhập hàng" },
  "home.researching":   { ko:"시장조사중", en:"Researching", ja:"調査中", zh:"调研中", vi:"Đang khảo sát" },
  "home.in_progress":   { ko:"발주진행중", en:"In Progress", ja:"発注進行中", zh:"采购中", vi:"Đang đặt hàng" },
  "home.arrived":       { ko:"입고완료", en:"Arrived", ja:"入庫完了", zh:"已入库", vi:"Đã nhập kho" },
  "home.quick":         { ko:"현장 바로가기", en:"Quick Actions", ja:"クイックアクション", zh:"快速操作", vi:"Thao tác nhanh" },
  "home.photo":         { ko:"상품 촬영", en:"Photo Product", ja:"商品撮影", zh:"拍摄商品", vi:"Chụp sản phẩm" },
  "home.photo_sub":     { ko:"사진+가격 바로 저장", en:"Save photo & price", ja:"写真＋価格を保存", zh:"保存照片和价格", vi:"Lưu ảnh + giá ngay" },
  "home.calc":          { ko:"원가 계산", en:"Cost Calculator", ja:"原価計算", zh:"成本计算", vi:"Tính giá vốn" },
  "home.menu":          { ko:"메뉴 바로가기", en:"Menu", ja:"メニュー", zh:"菜单", vi:"Menu chính" },

  // ── 더보기 ──
  "more.title":         { ko:"더보기", en:"More", ja:"もっと", zh:"更多", vi:"Thêm" },
  "more.subtitle":      { ko:"관리 기능 · 앱 설정", en:"Management · Settings", ja:"管理 · 設定", zh:"管理 · 设置", vi:"Quản lý · Cài đặt" },
  "more.my_info":       { ko:"내 정보", en:"My Profile", ja:"マイプロフィール", zh:"我的信息", vi:"Thông tin của tôi" },
  "more.disp_name":     { ko:"표시 이름", en:"Display name", ja:"表示名", zh:"显示名称", vi:"Tên hiển thị" },
  "more.edit":          { ko:"수정", en:"Edit", ja:"編集", zh:"编辑", vi:"Chỉnh sửa" },
  "more.save":          { ko:"저장", en:"Save", ja:"保存", zh:"保存", vi:"Lưu" },
  "more.cancel":        { ko:"취소", en:"Cancel", ja:"キャンセル", zh:"取消", vi:"Hủy" },
  "more.theme":         { ko:"앱 테마", en:"App Theme", ja:"テーマ", zh:"应用主题", vi:"Giao diện" },
  "more.lang":          { ko:"국가 / 언어", en:"Country / Language", ja:"国 / 言語", zh:"国家 / 语言", vi:"Quốc gia / Ngôn ngữ" },
  "more.menu":          { ko:"관리 메뉴", en:"Management", ja:"管理メニュー", zh:"管理菜单", vi:"Menu quản lý" },
  "more.suppliers":     { ko:"공급업체", en:"Suppliers", ja:"仕入先", zh:"供应商", vi:"Nhà cung cấp" },
  "more.suppliers_sub": { ko:"거래처 정보 · 명함 스캔", en:"Contacts · Business card scan", ja:"取引先情報 · 名刺スキャン", zh:"供应商信息 · 名片扫描", vi:"Thông tin · Quét danh thiếp" },
  "more.proposals":     { ko:"제안서 보내기", en:"Send Proposal", ja:"提案書送信", zh:"发送提案", vi:"Gửi đề xuất" },
  "more.proposals_sub": { ko:"바이어에게 상품 제안", en:"Propose products to buyers", ja:"バイヤーへ商品提案", zh:"向买家推荐商品", vi:"Đề xuất sản phẩm cho người mua" },
  "more.buyers":        { ko:"바이어 목록", en:"Buyer List", ja:"バイヤー一覧", zh:"买家列表", vi:"Danh sách người mua" },
  "more.buyers_sub":    { ko:"바이어 연락처 관리", en:"Manage buyer contacts", ja:"バイヤー連絡先管理", zh:"管理买家联系方式", vi:"Quản lý liên hệ người mua" },
  "more.orders":        { ko:"주문 관리", en:"Order Management", ja:"受注管理", zh:"订单管理", vi:"Quản lý đơn hàng" },
  "more.orders_sub":    { ko:"발주 → 선적 단계 추적", en:"Order → Shipping tracking", ja:"発注→出荷 追跡", zh:"下单→发货 追踪", vi:"Theo dõi đặt hàng → vận chuyển" },
  "more.hs_sub":        { ko:"관세율 · HS코드 검색", en:"Tariff rate · HS code search", ja:"関税率 · HSコード検索", zh:"关税率 · HS编码查询", vi:"Thuế quan · Tìm mã HS" },
  "more.name_ph":       { ko:"이름 / 업체명 / 닉네임", en:"Name / Company / Nickname", ja:"名前 / 会社名 / ニックネーム", zh:"姓名 / 公司名 / 昵称", vi:"Tên / Công ty / Biệt danh" },

  // ── 소싱수첩 ──
  "sourcing.title":           { ko:"소싱 수첩", en:"Sourcing", ja:"仕入帳", zh:"采购本", vi:"Sổ tìm hàng" },
  "sourcing.add":             { ko:"상품 추가", en:"Add Product", ja:"商品追加", zh:"添加商品", vi:"Thêm sản phẩm" },
  "sourcing.search":          { ko:"상품명, 거래처 검색...", en:"Search product, supplier...", ja:"商品名、取引先検索...", zh:"搜索商品、供应商...", vi:"Tìm sản phẩm, nhà cung cấp..." },
  "sourcing.empty":           { ko:"저장된 상품이 없어요", en:"No products saved", ja:"保存された商品がありません", zh:"没有已保存的商品", vi:"Chưa có sản phẩm nào" },
  "sourcing.empty_sub":       { ko:"+ 버튼으로 상품을 추가하세요", en:"Tap + to add a product", ja:"＋ボタンで商品を追加", zh:"点击 + 添加商品", vi:"Nhấn + để thêm sản phẩm" },
  "sourcing.save":            { ko:"저장", en:"Save", ja:"保存", zh:"保存", vi:"Lưu" },
  "sourcing.saving":          { ko:"저장 중...", en:"Saving...", ja:"保存中...", zh:"保存中...", vi:"Đang lưu..." },
  "sourcing.cost_cny":        { ko:"원가 (CNY)", en:"Cost (CNY)", ja:"原価 (CNY)", zh:"成本 (CNY)", vi:"Giá vốn (CNY)" },
  "sourcing.supplier":        { ko:"거래처 (선택)", en:"Supplier (optional)", ja:"取引先 (任意)", zh:"供应商 (选填)", vi:"Nhà cung cấp (tùy chọn)" },
  "sourcing.location":        { ko:"가게 위치 (선택)", en:"Shop Location (optional)", ja:"店舗場所 (任意)", zh:"店铺位置 (选填)", vi:"Vị trí cửa hàng (tùy chọn)" },
  "sourcing.moq":             { ko:"최소주문수량 MOQ (선택)", en:"Min. Order Qty (optional)", ja:"最低発注数 (任意)", zh:"最小起订量 MOQ (选填)", vi:"Số lượng tối thiểu MOQ (tùy chọn)" },
  "sourcing.cost_settings":   { ko:"원가 계산 설정", en:"Cost Settings", ja:"原価計算設定", zh:"成本计算设置", vi:"Cài đặt tính giá vốn" },
  "sourcing.status.sourcing": { ko:"검토중", en:"Reviewing", ja:"検討中", zh:"审核中", vi:"Đang xem xét" },
  "sourcing.status.proposed": { ko:"제안완료", en:"Proposed", ja:"提案済", zh:"已提案", vi:"Đã đề xuất" },
  "sourcing.status.ordered":  { ko:"발주완료", en:"Ordered", ja:"発注済", zh:"已下单", vi:"Đã đặt hàng" },

  // ── 공급업체 ──
  "sup.title":          { ko:"공급업체 관리", en:"Supplier Management", ja:"仕入先管理", zh:"供应商管理", vi:"Quản lý nhà cung cấp" },
  "sup.add":            { ko:"거래처 추가", en:"Add Supplier", ja:"取引先追加", zh:"添加供应商", vi:"Thêm nhà cung cấp" },
  "sup.edit":           { ko:"거래처 수정", en:"Edit Supplier", ja:"取引先編集", zh:"编辑供应商", vi:"Chỉnh sửa nhà cung cấp" },
  "sup.search":         { ko:"업체명, 카테고리, 위치 검색...", en:"Search name, category, location...", ja:"会社名、カテゴリ、場所を検索...", zh:"搜索名称、类别、位置...", vi:"Tìm tên, danh mục, vị trí..." },
  "sup.empty":          { ko:"거래처가 없습니다", en:"No suppliers", ja:"取引先がありません", zh:"没有供应商", vi:"Không có nhà cung cấp" },
  "sup.empty_sub":      { ko:"+ 버튼으로 추가하세요", en:"Tap + to add", ja:"＋で追加", zh:"点击 + 添加", vi:"Nhấn + để thêm" },
  "sup.detail":         { ko:"거래처 상세", en:"Supplier Detail", ja:"取引先詳細", zh:"供应商详情", vi:"Chi tiết nhà cung cấp" },
  "sup.name":           { ko:"업체명 *", en:"Company name *", ja:"会社名 *", zh:"公司名称 *", vi:"Tên công ty *" },
  "sup.contact":        { ko:"담당자명", en:"Contact person", ja:"担当者名", zh:"联系人", vi:"Người liên hệ" },
  "sup.phone":          { ko:"전화번호", en:"Phone", ja:"電話番号", zh:"电话号码", vi:"Số điện thoại" },
  "sup.wechat":         { ko:"위챗 ID", en:"WeChat ID", ja:"WeChat ID", zh:"微信ID", vi:"WeChat ID" },
  "sup.market":         { ko:"시장 위치", en:"Market location", ja:"市場場所", zh:"市场位置", vi:"Vị trí thị trường" },
  "sup.category":       { ko:"취급 카테고리", en:"Category", ja:"取扱カテゴリ", zh:"经营类别", vi:"Danh mục kinh doanh" },
  "sup.url1688":        { ko:"1688 URL", en:"1688 URL", ja:"1688 URL", zh:"1688网址", vi:"1688 URL" },
  "sup.memo":           { ko:"메모", en:"Memo", ja:"メモ", zh:"备注", vi:"Ghi chú" },
  "sup.scan":           { ko:"명함 스캔", en:"Scan Card", ja:"名刺スキャン", zh:"扫描名片", vi:"Quét danh thiếp" },
  "sup.scanning":       { ko:"분석중...", en:"Analyzing...", ja:"分析中...", zh:"分析中...", vi:"Đang phân tích..." },
  "sup.locate":         { ko:"현위치", en:"My Location", ja:"現在地", zh:"当前位置", vi:"Vị trí hiện tại" },
  "sup.locating":       { ko:"감지중", en:"Detecting...", ja:"検出中", zh:"检测中", vi:"Đang xác định..." },
  "sup.delete_confirm": { ko:"이 거래처를 삭제할까요?", en:"Delete this supplier?", ja:"この取引先を削除しますか？", zh:"确定删除此供应商？", vi:"Xóa nhà cung cấp này?" },
  "sup.save":           { ko:"저장", en:"Save", ja:"保存", zh:"保存", vi:"Lưu" },
  "sup.saving":         { ko:"저장 중...", en:"Saving...", ja:"保存中...", zh:"保存中...", vi:"Đang lưu..." },

  // ── 공통 ──
  "common.loading": { ko:"불러오는 중...", en:"Loading...", ja:"読み込み中...", zh:"加载中...", vi:"Đang tải..." },
  "common.back":    { ko:"뒤로", en:"Back", ja:"戻る", zh:"返回", vi:"Quay lại" },
  "common.qr_scan": { ko:"QR스캔", en:"QR Scan", ja:"QRスキャン", zh:"扫描QR", vi:"Quét QR" },
  "common.modify":  { ko:"수정", en:"Edit", ja:"編集", zh:"编辑", vi:"Chỉnh sửa" },
};

// ── 헬퍼 ─────────────────────────────────────────────────────
export function getStoredLang(): LangId {
  try {
    const l = localStorage.getItem("lang") as LangId | null;
    if (l && LANGS.some((x) => x.id === l)) return l;
  } catch {}
  return "ko";
}

export function setStoredLang(id: LangId) {
  try { localStorage.setItem("lang", id); } catch {}
}

export function translate(lang: LangId, key: string, vars?: Record<string, string>): string {
  // en-SG는 en 번역 사용
  const effectiveLang = lang === "en-SG" ? "en" : lang as "ko"|"en"|"zh"|"ja"|"vi";
  let str = dict[key]?.[effectiveLang] ?? dict[key]?.["en"] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v);
    });
  }
  return str;
}

// ── React hook ───────────────────────────────────────────────
export function useTranslation() {
  const [lang, setLang] = useState<LangId>("ko");

  useEffect(() => {
    setLang(getStoredLang());
  }, []);

  const t = (key: string, vars?: Record<string, string>) => translate(lang, key, vars);

  const changeLang = (id: LangId) => {
    setStoredLang(id);
    setLang(id);
  };

  return { lang, t, changeLang };
}
