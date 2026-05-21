"""
소싱킷 결제경로 스크린샷 자동 캡처
Chrome 프로필을 사용해 로그인된 상태로 캡처
"""
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

# 저장 경로
SAVE_DIR = Path(r"C:\Users\USER\Documents\Claude\cord\trade-sourcing-app\scripts\screenshots")
SAVE_DIR.mkdir(exist_ok=True)

# Chrome 사용자 프로필 경로
CHROME_USER_DATA = r"C:\Users\USER\AppData\Local\Google\Chrome\User Data"

def capture_screenshots():
    with sync_playwright() as p:
        # 기존 Chrome 프로필 사용 (로그인 세션 유지)
        context = p.chromium.launch_persistent_context(
            user_data_dir=CHROME_USER_DATA,
            channel="chrome",
            headless=False,
            viewport={"width": 390, "height": 844},  # iPhone 14 크기
            device_scale_factor=2,
            args=["--disable-blink-features=AutomationControlled"],
            ignore_default_args=["--enable-automation"],
        )

        page = context.new_page()

        screenshots = []

        # 1. 로그인 페이지
        print("1. 로그인 페이지 캡처...")
        page.goto("https://www.sourcing-kit.kr/auth/signin", wait_until="networkidle")
        time.sleep(1)
        path = SAVE_DIR / "01_login.png"
        page.screenshot(path=str(path), full_page=False)
        screenshots.append(str(path))
        print(f"   저장: {path}")

        # 2. 홈 화면 (로그인 후)
        print("2. 홈 화면 캡처...")
        page.goto("https://www.sourcing-kit.kr", wait_until="networkidle")
        time.sleep(1)
        path = SAVE_DIR / "02_home.png"
        page.screenshot(path=str(path), full_page=False)
        screenshots.append(str(path))
        print(f"   저장: {path}")

        # 3. 요금제 페이지
        print("3. 요금제 페이지 캡처...")
        page.goto("https://www.sourcing-kit.kr/pricing", wait_until="networkidle")
        time.sleep(1)
        path = SAVE_DIR / "03_pricing.png"
        page.screenshot(path=str(path), full_page=False)
        screenshots.append(str(path))
        print(f"   저장: {path}")

        # 4. 맛보기 결제 버튼 클릭 → 토스 결제창
        print("4. 토스 결제창 캡처...")
        # 맛보기 버튼 클릭
        taste_btn = page.get_by_text("30일 맛보기 시작")
        if taste_btn.count() > 0:
            taste_btn.first.click()
            time.sleep(3)  # 결제창 로드 대기
            path = SAVE_DIR / "04_toss_payment.png"
            page.screenshot(path=str(path), full_page=False)
            screenshots.append(str(path))
            print(f"   저장: {path}")
        else:
            print("   맛보기 버튼 없음 - 건너뜀")

        # 5. Pro 플랜 빌링 인증 (정기결제)
        print("5. 정기결제 빌링 창 캡처...")
        page.goto("https://www.sourcing-kit.kr/pricing", wait_until="networkidle")
        time.sleep(1)
        # Pro 월결제 버튼 클릭
        pro_btn = page.get_by_text("월 구독 시작하기")
        if pro_btn.count() == 0:
            pro_btn = page.get_by_text("Pro 시작")
        if pro_btn.count() == 0:
            # 스크롤 다운 후 재시도
            page.keyboard.press("End")
            time.sleep(1)
            pro_btn = page.locator("button").filter(has_text="구독")

        if pro_btn.count() > 0:
            pro_btn.first.click()
            time.sleep(3)
            path = SAVE_DIR / "05_billing_auth.png"
            page.screenshot(path=str(path), full_page=False)
            screenshots.append(str(path))
            print(f"   저장: {path}")
        else:
            print("   Pro 버튼 없음 - 건너뜀")

        context.close()

        print(f"\n완료! {len(screenshots)}개 스크린샷 저장됨:")
        for s in screenshots:
            print(f"  {s}")

        return screenshots

if __name__ == "__main__":
    capture_screenshots()
