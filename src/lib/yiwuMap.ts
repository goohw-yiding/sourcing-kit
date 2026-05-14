export interface ProductCategory {
  kr: string;
  cn: string;
}

export interface FloorSection {
  section: string; // "A区", "B区", etc.
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
            section: "A区",
            products: [
              { kr: "양말", cn: "袜子" },
              { kr: "스타킹", cn: "丝袜" },
              { kr: "레깅스", cn: "打底裤" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "넥타이", cn: "领带" },
              { kr: "스카프", cn: "围巾" },
              { kr: "장갑", cn: "手套" },
              { kr: "모자", cn: "帽子" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "허리띠", cn: "腰带" },
              { kr: "벨트", cn: "皮带" },
              { kr: "지갑", cn: "钱包" },
              { kr: "가방", cn: "包包" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "우산", cn: "雨伞" },
              { kr: "우비", cn: "雨衣" },
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
            section: "A区",
            products: [
              { kr: "장신구", cn: "饰品" },
              { kr: "귀걸이", cn: "耳环" },
              { kr: "목걸이", cn: "项链" },
              { kr: "팔찌", cn: "手链" },
              { kr: "반지", cn: "戒指" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "머리핀", cn: "发夹" },
              { kr: "헤어밴드", cn: "发带" },
              { kr: "헤어액세서리", cn: "发饰" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "패션의류", cn: "时装" },
              { kr: "여성의류", cn: "女装" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "아동의류", cn: "童装" },
              { kr: "유아복", cn: "婴儿服" },
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
            section: "A区",
            products: [
              { kr: "란제리", cn: "内衣" },
              { kr: "속옷", cn: "内裤" },
              { kr: "수면바지", cn: "睡裤" },
              { kr: "잠옷", cn: "睡衣" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "수영복", cn: "游泳衣" },
              { kr: "스포츠웨어", cn: "运动服" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "남성의류", cn: "男装" },
              { kr: "남성속옷", cn: "男士内衣" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "학용품", cn: "文具" },
              { kr: "사무용품", cn: "办公用品" },
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
            section: "A区",
            products: [
              { kr: "인공꽃", cn: "仿真花" },
              { kr: "조화", cn: "假花" },
              { kr: "화분", cn: "花盆" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "크리스마스용품", cn: "圣诞用品" },
              { kr: "파티용품", cn: "派对用品" },
              { kr: "축제장식", cn: "节庆装饰" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "공예품", cn: "工艺品" },
              { kr: "선물용품", cn: "礼品" },
              { kr: "기념품", cn: "纪念品" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "종교용품", cn: "宗教用品" },
              { kr: "불교용품", cn: "佛教用品" },
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
            section: "A区",
            products: [
              { kr: "전기용품", cn: "电器用品" },
              { kr: "소형가전", cn: "小家电" },
              { kr: "충전기", cn: "充电器" },
              { kr: "어댑터", cn: "适配器" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "조명기구", cn: "灯具" },
              { kr: "LED조명", cn: "LED灯" },
              { kr: "전구", cn: "电灯泡" },
              { kr: "스트링라이트", cn: "串灯" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "배터리", cn: "电池" },
              { kr: "전선", cn: "电线" },
              { kr: "플러그", cn: "插头" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "스마트폰 액세서리", cn: "手机配件" },
              { kr: "핸드폰 케이스", cn: "手机壳" },
              { kr: "이어폰", cn: "耳机" },
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
            section: "A区",
            products: [
              { kr: "장난감", cn: "玩具" },
              { kr: "봉제인형", cn: "毛绒玩具" },
              { kr: "블록장난감", cn: "积木玩具" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "보드게임", cn: "桌游" },
              { kr: "카드게임", cn: "卡牌游戏" },
              { kr: "퍼즐", cn: "拼图" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "교육완구", cn: "教育玩具" },
              { kr: "과학완구", cn: "科学玩具" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "스포츠완구", cn: "运动玩具" },
              { kr: "야외완구", cn: "户外玩具" },
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
            section: "A区",
            products: [
              { kr: "문구류", cn: "文具类" },
              { kr: "볼펜", cn: "圆珠笔" },
              { kr: "연필", cn: "铅笔" },
              { kr: "형광펜", cn: "荧光笔" },
              { kr: "마커", cn: "马克笔" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "노트", cn: "笔记本" },
              { kr: "다이어리", cn: "日记本" },
              { kr: "스케치북", cn: "素描本" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "가방", cn: "书包" },
              { kr: "학생가방", cn: "学生书包" },
              { kr: "백팩", cn: "双肩包" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "포장재료", cn: "包装材料" },
              { kr: "리본", cn: "丝带" },
              { kr: "포장지", cn: "包装纸" },
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
            section: "A区",
            products: [
              { kr: "스포츠용품", cn: "体育用品" },
              { kr: "운동기구", cn: "健身器材" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "아웃도어용품", cn: "户外用品" },
              { kr: "캠핑용품", cn: "露营用品" },
              { kr: "등산용품", cn: "登山用品" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "낚시용품", cn: "钓鱼用品" },
              { kr: "수영용품", cn: "游泳用品" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "자전거용품", cn: "自行车用品" },
              { kr: "헬멧", cn: "头盔" },
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
            section: "A区",
            products: [
              { kr: "주방용품", cn: "厨房用品" },
              { kr: "냄비", cn: "锅" },
              { kr: "프라이팬", cn: "平底锅" },
              { kr: "솥", cn: "炒锅" },
              { kr: "압력솥", cn: "压力锅" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "칼", cn: "刀具" },
              { kr: "도마", cn: "砧板" },
              { kr: "주방칼", cn: "菜刀" },
              { kr: "식칼", cn: "厨师刀" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "컵", cn: "杯子" },
              { kr: "머그컵", cn: "马克杯" },
              { kr: "텀블러", cn: "保温杯" },
              { kr: "물병", cn: "水壶" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "접시", cn: "盘子" },
              { kr: "그릇", cn: "碗" },
              { kr: "수저", cn: "筷子勺子" },
              { kr: "젓가락", cn: "筷子" },
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
            section: "A区",
            products: [
              { kr: "식품보관용기", cn: "保鲜盒" },
              { kr: "밀폐용기", cn: "密封盒" },
              { kr: "도시락통", cn: "便当盒" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "주방소도구", cn: "厨房小工具" },
              { kr: "채소칼", cn: "切菜器" },
              { kr: "강판", cn: "磨蒜器" },
              { kr: "필러", cn: "削皮器" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "청소용품", cn: "清洁用品" },
              { kr: "세제", cn: "洗洁精" },
              { kr: "수세미", cn: "百洁布" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "정리함", cn: "收纳盒" },
              { kr: "서랍정리대", cn: "抽屉整理盒" },
              { kr: "다용도선반", cn: "置物架" },
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
            section: "A区",
            products: [
              { kr: "욕실용품", cn: "卫浴用品" },
              { kr: "치약", cn: "牙膏" },
              { kr: "칫솔", cn: "牙刷" },
              { kr: "비누", cn: "香皂" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "수건", cn: "毛巾" },
              { kr: "목욕타월", cn: "浴巾" },
              { kr: "발매트", cn: "浴室地垫" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "욕실수납", cn: "浴室收纳" },
              { kr: "샤워용품", cn: "沐浴用品" },
              { kr: "샴푸", cn: "洗发水" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "화장품", cn: "化妆品" },
              { kr: "스킨케어", cn: "护肤品" },
              { kr: "마스크팩", cn: "面膜" },
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
            section: "A区",
            products: [
              { kr: "생활잡화", cn: "生活杂货" },
              { kr: "빗자루", cn: "扫帚" },
              { kr: "쓰레기통", cn: "垃圾桶" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "세탁용품", cn: "洗衣用品" },
              { kr: "빨래바구니", cn: "洗衣篮" },
              { kr: "옷걸이", cn: "衣架" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "인테리어소품", cn: "家居装饰" },
              { kr: "액자", cn: "相框" },
              { kr: "벽시계", cn: "挂钟" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "침구류", cn: "床上用品" },
              { kr: "베개", cn: "枕头" },
              { kr: "이불", cn: "被子" },
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
            section: "A区",
            products: [
              { kr: "신발", cn: "鞋子" },
              { kr: "운동화", cn: "运动鞋" },
              { kr: "슬리퍼", cn: "拖鞋" },
              { kr: "샌들", cn: "凉鞋" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "여성구두", cn: "女鞋" },
              { kr: "힐", cn: "高跟鞋" },
              { kr: "플랫슈즈", cn: "平底鞋" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "남성화", cn: "男鞋" },
              { kr: "캐주얼화", cn: "休闲鞋" },
              { kr: "구두", cn: "皮鞋" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "아동화", cn: "童鞋" },
              { kr: "유아신발", cn: "婴儿鞋" },
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
            section: "A区",
            products: [
              { kr: "핸드백", cn: "手提包" },
              { kr: "숄더백", cn: "单肩包" },
              { kr: "크로스백", cn: "斜挎包" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "여행가방", cn: "旅行箱" },
              { kr: "캐리어", cn: "行李箱" },
              { kr: "여행파우치", cn: "旅行袋" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "지갑", cn: "皮夹" },
              { kr: "카드지갑", cn: "卡包" },
              { kr: "동전지갑", cn: "零钱包" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "백팩", cn: "双肩包" },
              { kr: "노트북가방", cn: "电脑包" },
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
            section: "A区",
            products: [
              { kr: "안경", cn: "眼镜" },
              { kr: "선글라스", cn: "太阳镜" },
              { kr: "안경테", cn: "镜架" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "시계", cn: "手表" },
              { kr: "손목시계", cn: "腕表" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "화장품용품", cn: "化妆工具" },
              { kr: "화장붓", cn: "化妆刷" },
              { kr: "화장솜", cn: "化妆棉" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "향수", cn: "香水" },
              { kr: "바디용품", cn: "身体护理" },
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
            section: "A区",
            products: [
              { kr: "건강용품", cn: "健康用品" },
              { kr: "마사지기구", cn: "按摩器材" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "의료용품", cn: "医疗用品" },
              { kr: "혈압계", cn: "血压计" },
              { kr: "체온계", cn: "体温计" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "건강식품", cn: "保健食品" },
              { kr: "영양제", cn: "营养补充剂" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "애완용품", cn: "宠物用品" },
              { kr: "강아지용품", cn: "狗用品" },
              { kr: "고양이용품", cn: "猫用品" },
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
            section: "A区",
            products: [
              { kr: "전자제품", cn: "电子产品" },
              { kr: "블루투스스피커", cn: "蓝牙音响" },
              { kr: "무선이어폰", cn: "无线耳机" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "드론", cn: "无人机" },
              { kr: "RC카", cn: "遥控车" },
              { kr: "로봇완구", cn: "机器人玩具" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "스마트홈기기", cn: "智能家居设备" },
              { kr: "CCTV", cn: "监控摄像头" },
              { kr: "도어벨", cn: "门铃" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "보조배터리", cn: "移动电源" },
              { kr: "무선충전기", cn: "无线充电器" },
              { kr: "USB허브", cn: "USB集线器" },
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
            section: "A区",
            products: [
              { kr: "DIY공구", cn: "DIY工具" },
              { kr: "드라이버", cn: "螺丝刀" },
              { kr: "망치", cn: "锤子" },
              { kr: "측정도구", cn: "量具" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "접착제", cn: "粘合剂" },
              { kr: "테이프", cn: "胶带" },
              { kr: "실리콘", cn: "硅胶" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "자물쇠", cn: "锁具" },
              { kr: "경첩", cn: "合页" },
              { kr: "나사못", cn: "螺丝钉" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "안전용품", cn: "安全用品" },
              { kr: "안전모", cn: "安全帽" },
              { kr: "작업장갑", cn: "劳保手套" },
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
            section: "A区",
            products: [
              { kr: "자동차용품", cn: "汽车用品" },
              { kr: "카매트", cn: "脚垫" },
              { kr: "차량방향제", cn: "车载香薰" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "자동차청소용품", cn: "洗车用品" },
              { kr: "스프레이왁스", cn: "喷蜡" },
              { kr: "클리너", cn: "清洁剂" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "자동차부품", cn: "汽车配件" },
              { kr: "카스테레오", cn: "车载音响" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "오토바이용품", cn: "摩托车用品" },
              { kr: "자전거부품", cn: "自行车配件" },
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
            section: "A区",
            products: [
              { kr: "원단", cn: "面料" },
              { kr: "천", cn: "布料" },
              { kr: "실", cn: "线" },
            ],
          },
          {
            section: "B区",
            products: [
              { kr: "단추", cn: "扣子" },
              { kr: "지퍼", cn: "拉链" },
              { kr: "레이스", cn: "花边" },
            ],
          },
          {
            section: "C区",
            products: [
              { kr: "재봉용품", cn: "缝纫用品" },
              { kr: "재봉틀", cn: "缝纫机" },
              { kr: "바느질도구", cn: "针线工具" },
            ],
          },
          {
            section: "D区",
            products: [
              { kr: "자수용품", cn: "刺绣用品" },
              { kr: "뜨개질", cn: "编织用品" },
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
