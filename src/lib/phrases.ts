export interface Phrase {
  kr: string;
  cn: string;
  pinyin: string;
}

export interface PhraseCategory {
  id: string;
  icon: string;
  label: string;       // 한국어
  labelCn: string;     // 중국어 카테고리명
  color: string;       // tailwind bg class
  textColor: string;   // tailwind text class
  phrases: Phrase[];
  nearbyKeyword?: string;  // Amap 검색 키워드
}

export const PHRASE_CATEGORIES: PhraseCategory[] = [
  {
    id: "immigration",
    icon: "🛂",
    label: "입국심사",
    labelCn: "入境审查",
    color: "bg-blue-100",
    textColor: "text-blue-700",
    phrases: [
      { kr: "관광 목적으로 왔습니다", cn: "我是来旅游的", pinyin: "Wǒ shì lái lǚyóu de" },
      { kr: "비즈니스 출장입니다", cn: "我是来出差的", pinyin: "Wǒ shì lái chūchāi de" },
      { kr: "한국에서 왔습니다", cn: "我从韩国来", pinyin: "Wǒ cóng Hánguó lái" },
      { kr: "7일 머물 예정입니다", cn: "我打算住七天", pinyin: "Wǒ dǎsuàn zhù qī tiān" },
      { kr: "호텔에 묵습니다", cn: "我住酒店", pinyin: "Wǒ zhù jiǔdiàn" },
      { kr: "혼자 왔습니다", cn: "我一个人来的", pinyin: "Wǒ yīgèrén lái de" },
      { kr: "이게 제 짐입니다", cn: "这是我的行李", pinyin: "Zhè shì wǒ de xínglǐ" },
      { kr: "신고할 물건 없습니다", cn: "没有需要申报的物品", pinyin: "Méiyǒu xūyào shēnbào de wùpǐn" },
    ],
  },
  {
    id: "transport",
    icon: "🚗",
    label: "이동·택시",
    labelCn: "交通出行",
    color: "bg-yellow-100",
    textColor: "text-yellow-700",
    phrases: [
      { kr: "이우 가주세요", cn: "请去义乌", pinyin: "Qǐng qù Yìwū" },
      { kr: "이 주소로 가주세요", cn: "请去这个地址", pinyin: "Qǐng qù zhège dìzhǐ" },
      { kr: "미터기 켜주세요", cn: "请打表", pinyin: "Qǐng dǎbiǎo" },
      { kr: "얼마예요?", cn: "多少钱？", pinyin: "Duōshǎo qián?" },
      { kr: "여기서 내려주세요", cn: "在这里停车", pinyin: "Zài zhèlǐ tíngchē" },
      { kr: "잠깐 기다려 주세요", cn: "请等一下", pinyin: "Qǐng děng yīxià" },
      { kr: "국제상무성으로 가주세요", cn: "请去国际商贸城", pinyin: "Qǐng qù Guójì Shāngmào Chéng" },
      { kr: "공항으로 가주세요", cn: "请去机场", pinyin: "Qǐng qù jīchǎng" },
      { kr: "기차역으로 가주세요", cn: "请去火车站", pinyin: "Qǐng qù huǒchēzhàn" },
      { kr: "영수증 주세요", cn: "请给我收据", pinyin: "Qǐng gěi wǒ shōujù" },
    ],
  },
  {
    id: "hotel",
    icon: "🏨",
    label: "호텔",
    labelCn: "酒店住宿",
    color: "bg-purple-100",
    textColor: "text-purple-700",
    phrases: [
      { kr: "체크인 하려고요", cn: "我要办理入住", pinyin: "Wǒ yào bànlǐ rùzhù" },
      { kr: "예약했어요", cn: "我有预订", pinyin: "Wǒ yǒu yùdìng" },
      { kr: "와이파이 비밀번호가 뭐예요?", cn: "WiFi密码是什么？", pinyin: "WiFi mìmǎ shì shénme?" },
      { kr: "조식은 몇 시예요?", cn: "早餐几点开始？", pinyin: "Zǎocān jǐ diǎn kāishǐ?" },
      { kr: "수건 더 주세요", cn: "请再给我毛巾", pinyin: "Qǐng zài gěi wǒ máojīn" },
      { kr: "체크아웃 하겠습니다", cn: "我要退房", pinyin: "Wǒ yào tuìfáng" },
      { kr: "방을 바꿔줄 수 있어요?", cn: "可以换个房间吗？", pinyin: "Kěyǐ huàn gè fángjiān ma?" },
      { kr: "짐 맡길 수 있어요?", cn: "可以寄存行李吗？", pinyin: "Kěyǐ jìcún xínglǐ ma?" },
    ],
  },
  {
    id: "market",
    icon: "🗺️",
    label: "시장 길찾기",
    labelCn: "市场导航",
    color: "bg-green-100",
    textColor: "text-green-700",
    phrases: [
      { kr: "국제상무성이 어디예요?", cn: "国际商贸城在哪里？", pinyin: "Guójì Shāngmào Chéng zài nǎlǐ?" },
      { kr: "몇 구예요?", cn: "这是几区？", pinyin: "Zhè shì jǐ qū?" },
      { kr: "화장실이 어디예요?", cn: "厕所在哪里？", pinyin: "Cèsuǒ zài nǎlǐ?" },
      { kr: "엘리베이터가 어디예요?", cn: "电梯在哪里？", pinyin: "Diàntī zài nǎlǐ?" },
      { kr: "몇 층이에요?", cn: "几楼？", pinyin: "Jǐ lóu?" },
      { kr: "길을 잃었어요", cn: "我迷路了", pinyin: "Wǒ mí lù le" },
      { kr: "이 부스를 찾고 있어요", cn: "我在找这个摊位", pinyin: "Wǒ zài zhǎo zhège tānwèi" },
      { kr: "입구가 어디예요?", cn: "入口在哪里？", pinyin: "Rùkǒu zài nǎlǐ?" },
    ],
  },
  {
    id: "product",
    icon: "📦",
    label: "상품 문의",
    labelCn: "商品询价",
    color: "bg-orange-100",
    textColor: "text-orange-700",
    phrases: [
      { kr: "이거 얼마예요?", cn: "这个多少钱？", pinyin: "Zhège duōshǎo qián?" },
      { kr: "이거 이름이 뭐예요?", cn: "这个叫什么名字？", pinyin: "Zhège jiào shénme míngzi?" },
      { kr: "샘플 있어요?", cn: "有样品吗？", pinyin: "Yǒu yàngpǐn ma?" },
      { kr: "최소 주문량이 몇 개예요?", cn: "最少要订多少个？", pinyin: "Zuìshǎo yào dìng duōshǎo gè?" },
      { kr: "사진 찍어도 돼요?", cn: "可以拍照吗？", pinyin: "Kěyǐ pāizhào ma?" },
      { kr: "1688에 있어요?", cn: "在1688上有卖吗？", pinyin: "Zài 1688 shàng yǒu mài ma?" },
      { kr: "다른 색상 있어요?", cn: "有其他颜色吗？", pinyin: "Yǒu qítā yánsè ma?" },
      { kr: "재고가 얼마나 있어요?", cn: "库存有多少？", pinyin: "Kùcún yǒu duōshǎo?" },
      { kr: "소재가 뭐예요?", cn: "这是什么材料？", pinyin: "Zhè shì shénme cáiliào?" },
      { kr: "납기가 얼마나 걸려요?", cn: "交货期要多久？", pinyin: "Jiāohuò qī yào duōjiǔ?" },
    ],
    nearbyKeyword: undefined,
  },
  {
    id: "negotiate",
    icon: "💰",
    label: "가격 협상",
    labelCn: "价格谈判",
    color: "bg-red-100",
    textColor: "text-red-700",
    phrases: [
      { kr: "좀 깎아주세요", cn: "便宜一点，好吗？", pinyin: "Piányí yīdiǎn, hǎo ma?" },
      { kr: "너무 비싸요", cn: "太贵了", pinyin: "Tài guì le" },
      { kr: "많이 살게요", cn: "我要买很多", pinyin: "Wǒ yào mǎi hěn duō" },
      { kr: "100개 사면 얼마예요?", cn: "买一百个多少钱？", pinyin: "Mǎi yī bǎi gè duōshǎo qián?" },
      { kr: "최저가가 얼마예요?", cn: "最低价是多少？", pinyin: "Zuì dī jià shì duōshǎo?" },
      { kr: "다른 데서 더 싸게 팔던데요", cn: "别的地方卖得更便宜", pinyin: "Bié de dìfāng mài de gèng piányí" },
      { kr: "나중에 또 올게요", cn: "以后还会再来买的", pinyin: "Yǐhòu hái huì zài lái mǎi de" },
      { kr: "현금으로 낼게요", cn: "我用现金付款", pinyin: "Wǒ yòng xiànjīn fùkuǎn" },
      { kr: "가격표 보여주세요", cn: "给我看一下价格表", pinyin: "Gěi wǒ kàn yīxià jiàgébiǎo" },
    ],
  },
  {
    id: "order",
    icon: "📋",
    label: "샘플·발주",
    labelCn: "样品订货",
    color: "bg-teal-100",
    textColor: "text-teal-700",
    phrases: [
      { kr: "샘플 한 개 주세요", cn: "给我一个样品", pinyin: "Gěi wǒ yīgè yàngpǐn" },
      { kr: "샘플비가 얼마예요?", cn: "样品费多少钱？", pinyin: "Yàngpǐn fèi duōshǎo qián?" },
      { kr: "100개 주문할게요", cn: "我要订一百个", pinyin: "Wǒ yào dìng yī bǎi gè" },
      { kr: "배송비 얼마예요?", cn: "运费多少钱？", pinyin: "Yùnfèi duōshǎo qián?" },
      { kr: "언제 받을 수 있어요?", cn: "什么时候能收到？", pinyin: "Shénme shíhòu néng shōudào?" },
      { kr: "포장은 어떻게 해요?", cn: "怎么包装？", pinyin: "Zěnme bāozhuāng?" },
      { kr: "카탈로그 주세요", cn: "给我产品目录", pinyin: "Gěi wǒ chǎnpǐn mùlù" },
      { kr: "견적서 보내주세요", cn: "请发报价单给我", pinyin: "Qǐng fā bàojià dān gěi wǒ" },
    ],
  },
  {
    id: "wechat",
    icon: "💬",
    label: "위챗 교환",
    labelCn: "加微信",
    color: "bg-emerald-100",
    textColor: "text-emerald-700",
    phrases: [
      { kr: "위챗 추가할게요", cn: "加一下微信吧", pinyin: "Jiā yīxià Wēixìn ba" },
      { kr: "위챗 ID가 뭐예요?", cn: "你的微信号是什么？", pinyin: "Nǐ de Wēixìn hào shì shénme?" },
      { kr: "QR코드 스캔할게요", cn: "我扫你的二维码", pinyin: "Wǒ sǎo nǐ de èrwéimǎ" },
      { kr: "나중에 연락할게요", cn: "我联系你", pinyin: "Wǒ liánxì nǐ" },
      { kr: "한국 돌아가서 연락할게요", cn: "回韩国后联系你", pinyin: "Huí Hánguó hòu liánxì nǐ" },
      { kr: "명함 주세요", cn: "请给我名片", pinyin: "Qǐng gěi wǒ míngpiàn" },
    ],
  },
  {
    id: "restaurant",
    icon: "🍜",
    label: "식당",
    labelCn: "餐厅用餐",
    color: "bg-amber-100",
    textColor: "text-amber-700",
    nearbyKeyword: "餐厅",
    phrases: [
      { kr: "2명이요", cn: "两位", pinyin: "Liǎng wèi" },
      { kr: "메뉴 주세요", cn: "给我菜单", pinyin: "Gěi wǒ càidān" },
      { kr: "이거 주세요 (가리키며)", cn: "我要这个", pinyin: "Wǒ yào zhège" },
      { kr: "맵지 않게 해주세요", cn: "不要太辣", pinyin: "Bùyào tài là" },
      { kr: "물 주세요", cn: "给我水", pinyin: "Gěi wǒ shuǐ" },
      { kr: "계산서 주세요", cn: "买单", pinyin: "Mǎidān" },
      { kr: "맛있어요", cn: "很好吃", pinyin: "Hěn hǎochī" },
      { kr: "한국 식당 있어요?", cn: "有韩国餐厅吗？", pinyin: "Yǒu Hánguó cāntīng ma?" },
      { kr: "채식 메뉴 있어요?", cn: "有素食菜单吗？", pinyin: "Yǒu sùshí càidān ma?" },
    ],
  },
  {
    id: "massage",
    icon: "💆",
    label: "마사지",
    labelCn: "按摩足疗",
    color: "bg-pink-100",
    textColor: "text-pink-700",
    nearbyKeyword: "按摩",
    phrases: [
      { kr: "발마사지 얼마예요?", cn: "足疗多少钱？", pinyin: "Zúliáo duōshǎo qián?" },
      { kr: "전신마사지 얼마예요?", cn: "全身按摩多少钱？", pinyin: "Quánshēn ànmó duōshǎo qián?" },
      { kr: "1시간이요", cn: "一个小时", pinyin: "Yīgè xiǎoshí" },
      { kr: "세게 해주세요", cn: "用力一点", pinyin: "Yòng lì yīdiǎn" },
      { kr: "살살 해주세요", cn: "轻一点", pinyin: "Qīng yīdiǎn" },
      { kr: "거기 아파요", cn: "那里很痛", pinyin: "Nàlǐ hěn tòng" },
      { kr: "너무 좋아요", cn: "很舒服", pinyin: "Hěn shūfu" },
      { kr: "예약 가능해요?", cn: "可以预约吗？", pinyin: "Kěyǐ yùyuē ma?" },
    ],
  },
];

