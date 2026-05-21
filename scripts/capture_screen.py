"""
현재 화면 캡처 후 Chrome 콘텐츠 영역만 크롭
Chrome 창을 앞으로 가져온 후 캡처
"""
import sys
import time
import subprocess
import mss
from PIL import Image
from pathlib import Path

SAVE_DIR = Path(r"C:\Users\USER\Documents\Claude\cord\trade-sourcing-app\scripts\screenshots")
SAVE_DIR.mkdir(exist_ok=True)

def bring_chrome_to_front():
    """PowerShell로 Chrome 창을 앞으로 가져오기"""
    script = '''
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
}
"@
$chrome = Get-Process chrome -ErrorAction SilentlyContinue | Sort-Object MainWindowTitle | Where-Object {$_.MainWindowHandle -ne 0} | Select-Object -First 1
if ($chrome) {
    [Win32]::SetForegroundWindow($chrome.MainWindowHandle)
    Write-Output "OK"
}
'''
    result = subprocess.run(
        ["powershell", "-Command", script],
        capture_output=True, text=True, timeout=5
    )
    time.sleep(1.5)  # Chrome이 앞으로 오길 기다림

def capture(filename, crop_right=1030):
    """
    Chrome을 앞으로 가져온 후 전체 화면 캡처
    """
    bring_chrome_to_front()

    with mss.mss() as sct:
        monitor = sct.monitors[1]  # 주 모니터
        screenshot = sct.grab(monitor)
        img = Image.frombytes("RGB", screenshot.size, screenshot.rgb)

    width, height = img.size
    # Chrome 탭/주소창 제외 (상단 ~130px), 하단 작업표시줄 제외
    cropped = img.crop((0, 130, crop_right, height - 50))

    out_path = SAVE_DIR / filename
    cropped.save(str(out_path), "PNG")
    print(f"저장: {out_path} ({cropped.size})")
    return str(out_path)

if __name__ == "__main__":
    filename = sys.argv[1] if len(sys.argv) > 1 else "screenshot.png"
    capture(filename)
