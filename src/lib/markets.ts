// ── 시장 가이드 데이터 ─────────────────────────────────────

export interface MarketSpot {
  name: string;
  nameKr: string;
  desc: string;
  tip?: string;
}

export interface MarketRegion {
  id: string;
  country: string;
  flag: string;
  city: string;
  title: string;
  subtitle: string;
  color: string;
  textColor: string;
  spots: MarketSpot[];
}

export const MARKET_REGIONS: MarketRegion[] = [
  {
    id: "yiwu",
    country: "중국",
    flag: "🇨🇳",
    city: "이우 (义乌)",
    title: "이우 국제무역시장",
    subtitle: "세계 최대 소비재 도매시장 · 5개 구역 170만㎡",
    color: "bg-red-50",
    textColor: "text-red-700",
    spots: [
      {
        name: "义乌国际商贸城 1~5区",
        nameKr: "이우 국제상무성 1~5구",
        desc: "완구·악세서리·공예품·크리스마스용품·문구·전자 등 구역별 전문화. 세계 바이어 상시 방문.",
        tip: "1구: 장신구·머리핀 / 2구: 완구·우산 / 3구: 공예·크리스마스 / 4구: 전자·사진 / 5구: 의류"
      },
      {
        name: "义乌篁园服装市场",
        nameKr: "이우 황원 의류시장",
        desc: "저가 의류 도매 메카. 티셔츠·바지·아동복 등 다양한 품목.",
        tip: "최소 주문량 낮고 가격 경쟁력 높음"
      },
      {
        name: "义乌家具市场",
        nameKr: "이우 가구 도매시장",
        desc: "소형 가구·인테리어 소품 전문. 상무성 외곽에 위치.",
      },
      {
        name: "柳市 (乐清)",
        nameKr: "류시장 (러칭)",
        desc: "전기부품·스위치·케이블 세계 최대 생산지. 이우에서 차로 2시간.",
        tip: "전기부품 대량 소싱 시 필수 방문지"
      },
      {
        name: "义乌国际生产资料市场",
        nameKr: "이우 국제 생산자재 시장",
        desc: "원자재·포장재·라벨·인쇄물 전문. OEM 소싱에 유리.",
      },
    ],
  },
  {
    id: "guangzhou",
    country: "중국",
    flag: "🇨🇳",
    city: "광저우 (广州)",
    title: "광저우 도매시장 & 캔톤페어",
    subtitle: "중국 최대 무역박람회 본거지 · 의류·전기 전문 도매 밀집",
    color: "bg-orange-50",
    textColor: "text-orange-700",
    spots: [
      {
        name: "广交会 (Canton Fair)",
        nameKr: "캔톤페어 (광저우 교역회)",
        desc: "세계 최대 무역박람회. 연 2회(봄 4~5월 / 가을 10~11월) 파저우 전시관에서 개최. 50만 바이어 참가.",
        tip: "1기: 전자·기계 / 2기: 일용품·선물 / 3기: 의류·식품·의약 — 미리 사전등록 필수!"
      },
      {
        name: "广州华南国际电气城 (琶洲)",
        nameKr: "화남국제전기성 (파저우)",
        desc: "조명·스위치·케이블·인테리어 자재 전문 도매. 캔톤페어 전시관 인근.",
        tip: "캔톤페어 기간 방문 시 동선 효율 극대화"
      },
      {
        name: "十三行 (시산행)",
        nameKr: "십삼행 의류시장",
        desc: "중저가 여성의류 도매 특화. 좁은 골목에 수백 개 도매상 밀집. 새벽 5시부터 가장 활발.",
        tip: "새벽 일찍 방문 추천. 현금 선호, 위챗페이 병행"
      },
      {
        name: "白马服装城",
        nameKr: "바이마 의류시장",
        desc: "십삼행 인근의 중고급 의류 도매시장. 홍콩 스타일 트렌드 의류 강세.",
      },
      {
        name: "沙河服装城",
        nameKr: "사허 의류시장",
        desc: "캐주얼·스트리트 패션 도매. 젊은 층 대상 패션 소싱에 유리.",
        tip: "지하철 2호선 사허역 도보 5분"
      },
      {
        name: "华南城 (深圳平湖)",
        nameKr: "화남청 (선전 핑후)",
        desc: "선전 소재 종합 도매단지. 전자·의류·가구·식품 등 광범위한 카테고리.",
        tip: "광저우에서 고속철 30분 거리. 하루 일정으로 병행 가능"
      },
      {
        name: "华强北",
        nameKr: "화첸베이 (선전)",
        desc: "세계 전자부품 메카. 스마트폰 부품·IC칩·LED·소형가전 도매.",
        tip: "가품 주의. 신뢰할 수 있는 가이드 동반 권장"
      },
    ],
  },
  {
    id: "japan",
    country: "일본",
    flag: "🇯🇵",
    city: "도쿄·오사카",
    title: "도쿄 빅사이트 & 마쿠하리 멧세",
    subtitle: "일본 최대 전시장 · 연간 600개+ 국제박람회 개최",
    color: "bg-pink-50",
    textColor: "text-pink-700",
    spots: [
      {
        name: "東京ビッグサイト (Tokyo Big Sight)",
        nameKr: "도쿄 빅사이트",
        desc: "도쿄 아리아케 소재. 일본 최대 전시장(230,000㎡). 기프트쇼·식품박람회·패션위크 등 연간 600여 개 박람회 개최.",
        tip: "유리카모메 '국제전시장' 하차. 도쿄역에서 40분"
      },
      {
        name: "幕張メッセ (Makuhari Messe)",
        nameKr: "마쿠하리 멧세",
        desc: "치바 소재 대형 전시장. IT·가전·자동차 관련 박람회 특화. CEATEC Japan 등 주요 IT 박람회 장소.",
        tip: "도쿄역에서 고속열차 30분. JR 해변마쿠하리역 도보 5분"
      },
      {
        name: "インテックス大阪 (INTEX Osaka)",
        nameKr: "인텍스 오사카",
        desc: "오사카 소재 국제전시장. 간사이 지역 최대 박람회장. 오사카 국제 선물박람회 등 개최.",
        tip: "오사카 지하철 코스모스퀘어역 인근"
      },
      {
        name: "合羽橋道具街 (카파바시)",
        nameKr: "카파바시 도구 거리 (도쿄)",
        desc: "식기·주방용품·식품 샘플 전문 도매 거리. 약 170여 개 전문점 밀집. 업소용·가정용 모두 취급.",
        tip: "아사쿠사 인근. 화요일 정기휴무 많음"
      },
    ],
  },
  {
    id: "korea",
    country: "한국",
    flag: "🇰🇷",
    city: "서울·수도권",
    title: "국내 주요 전시장",
    subtitle: "COEX · KINTEX · BEXCO — 연간 700개+ 전시회",
    color: "bg-blue-50",
    textColor: "text-blue-700",
    spots: [
      {
        name: "COEX (코엑스)",
        nameKr: "서울 코엑스",
        desc: "서울 삼성동. 연간 300개+ 전시회. 수입박람회·홈리빙·식품·뷰티 등 소비재 박람회 다수.",
        tip: "지하철 2호선 삼성역 직결"
      },
      {
        name: "KINTEX (킨텍스)",
        nameKr: "경기 고양 킨텍스",
        desc: "수도권 최대 전시장(10만㎡). 가구·인테리어·자동차·산업 박람회 주요 개최지.",
        tip: "경의중앙선 킨텍스역 인근. 자동차 접근 용이"
      },
      {
        name: "BEXCO (벡스코)",
        nameKr: "부산 벡스코",
        desc: "부산 소재. 지역 최대 국제전시장. 수산·조선·해양 관련 박람회 특화.",
        tip: "지하철 2호선 벡스코역 도보 3분"
      },
    ],
  },
  {
    id: "usa",
    country: "미국",
    flag: "🇺🇸",
    city: "라스베가스·뉴욕",
    title: "미국 주요 전시장",
    subtitle: "ASD · NY NOW · CES — 글로벌 트렌드 최전선",
    color: "bg-indigo-50",
    textColor: "text-indigo-700",
    spots: [
      {
        name: "Las Vegas Convention Center",
        nameKr: "라스베가스 컨벤션센터",
        desc: "세계 최대 컨벤션센터 중 하나. CES(가전)·ASD Market Week(소비재) 등 메가 박람회 개최지.",
        tip: "라스베가스 스트립 북쪽. 라스베가스 모노레일 접근"
      },
      {
        name: "Javits Center (NYC)",
        nameKr: "자비츠 센터 (뉴욕)",
        desc: "뉴욕 맨해튼 서쪽. NY NOW(선물·라이프스타일) 등 소비재 박람회 주요 개최지.",
        tip: "A·C·E 라인 34 St-Hudson Yards 인근"
      },
      {
        name: "Orange County Convention Center",
        nameKr: "오렌지카운티 컨벤션센터 (올랜도)",
        desc: "미국 동부 최대 전시장. 유통·식품·의료 관련 박람회 다수.",
      },
    ],
  },
];

