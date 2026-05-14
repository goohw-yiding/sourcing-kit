import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const HS_DB = [
  // ===== 의류 =====
  { hsCode: "6110200000", keywords: ["면 스웨터", "니트", "스웨터", "풀오버", "면니트", "棉毛衣", "니트웨어"] },
  { hsCode: "6110300000", keywords: ["합성섬유 스웨터", "폴리 니트", "화섬니트", "폴리에스터 니트"] },
  { hsCode: "6109100000", keywords: ["면 티셔츠", "티셔츠", "T셔츠", "반팔", "棉T恤", "반팔티"] },
  { hsCode: "6109900000", keywords: ["합성섬유 티셔츠", "폴리 티셔츠", "기능성 티셔츠"] },
  { hsCode: "6104430000", keywords: ["합성섬유 원피스", "원피스", "드레스", "连衣裙", "원피스드레스"] },
  { hsCode: "6104440000", keywords: ["인조견 원피스", "새틴 원피스", "실크 드레스"] },
  { hsCode: "6203420000", keywords: ["면 바지", "청바지", "데님", "팬츠", "棉裤子", "면팬츠"] },
  { hsCode: "6203430000", keywords: ["합성섬유 바지", "폴리 바지", "트레이닝 바지", "조거팬츠"] },
  { hsCode: "6211430000", keywords: ["합성섬유 운동복", "트레이닝", "운동복", "스포츠웨어", "레깅스"] },
  { hsCode: "6108210000", keywords: ["면 잠옷", "파자마", "잠옷", "홈웨어"] },
  { hsCode: "6108220000", keywords: ["합성섬유 잠옷", "폴리 파자마"] },
  { hsCode: "6106100000", keywords: ["면 블라우스", "블라우스", "셔츠", "여성 셔츠"] },
  { hsCode: "6205200000", keywords: ["면 남성 셔츠", "남방", "와이셔츠"] },
  { hsCode: "6201110000", keywords: ["면 코트", "외투", "코트", "자켓"] },
  { hsCode: "6201130000", keywords: ["합성섬유 코트", "패딩", "겨울 자켓", "점퍼", "패딩자켓"] },
  { hsCode: "6211110000", keywords: ["수영복 남성", "수영복", "래시가드"] },
  { hsCode: "6211120000", keywords: ["수영복 여성", "비키니", "여성 수영복"] },
  { hsCode: "6212100000", keywords: ["브래지어", "속옷 상의", "여성 내의"] },
  { hsCode: "6207110000", keywords: ["면 팬티 남성", "속옷", "남성 속옷", "팬티"] },
  { hsCode: "6208110000", keywords: ["면 팬티 여성", "여성 속옷"] },
  { hsCode: "6115100000", keywords: ["스타킹", "타이즈", "양말 스타킹"] },
  { hsCode: "6115960000", keywords: ["면 양말", "양말", "短袜", "발목양말"] },
  { hsCode: "6217100000", keywords: ["의류부속품", "벨트 직물", "넥타이", "스카프", "머플러", "손수건", "服装配件"] },
  { hsCode: "6116100000", keywords: ["장갑", "합성섬유 장갑", "手套", "니트 장갑"] },
  { hsCode: "6216000000", keywords: ["작업장갑", "고무장갑"] },
  { hsCode: "6505000000", keywords: ["모자", "캡", "비니", "帽子", "버킷햇", "야구모자", "볼캡"] },
  { hsCode: "6506100000", keywords: ["안전모", "헬멧", "작업모자"] },

  // ===== 신발 =====
  { hsCode: "6401100000", keywords: ["방수 신발", "레인부츠", "장화", "웰링턴부츠"] },
  { hsCode: "6402990000", keywords: ["운동화", "스니커즈", "캐주얼화", "运动鞋", "런닝화"] },
  { hsCode: "6403990000", keywords: ["가죽 신발", "구두", "皮鞋", "로퍼", "옥스퍼드"] },
  { hsCode: "6404110000", keywords: ["스포츠화", "농구화", "트레킹화"] },
  { hsCode: "6404190000", keywords: ["슬리퍼", "샌들", "拖鞋", "凉鞋"] },
  { hsCode: "6405200000", keywords: ["직물 신발", "에스파드리유", "천 신발"] },

  // ===== 가방/지갑 =====
  { hsCode: "4202110000", keywords: ["서류가방", "브리프케이스", "비즈니스백"] },
  { hsCode: "4202120000", keywords: ["핸드백", "가방", "숄더백", "手提包", "包包", "토트백", "크로스백"] },
  { hsCode: "4202220000", keywords: ["지갑", "카드지갑", "钱包", "장지갑", "반지갑"] },
  { hsCode: "4202920000", keywords: ["여행가방", "캐리어", "백팩", "배낭", "旅行包", "背包", "스쿨백"] },
  { hsCode: "4202320000", keywords: ["클러치", "파우치", "화장품 파우치"] },
  { hsCode: "4205000000", keywords: ["가죽 소품", "가죽 케이스", "가죽 파우치"] },

  // ===== 화장품/미용 =====
  { hsCode: "3304100000", keywords: ["립스틱", "립밤", "립글로스", "口红"] },
  { hsCode: "3304200000", keywords: ["눈화장품", "아이섀도", "마스카라", "아이라이너", "眼影"] },
  { hsCode: "3304910000", keywords: ["파우더", "파운데이션", "BB크림", "CC크림", "粉底"] },
  { hsCode: "3304990000", keywords: ["화장품", "스킨케어", "로션", "크림", "세안", "미용", "化妆品", "护肤品", "에센스", "앰플", "토너"] },
  { hsCode: "3305100000", keywords: ["샴푸", "洗发水", "린스", "트리트먼트"] },
  { hsCode: "3305300000", keywords: ["헤어왁스", "헤어젤", "스타일링", "헤어스프레이"] },
  { hsCode: "3307100000", keywords: ["면도크림", "쉐이빙폼"] },
  { hsCode: "3307490000", keywords: ["방향제", "디퓨저", "룸스프레이", "탈취제"] },
  { hsCode: "3401110000", keywords: ["비누", "세안비누", "香皂", "클렌징바"] },
  { hsCode: "3402200000", keywords: ["세제", "주방세제", "세탁세제", "청소용품"] },

  // ===== 주방/식기 =====
  { hsCode: "3924100000", keywords: ["플라스틱 식기", "컵", "그릇", "식판", "도시락통", "塑料餐具", "밀폐용기"] },
  { hsCode: "3924900000", keywords: ["플라스틱 주방용품", "채반", "국자홀더", "주방 수납"] },
  { hsCode: "4419110000", keywords: ["나무 도마", "원목 도마", "竹木砧板"] },
  { hsCode: "4419900000", keywords: ["나무 주방도구", "나무 주걱", "나무 스푼", "木制厨具"] },
  { hsCode: "6911100000", keywords: ["도자기 그릇", "세라믹", "陶瓷", "머그컵", "도자기컵", "밥그릇"] },
  { hsCode: "6912000000", keywords: ["도자기 주방용품", "도자기 냄비", "세라믹 팬"] },
  { hsCode: "7013100000", keywords: ["유리 식기", "유리 밥그릇", "玻璃碗"] },
  { hsCode: "7013490000", keywords: ["유리그릇", "유리컵", "玻璃杯", "유리 텀블러"] },
  { hsCode: "7323100000", keywords: ["주철 냄비", "무쇠 팬"] },
  { hsCode: "7323930000", keywords: ["스테인리스 주방용품", "냄비", "프라이팬", "不锈钢", "스테인리스 볼"] },
  { hsCode: "7615100000", keywords: ["알루미늄 냄비", "알루미늄 팬", "铝制厨具"] },
  { hsCode: "8215990000", keywords: ["병따개", "오프너", "와인오프너", "스푼", "포크", "국자", "조리도구"] },
  { hsCode: "8423810000", keywords: ["주방 저울", "전자저울", "体重秤", "저울"] },

  // ===== 가구/인테리어 =====
  { hsCode: "7009100000", keywords: ["뒷유리 거울", "백미러"] },
  { hsCode: "7009910000", keywords: ["거울 금속프레임", "금속 거울", "벽걸이 거울 금속"] },
  { hsCode: "7009920000", keywords: ["거울", "유리 거울", "벽걸이 거울", "화장대 거울", "전신거울", "탁상거울", "镜子", "화장거울"] },
  { hsCode: "9405500000", keywords: ["캔들홀더", "촛대", "캔들 스탠드", "蜡烛台"] },
  { hsCode: "3406000000", keywords: ["양초", "캔들", "蜡烛", "향초"] },
  { hsCode: "7308900000", keywords: ["커튼봉 철강", "커튼레일", "铁制窗帘杆", "커튼봉"] },
  { hsCode: "7616990000", keywords: ["커튼봉 알루미늄", "알루미늄 커튼봉", "알루미늄 레일"] },
  { hsCode: "3926409000", keywords: ["플라스틱 커튼봉", "플라스틱 레일", "커튼 고리", "커튼 부속"] },
  { hsCode: "6302100000", keywords: ["침구", "이불", "베개커버", "침대커버", "床单", "被套", "패드"] },
  { hsCode: "6301200000", keywords: ["담요", "블랭킷", "毛毯", "무릎담요", "플리스 담요"] },
  { hsCode: "6304920000", keywords: ["커튼", "블라인드", "인테리어패브릭", "창문커튼", "窗帘"] },
  { hsCode: "6304930000", keywords: ["욕실 매트", "화장실 매트", "浴室地垫"] },
  { hsCode: "9404900000", keywords: ["쿠션", "방석", "베개", "枕头", "소파쿠션"] },
  { hsCode: "9401800000", keywords: ["의자", "折叠椅", "폴딩 의자", "캠핑의자"] },
  { hsCode: "9401610000", keywords: ["목재 의자", "나무 의자", "木椅"] },
  { hsCode: "9403200000", keywords: ["금속 가구", "철제 선반", "메탈 선반", "金属家具"] },
  { hsCode: "9403600000", keywords: ["목재 가구", "나무 선반", "책장", "서랍장", "木制家具", "수납장"] },
  { hsCode: "9403700000", keywords: ["플라스틱 가구", "플라스틱 수납장", "塑料家具"] },
  { hsCode: "3926300000", keywords: ["플라스틱 생활용품", "수납박스", "바구니", "收纳盒", "정리함", "수납함"] },
  { hsCode: "4602190000", keywords: ["바구니", "라탄바구니", "籐篮", "수납 바구니", "세탁 바구니"] },
  { hsCode: "6302600000", keywords: ["수건", "타월", "毛巾", "목욕 타월", "핸드 타월"] },

  // ===== 조명 =====
  { hsCode: "9405400000", keywords: ["LED등", "조명", "전구", "LED灯", "스탠드", "무드등"] },
  { hsCode: "9405100000", keywords: ["샹들리에", "천장 조명", "펜던트 등"] },
  { hsCode: "9405200000", keywords: ["벽 조명", "벽등", "브래킷 등"] },
  { hsCode: "9405500000", keywords: ["캔들형 조명", "야간등", "나이트 라이트"] },

  // ===== 시계 =====
  { hsCode: "9103000000", keywords: ["탁상시계", "탁상 알람시계", "台钟"] },
  { hsCode: "9105110000", keywords: ["벽시계", "挂钟", "인테리어 시계"] },
  { hsCode: "9102110000", keywords: ["손목시계", "腕表", "시계"] },

  // ===== 전자제품 =====
  { hsCode: "8414510000", keywords: ["선풍기", "서큘레이터", "电风扇", "탁상 선풍기"] },
  { hsCode: "8414590000", keywords: ["미니 선풍기", "USB 선풍기", "목선풍기"] },
  { hsCode: "8509400000", keywords: ["믹서기", "블렌더", "榨汁机", "주서기"] },
  { hsCode: "8516500000", keywords: ["전자레인지", "오븐", "微波炉", "에어프라이어"] },
  { hsCode: "8516600000", keywords: ["전기밥솥", "电饭锅"] },
  { hsCode: "8516790000", keywords: ["헤어드라이어", "고데기", "电吹风", "드라이기", "스트레이트너"] },
  { hsCode: "8517120000", keywords: ["스마트폰", "휴대폰", "핸드폰", "手机"] },
  { hsCode: "8518220000", keywords: ["블루투스 스피커", "스피커", "音响", "포터블 스피커"] },
  { hsCode: "8518300000", keywords: ["헤드폰", "이어폰", "무선 이어폰", "耳机", "에어팟형"] },
  { hsCode: "8523510000", keywords: ["USB메모리", "플래시드라이브", "U盘"] },
  { hsCode: "8544420000", keywords: ["충전케이블", "USB케이블", "C타입케이블", "数据线"] },
  { hsCode: "8504400000", keywords: ["충전기", "어댑터", "보조배터리", "充电器", "무선충전기"] },
  { hsCode: "8543700000", keywords: ["마사지기", "안마기", "按摩仪", "진동마사지기"] },
  { hsCode: "8479890000", keywords: ["가습기", "加湿器", "공기청정기"] },
  { hsCode: "8471610000", keywords: ["마우스", "컴퓨터 마우스", "无线鼠标"] },
  { hsCode: "8471600000", keywords: ["키보드", "无线键盘", "게이밍 키보드"] },
  { hsCode: "8473300000", keywords: ["키보드 마우스 세트", "컴퓨터 주변기기"] },
  { hsCode: "9504500000", keywords: ["비디오게임", "게임기", "콘솔", "게임패드"] },

  // ===== 완구/취미 =====
  { hsCode: "9503000000", keywords: ["완구", "장난감", "퍼즐", "인형", "블록", "玩具", "积木", "피규어", "봉제인형"] },
  { hsCode: "9504900000", keywords: ["보드게임", "카드게임", "桌游"] },
  { hsCode: "9506990000", keywords: ["스포츠용품", "운동기구", "헬스", "피트니스용품"] },
  { hsCode: "9506910000", keywords: ["아령", "덤벨", "哑铃", "바벨", "역기"] },
  { hsCode: "3926909000", keywords: ["요가매트", "운동매트", "瑜伽垫", "폼롤러"] },
  { hsCode: "9506400000", keywords: ["탁구", "배드민턴", "배드민턴 라켓"] },
  { hsCode: "9506620000", keywords: ["축구공", "농구공", "배구공", "공"] },
  { hsCode: "9501000000", keywords: ["자전거", "킥보드", "스케이트보드"] },
  { hsCode: "3407000000", keywords: ["클레이", "점토", "橡皮泥", "슬라임"] },

  // ===== 문구/사무 =====
  { hsCode: "9608100000", keywords: ["볼펜", "펜", "圆珠笔", "사인펜", "형광펜"] },
  { hsCode: "9609900000", keywords: ["색연필", "크레용", "蜡笔", "마커"] },
  { hsCode: "4820100000", keywords: ["노트", "다이어리", "笔记本", "스케치북", "필기장"] },
  { hsCode: "3926100000", keywords: ["파일", "바인더", "서류함", "文件夹"] },
  { hsCode: "8213000000", keywords: ["가위", "剪刀", "공예 가위"] },
  { hsCode: "8305200000", keywords: ["스테이플러", "호치키스", "订书机"] },
  { hsCode: "3919100000", keywords: ["스티커", "贴纸", "포스트잇", "메모지"] },
  { hsCode: "4817300000", keywords: ["선물 포장", "포장용품", "礼品包装"] },
  { hsCode: "4819100000", keywords: ["골판지 박스", "포장박스", "纸箱", "배송박스"] },

  // ===== 스포츠/아웃도어 =====
  { hsCode: "6210100000", keywords: ["등산복", "고어텍스 자켓", "아웃도어 자켓"] },
  { hsCode: "6402110000", keywords: ["등산화", "트레킹화", "아웃도어화"] },
  { hsCode: "4015110000", keywords: ["수영 장갑", "다이빙 장갑"] },
  { hsCode: "9506310000", keywords: ["낚시 낚싯대", "낚시 릴"] },
  { hsCode: "9506390000", keywords: ["낚시 용품", "낚시대", "釣鱼用品"] },

  // ===== 주얼리/액세서리 =====
  { hsCode: "7117190000", keywords: ["패션주얼리", "귀걸이", "목걸이", "팔찌", "时尚饰品", "반지", "이어링"] },
  { hsCode: "7113190000", keywords: ["금 주얼리", "금 목걸이", "골드 귀걸이"] },
  { hsCode: "9615190000", keywords: ["헤어핀", "헤어밴드", "머리핀", "머리띠", "头饰", "헤어클립"] },
  { hsCode: "9615110000", keywords: ["헤어빗", "빗", "梳子"] },
  { hsCode: "9004100000", keywords: ["선글라스", "太阳镜", "자외선 차단 안경"] },
  { hsCode: "9003110000", keywords: ["안경테", "안경 프레임", "眼镜框"] },
  { hsCode: "4015190000", keywords: ["가죽 벨트", "허리띠", "皮带"] },
  { hsCode: "3926200000", keywords: ["실리콘 밴드", "실리콘 팔찌", "실리콘 제품"] },

  // ===== 욕실/위생 =====
  { hsCode: "3922100000", keywords: ["욕조", "샤워부스", "浴缸"] },
  { hsCode: "3922200000", keywords: ["변기시트", "화장실 시트", "马桶盖"] },
  { hsCode: "3924900000", keywords: ["욕실 수납", "욕실 선반", "샤워 바구니", "浴室收纳"] },
  { hsCode: "3926909000", keywords: ["욕실 소품", "비누 받침대", "비누 디스펜서", "칫솔 홀더", "浴室用品"] },
  { hsCode: "4014900000", keywords: ["고무 욕실 매트", "미끄럼 방지 매트"] },
  { hsCode: "9603210000", keywords: ["칫솔", "牙刷", "전동칫솔"] },
  { hsCode: "9603290000", keywords: ["브러시", "세면 브러시", "청소 솔"] },

  // ===== 공예/DIY =====
  { hsCode: "9601910000", keywords: ["공예품", "인테리어소품", "장식품", "工艺品", "오브제", "피규어"] },
  { hsCode: "6307900000", keywords: ["마스크", "부직포 마스크", "생활마스크"] },
  { hsCode: "3924100000", keywords: ["도시락통", "런치박스", "便当盒", "밀폐용기"] },
  { hsCode: "7117900000", keywords: ["브로치", "핀", "장식 핀"] },
  { hsCode: "6304990000", keywords: ["쿠션커버", "베개커버", "소파커버", "抱枕套"] },

  // ===== 기타 잡화 =====
  { hsCode: "6601910000", keywords: ["우산", "雨伞", "장우산", "접이식우산", "양산"] },
  { hsCode: "6602000000", keywords: ["지팡이", "워킹스틱", "手杖"] },
  { hsCode: "4016990000", keywords: ["고무 제품", "실리콘 제품", "러버"] },
  { hsCode: "3005900000", keywords: ["위생마스크", "의료마스크", "방진마스크"] },
  { hsCode: "9613100000", keywords: ["일회용 라이터", "打火机"] },
  { hsCode: "4016300000", keywords: ["고무장갑", "가사장갑", "청소장갑"] },
  { hsCode: "8302410000", keywords: ["문 손잡이", "도어락", "핸들", "铰链"] },
  { hsCode: "3926909000", keywords: ["플라스틱 잡화", "플라스틱 소품", "塑料制品", "플라스틱 생활용품"] },
];

