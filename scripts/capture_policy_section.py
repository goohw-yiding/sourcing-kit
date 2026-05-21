"""로컬 dev 서버에서 요금제 페이지 정책 섹션 캡처"""
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

    # 요금제 페이지 접근 (비로그인 상태)
    page.goto(f"{BASE_URL}/pricing", wait_until="networkidle")
    page.evaluate("""() => {
        localStorage.setItem('lang', 'ko');
        localStorage.setItem('userName', 'testuser');
        localStorage.setItem('theme', 'navy');
    }""")
    time.sleep(2)

    # 정책 섹션 있는지 확인
    text = page.inner_text("body")
    print("Policy found:", "서비스 제공기간" in text)
    print("Refund found:", "환불 및 취소" in text)

    # 전체 페이지 스크린샷
    full_path = SAVE_DIR / "03_pricing_full.png"
    page.screenshot(path=str(full_path), full_page=True)
    print(f"Full page saved: {full_path}")

    # 맨 아래로 스크롤 - 정책 섹션 캡처
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(0.5)
    policy_path = SAVE_DIR / "03_pricing_policy.png"
    page.screenshot(path=str(policy_path), full_page=False)
    print(f"Policy section saved: {policy_path}")

    # 서비스 제공기간 섹션 위치로 정확히 스크롤
    try:
        # "서비스 제공기간" 텍스트가 있는 요소 찾기
        section = page.get_by_text("서비스 제공기간").first
        section.scroll_into_view_if_needed()
        time.sleep(0.5)
        service_path = SAVE_DIR / "03_pricing_service_period.png"
        page.screenshot(path=str(service_path), full_page=False)
        print(f"Service period section saved: {service_path}")
    except Exception as e:
        print(f"Service period section not found: {e}")

    browser.close()
