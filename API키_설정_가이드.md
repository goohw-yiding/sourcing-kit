# 소싱킷 API 키 설정 가이드

> 이 가이드는 HS코드 AI 검색 기능을 활성화하기 위한 설정 방법입니다.

---

## ⚠️ 먼저 해야 할 일: API 키 재발급

현재 `.env.local`에 있는 API 키가 채팅에 노출된 적 있습니다.
**지금 바로 폐기하고 새로 발급받으세요.**

---

## 1. Anthropic API 키 발급 (HS코드 AI 검색용)

### 가입 & 로그인
1. 브라우저에서 **https://console.anthropic.com** 접속
2. 우측 상단 **Sign Up** → Google 계정으로 가입 가능

### API 키 발급
1. 로그인 후 왼쪽 메뉴 **"API Keys"** 클릭
2. **"Create Key"** 버튼 클릭
3. 이름 입력 (예: `소싱킷-앱`)
4. 생성된 키 복사 (`sk-ant-api03-...` 형식)
   > ⚠️ 이 창 닫으면 다시 볼 수 없습니다! 꼭 복사하세요.

### 크레딧 충전
1. 왼쪽 메뉴 **"Billing"** 클릭
2. **"Add Credits"** → 최소 $5 (약 7,000원) 충전
3. 신용카드 등록 후 결제

> 💰 **비용 안내:** HS코드 검색 1회 ≈ $0.0001 (약 0.14원)
> $5 충전하면 약 **35,000번 검색** 가능 → 실질적으로 무제한

---

## 2. 앱에 API 키 등록

### .env.local 파일 수정
앱 폴더(`C:\Users\goohw\trade-sourcing-app\`)에서 `.env.local` 파일을 열고:

```
ANTHROPIC_API_KEY=sk-ant-api03-여기에붙여넣기
```

> 파일이 없으면 새로 만드세요 (확장자 없이 `.env.local`)

### 앱 재시작
`.env.local` 수정 후 **실행하기.bat를 껐다가 다시 실행**해야 적용됩니다.

---

## 3. 동작 방식 (3단계 검색)

```
사용자가 검색어 입력
        ↓
1단계: 내부 DB 검색 (200+ 품목, 즉시, 무료)
        ↓ 결과 없으면
2단계: 관세청 공식 API (CUSTOMS_API_KEY 있을 때)
        ↓ 결과 없으면
3단계: Claude AI 검색 (ANTHROPIC_API_KEY 필요)
        → 어떤 상품이든 HS코드 추천
```

**현재 상태:**
- ✅ 1단계 내부 DB: 항상 동작 (의류, 신발, 가방, 화장품, 전자제품 등 200+ 품목)
- ❌ 3단계 AI: API 키 필요 → 위 과정대로 설정 시 즉시 활성화

---

## 4. 선택사항: 관세청 공식 API (더 정확한 검색)

관세청 UNI-PASS 시스템 API로 공식 HS코드 DB를 직접 검색합니다.

1. **https://unipass.customs.go.kr** → 회원가입
2. 개발자센터 → API 신청 → "통관시스템HS부호조회" 신청
3. 발급받은 키를 `.env.local`에 추가:
```
CUSTOMS_API_KEY=여기에붙여넣기
```

> 📝 심사에 1~3일 소요. 무료입니다.

---

## 5. 최종 .env.local 예시

```
# Claude AI (HS코드 AI 검색)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxx

# 관세청 공식 API (선택, 더 정확한 검색)
CUSTOMS_API_KEY=xxxxxxxxxxxxxxxxxxxx

# 수출입은행 환율 API (선택, 더 정확한 환율)
EXIM_API_KEY=xxxxxxxxxxxxxxxxxxxx
```

---

## 6. 수출입은행 환율 API (선택)

더 정확한 공식 환율(전신환매도율)을 자동으로 가져올 수 있습니다.

1. **https://www.koreaexim.go.kr** → 개발자 포털
2. 환율정보 API 신청 (무료)
3. 발급 키를 `.env.local`에 `EXIM_API_KEY=` 로 추가

---

*문서 작성: 소싱킷 v1.0 | 2026년 5월*
