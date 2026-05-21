"""JWT 직접 생성으로 로컬 pricing 페이지 캡처"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import time
import json
import base64
import hmac
import hashlib
import struct
import os

BASE_URL = "http://localhost:3001"
SAVE_DIR = Path(r"C:\Users\USER\Documents\Claude\cord\trade-sourcing-app\scripts\screenshots")
NEXTAUTH_SECRET = "sourcing-kit-secret-key-2024-please-change-in-prod"

def base64url_encode(data):
    if isinstance(data, str):
        data = data.encode()
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

def base64url_decode(s):
    pad = 4 - len(s) % 4
    if pad != 4:
        s += '=' * pad
    return base64.urlsafe_b64decode(s)

def create_nextauth_jwt():
    """NextAuth compatible JWT (JWE) - too complex. Use jose instead."""
    pass

# jose 라이브러리로 NextAuth JWT 생성
try:
    import joserfc
    USE_JOSE = True
except ImportError:
    USE_JOSE = False

# python-jose 사용
try:
    from jose import jwt as jose_jwt
    from jose.constants import Algorithms
    import datetime

    # NextAuth JWT payload (credentials provider)
    now = int(time.time())
    payload = {
        "sub": "local-user-1",
        "email": "localtest@test.com",
        "name": "테스트유저",
        "tenantId": "local-tenant-1",
        "userId": "local-user-1",
        "iat": now,
        "exp": now + 3600,
        "jti": "local-test-jti",
    }

    # NextAuth uses HS256 by default for JWT strategy
    token = jose_jwt.encode(payload, NEXTAUTH_SECRET, algorithm="HS256")
    print(f"JWT created: {token[:50]}...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        )

        # NextAuth 세션 쿠키 주입
        context.add_cookies([{
            "name": "next-auth.session-token",
            "value": token,
            "domain": "localhost",
            "path": "/",
            "httpOnly": True,
            "secure": False,
        }])

        page = context.new_page()
        page.evaluate("""() => {
            localStorage.setItem('lang', 'ko');
            localStorage.setItem('userName', '테스트');
            localStorage.setItem('theme', 'navy');
        }""")

        page.goto(f"{BASE_URL}/pricing", wait_until="networkidle")
        time.sleep(2)
        print(f"URL: {page.url}")

        text = page.inner_text("body")
        print(f"Policy found: {'서비스 제공기간' in text}")
        print(f"Refund found: {'환불 및 취소' in text}")

        # 상단 플랜 카드 스크린샷 (PPT용)
        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(0.3)
        page.screenshot(path=str(SAVE_DIR / "03_pricing.png"), full_page=False)
        print("Top screenshot saved")

        # 정책 섹션 스크롤
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(0.5)
        page.screenshot(path=str(SAVE_DIR / "03_pricing_policy.png"), full_page=False)
        print("Policy screenshot saved")

        # 전체 페이지
        page.screenshot(path=str(SAVE_DIR / "03_pricing_full.png"), full_page=True)
        print("Full page saved")

        browser.close()

except ImportError:
    print("python-jose not installed. Installing...")
    os.system("pip install python-jose -q")
    print("Installed. Re-run the script.")
