# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

OUTPUT = r"C:\Users\USER\Documents\Claude\cord\trade-sourcing-app\高德地图_API申请指南.pdf"
FONT_PATH = r"C:\Windows\Fonts\msyh.ttc"
FONT_BOLD_PATH = r"C:\Windows\Fonts\msyhbd.ttc"

pdfmetrics.registerFont(TTFont("MSYH", FONT_PATH, subfontIndex=0))
pdfmetrics.registerFont(TTFont("MSYH-Bold", FONT_BOLD_PATH, subfontIndex=0))

W, H = A4
MARGIN = 22 * mm
LINE_W = W - MARGIN * 2

def draw_rect(c, x, y, w, h, fill_color=None, stroke_color=None):
    if fill_color:
        c.setFillColor(fill_color)
    if stroke_color:
        c.setStrokeColor(stroke_color)
    if fill_color and stroke_color:
        c.rect(x, y, w, h, fill=1, stroke=1)
    elif fill_color:
        c.rect(x, y, w, h, fill=1, stroke=0)
    else:
        c.rect(x, y, w, h, fill=0, stroke=1)

c = canvas.Canvas(OUTPUT, pagesize=A4)
c.setTitle("高德地图 API Key 申请指南")

# Header
HEADER_H = 52 * mm
draw_rect(c, 0, H - HEADER_H, W, HEADER_H, fill_color=colors.HexColor("#1565C0"))

c.setFillColor(colors.white)
c.setFont("MSYH-Bold", 22)
c.drawCentredString(W / 2, H - 24 * mm, "高德地图 API Key 申请指南")
c.setFont("MSYH", 11)
c.drawCentredString(W / 2, H - 36 * mm, "请按照以下步骤申请 Web服务 API Key，完成后将 Key 发给我。")

def step(c, num, title, lines, y_top):
    BLOCK_H = 10 * mm + len(lines) * 7 * mm
    BG = colors.HexColor("#F0F4FF")
    ACCENT = colors.HexColor("#1565C0")
    BORDER = colors.HexColor("#C5D0E8")

    draw_rect(c, MARGIN, y_top - BLOCK_H, LINE_W, BLOCK_H, fill_color=BG, stroke_color=BORDER)

    cx = MARGIN + 10 * mm
    cy = y_top - 7 * mm
    c.setFillColor(ACCENT)
    c.circle(cx, cy, 5.5 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("MSYH-Bold", 13)
    c.drawCentredString(cx, cy - 4, str(num))

    c.setFillColor(ACCENT)
    c.setFont("MSYH-Bold", 13)
    c.drawString(MARGIN + 19 * mm, y_top - 8.5 * mm, title)

    c.setFillColor(colors.HexColor("#222222"))
    c.setFont("MSYH", 10.5)
    for i, line in enumerate(lines):
        c.drawString(MARGIN + 19 * mm, y_top - 16 * mm - i * 7 * mm, line)

    return y_top - BLOCK_H - 5 * mm

y = H - HEADER_H - 10 * mm

y = step(c, 1, "注册账号",
         ["打开浏览器，访问：https://lbs.amap.com",
          "点击右上角 \"注册\" → 使用中国手机号完成注册"],
         y)

y = step(c, 2, "进入控制台，创建应用",
         ["登录后点击右上角 \"控制台\"",
          "左侧菜单：应用管理 → 我的应用 → 点击 \"创建新应用\"",
          "应用名称随意填写，点击确认"],
         y)

y = step(c, 3, "添加 Key（重要）",
         ["在新建应用旁边，点击 \"添加Key\"",
          "Key名称：随意填写（例：webservice-key）",
          "服务平台：选择  ★ Web服务 ★  （必须选这个！）",
          "IP白名单：留空，直接提交",
          "生成后复制 32 位 Key 字符串"],
         y)

y = step(c, 4, "将 Key 发送给我",
         ["复制生成的 Key（格式：xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx）",
          "通过微信或其他方式发送给我即可"],
         y)

# Warning box
WARN_H = 20 * mm
WARN_Y = y - 3 * mm
draw_rect(c, MARGIN, WARN_Y - WARN_H, LINE_W, WARN_H,
          fill_color=colors.HexColor("#FFF8E1"), stroke_color=colors.HexColor("#F9A825"))

c.setFillColor(colors.HexColor("#E65100"))
c.setFont("MSYH-Bold", 11)
c.drawString(MARGIN + 5 * mm, WARN_Y - 8 * mm,
    "!  注意：服务平台必须选择 \"​Web服务\"，不能选 JS API / Android / iOS")
c.setFillColor(colors.HexColor("#555555"))
c.setFont("MSYH", 10)
c.drawString(MARGIN + 5 * mm, WARN_Y - 15 * mm,
    "免费额度：每日 30,000 次请求，申请后即可使用，无需审核。")

# Footer
c.setFillColor(colors.HexColor("#AAAAAA"))
c.setFont("MSYH", 9)
c.drawCentredString(W / 2, 12 * mm, "如有疑问请联系我，谢谢配合")

c.save()
print("PDF saved OK")
