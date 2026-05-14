# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# 폰트 등록
pdfmetrics.registerFont(TTFont("YaHei", "C:/Windows/Fonts/msyh.ttc"))
pdfmetrics.registerFont(TTFont("YaHei-Bold", "C:/Windows/Fonts/msyhbd.ttc"))

W, H = A4

doc = SimpleDocTemplate(
    "C:/Users/USER/Documents/Claude/cord/trade-sourcing-app/이우시장_평면도수집가이드.pdf",
    pagesize=A4,
    leftMargin=20*mm, rightMargin=20*mm,
    topMargin=18*mm, bottomMargin=18*mm,
)

def s(name, size, bold=False, color=colors.black, leading=None):
    return ParagraphStyle(
        name,
        fontName="YaHei-Bold" if bold else "YaHei",
        fontSize=size,
        textColor=color,
        leading=leading or size * 1.5,
        spaceAfter=0,
    )

title_s    = s("t", 18, bold=True, color=colors.HexColor("#1a3c6e"))
sub_s      = s("sub", 11, color=colors.HexColor("#555555"))
h2_s       = s("h2", 13, bold=True, color=colors.HexColor("#1a3c6e"))
h3_s       = s("h3", 11, bold=True, color=colors.HexColor("#e07000"))
body_s     = s("b", 10, leading=16)
note_s     = s("n", 9, color=colors.HexColor("#666666"), leading=14)
tag_s      = s("tag", 9, bold=True, color=colors.white)
warn_s     = s("w", 9, bold=True, color=colors.HexColor("#cc0000"))

story = []

# ── 제목 ──────────────────────────────────────────────
story.append(Spacer(1, 4*mm))
story.append(Paragraph("义乌国际商贸城 平面图收集任务", title_s))
story.append(Spacer(1, 2*mm))
story.append(Paragraph("请按照以下步骤，在电脑上收集各区楼层平面图，完成后发给负责人。", sub_s))
story.append(Spacer(1, 3*mm))
story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1a3c6e")))
story.append(Spacer(1, 4*mm))

# ── 任务目标 ──────────────────────────────────────────
story.append(Paragraph("📋  任务目标", h2_s))
story.append(Spacer(1, 2*mm))
story.append(Paragraph(
    "收集义乌国际商贸城 <b>一区～五区</b>，每区 <b>1～4层</b> 的平面图（导览图）。"
    "共约 <b>20张</b>。图中需能看到各区域销售的商品类别。",
    body_s
))
story.append(Spacer(1, 5*mm))

# ── STEP 1 ──────────────────────────────────────────
story.append(Paragraph("STEP 1   百度图片搜索（推荐首选）", h2_s))
story.append(Spacer(1, 2*mm))

step1_data = [
    ["①", "打开浏览器，进入  images.baidu.com"],
    ["②", "搜索词（复制粘贴）：\n义乌国际商贸城 一区 平面图\n义乌国际商贸城 二区 导览图\n（一区→二区→三区→四区→五区 依次搜索）"],
    ["③", "选择能看清商品分类的图片，右键→「图片另存为」\n建议保存格式：d1_f1.jpg（一区1层），d1_f2.jpg（一区2层）……"],
    ["④", "每层平面图单独保存，文件名注明区号和层号"],
]

for row in step1_data:
    t = Table(
        [[Paragraph(row[0], s("num", 11, bold=True, color=colors.HexColor("#1a3c6e"))),
          Paragraph(row[1], body_s)]],
        colWidths=[10*mm, 148*mm],
    )
    t.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING", (1,0), (1,0), 4),
    ]))
    story.append(t)

story.append(Spacer(1, 2*mm))
# 추천 검색어 표
kw_data = [
    ["推荐搜索词（直接复制）"],
    ["义乌国际商贸城一区平面图"],
    ["义乌国际商贸城二区导览图"],
    ["义乌国际商贸城三区商品分布"],
    ["义乌商贸城四区楼层分布"],
    ["义乌商贸城五区平面图"],
]
kw_table = Table(kw_data, colWidths=[158*mm])
kw_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1a3c6e")),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,-1), "YaHei-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("BACKGROUND", (0,1), (-1,-1), colors.HexColor("#eef2f8")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#eef2f8"), colors.white]),
    ("TOPPADDING", (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
    ("INNERGRID", (0,0), (-1,-1), 0.3, colors.HexColor("#dddddd")),
]))
story.append(kw_table)
story.append(Spacer(1, 5*mm))

