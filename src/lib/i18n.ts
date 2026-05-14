"use client";
import { useEffect, useState } from "react";

export const LANGS = [
  { id: "ko", label: "한국어", flag: "🇰🇷", name: "한국어" },
  { id: "en", label: "English", flag: "🇺🇸", name: "English" },
  { id: "ja", label: "日本語", flag: "🇯🇵", name: "日本語" },
  { id: "zh", label: "简体中文", flag: "🇨🇳", name: "简体中文" },
  { id: "zh-tw", label: "繁體中文", flag: "🇹🇼", name: "繁體中文" },
  { id: "ru", label: "Русский", flag: "🇷🇺", name: "Русский" },
  { id: "th", label: "ภาษาไทย", flag: "🇹🇭", name: "ภาษาไทย" },
] as const;

export type LangId = (typeof LANGS)[number]["id"];

// ── 번역 사전 ────────────────────────────────────────────────
const dict: Record<string, Record<LangId, string>> = {
  // ── 온보딩 ──
  "ob.lang_title":    { ko:"언어를 선택하세요", en:"Choose your language", ja:"言語を選択", zh:"请选择语言", "zh-tw":"請選擇語言", ru:"Выберите язык", th:"เลือกภาษา" },
  "ob.lang_sub":      { ko:"앱 전체에 적용됩니다", en:"This applies to the whole app", ja:"アプリ全体に適用されます", zh:"将应用于整个应用", "zh-tw":"將套用於整個應用程式", ru:"Применится ко всему приложению", th:"จะใช้กับทั้งแอป" },
  "ob.name_title":    { ko:"어떻게 불러드릴까요? 👋", en:"What should we call you? 👋", ja:"何とお呼びすれば？👋", zh:"我们该怎么称呼您？👋", "zh-tw":"我們該怎麼稱呼您？👋", ru:"Как вас называть? 👋", th:"เราจะเรียกคุณว่าอะไร? 👋" },
  "ob.name_sub":      { ko:"업체명, 닉네임, 이름 — 편하신 대로", en:"Company, nickname, or name", ja:"会社名、ニックネーム、名前など", zh:"公司名、昵称或姓名", "zh-tw":"公司名、暱稱或姓名", ru:"Компания, ник или имя", th:"ชื่อบริษัท ชื่อเล่น หรือชื่อของคุณ" },
  "ob.name_ph":       { ko:"예: 홍길동 / 이우소싱 / 따봉무역", en:"e.g. John / ABC Trading", ja:"例: 山田 / ABC商事", zh:"例: 张先生 / ABC贸易", "zh-tw":"例: 張先生 / ABC貿易", ru:"Напр.: Иван / ABC Трейд", th:"เช่น: สมชาย / ABC Trading" },
  "ob.theme_title":   { ko:"테마를 선택하세요 🎨", en:"Choose a theme 🎨", ja:"テーマを選択 🎨", zh:"选择主题 🎨", "zh-tw":"選擇主題 🎨", ru:"Выберите тему 🎨", th:"เลือกธีม 🎨" },
  "ob.theme_sub":     { ko:"나중에 설정에서 바꿀 수 있어요", en:"You can change this later in settings", ja:"後で設定から変更できます", zh:"稍后可在设置中更改", "zh-tw":"稍後可在設定中更改", ru:"Можно изменить позже в настройках", th:"คุณสามารถเปลี่ยนได้ในการตั้งค่า" },
  "ob.next":          { ko:"다음", en:"Next", ja:"次へ", zh:"下一步", "zh-tw":"下一步", ru:"Далее", th:"ถัดไป" },
  "ob.start":         { ko:"시작하기 🚀", en:"Get Started 🚀", ja:"始める 🚀", zh:"开始使用 🚀", "zh-tw":"開始使用 🚀", ru:"Начать 🚀", th:"เริ่มเลย 🚀" },
  "ob.app_name":      { ko:"소싱킷", en:"SourcingKit", ja:"ソーシングキット", zh:"采购助手", "zh-tw":"採購助手", ru:"SourcingKit", th:"SourcingKit" },
  "ob.app_desc":      { ko:"중국 무역 소싱 관리", en:"China Trade Sourcing Manager", ja:"中国貿易仕入れ管理", zh:"中国贸易采购管理", "zh-tw":"中國貿易採購管理", ru:"Управление закупками в Китае", th:"จัดการการจัดหาสินค้าจากจีน" },

  // ── 내 정보 인삿말 (랜덤) ──
  "greet.0":  { ko:"사장님, 오늘 3만보 목표! 시장 정복 가즈아 🚶", en:"Boss, aim for 30,000 steps today! Conquer the market 🚶", ja:"社長、今日は3万歩目標！市場を制覇しよう 🚶", zh:"老板，今天目标3万步！征服市场出发 🚶", "zh-tw":"老闆，今天目標3萬步！征服市場出發 🚶", ru:"Сегодня цель — 30 000 шагов! Захватим рынок 🚶", th:"วันนี้เป้าหมาย 30,000 ก้าว! ไปพิชิตตลาดกัน 🚶" },
  "greet.1":  { ko:"대표님, 오늘 대박 상품 반드시 찾는다! 🔥", en:"Find that winning product today, no matter what! 🔥", ja:"社長、今日は絶対に売れる商品を見つける！🔥", zh:"老板，今天一定要找到爆款！🔥", "zh-tw":"老闆，今天一定要找到爆款！🔥", ru:"Сегодня обязательно найдём хит! 🔥", th:"วันนี้ต้องหาสินค้าดังให้ได้! 🔥" },
  "greet.2":  { ko:"사장님, 발품이 곧 이익이에요 👟", en:"Every step you walk is profit in the making 👟", ja:"社長、足で稼ぐのが仕入れの基本！👟", zh:"老板，多走多赚，迈开腿就是利润 👟", "zh-tw":"老闆，多走多賺，邁開腿就是利潤 👟", ru:"Каждый шаг — это прибыль, босс 👟", th:"ทุกก้าวที่เดินคือกำไร 👟" },
  "greet.3":  { ko:"대표님, 1구부터 5구까지 오늘 다 뒤진다! 🗺️", en:"Scanning every section of the market today! 🗺️", ja:"今日は1区から5区まで全部回る！🗺️", zh:"老板，今天从一区扫到五区！🗺️", "zh-tw":"老闆，今天從一區掃到五區！🗺️", ru:"Сегодня обходим весь рынок сверху донизу! 🗺️", th:"วันนี้สำรวจทุกโซนของตลาด! 🗺️" },
  "greet.4":  { ko:"사장님, 거래처 명함 오늘 10장 목표! 📇", en:"Target: collect 10 supplier cards today! 📇", ja:"社長、今日は名刺10枚ゲット目標！📇", zh:"老板，今天目标拿到10张名片！📇", "zh-tw":"老闆，今天目標拿到10張名片！📇", ru:"Цель — 10 визиток от поставщиков сегодня! 📇", th:"เป้าหมายวันนี้: รับนามบัตรผู้จัดหา 10 ใบ! 📇" },
  "greet.5":  { ko:"대표님, 신상 선점이 곧 경쟁력! 빨리 움직여요 ⚡", en:"First to find new items wins — move fast! ⚡", ja:"新商品を先に見つけたもん勝ち！さあ動こう ⚡", zh:"老板，先下手为强！快去抢先机 ⚡", "zh-tw":"老闆，先下手為強！快去搶先機 ⚡", ru:"Первым найти новинки — значит победить! ⚡", th:"ใครหาสินค้าใหม่ก่อนคือผู้ชนะ! ⚡" },
  "greet.6":  { ko:"사장님, 오늘 가격 협상 강하게 들어가요 💪", en:"Time to negotiate hard today, boss 💪", ja:"社長、今日は価格交渉で強気に行こう！💪", zh:"老板，今天砍价要狠一点！💪", "zh-tw":"老闆，今天砍價要狠一點！💪", ru:"Сегодня торгуемся жёстко! 💪", th:"วันนี้ต่อราคาให้หนัก! 💪" },
  "greet.7":  { ko:"대표님, 위안화 지금이 기회예요! 환율 확인 📈", en:"Check the CNY rate — now might be the moment! 📈", ja:"社長、今が仕入れのチャンス！為替を確認して 📈", zh:"老板，现在汇率不错，抓紧机会！📈", "zh-tw":"老闆，現在匯率不錯，把握機會！📈", ru:"Курс юаня выгодный — не упустите момент! 📈", th:"ตอนนี้อัตราแลกเปลี่ยนดี อย่าพลาด! 📈" },
  "greet.8":  { ko:"사장님, 오늘 소싱한 상품 바로 원가 계산해요 🧮", en:"Log today's finds and crunch the numbers! 🧮", ja:"社長、今日仕入れた商品の原価、すぐ計算！🧮", zh:"老板，今天找到的商品马上核算成本！🧮", "zh-tw":"老闆，今天找到的商品馬上核算成本！🧮", ru:"Считаем себестоимость сегодняшних находок! 🧮", th:"คำนวณต้นทุนสินค้าที่หาได้วันนี้เลย! 🧮" },
  "greet.9":  { ko:"대표님, 오늘도 현장이 최고의 교과서! 📚", en:"The market floor is the best classroom — get out there! 📚", ja:"社長、今日も市場が最高の教科書！📚", zh:"老板，市场就是最好的课堂，出发！📚", "zh-tw":"老闆，市場就是最好的課堂，出發！📚", ru:"Рынок — лучший учебник! Вперёд! 📚", th:"ตลาดคือห้องเรียนที่ดีที่สุด! ออกไปเลย! 📚" },

  // ── 하단 네비게이션 ──
  "nav.home":       { ko:"홈", en:"Home", ja:"ホーム", zh:"首页", "zh-tw":"首頁", ru:"Главная", th:"หน้าหลัก" },
  "nav.calc":       { ko:"계산기", en:"Calc", ja:"計算機", zh:"计算器", "zh-tw":"計算機", ru:"Расчёт", th:"คำนวณ" },
  "nav.sourcing":   { ko:"소싱수첩", en:"Sourcing", ja:"仕入帳", zh:"采购本", "zh-tw":"採購本", ru:"Поиск", th:"สมุดซื้อ" },
  "nav.field":      { ko:"현장", en:"Field", ja:"現場", zh:"现场", "zh-tw":"現場", ru:"На месте", th:"ภาคสนาม" },
  "nav.hs":         { ko:"HS코드", en:"HS Code", ja:"HSコード", zh:"HS编码", "zh-tw":"HS編碼", ru:"HS код", th:"รหัส HS" },
  "nav.more":       { ko:"더보기", en:"More", ja:"もっと", zh:"更多", "zh-tw":"更多", ru:"Ещё", th:"เพิ่มเติม" },

  // ── 홈 ──
  "home.greeting":  { ko:"안녕하세요, {name}님 👋", en:"Hello, {name} 👋", ja:"こんにちは、{name}さん 👋", zh:"您好，{name} 👋", "zh-tw":"您好，{name} 👋", ru:"Привет, {name} 👋", th:"สวัสดี, {name} 👋" },
  "home.greet_no_name": { ko:"안녕하세요 👋", en:"Hello 👋", ja:"こんにちは 👋", zh:"您好 👋", "zh-tw":"您好 👋", ru:"Привет 👋", th:"สวัสดี 👋" },
  "home.subtitle":  { ko:"오늘도 좋은 소싱 되세요", en:"Happy sourcing today!", ja:"良い仕入れを！", zh:"祝今天采购顺利！", "zh-tw":"祝今天採購順利！", ru:"Удачного сорсинга!", th:"ขอให้ซื้อสินค้าได้ดีวันนี้!" },
  "home.rate":      { ko:"오늘 환율 (CNY)", en:"Today's Rate (CNY)", ja:"本日レート (CNY)", zh:"今日汇率 (CNY)", "zh-tw":"今日匯率 (CNY)", ru:"Курс сегодня (CNY)", th:"อัตราแลกเปลี่ยน (CNY)" },
  "home.stats":     { ko:"소싱 현황", en:"Sourcing Status", ja:"仕入れ状況", zh:"采购状态", "zh-tw":"採購狀態", ru:"Статус закупок", th:"สถานะการซื้อ" },
  "home.reviewing": { ko:"검토중", en:"Reviewing", ja:"検討中", zh:"审核中", "zh-tw":"審核中", ru:"На рассмотрении", th:"กำลังตรวจสอบ" },
  "home.proposed":  { ko:"제안완료", en:"Proposed", ja:"提案済", zh:"已提案", "zh-tw":"已提案", ru:"Предложено", th:"เสนอแล้ว" },
  "home.ordered":   { ko:"발주완료", en:"Ordered", ja:"発注済", zh:"已下单", "zh-tw":"已下單", ru:"Заказано", th:"สั่งแล้ว" },
  "home.quick":     { ko:"현장 바로가기", en:"Quick Actions", ja:"クイックアクション", zh:"快速操作", "zh-tw":"快速操作", ru:"Быстрые действия", th:"ทางลัด" },
  "home.photo":     { ko:"상품 촬영", en:"Photo Product", ja:"商品撮影", zh:"拍摄商品", "zh-tw":"拍攝商品", ru:"Фото товара", th:"ถ่ายสินค้า" },
  "home.photo_sub": { ko:"사진+가격 바로 저장", en:"Save photo & price", ja:"写真＋価格を保存", zh:"保存照片和价格", "zh-tw":"保存照片和價格", ru:"Фото + цена", th:"บันทึกรูป+ราคา" },
  "home.calc":      { ko:"원가 계산", en:"Cost Calculator", ja:"原価計算", zh:"成本计算", "zh-tw":"成本計算", ru:"Расчёт стоимости", th:"คำนวณต้นทุน" },
  "home.menu":      { ko:"메뉴 바로가기", en:"Menu", ja:"メニュー", zh:"菜单", "zh-tw":"選單", ru:"Меню", th:"เมนู" },

  // ── 더보기 ──
  "more.title":     { ko:"더보기", en:"More", ja:"もっと", zh:"更多", "zh-tw":"更多", ru:"Ещё", th:"เพิ่มเติม" },
  "more.subtitle":  { ko:"관리 기능 · 앱 설정", en:"Management · Settings", ja:"管理 · 設定", zh:"管理 · 设置", "zh-tw":"管理 · 設定", ru:"Управление · Настройки", th:"จัดการ · ตั้งค่า" },
  "more.my_info":   { ko:"내 정보", en:"My Profile", ja:"マイプロフィール", zh:"我的信息", "zh-tw":"我的資訊", ru:"Мой профиль", th:"ข้อมูลของฉัน" },
  "more.disp_name": { ko:"표시 이름", en:"Display name", ja:"表示名", zh:"显示名称", "zh-tw":"顯示名稱", ru:"Отображаемое имя", th:"ชื่อที่แสดง" },
  "more.edit":      { ko:"수정", en:"Edit", ja:"編集", zh:"编辑", "zh-tw":"編輯", ru:"Изменить", th:"แก้ไข" },
  "more.save":      { ko:"저장", en:"Save", ja:"保存", zh:"保存", "zh-tw":"儲存", ru:"Сохранить", th:"บันทึก" },
  "more.cancel":    { ko:"취소", en:"Cancel", ja:"キャンセル", zh:"取消", "zh-tw":"取消", ru:"Отмена", th:"ยกเลิก" },
  "more.theme":     { ko:"앱 테마", en:"App Theme", ja:"テーマ", zh:"应用主题", "zh-tw":"應用程式主題", ru:"Тема", th:"ธีมแอป" },
  "more.lang":      { ko:"언어", en:"Language", ja:"言語", zh:"语言", "zh-tw":"語言", ru:"Язык", th:"ภาษา" },
  "more.menu":      { ko:"관리 메뉴", en:"Management", ja:"管理メニュー", zh:"管理菜单", "zh-tw":"管理選單", ru:"Управление", th:"เมนูจัดการ" },
  "more.suppliers": { ko:"공급업체", en:"Suppliers", ja:"仕入先", zh:"供应商", "zh-tw":"供應商", ru:"Поставщики", th:"ผู้จัดหาสินค้า" },
  "more.suppliers_sub": { ko:"거래처 정보 · 명함 스캔", en:"Contacts · Business card scan", ja:"取引先情報 · 名刺スキャン", zh:"供应商信息 · 名片扫描", "zh-tw":"供應商資訊 · 名片掃描", ru:"Контакты · Сканер визиток", th:"ข้อมูลผู้จัดหา · สแกนนามบัตร" },
  "more.proposals": { ko:"제안서 보내기", en:"Send Proposal", ja:"提案書送信", zh:"发送提案", "zh-tw":"發送提案", ru:"Отправить предложение", th:"ส่งข้อเสนอ" },
  "more.proposals_sub": { ko:"바이어에게 상품 제안", en:"Propose products to buyers", ja:"バイヤーへ商品提案", zh:"向买家推荐商品", "zh-tw":"向買家推薦商品", ru:"Предложить товары покупателям", th:"เสนอสินค้าให้ผู้ซื้อ" },
  "more.buyers":    { ko:"바이어 목록", en:"Buyer List", ja:"バイヤー一覧", zh:"买家列表", "zh-tw":"買家清單", ru:"Список покупателей", th:"รายชื่อผู้ซื้อ" },
  "more.buyers_sub":{ ko:"바이어 연락처 관리", en:"Manage buyer contacts", ja:"バイヤー連絡先管理", zh:"管理买家联系方式", "zh-tw":"管理買家聯絡方式", ru:"Управление контактами", th:"จัดการรายชื่อผู้ซื้อ" },
  "more.orders":    { ko:"주문 관리", en:"Order Management", ja:"受注管理", zh:"订单管理", "zh-tw":"訂單管理", ru:"Управление заказами", th:"จัดการคำสั่งซื้อ" },
  "more.orders_sub":{ ko:"발주 → 선적 단계 추적", en:"Order → Shipping tracking", ja:"発注→出荷 追跡", zh:"下单→发货 追踪", "zh-tw":"下單→出貨 追蹤", ru:"Заказ → Отгрузка", th:"ติดตามคำสั่งซื้อ" },
  "more.hs_sub":    { ko:"관세율 · HS코드 검색", en:"Tariff rate · HS code search", ja:"関税率 · HSコード検索", zh:"关税率 · HS编码查询", "zh-tw":"關稅率 · HS編碼查詢", ru:"Тариф · Поиск HS кода", th:"อัตราภาษี · ค้นหา HS" },
  "more.name_ph":   { ko:"이름 / 업체명 / 닉네임", en:"Name / Company / Nickname", ja:"名前 / 会社名 / ニックネーム", zh:"姓名 / 公司名 / 昵称", "zh-tw":"姓名 / 公司名 / 暱稱", ru:"Имя / Компания / Ник", th:"ชื่อ / บริษัท / ชื่อเล่น" },

  // ── 소싱수첩 ──
  "sourcing.title":  { ko:"소싱 수첩", en:"Sourcing", ja:"仕入帳", zh:"采购本", "zh-tw":"採購本", ru:"Закупки", th:"สมุดซื้อ" },
  "sourcing.add":    { ko:"상품 추가", en:"Add Product", ja:"商品追加", zh:"添加商品", "zh-tw":"新增商品", ru:"Добавить товар", th:"เพิ่มสินค้า" },
  "sourcing.search": { ko:"상품명, 거래처 검색...", en:"Search product, supplier...", ja:"商品名、取引先検索...", zh:"搜索商品、供应商...", "zh-tw":"搜尋商品、供應商...", ru:"Поиск товара, поставщика...", th:"ค้นหาสินค้า, ผู้จัดหา..." },
  "sourcing.empty":  { ko:"저장된 상품이 없어요", en:"No products saved", ja:"保存された商品がありません", zh:"没有已保存的商品", "zh-tw":"沒有已儲存的商品", ru:"Нет сохранённых товаров", th:"ไม่มีสินค้าที่บันทึก" },
  "sourcing.empty_sub": { ko:"+ 버튼으로 상품을 추가하세요", en:"Tap + to add a product", ja:"＋ボタンで商品を追加", zh:"点击 + 添加商品", "zh-tw":"點擊 + 新增商品", ru:"Нажмите + чтобы добавить", th:"แตะ + เพื่อเพิ่มสินค้า" },
  "sourcing.save":   { ko:"저장", en:"Save", ja:"保存", zh:"保存", "zh-tw":"儲存", ru:"Сохранить", th:"บันทึก" },
  "sourcing.saving": { ko:"저장 중...", en:"Saving...", ja:"保存中...", zh:"保存中...", "zh-tw":"儲存中...", ru:"Сохранение...", th:"กำลังบันทึก..." },
  "sourcing.cost_cny": { ko:"원가 (CNY)", en:"Cost (CNY)", ja:"原価 (CNY)", zh:"成本 (CNY)", "zh-tw":"成本 (CNY)", ru:"Стоимость (CNY)", th:"ต้นทุน (CNY)" },
  "sourcing.supplier": { ko:"거래처 (선택)", en:"Supplier (optional)", ja:"取引先 (任意)", zh:"供应商 (选填)", "zh-tw":"供應商 (選填)", ru:"Поставщик (необязательно)", th:"ผู้จัดหา (ไม่บังคับ)" },
  "sourcing.location": { ko:"가게 위치 (선택)", en:"Shop Location (optional)", ja:"店舗場所 (任意)", zh:"店铺位置 (选填)", "zh-tw":"店鋪位置 (選填)", ru:"Местонахождение (необязательно)", th:"ที่ตั้งร้าน (ไม่บังคับ)" },
  "sourcing.moq":    { ko:"최소주문수량 MOQ (선택)", en:"Min. Order Qty (optional)", ja:"最低発注数 (任意)", zh:"最小起订量 MOQ (选填)", "zh-tw":"最小起訂量 (選填)", ru:"Мин. заказ (необязательно)", th:"จำนวนสั่งซื้อขั้นต่ำ (ไม่บังคับ)" },
  "sourcing.cost_settings": { ko:"원가 계산 설정", en:"Cost Settings", ja:"原価計算設定", zh:"成本计算设置", "zh-tw":"成本計算設定", ru:"Настройки стоимости", th:"ตั้งค่าต้นทุน" },
  "sourcing.status.sourcing": { ko:"검토중", en:"Reviewing", ja:"検討中", zh:"审核中", "zh-tw":"審核中", ru:"Рассмотрение", th:"กำลังตรวจสอบ" },
  "sourcing.status.proposed": { ko:"제안완료", en:"Proposed", ja:"提案済", zh:"已提案", "zh-tw":"已提案", ru:"Предложено", th:"เสนอแล้ว" },
  "sourcing.status.ordered":  { ko:"발주완료", en:"Ordered", ja:"発注済", zh:"已下单", "zh-tw":"已下單", ru:"Заказано", th:"สั่งแล้ว" },

  // ── 공급업체 ──
  "sup.title":      { ko:"공급업체 관리", en:"Supplier Management", ja:"仕入先管理", zh:"供应商管理", "zh-tw":"供應商管理", ru:"Управление поставщиками", th:"จัดการผู้จัดหา" },
  "sup.add":        { ko:"거래처 추가", en:"Add Supplier", ja:"取引先追加", zh:"添加供应商", "zh-tw":"新增供應商", ru:"Добавить поставщика", th:"เพิ่มผู้จัดหา" },
  "sup.edit":       { ko:"거래처 수정", en:"Edit Supplier", ja:"取引先編集", zh:"编辑供应商", "zh-tw":"編輯供應商", ru:"Редактировать", th:"แก้ไขผู้จัดหา" },
  "sup.search":     { ko:"업체명, 카테고리, 위치 검색...", en:"Search name, category, location...", ja:"会社名、カテゴリ、場所を検索...", zh:"搜索名称、类别、位置...", "zh-tw":"搜尋名稱、類別、位置...", ru:"Поиск имени, категории...", th:"ค้นหาชื่อ, ประเภท, ตำแหน่ง..." },
  "sup.empty":      { ko:"거래처가 없습니다", en:"No suppliers", ja:"取引先がありません", zh:"没有供应商", "zh-tw":"沒有供應商", ru:"Нет поставщиков", th:"ไม่มีผู้จัดหา" },
  "sup.empty_sub":  { ko:"+ 버튼으로 추가하세요", en:"Tap + to add", ja:"＋で追加", zh:"点击 + 添加", "zh-tw":"點擊 + 新增", ru:"Нажмите + для добавления", th:"แตะ + เพื่อเพิ่ม" },
  "sup.detail":     { ko:"거래처 상세", en:"Supplier Detail", ja:"取引先詳細", zh:"供应商详情", "zh-tw":"供應商詳情", ru:"Детали поставщика", th:"รายละเอียดผู้จัดหา" },
  "sup.name":       { ko:"업체명 *", en:"Company name *", ja:"会社名 *", zh:"公司名称 *", "zh-tw":"公司名稱 *", ru:"Название *", th:"ชื่อบริษัท *" },
  "sup.contact":    { ko:"담당자명", en:"Contact person", ja:"担当者名", zh:"联系人", "zh-tw":"聯絡人", ru:"Контактное лицо", th:"ชื่อผู้ติดต่อ" },
  "sup.phone":      { ko:"전화번호", en:"Phone", ja:"電話番号", zh:"电话号码", "zh-tw":"電話號碼", ru:"Телефон", th:"เบอร์โทร" },
  "sup.wechat":     { ko:"위챗 ID", en:"WeChat ID", ja:"WeChat ID", zh:"微信ID", "zh-tw":"微信ID", ru:"WeChat ID", th:"WeChat ID" },
  "sup.market":     { ko:"시장 위치", en:"Market location", ja:"市場場所", zh:"市场位置", "zh-tw":"市場位置", ru:"Рынок", th:"ตำแหน่งตลาด" },
  "sup.category":   { ko:"취급 카테고리", en:"Category", ja:"取扱カテゴリ", zh:"经营类别", "zh-tw":"經營類別", ru:"Категория", th:"ประเภทสินค้า" },
  "sup.url1688":    { ko:"1688 URL", en:"1688 URL", ja:"1688 URL", zh:"1688网址", "zh-tw":"1688網址", ru:"1688 URL", th:"1688 URL" },
  "sup.memo":       { ko:"메모", en:"Memo", ja:"メモ", zh:"备注", "zh-tw":"備註", ru:"Заметка", th:"บันทึก" },
  "sup.scan":       { ko:"명함 스캔", en:"Scan Card", ja:"名刺スキャン", zh:"扫描名片", "zh-tw":"掃描名片", ru:"Скан визитки", th:"สแกนนามบัตร" },
  "sup.scanning":   { ko:"분석중...", en:"Analyzing...", ja:"分析中...", zh:"分析中...", "zh-tw":"分析中...", ru:"Анализирую...", th:"กำลังวิเคราะห์..." },
  "sup.locate":     { ko:"현위치", en:"My Location", ja:"現在地", zh:"当前位置", "zh-tw":"目前位置", ru:"Мое место", th:"ตำแหน่งปัจจุบัน" },
  "sup.locating":   { ko:"감지중", en:"Detecting...", ja:"検出中", zh:"检测中", "zh-tw":"偵測中", ru:"Определяю...", th:"กำลังตรวจจับ" },
  "sup.delete_confirm": { ko:"이 거래처를 삭제할까요?", en:"Delete this supplier?", ja:"この取引先を削除しますか？", zh:"确定删除此供应商？", "zh-tw":"確定刪除此供應商？", ru:"Удалить поставщика?", th:"ลบผู้จัดหานี้?" },
  "sup.save":       { ko:"저장", en:"Save", ja:"保存", zh:"保存", "zh-tw":"儲存", ru:"Сохранить", th:"บันทึก" },
  "sup.saving":     { ko:"저장 중...", en:"Saving...", ja:"保存中...", zh:"保存中...", "zh-tw":"儲存中...", ru:"Сохранение...", th:"กำลังบันทึก..." },

  // ── 공통 ──
  "common.loading": { ko:"불러오는 중...", en:"Loading...", ja:"読み込み中...", zh:"加载中...", "zh-tw":"載入中...", ru:"Загрузка...", th:"กำลังโหลด..." },
  "common.back":    { ko:"뒤로", en:"Back", ja:"戻る", zh:"返回", "zh-tw":"返回", ru:"Назад", th:"กลับ" },
  "common.qr_scan": { ko:"QR스캔", en:"QR Scan", ja:"QRスキャン", zh:"扫描QR", "zh-tw":"掃描QR", ru:"QR скан", th:"สแกน QR" },
  "common.modify":  { ko:"수정", en:"Edit", ja:"編集", zh:"编辑", "zh-tw":"編輯", ru:"Изменить", th:"แก้ไข" },
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
  let str = dict[key]?.[lang] ?? dict[key]?.["en"] ?? key;
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