function searchLocal(query: string): { hsCode: string; description: string }[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const exact: typeof HS_DB = [];
  const partial: typeof HS_DB = [];

  for (const item of HS_DB) {
    const exactMatch = item.keywords.some((kw) => kw.toLowerCase() === q) || item.hsCode === q;
    const partialMatch = item.keywords.some((kw) => kw.toLowerCase().includes(q) || q.includes(kw.toLowerCase())) || item.hsCode.includes(q);
    if (exactMatch) exact.push(item);
    else if (partialMatch) partial.push(item);
  }

  return [...exact, ...partial]
    .slice(0, 8)
    .map((item) => ({ hsCode: item.hsCode, description: item.keywords[0] }));
}

async function searchWithAI(query: string): Promise<{ hsCode: string; description: string; reason: string }[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `한국 수입 무역상이 중국에서 수입하는 상품입니다. 상품명: "${query}"

이 상품에 해당할 수 있는 한국 HS코드(10자리)를 2~4개 제안해주세요.
재질이나 용도에 따라 코드가 다를 수 있으면 모두 포함해주세요.

반드시 아래 JSON 배열 형식으로만 답하세요. 다른 텍스트는 절대 포함하지 마세요:
[{"hsCode":"1234567890","description":"품목 설명 20자 이내","reason":"선택 이유 30자 이내"}]`,
    }],
  });

  const text = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.map((item: { hsCode: string; description: string; reason: string }) => ({
    hsCode: String(item.hsCode).replace(/[^0-9]/g, "").padEnd(10, "0").slice(0, 10),
    description: item.description,
    reason: item.reason,
  }));
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";

  // 1. 관세청 공식 API
  if (process.env.CUSTOMS_API_KEY && query) {
    try {
      const url = `https://unipass.customs.go.kr:38010/ext/rest/trtmHsSgHscdQry/retrieveTrtmHsSgHscdList?crkyCn=${process.env.CUSTOMS_API_KEY}&hsSgQryTxt=${encodeURIComponent(query)}&numOfRows=10&pageNo=1`;
      const res = await fetch(url);
      const text = await res.text();
      const items: { hsCode: string; description: string }[] = [];
      const matches = text.matchAll(/<trtmHsSgInfo>([\s\S]*?)<\/trtmHsSgInfo>/g);
      for (const match of matches) {
        const block = match[1];
        const hsCode = block.match(/<hsCd>(.*?)<\/hsCd>/)?.[1] || "";
        const desc = block.match(/<hsSgNm>(.*?)<\/hsSgNm>/)?.[1] || "";
        if (hsCode) items.push({ hsCode, description: desc });
      }
      if (items.length > 0) return NextResponse.json({ items, source: "customs" });
    } catch { /* fallback */ }
  }

  // 2. 로컬 DB
  const localItems = searchLocal(query);
  if (localItems.length > 0) {
    return NextResponse.json({ items: localItems, source: "local-db" });
  }

  // 3. AI 검색 (로컬에 없을 때)
  if (process.env.ANTHROPIC_API_KEY && query.trim()) {
    try {
      const aiItems = await searchWithAI(query);
      if (aiItems.length > 0) {
        return NextResponse.json({
          items: aiItems,
          source: "ai",
          aiNote: "AI 추천 결과 — 관세청에서 최종 확인을 권장합니다",
        });
      }
    } catch { /* AI 실패시 not-found */ }
  }

  return NextResponse.json({ items: [], source: "not-found" });
}
