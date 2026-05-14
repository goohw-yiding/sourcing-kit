export interface ProductCategory {
  kr: string;
  cn: string;
}

export interface FloorSection {
  section: string;
  products: ProductCategory[];
}

export interface FloorData {
  floor: number;
  floorLabel: string;
  sections: FloorSection[];
  imageAvailable: boolean;
}

export interface DistrictData {
  district: number;
  name: string;
  nameCn: string;
  address: string;
  floors: FloorData[];
}

export const YIWU_DISTRICTS: DistrictData[] = [
  {
    district: 1,
    name: "1구",
    nameCn: "一区",
    address: "义乌国际商贸城一区",
    floors: [
      {
        floor: 1,
        floorLabel: "1층",
        imageAvailable: false,
        sections: [
          {
            section: "꽃·직물존",
            products: [
              { kr: "꽃·화훼", cn: "花卉" },
              { kr: "조화·인조꽃", cn: "仿真花" },
              { kr: "직물공예", cn: "布艺" },
              { kr: "절기장식", cn: "节庆装饰" },
            ],
          },
          {
            section: "완구존",
            products: [
              { kr: "전동완구", cn: "电动玩具" },
              { kr: "일반완구", cn: "普通玩具" },
              { kr: "RC카·드론", cn: "遥控车" },
              { kr: "아동완구", cn: "儿童玩具" },
            ],
          },
        ],
      },
      {
        floor: 2,
        floorLabel: "2층",
        imageAvailable: false,
        sections: [
          {
            section: "주얼리·헤어존",
            products: [
              { kr: "주얼리·귀금속", cn: "珠宝首饰" },
              { kr: "헤어액세서리", cn: "头饰" },
              { kr: "귀걸이·목걸이", cn: "耳环项链" },
              { kr: "팔찌·반지", cn: "手链戒指" },
            ],
          },
        ],
      },
      {
        floor: 3,
        floorLabel: "3층",
        imageAvailable: false,
        sections: [
          {
            section: "공예·장식존",
            products: [
              { kr: "공예품·장식", cn: "装饰工艺" },
              { kr: "도자기·크리스털", cn: "瓷器水晶" },
              { kr: "장신구부품", cn: "饰品配件" },
              { kr: "액자·사진틀", cn: "相框" },
              { kr: "장례용품", cn: "殡葬用品" },
            ],
          },
        ],
      },
      {
        floor: 4,
        floorLabel: "4층",
        imageAvailable: false,
        sections: [
          {
            section: "직판·특별관",
            products: [
              { kr: "대만관", cn: "台商馆" },
              { kr: "생산기업 직판센터", cn: "生产企业直销中心" },
            ],
          },
        ],
      },
    ],
  },
  {
    district: 2,
    name: "2구",
    nameCn: "二区",
    address: "义乌国际商贸城二区",
    floors: [
      {
        floor: 1,
        floorLabel: "1층",
        imageAvailable: false,
        sections: [
          {
            section: "가방·우산존",
            products: [
              { kr: "가방·여행가방", cn: "箱包" },
              { kr: "배낭·학생가방", cn: "书包" },
              { kr: "우산", cn: "伞具" },
              { kr: "우비·포장재", cn: "雨披包装袋" },
              { kr: "핸드백", cn: "手提包" },
            ],
          },
        ],
      },
      {
        floor: 2,
        floorLabel: "2층",
        imageAvailable: false,
        sections: [
          {
            section: "철물·공구존",
            products: [
              { kr: "철물공구·부품", cn: "五金工具配件" },
              { kr: "자물쇠·잠금장치", cn: "锁具" },
              { kr: "전기제품", cn: "电工产品" },
              { kr: "선물봉투", cn: "礼品袋" },
              { kr: "차량용품", cn: "车类" },
            ],
          },
        ],
      },
      {
        floor: 3,
        floorLabel: "3층",
        imageAvailable: false,
        sections: [
          {
            section: "전자·시계존",
            products: [
              { kr: "주방·욕실 철물", cn: "五金厨卫" },
              { kr: "전자제품", cn: "电子产品" },
              { kr: "통신기기", cn: "电讯器材" },
              { kr: "소형가전·면도기", cn: "小家电剃须刀" },
              { kr: "시계", cn: "钟表" },
            ],
          },
        ],
      },
      {
        floor: 4,
        floorLabel: "4층",
        imageAvailable: false,
        sections: [
          {
            section: "전자기기·직판존",
            products: [
              { kr: "철물·전기제품", cn: "五金电器" },
              { kr: "공장 직판", cn: "生产企业直销中心" },
              { kr: "전자측정기·카메라", cn: "电子仪表照相器材" },
              { kr: "배터리·조명·손전등", cn: "电池灯电筒" },
              { kr: "정품가방관", cn: "精品箱包区" },
            ],
          },
        ],
      },
      {
        floor: 5,
        floorLabel: "5층",
        imageAvailable: false,
        sections: [
          {
            section: "무역기관·서비스존",
            products: [
              { kr: "무역기관 사무소", cn: "外贸机构办事处" },
              { kr: "다기능홀", cn: "多功能厅" },
              { kr: "옥상 주차장", cn: "屋顶停车场" },
            ],
          },
        ],
      },
    ],
  },
  {
    district: 3,
    name: "3구",
    nameCn: "三区",
    address: "义乌国际商贸城三区",
    floors: [
      {
        floor: 1,
        floorLabel: "1층",
        imageAvailable: false,
        sections: [
          {
            section: "안경·문구존",
            products: [
              { kr: "안경·선글라스", cn: "眼镜" },
              { kr: "문구·필기구", cn: "笔墨用品" },
              { kr: "종이·인쇄물", cn: "纸制品" },
              { kr: "연화·달력·대련", cn: "年画挂历对联" },
            ],
          },
        ],
      },
      {
        floor: 2,
        floorLabel: "2층",
        imageAvailable: false,
        sections: [
          {
            section: "사무·스포츠존",
            products: [
              { kr: "사무·학용품", cn: "办公学习用品" },
              { kr: "스포츠용품", cn: "运动器材" },
              { kr: "체육·레저용품", cn: "体育休闲用品" },
            ],
          },
        ],
      },
      {
        floor: 3,
        floorLabel: "3층",
        imageAvailable: false,
        sections: [
          {
            section: "화장품·의류부속존",
            products: [
              { kr: "화장품·코스메틱", cn: "化妆品" },
              { kr: "단추·지퍼", cn: "纽扣拉链" },
              { kr: "의류 부속재료", cn: "服装辅料" },
            ],
          },
        ],
      },
      {
        floor: 4,
        floorLabel: "4층",
        imageAvailable: false,
        sections: [
          {
            section: "화장품·부속 직판존",
            products: [
              { kr: "문화체육용품 직판", cn: "文化体育用品直销" },
              { kr: "화장품", cn: "化妆品" },
              { kr: "부속재료·부품", cn: "辅料配件" },
              { kr: "거울·빗", cn: "镜梳" },
            ],
          },
        ],
      },
      {
        floor: 5,
        floorLabel: "5층",
        imageAvailable: false,
        sections: [
          {
            section: "의류부속존",
            products: [
              { kr: "단추·지퍼", cn: "纽扣拉链" },
              { kr: "의류 부속재료", cn: "服装辅料" },
            ],
          },
        ],
      },
    ],
  },
  {
    district: 4,
    name: "4구",
    nameCn: "四区",
    address: "义乌国际商贸城四区",
    floors: [
      {
        floor: 1,
        floorLabel: "1층",
        imageAvailable: false,
        sections: [
          {
            section: "양말·모자·장갑존",
            products: [
              { kr: "양말", cn: "袜类" },
              { kr: "레깅스·스타킹", cn: "打底裤" },
              { kr: "모자", cn: "帽类" },
              { kr: "장갑", cn: "手套" },
              { kr: "기타 니트·면 제품", cn: "其他针棉" },
            ],
          },
        ],
      },
      {
        floor: 2,
        floorLabel: "2층",
        imageAvailable: false,
        sections: [
          {
            section: "생활잡화·신발존",
            products: [
              { kr: "생활잡화", cn: "日用百货" },
              { kr: "수건", cn: "毛巾" },
              { kr: "모직실·울", cn: "毛线" },
              { kr: "넥타이", cn: "领带" },
              { kr: "신발", cn: "鞋类" },
              { kr: "레이스·장식끈", cn: "花边线带" },
            ],
          },
        ],
      },
      {
        floor: 3,
        floorLabel: "3층",
        imageAvailable: false,
        sections: [
          {
            section: "속옷·벨트·스카프존",
            products: [
              { kr: "브래지어·속옷", cn: "文胸内衣" },
              { kr: "벨트·허리띠", cn: "皮带" },
              { kr: "스카프·머플러", cn: "围巾" },
            ],
          },
        ],
      },
      {
        floor: 4,
        floorLabel: "4층",
        imageAvailable: false,
        sections: [
          {
            section: "속옷·신발·스카프존",
            products: [
              { kr: "브래지어·속옷", cn: "文胸内衣" },
              { kr: "스카프·머플러", cn: "围巾" },
              { kr: "신발", cn: "鞋类" },
              { kr: "여행쇼핑센터", cn: "旅游购物中心" },
            ],
          },
        ],
      },
      {
        floor: 5,
        floorLabel: "5층",
        imageAvailable: false,
        sections: [
          {
            section: "그림·생활잡화존",
            products: [
              { kr: "그림·인쇄물", cn: "画业" },
              { kr: "생활잡화", cn: "日用百货" },
            ],
          },
        ],
      },
    ],
  },
  {
    district: 5,
    name: "5구",
    nameCn: "五区",
    address: "义乌国际商贸城五区",
    floors: [
      {
        floor: 1,
        floorLabel: "1층",
        imageAvailable: false,
        sections: [
          {
            section: "종합·주얼리존",
            products: [
              { kr: "종합생활용품", cn: "综合商超类" },
              { kr: "주얼리·공예품", cn: "珠宝饰品工艺品" },
              { kr: "생활잡화", cn: "日用百货类" },
              { kr: "주류·식품", cn: "酒类食品" },
              { kr: "일대일로 국가관", cn: "一带一路国家馆" },
            ],
          },
        ],
      },
      {
        floor: 2,
        floorLabel: "2층",
        imageAvailable: false,
        sections: [
          {
            section: "혼례·침구·반려동물존",
            products: [
              { kr: "혼례용품", cn: "婚庆用品" },
              { kr: "침구·이불", cn: "床上用品" },
              { kr: "가발·헤어제품", cn: "发制品" },
              { kr: "반려동물·수족관용품", cn: "宠物水族用品" },
            ],
          },
        ],
      },
      {
        floor: 3,
        floorLabel: "3층",
        imageAvailable: false,
        sections: [
          {
            section: "호텔·커튼·방직존",
            products: [
              { kr: "호텔용품", cn: "酒店用品" },
              { kr: "커튼·블라인드 원단", cn: "窗帘布类" },
              { kr: "니트·방직물", cn: "针纺布类" },
            ],
          },
        ],
      },
      {
        floor: 4,
        floorLabel: "4층",
        imageAvailable: false,
        sections: [
          {
            section: "자동차용품존",
            products: [
              { kr: "자동차용품·부품", cn: "汽车用品及配件" },
              { kr: "소상품 유통", cn: "小商品配送" },
            ],
          },
        ],
      },
      {
        floor: 5,
        floorLabel: "5층",
        imageAvailable: false,
        sections: [
          {
            section: "인터넷쇼핑존",
            products: [
              { kr: "인터넷쇼핑 서비스존", cn: "网商服务区" },
            ],
          },
        ],
      },
    ],
  },
  {
    district: 6,
    name: "6구",
    nameCn: "六区",
    address: "义乌国际商贸城六区",
    floors: [
      {
        floor: 1,
        floorLabel: "1층",
        imageAvailable: false,
        sections: [
          {
            section: "주얼리·패션·완구존",
            products: [
              { kr: "패션 주얼리", cn: "时尚珠宝" },
              { kr: "패션 원단·의류", cn: "时尚服饰面料" },
              { kr: "크리에이티브 완구", cn: "创意潮流玩具" },
            ],
          },
        ],
      },
      {
        floor: 2,
        floorLabel: "2층",
        imageAvailable: false,
        sections: [
          {
            section: "뷰티·유아동존",
            products: [
              { kr: "스킨케어·뷰티", cn: "护肤及美容用品" },
              { kr: "패션 원단", cn: "时尚服饰面料" },
              { kr: "유아동용품", cn: "婴幼童生活用品" },
            ],
          },
        ],
      },
      {
        floor: 3,
        floorLabel: "3층",
        imageAvailable: false,
        sections: [
          {
            section: "스마트기기·홈·여행존",
            products: [
              { kr: "가정생활·의료기기", cn: "家庭生活健康医疗用品" },
              { kr: "드론·로봇·AR·VR", cn: "智能无人装备" },
              { kr: "여행용품", cn: "旅行好物" },
            ],
          },
        ],
      },
    ],
  },
];

export interface SearchResult {
  district: number;
  districtName: string;
  floor: number;
  floorLabel: string;
  section: string;
  product: ProductCategory;
}

export function searchProducts(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  const results: SearchResult[] = [];

  for (const d of YIWU_DISTRICTS) {
    for (const f of d.floors) {
      for (const s of f.sections) {
        for (const p of s.products) {
          if (p.kr.toLowerCase().includes(q) || p.cn.toLowerCase().includes(q)) {
            results.push({
              district: d.district,
              districtName: d.name,
              floor: f.floor,
              floorLabel: f.floorLabel,
              section: s.section,
              product: p,
            });
          }
        }
      }
    }
  }

  return results;
}
