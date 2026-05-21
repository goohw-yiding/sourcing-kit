"""Vercel 배포 확인 + 요금제 페이지 정책 섹션 전체 캡처"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import time

BASE_URL = "https://www.sourcing-kit.kr"
SAVE_DIR = Path(r"C:\Users\USER\Documents\Claude\cord\trade-sourcing-app\scripts\screenshots")

def check_and_capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
        )
        page = context.new_page()

        # 로그인 (API)
        csrf = page.request.get(f"{BASE_URL}/api/auth/csrf").json()["csrfToken"]
        login = page.request.post(
            f"{BASE_URL}/api/auth/callback/credentials",
            form={"csrfToken": csrf, "email": "ppttest2025@gmail.com",
                  "password": "Test1234!", "callbackUrl": f"{BASE_URL}/", "json": "true"},
        )
        print(f"Login: {login.status}")

        page.goto(f"{BASE_URL}/pricing", wait_until="networkidle")
        page.evaluate("""() => {
            localStorage.setItem('lang', 'ko');
            localStorage.setItem('userName', '천무');
            localStorage.setItem('theme', 'navy');
        }""")
        time.sleep(2)

        # 페이지 텍스트에 새 섹션 있는지 확인
        text = page.inner_text("body")
        has_policy = "서비스 제공기간" in text or "환불 및 취소" in text
        print(f"Policy deployed: {'YES' if has_policy else 'NO - not yet'}")

        # 전체 페이지 스크린샷 (full_page=True)
        full_path = SAVE_DIR / "03_pricing_full.png"
        page.screenshot(path=str(full_path), full_page=True)
        print(f"전체 페이지 저장: {full_path}")

        # 정책 섹션만 스크롤해서 캡처
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(0.5)
        policy_path = SAVE_DIR / "03_pricing_policy.png"
        page.screenshot(path=str(policy_path), full_page=False)
        print(f"정책 하단 저장: {policy_path}")

        browser.close()
        return has_policy

check_and_capture()
