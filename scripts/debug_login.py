"""Debug login page loading - check HTML"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "https://www.sourcing-kit.kr"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
    )
    page = context.new_page()

    print("Navigating to /login ...")
    page.goto(f"{BASE_URL}/login", wait_until="networkidle")
    time.sleep(5)

    # Get HTML
    html = page.content()
    # Save to file for inspection
    with open(r"C:\Users\USER\Documents\Claude\cord\trade-sourcing-app\scripts\debug_page.html", "w", encoding="utf-8") as f:
        f.write(html)
    print(f"HTML saved ({len(html)} chars)")
    print(f"Has 'input': {'<input' in html}")
    print(f"Has 'form': {'<form' in html}")
    print(f"Has 'button': {'<button' in html}")
    print(f"URL: {page.url}")

    # Save screenshot
    page.screenshot(path=r"C:\Users\USER\Documents\Claude\cord\trade-sourcing-app\scripts\screenshots\debug_login.png")
    print("Screenshot saved")

    browser.close()
