"""
소싱킷 결제경로 스크린샷 캡처 (Playwright - API 로그인 방식)
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import time
import json

SAVE_DIR = Path(r"C:\Users\USER\Documents\Claude\cord\trade-sourcing-app\scripts\screenshots")
SAVE_DIR.mkdir(exist_ok=True)

BASE_URL = "https://www.sourcing-kit.kr"
EMAIL = "ppttest2025@gmail.com"
PASSWORD = "Test1234!"
VIEWPORT = {"width": 390, "height": 844}


def api_login(page):
    """NextAuth API를 사용해 로그인 후 쿠키 설정"""
    # 1. CSRF 토큰 가져오기
    csrf_response = page.request.get(f"{BASE_URL}/api/auth/csrf")
    csrf_data = csrf_response.json()
    csrf_token = csrf_data["csrfToken"]
    print(f"   CSRF 토큰: {csrf_token[:20]}...")

    # 2. 로그인 API 호출
    login_response = page.request.post(
        f"{BASE_URL}/api/auth/callback/credentials",
        form={
            "csrfToken": csrf_token,
            "email": EMAIL,
            "password": PASSWORD,
            "callbackUrl": f"{BASE_URL}/",
            "json": "true",
        },
    )
    data = login_response.json()
    print(f"   로그인 결과: status={login_response.status}, data={data}")
    return login_response.status == 200


def dismiss_modal_via_js(page):
    """localStorage로 온보딩 모달 스킵 (userName + lang 설정)"""
    page.evaluate("""() => {
        try {
            localStorage.setItem('lang', 'ko');
            localStorage.setItem('userName', '천무');
            localStorage.setItem('theme', 'navy');
        } catch(e) {}
    }""")


def capture_all():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=2,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        )
        page = context.new_page()
        screenshots = {}

        # ── 초기 방문 + localStorage 설정 ──────────────────────
        print("초기 설정...")
        page.goto(f"{BASE_URL}/login", wait_until="load")
        time.sleep(1)
        dismiss_modal_via_js(page)

        # ── 로그인 (API) ───────────────────────────────────────
        print("API 로그인...")
        logged_in = api_login(page)
        if not logged_in:
            print("   로그인 실패!")
            return {}
        print("   로그인 성공!")

        # ── 1. 로그인 페이지 (로그아웃 후 캡처) ──────────────
        print("1. 로그인 페이지 캡처...")
        # 로그인 페이지를 보려면 session 없이 접근해야 하므로
        # 별도 context로 캡처
        anon_context = browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=2,
        )
        anon_page = anon_context.new_page()
        anon_page.goto(f"{BASE_URL}/login", wait_until="load")
        time.sleep(1)
        dismiss_modal_via_js(anon_page)

        # 국가 모달 버튼으로 닫기
        try:
            next_btn = anon_page.locator('button:has-text("다음")').first
            if next_btn.is_visible(timeout=3000):
                kr_btn = anon_page.locator('button:has-text("한국")').first
                if kr_btn.is_visible(timeout=1000):
                    kr_btn.click()
                    time.sleep(0.3)
                next_btn.click()
                time.sleep(1)
                dismiss_modal_via_js(anon_page)
                anon_page.reload(wait_until="networkidle")
                time.sleep(2)
        except Exception as ex:
            print(f"   모달 처리: {ex}")

        path = SAVE_DIR / "01_login.png"
        anon_page.screenshot(path=str(path), full_page=False)
        screenshots["login"] = str(path)
        print(f"   저장: {path}")
        anon_context.close()

        # ── 2. 홈 화면 (로그인됨) ─────────────────────────────
        print("2. 홈 화면 캡처...")
        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        time.sleep(2)
        print(f"   현재 URL: {page.url}")

        # 국가 모달 처리
        try:
            next_btn = page.locator('button:has-text("다음")').first
            if next_btn.is_visible(timeout=2000):
                kr_btn = page.locator('button:has-text("한국")').first
                if kr_btn.is_visible(timeout=1000):
                    kr_btn.click()
                    time.sleep(0.3)
                next_btn.click()
                time.sleep(1)
        except Exception:
            pass

        path = SAVE_DIR / "02_home.png"
        page.screenshot(path=str(path), full_page=False)
        screenshots["home"] = str(path)
        print(f"   저장: {path}")

        # ── 3. 요금제 페이지 ──────────────────────────────────
        print("3. 요금제 페이지 캡처...")
        page.goto(f"{BASE_URL}/pricing", wait_until="networkidle")
        time.sleep(2)
        path = SAVE_DIR / "03_pricing.png"
        page.screenshot(path=str(path), full_page=False)
        screenshots["pricing"] = str(path)
        print(f"   저장: {path}")

        # 버튼 목록 확인
        buttons = page.locator('button').all()
        print(f"   Buttons found: {len(buttons)}")
        for btn in buttons[:15]:
            try:
                txt = btn.inner_text().strip()[:50]
                if txt:
                    print(f"     - {txt.encode('ascii', 'replace').decode()}")
            except Exception:
                pass

        # ── 4. 단건결제 버튼 → Toss 결제창 ──────────────────
        print("4. Toss 단건결제창 캡처...")

        # 맛보기/30일 버튼 찾기
        all_btns = page.locator('button').all()
        taste_btn = None
        for btn in all_btns:
            txt = btn.inner_text().strip()
            if any(kw in txt for kw in ["맛보기", "30일", "시작하기", "9,900"]):
                taste_btn = btn
                print(f"   click: {txt[:40].encode('ascii','replace').decode()}")
                break

        if taste_btn:
            taste_btn.click()
            time.sleep(5)  # Toss 결제창 로드
            path = SAVE_DIR / "04_toss_onetime.png"
            page.screenshot(path=str(path), full_page=False)
            screenshots["toss_onetime"] = str(path)
            print(f"   저장: {path}")
        else:
            print("   단건결제 버튼 없음")

        # ── 5. 정기결제 버튼 → Toss 빌링창 ─────────────────
        print("5. Toss 빌링결제창 캡처...")
        page.goto(f"{BASE_URL}/pricing", wait_until="networkidle")
        time.sleep(2)

        all_btns = page.locator('button').all()
        billing_btn = None
        for btn in all_btns:
            txt = btn.inner_text().strip()
            if any(kw in txt for kw in ["구독", "Pro", "월 구독", "7,900"]):
                billing_btn = btn
                print(f"   click: {txt[:40].encode('ascii','replace').decode()}")
                break

        if billing_btn:
            billing_btn.click()
            time.sleep(5)
            path = SAVE_DIR / "05_toss_billing.png"
            page.screenshot(path=str(path), full_page=False)
            screenshots["toss_billing"] = str(path)
            print(f"   저장: {path}")
        else:
            print("   빌링결제 버튼 없음")

        context.close()
        browser.close()

        print(f"\n완료! {len(screenshots)}개 스크린샷:")
        for k, v in screenshots.items():
            print(f"  {k}: {v}")
        return screenshots


if __name__ == "__main__":
    capture_all()
