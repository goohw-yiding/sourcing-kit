#target illustrator

function rgb(r, g, b) {
    var c = new RGBColor();
    c.red = r; c.green = g; c.blue = b;
    return c;
}

// ── 새 문서 512×512 ──────────────────────────────────────────
var doc = app.documents.add(DocumentColorSpace.RGB, 512, 512);
var layer = doc.layers[0];
layer.name = "icon";

// ── 1. 배경 (라운드 사각형, 오렌지 그라디언트) ─────────────────
var bg = layer.pathItems.roundedRectangle(512, 0, 512, 512, 90, 90);
bg.stroked = false;

var grad = doc.gradients.add();
grad.name = "bgGrad";
grad.type = GradientType.LINEAR;
grad.gradientStops[0].color = rgb(255, 120, 0);   // 밝은 오렌지
grad.gradientStops[0].rampPoint = 0;
grad.gradientStops[1].color = rgb(190, 30, 0);    // 진한 레드오렌지
grad.gradientStops[1].rampPoint = 100;

var gc = new GradientColor();
gc.gradient = grad;
gc.angle = -135;
gc.length = 724;
bg.fillColor = gc;

// ── 2. 돋보기 렌즈 (흰색 원) ────────────────────────────────
// 렌즈 중심: (210, 305), 반지름: 148
// top=305+148=453, left=210-148=62, w=h=296
var lens = layer.pathItems.ellipse(453, 62, 296, 296);
lens.filled = true;
lens.fillColor = rgb(255, 255, 255);
lens.stroked = false;

// ── 3. 돋보기 링 (흰색 굵은 테두리) ────────────────────────
// 링 중심: (210, 305), 반지름: 168
// top=305+168=473, left=210-168=42, w=h=336
var ring = layer.pathItems.ellipse(473, 42, 336, 336);
ring.filled = false;
ring.stroked = true;
ring.strokeColor = rgb(255, 255, 255);
ring.strokeWidth = 36;

// ── 4. 손잡이 ───────────────────────────────────────────────
var handlePath = layer.pathItems.add();
handlePath.setEntirePath([[335, 160], [458, 55]]);
handlePath.filled = false;
handlePath.stroked = true;
handlePath.strokeColor = rgb(255, 255, 255);
handlePath.strokeWidth = 54;
handlePath.strokeCap = StrokeCap.ROUNDENDCAP;

// ── 5. 렌즈 안 - 크고 선명한 상승 화살표 (채워진 도형) ──────────
// 화살표 전체 중심: (210, 305) = 렌즈 중심
// 화살표 샤프트 (직사각형): width=54, height=125
// X=[183, 237], Y=[215, 340]
var shaft = layer.pathItems.rectangle(340, 183, 54, 125);
shaft.filled = true;
shaft.fillColor = rgb(255, 120, 0);
shaft.stroked = false;

// 화살표 헤드 (삼각형, 위를 향함)
// 꼭지점: (210, 400), 밑변: (148, 340) ~ (272, 340)
var arrowHead = layer.pathItems.add();
arrowHead.setEntirePath([[148, 340], [210, 400], [272, 340]]);
arrowHead.closed = true;
arrowHead.filled = true;
arrowHead.fillColor = rgb(255, 120, 0);
arrowHead.stroked = false;

// ── 6. "소싱킷" 텍스트 ──────────────────────────────────────
var tf = layer.textFrames.pointText([256, 78]);
tf.contents = "소싱킷";
tf.top = 78;
tf.left = 100;

var tr = tf.textRange;
tr.justification = Justification.CENTER;
tr.characterAttributes.size = 76;
tr.characterAttributes.fillColor = rgb(255, 255, 255);

var fonts = ["AppleSDGothicNeo-Bold", "NotoSansKR-Bold", "Malgun Gothic Bold",
             "MalgunGothicBold", "Arial-BoldMT", "ArialMT"];
for (var i = 0; i < fonts.length; i++) {
    try {
        tr.characterAttributes.textFont = app.textFonts.getByName(fonts[i]);
        break;
    } catch(e) {}
}
tf.position = [256 - tf.width/2, 78];

// ── 7. PNG 내보내기 ──────────────────────────────────────────
var pngFile = new File("C:/Users/USER/Documents/Claude/cord/trade-sourcing-app/public/icons/icon-new-512.png");
var pngOpts = new ExportOptionsPNG24();
pngOpts.artBoardClipping = true;
pngOpts.resolution = 72;
pngOpts.antiAliasing = true;
pngOpts.transparency = false;
doc.exportFile(pngFile, ExportType.PNG24, pngOpts);

alert("v2 아이콘 생성 완료!\n저장 위치: public/icons/icon-new-512.png");
