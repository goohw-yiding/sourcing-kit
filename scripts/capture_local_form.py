"""폼 로그인으로 로컬 pricing 정책 섹션 캡처"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import time

BASE_URL = "http://localhost:3001"
SAVE_DIR = Path(r"C:\Users\USER\Documents\Claude\cord\trade-sourcing-app\scripts\screenshots")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    )
    page = context.new_page()
    page.set_default_timeout(60000)

    # 1. 로그인 페이지 접근
    page.goto(f"{BASE_URL}/login", wait_until="load")
    time.sleep(3)
    print(f"Login page URL: {page.url}")

    # localStorage 설정
    page.evaluate("""() => {
        try {
            localStorage.setItem('lang', 'ko');
            localStorage.setItem('userName', 'dummy');
            localStorage.setItem('theme', 'navy');
        } catch(e) {}
    }""")
    time.sleep(1)

    # 2. 이메일/비밀번호 입력
    inputs = page.locator("input").all()
    print(f"Inputs found: {len(inputs)}")
    for i, inp in enumerate(inputs):
        t = inp.get_attribute("type") or ""
        n = inp.get_attribute("name") or ""
        p2 = inp.get_attribute("placeholder") or ""
        print(f"  [{i}] type={t}, name={n}, placeholder={p2[:30]}")

    # 이메일 입력
    email_input = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="이메일"]').first
    email_input.fill("localtest@test.com")
    time.sleep(0.3)

    # 비밀번호 입력
    pw_input = page.locator('input[type="password"]').first
    pw_input.fill("Test1234!")
    time.sleep(0.3)

    # 3. 로그인 버튼 클릭
    login_btn = page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("시작")').first
    login_btn.click()
    time.sleep(5)
    print(f"After login URL: {page.url}")

    if "login" in page.url:
        print("Login FAILED - still on login page")
        page.screenshot(path=str(SAVE_DIR / "debug_login_local.png"))
    else:
        print("Login SUCCESS!")
        page.evaluate("""() => {
            localStorage.setItem('userName', '테스트');
        }""")

        # 4. 요금제 페이지 이동
        page.goto(f"{BASE_URL}/pricing", wait_until="networkidle")
        time.sleep(3)
        print(f"Pricing URL: {page.url}")

        text = page.inner_text("body")
        print(f"Policy sections: 서비스 제공기간={'서비스 제공기간' in text}, 환불={'환불 및 취소' in text}")

        # 5. 상단 스크린샷 (플랜 카드)
        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(0.3)
        page.screenshot(path=str(SAVE_DIR / "03_pricing.png"), full_page=False)
        print("Top screenshot saved")

        # 6. 정책 섹션 스크롤 + 캡처
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(0.5)
        page.screenshot(path=str(SAVE_DIR / "03_pricing_policy.png"), full_page=False)
        print("Policy screenshot saved")

        # 7. 전체 페이지
        page.screenshot(path=str(SAVE_DIR / "03_pricing_full.png"), full_page=True)
        print("Full page saved")

    browser.close()
    print("Done!")