# ── STEP 2 ──────────────────────────────────────────
story.append(Paragraph("STEP 2   义乌购官网 / 商贸城官网 查找", h2_s))
story.append(Spacer(1, 2*mm))

sites_data = [
    ["网站", "地址", "找什么"],
    ["义乌购", "www.yiwugo.com", "搜索各区商品分布，截图保存"],
    ["商贸城官网", "www.chinaywmart.com", "进入「商城导览」或「楼层介绍」"],
    ["小红书", "www.xiaohongshu.com", "搜索「义乌商贸城 平面图」，有用户分享的高清图"],
]
sites_table = Table(sites_data, colWidths=[28*mm, 55*mm, 75*mm])
sites_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#e07000")),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "YaHei-Bold"),
    ("FONTNAME", (0,1), (-1,-1), "YaHei"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#fff8ee"), colors.white]),
    ("TOPPADDING", (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
    ("INNERGRID", (0,0), (-1,-1), 0.3, colors.HexColor("#dddddd")),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
]))
story.append(sites_table)
story.append(Spacer(1, 5*mm))

# ── STEP 3 ──────────────────────────────────────────
story.append(Paragraph("STEP 3   截图要求 & 文件命名规则", h2_s))
story.append(Spacer(1, 2*mm))

naming_data = [
    ["文件名", "内容"],
    ["d1_f1.jpg", "一区  1层平面图"],
    ["d1_f2.jpg", "一区  2层平面图"],
    ["d1_f3.jpg", "一区  3层平面图"],
    ["d1_f4.jpg", "一区  4层平面图"],
    ["d2_f1.jpg", "二区  1层平面图"],
    ["d2_f2.jpg", "二区  2层平面图"],
    ["……", "三区～五区 同样规则（d3/d4/d5）"],
]
naming_table = Table(naming_data, colWidths=[35*mm, 123*mm])
naming_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1a3c6e")),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "YaHei-Bold"),
    ("FONTNAME", (0,1), (-1,-1), "YaHei"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#eef2f8"), colors.white]),
    ("TOPPADDING", (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#cccccc")),
    ("INNERGRID", (0,0), (-1,-1), 0.3, colors.HexColor("#dddddd")),
]))
story.append(naming_table)
story.append(Spacer(1, 2*mm))
story.append(Paragraph(
    "⚠️  截图质量要求：图片清晰可读，能看到各区域销售商品名称。模糊或无商品标注的图片无效。",
    warn_s
))
story.append(Spacer(1, 5*mm))

# ── STEP 4 ──────────────────────────────────────────
story.append(Paragraph("STEP 4   发送方式", h2_s))
story.append(Spacer(1, 2*mm))
story.append(Paragraph(
    "将收集好的图片全部整理到一个文件夹，通过 <b>微信</b> 或 <b>邮件</b> 发送给负责人。"
    "请注明每张图片对应的区号和楼层，方便核对。",
    body_s
))
story.append(Spacer(1, 6*mm))

# ── 注意事项 ──────────────────────────────────────────
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cccccc")))
story.append(Spacer(1, 3*mm))
story.append(Paragraph("注意事项", h3_s))
story.append(Spacer(1, 1*mm))
notes = [
    "· 优先选择有商品分类标注的平面图，纯建筑结构图无效",
    "· 如百度找不到，可尝试搜索「义乌商贸城 楼层分布 2024」或「义乌市场 导览图」",
    "· 小红书上有很多用户实地拍摄的高清平面图，可重点查找",
    "· 图片越清晰越好，建议下载原图而非缩略图",
    "· 不需要出门，全部在电脑上完成即可",
]
for n in notes:
    story.append(Paragraph(n, note_s))
    story.append(Spacer(1, 1*mm))

doc.build(story)
print("PDF 생성 완료!")
