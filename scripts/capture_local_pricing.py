"""로컬 dev 서버에서 요금제 페이지 전체 캡처 (정책 섹션 포함)"""
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

    # 1. 로컬 로그인 (API 방식)
    csrf = page.request.get(f"{BASE_URL}/api/auth/csrf").json()["csrfToken"]
    login = page.request.post(
        f"{BASE_URL}/api/auth/callback/credentials",
        form={
            "csrfToken": csrf,
            "email": "localtest@test.com",
            "password": "Test1234!",
            "callbackUrl": f"{BASE_URL}/",
            "json": "true",
        },
    )
    print(f"Login: {login.status}")

    # 2. localStorage 설정
    page.goto(f"{BASE_URL}/", wait_until="networkidle")
    page.evaluate("""() => {
        localStorage.setItem('lang', 'ko');
        localStorage.setItem('userName', '테스트');
        localStorage.setItem('theme', 'navy');
    }""")

    # 3. 요금제 페이지 이동
    page.goto(f"{BASE_URL}/pricing", wait_until="networkidle")
    time.sleep(2)
    print(f"URL: {page.url}")

    # 4. 정책 섹션 확인
    text = page.inner_text("body")
    print(f"Policy found: {'서비스 제공기간' in text}")
    print(f"Refund found: {'환불 및 취소' in text}")

    # 5. 뷰포트 스크린샷 (상단 - 플랜 카드)
    path_top = SAVE_DIR / "03_pricing.png"
    page.screenshot(path=str(path_top), full_page=False)
    print(f"Top saved: {path_top}")

    # 6. 정책 섹션으로 스크롤 + 스크린샷
    page.evaluate("document.querySelector('body').scrollTo(0, 9999)")
    time.sleep(0.5)
    path_policy = SAVE_DIR / "03_pricing_policy.png"
    page.screenshot(path=str(path_policy), full_page=False)
    print(f"Policy saved: {path_policy}")

    # 7. 전체 페이지 스크린샷
    path_full = SAVE_DIR / "03_pricing_full.png"
    page.screenshot(path=str(path_full), full_page=True)
    print(f"Full page saved: {path_full}")

    browser.close()
    print("Done!")
