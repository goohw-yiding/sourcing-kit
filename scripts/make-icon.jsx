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
grad.gradientStops[0].color = rgb(255, 135, 20);  // 밝은 오렌지
grad.gradientStops[0].rampPoint = 0;
grad.gradientStops[1].color = rgb(210, 55, 0);    // 진한 오렌지-레드
grad.gradientStops[1].rampPoint = 100;

var gc = new GradientColor();
gc.gradient = grad;
gc.angle = -135;
gc.length = 724;
bg.fillColor = gc;

// ── 2. 돋보기 렌즈 (흰색 원) ────────────────────────────────
// 렌즈 중심: (205, 310), 반지름: 135
// top=310+135=445, left=205-135=70, w=h=270
var lens = layer.pathItems.ellipse(445, 70, 270, 270);
lens.filled = true;
lens.fillColor = rgb(255, 255, 255);
lens.stroked = false;

// 렌즈 안쪽 하이라이트 (옅은 원)
var lensGlow = layer.pathItems.ellipse(425, 88, 235, 235);
lensGlow.filled = true;
lensGlow.fillColor = rgb(255, 248, 235);
lensGlow.stroked = false;
lensGlow.opacity = 50;

// ── 3. 돋보기 링 (흰색 굵은 테두리) ────────────────────────
// top=472, left=43, w=h=324
var ring = layer.pathItems.ellipse(472, 43, 324, 324);
ring.filled = false;
ring.stroked = true;
ring.strokeColor = rgb(255, 255, 255);
ring.strokeWidth = 40;

// ── 4. 손잡이 ───────────────────────────────────────────────
// 돋보기 오른쪽 아래에서 대각선으로 뻗는 굵은 선
// path: 두 점 연결 후 두꺼운 stroke
var handlePath = layer.pathItems.add();
handlePath.setEntirePath([[322, 165], [440, 75]]);
handlePath.filled = false;
handlePath.stroked = true;
handlePath.strokeColor = rgb(255, 255, 255);
handlePath.strokeWidth = 52;
handlePath.strokeCap = StrokeCap.ROUNDENDCAP;

// ── 5. 렌즈 안 아이콘 (작은 상승 화살표 - 장사 성장 느낌) ─────
// 위쪽 화살표
var arr1 = layer.pathItems.add();
arr1.setEntirePath([[205, 340], [205, 270]]);
arr1.filled = false;
arr1.stroked = true;
arr1.strokeColor = rgb(255, 135, 20);
arr1.strokeWidth = 16;
arr1.strokeCap = StrokeCap.ROUNDENDCAP;

// 화살표 왼쪽 날개
var arr2 = layer.pathItems.add();
arr2.setEntirePath([[175, 300], [205, 270], [235, 300]]);
arr2.filled = false;
arr2.stroked = true;
arr2.strokeColor = rgb(255, 135, 20);
arr2.strokeWidth = 16;
arr2.strokeCap = StrokeCap.ROUNDENDCAP;
arr2.strokeJoin = StrokeJoin.ROUNDENDJOIN;

// 막대그래프 느낌 (3개 bar)
var bar1 = layer.pathItems.rectangle(290, 148, 24, 60);
bar1.filled = true;
bar1.fillColor = rgb(255, 135, 20);
bar1.stroked = false;

var bar2 = layer.pathItems.rectangle(290, 183, 24, 90);
bar2.filled = true;
bar2.fillColor = rgb(255, 135, 20);
bar2.stroked = false;

var bar3 = layer.pathItems.rectangle(290, 218, 24, 45);
bar3.filled = true;
bar3.fillColor = rgb(255, 135, 20);
bar3.stroked = false;

// ── 6. "소싱킷" 텍스트 ──────────────────────────────────────
var tf = layer.textFrames.pointText([256, 78]);
tf.contents = "소싱킷";  // 소싱킷 유니코드
tf.top = 78;
tf.left = 100;

var tr = tf.textRange;
tr.justification = Justification.CENTER;
tr.characterAttributes.size = 78;
tr.characterAttributes.fillColor = rgb(255, 255, 255);

// 한국어 폰트 설정 시도
var fonts = ["AppleSDGothicNeo-Bold", "NotoSansKR-Bold", "Malgun Gothic Bold",
             "MalgunGothicBold", "Arial-BoldMT", "ArialMT"];
for (var i = 0; i < fonts.length; i++) {
    try {
        tr.characterAttributes.textFont = app.textFonts.getByName(fonts[i]);
        break;
    } catch(e) {}
}

// 텍스트 가운데 정렬 (x=256 기준)
tf.position = [256 - tf.width/2, 78];

// ── 7. PNG 내보내기 ──────────────────────────────────────────
var pngFile = new File("C:/Users/USER/Documents/Claude/cord/trade-sourcing-app/public/icons/icon-new-512.png");
var pngOpts = new ExportOptionsPNG24();
pngOpts.artBoardClipping = true;
pngOpts.resolution = 144;
pngOpts.antiAliasing = true;
pngOpts.transparency = false;
doc.exportFile(pngFile, ExportType.PNG24, pngOpts);

alert("✅ 아이콘 생성 완료!\n저장 위치: public/icons/icon-new-512.png");