// 주변 검색 빠른 버튼 정의
export interface NearbyQuickBtn {
  icon: string;
  label: string;
  keyword: string;   // Amap 검색어
  phraseId: string;  // 연결할 회화 카테고리
  color: string;
}

export const NEARBY_QUICK: NearbyQuickBtn[] = [
  { icon: "🍜", label: "밥집",   keyword: "餐厅",   phraseId: "restaurant", color: "bg-amber-50 border-amber-200 text-amber-700" },
  { icon: "🇰🇷", label: "한식",   keyword: "韩国餐厅", phraseId: "restaurant", color: "bg-red-50 border-red-200 text-red-700" },
  { icon: "💆", label: "마사지", keyword: "按摩",   phraseId: "massage",    color: "bg-pink-50 border-pink-200 text-pink-700" },
  { icon: "🦶", label: "발마사지",keyword: "足疗",   phraseId: "massage",    color: "bg-purple-50 border-purple-200 text-purple-700" },
  { icon: "🏪", label: "편의점", keyword: "便利店", phraseId: "transport",  color: "bg-blue-50 border-blue-200 text-blue-700" },
  { icon: "💊", label: "약국",   keyword: "药店",   phraseId: "transport",  color: "bg-green-50 border-green-200 text-green-700" },
  { icon: "🏧", label: "ATM",    keyword: "ATM",    phraseId: "transport",  color: "bg-gray-50 border-gray-200 text-gray-700" },
  { icon: "☕", label: "카페",   keyword: "咖啡",   phraseId: "restaurant", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
];