// ── 박람회 캘린더 ──────────────────────────────────────────

export interface TradeFair {
  month: number;
  name: string;
  nameEn: string;
  country: string;
  flag: string;
  venue: string;
  period: string;      // 예: "4월 15~19일"
  category: string;    // 예: "전자·기계"
  desc: string;
  url?: string;
  highlight?: boolean; // 특히 중요한 박람회
}

export const TRADE_FAIRS: TradeFair[] = [
  // ── 1월 ──
  {
    month: 1,
    name: "CES (국제전자제품박람회)",
    nameEn: "CES",
    country: "미국",
    flag: "🇺🇸",
    venue: "라스베가스 컨벤션센터",
    period: "1월 초 (7~10일)",
    category: "가전·IT·테크",
    desc: "세계 최대 가전·테크 박람회. 글로벌 트렌드를 가장 먼저 볼 수 있는 행사.",
    url: "https://www.ces.tech",
    highlight: true,
  },
  {
    month: 1,
    name: "NY NOW (뉴욕 선물박람회 겨울)",
    nameEn: "NY NOW",
    country: "미국",
    flag: "🇺🇸",
    venue: "자비츠 센터, 뉴욕",
    period: "1월 말 ~ 2월 초",
    category: "선물·라이프스타일·홈데코",
    desc: "북미 최대 선물·라이프스타일 박람회. 연 2회(1월/8월) 개최.",
    url: "https://www.nynow.com",
  },
  // ── 2월 ──
  {
    month: 2,
    name: "東京インターナショナルギフトショー(봄)",
    nameEn: "Tokyo International Gift Show Spring",
    country: "일본",
    flag: "🇯🇵",
    venue: "도쿄 빅사이트",
    period: "2월 초 (5~8일)",
    category: "선물·잡화·라이프스타일",
    desc: "일본 최대 선물·생활잡화 박람회. 연 2회(2월/9월). 아시아 트렌드 파악 필수.",
    url: "https://www.giftshow.co.jp",
    highlight: true,
  },
  // ── 3월 ──
  {
    month: 3,
    name: "서울리빙디자인페어",
    nameEn: "Seoul Living Design Fair",
    country: "한국",
    flag: "🇰🇷",
    venue: "COEX, 서울",
    period: "3월 중순 (7~10일)",
    category: "홈인테리어·가구·라이프스타일",
    desc: "국내 최대 리빙·인테리어 박람회. 해외 브랜드 대거 참가, 트렌드 확인.",
    url: "https://www.livingdesign.or.kr",
  },
  {
    month: 3,
    name: "ASD Market Week (봄)",
    nameEn: "ASD Market Week",
    country: "미국",
    flag: "🇺🇸",
    venue: "라스베가스 컨벤션센터",
    period: "3월 초 (3~6일)",
    category: "소비재·잡화·선물",
    desc: "미국 최대 소비재 도매 박람회. 연 2회(3월/8월). 바이어 직접 만날 수 있는 절호의 기회.",
    url: "https://www.asdonline.com",
    highlight: true,
  },
  // ── 4월 ──
  {
    month: 4,
    name: "캔톤페어 1기 (春季 广交会)",
    nameEn: "Canton Fair Phase 1",
    country: "중국",
    flag: "🇨🇳",
    venue: "광저우 파저우 전시관",
    period: "4월 15~19일",
    category: "전자·기계·건자재",
    desc: "세계 최대 무역박람회 첫 번째 기간. 전자제품·산업기계·조명·오디오 등.",
    url: "https://www.cantonfair.org.cn",
    highlight: true,
  },
  {
    month: 4,
    name: "캔톤페어 2기 (春季 广交会)",
    nameEn: "Canton Fair Phase 2",
    country: "중국",
    flag: "🇨🇳",
    venue: "광저우 파저우 전시관",
    period: "4월 23~27일",
    category: "일용품·선물·가정용품",
    desc: "두 번째 기간. 생활용품·선물·완구·스포츠·인테리어 등 소비재 중심.",
    url: "https://www.cantonfair.org.cn",
    highlight: true,
  },
  {
    month: 4,
    name: "경향하우징페어 (봄)",
    nameEn: "Kyunghyang Housing Fair Spring",
    country: "한국",
    flag: "🇰🇷",
    venue: "KINTEX, 고양",
    period: "4월 말",
    category: "인테리어·건자재·가구",
    desc: "국내 최대 주거·인테리어 박람회. 봄·가을 연 2회 개최.",
  },
  // ── 5월 ──
  {
    month: 5,
    name: "캔톤페어 3기 (春季 广交会)",
    nameEn: "Canton Fair Phase 3",
    country: "중국",
    flag: "🇨🇳",
    venue: "광저우 파저우 전시관",
    period: "5월 1~5일",
    category: "의류·신발·식품·의약",
    desc: "세 번째 기간. 패션·식품·헬스케어 중심. 연 2회 봄 캔톤페어 마지막 기간.",
    url: "https://www.cantonfair.org.cn",
  },
  // ── 8월 ──
  {
    month: 8,
    name: "ASD Market Week (여름)",
    nameEn: "ASD Market Week Summer",
    country: "미국",
    flag: "🇺🇸",
    venue: "라스베가스 컨벤션센터",
    period: "8월 초 (3~6일)",
    category: "소비재·잡화·선물",
    desc: "ASD 연간 두 번째 개최. 연말 시즌 상품 소싱 최적기.",
    url: "https://www.asdonline.com",
  },
  {
    month: 8,
    name: "NY NOW (뉴욕 선물박람회 여름)",
    nameEn: "NY NOW Summer",
    country: "미국",
    flag: "🇺🇸",
    venue: "자비츠 센터, 뉴욕",
    period: "8월 중순",
    category: "선물·라이프스타일·홈데코",
    desc: "NY NOW 여름 시즌. 가을·겨울 시즌 신상품 확인.",
    url: "https://www.nynow.com",
  },
  // ── 9월 ──
  {
    month: 9,
    name: "東京インターナショナルギフトショー(가을)",
    nameEn: "Tokyo International Gift Show Autumn",
    country: "일본",
    flag: "🇯🇵",
    venue: "도쿄 빅사이트",
    period: "9월 초 (3~6일)",
    category: "선물·잡화·라이프스타일",
    desc: "기프트쇼 가을 시즌. 연말·설 선물 시즌 대비 신상품 트렌드 확인.",
    url: "https://www.giftshow.co.jp",
    highlight: true,
  },
  // ── 10월 ──
  {
    month: 10,
    name: "캔톤페어 4기 (秋季 广交会)",
    nameEn: "Canton Fair Autumn Phase 1",
    country: "중국",
    flag: "🇨🇳",
    venue: "광저우 파저우 전시관",
    period: "10월 15~19일",
    category: "전자·기계·건자재",
    desc: "가을 캔톤페어 첫 번째 기간. 봄과 동일 일정·구성.",
    url: "https://www.cantonfair.org.cn",
    highlight: true,
  },
  {
    month: 10,
    name: "이우 박람회 (义博会)",
    nameEn: "Yiwu Fair",
    country: "중국",
    flag: "🇨🇳",
    venue: "이우 국제박람회센터",
    period: "10월 중순 (약 5일)",
    category: "소비재·선물·완구",
    desc: "이우 방문 중 병행 참관 추천. 이우시장 상인들도 대거 참가.",
    url: "https://www.yiwufair.com",
  },
  {
    month: 10,
    name: "경향하우징페어 (가을)",
    nameEn: "Kyunghyang Housing Fair Autumn",
    country: "한국",
    flag: "🇰🇷",
    venue: "KINTEX, 고양",
    period: "10월 말",
    category: "인테리어·건자재·가구",
    desc: "가을 시즌 주거·인테리어 박람회.",
  },
  // ── 11월 ──
  {
    month: 11,
    name: "캔톤페어 5기 (秋季 广交会)",
    nameEn: "Canton Fair Autumn Phase 2",
    country: "중국",
    flag: "🇨🇳",
    venue: "광저우 파저우 전시관",
    period: "11월 1~5일",
    category: "의류·신발·식품·의약",
    desc: "가을 캔톤페어 마지막 기간.",
    url: "https://www.cantonfair.org.cn",
  },
];

export const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
