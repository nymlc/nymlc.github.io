// 雪山森林河谷：白雪山脊、深绿针叶林与低处的蜿蜒河谷，全部由周期地貌着色器实时生成。
import { C } from './config.js';

export const alpineCurves = [
  { c: 3, t: [[1, 18, 0.5], [3, 5.5, 2.2], [6, 2.0, 4.1]] }, // 0 山谷溪流
  { c: 20, t: [[1, 14, 0.5], [3, 4.5, 2.2], [6, 1.5, 4.1]] }, // 1 东岸林道
  { c: -19, t: [[1, 13, 0.5], [3, 4.5, 2.2]] },             // 2 西岸林道
];

export const alpineGLSL = /* glsl */ `
Ground biome(vec2 p) {
  Ground g = ground0();
  vec2 q = warp2(p, 6.0, 3.2, 501u);
  vec3 river = cDist(0, q);
  float rw = 5.5 + 1.2 * wf(p, 8.0, 2, 502u);
  float rd = abs(river.x) + 0.24 * wn(p, 128.0, 503u);
  float water = 1.0 - smoothstep(rw - 0.3, rw + 0.38, rd);
  float valley = smoothstep(rw + 62.0, rw + 8.0, rd);

  // 主山脉横跨远处天际：山脊沿纵深成带，峰形沿横向起伏。
  float n = wf(vec2(p.x * 0.65, p.y), 8.0, 4, 504u);
  // 雪峰沿行进方向拉开间距，把近景留给林坡，避免一排白峰贴着纸窗下沿滚出。
  float ridgeCenter = -110.0 + 5.0 * wn(p, 6.0, 517u);
  float ridgePeriod = LOOP / 2.0;
  float ridgeDz = mod(p.y - ridgeCenter + ridgePeriod * 0.5, ridgePeriod) - ridgePeriod * 0.5;
  float frontRidge = pow(max(0.0, 1.0 - abs(ridgeDz) / 44.0), 0.98);
  float backDz = mod(ridgeDz + ridgePeriod * 0.5 + 8.0 * wn(p + 11.0, 4.0, 519u) + ridgePeriod * 0.5, ridgePeriod) - ridgePeriod * 0.5;
  float backRidge = pow(max(0.0, 1.0 - abs(backDz) / 40.0), 0.92);

  float xWob = 6.0 * wn(p, 8.0, 518u) + 2.5 * wn(p, 20.0, 520u);
  // 相邻峰脚互相衔接成山 massif，峰顶错落，不再像两座独立的圆锥小山。
  // 峰列整体收进地形有效宽度，避免最外侧雪峰越过布局贴图边界后被硬切。
  float peakA = 0.92 * pow(max(0.0, 1.0 - abs(p.x + 73.0 + xWob) / 27.0), 0.88);
  float peakB = 1.02 * pow(max(0.0, 1.0 - abs(p.x + 44.0 - xWob * 0.7) / 29.0), 0.82);
  float peakC = 0.9 * pow(max(0.0, 1.0 - abs(p.x + 15.0 + xWob * 0.5) / 28.0), 0.92);
  float peakD = 0.98 * pow(max(0.0, 1.0 - abs(p.x - 14.0 - xWob * 0.6) / 29.0), 0.86);
  float peakE = 1.06 * pow(max(0.0, 1.0 - abs(p.x - 43.0 + xWob * 0.8) / 29.0), 0.8);
  float peakF = 0.88 * pow(max(0.0, 1.0 - abs(p.x - 72.0 - xWob * 0.4) / 27.0), 0.94);
  float crown = max(max(max(peakA, peakB), max(peakC, peakD)), max(peakE, peakF));
  float crownBreakup = 0.76 + 0.24 * wf(p, 30.0, 3, 524u);
  float ridgeShape = (0.18 + 0.82 * crown) * crownBreakup;
  // 山脊沿飞行方向周期延展，错开的次级峰列补足远近层次；河道从山口穿过。
  // 次级山脊只补上主峰之间的林坡与岩肩，不再与主峰叠加成一整堵同高的雪墙。
  float peaks = max(frontRidge * ridgeShape, backRidge * (0.34 + 0.14 * crown));
  // 外侧峰脚更早收进林坡，避免雪峰贴着宽幅纸窗边缘被截成半座山。
  float mountainEdge = 1.0 - smoothstep(74.0, 94.0, abs(p.x));
  peaks *= mountainEdge;
  float mountainShoulder = smoothstep(rw + 3.0, rw + 30.0, rd);
  peaks *= mountainShoulder;
  float hLand = 1.4 + 2.8 * wf(p, 18.0, 3, 507u);
  hLand += peaks * (28.0 + 24.0 * n);
  // 叠加克制的中尺度起伏，打破光滑锥形坡面，同时保留清楚的主峰轮廓。
  hLand += peaks * ((wf(p, 34.0, 4, 521u) - 0.5) * 8.0 + (wf(p, 12.0, 2, 522u) - 0.5) * 3.0);
  hLand += frontRidge * (1.0 - crown) * 3.0 * mountainEdge;
  hLand += valley * 1.7 * wf(p, 6.0, 3, 508u);
  hLand = mix(hLand, 0.0, water);

  vec3 forestCol = grass(p, ${C('#79B95F')}, ${C('#438452')}, ${C('#A4C37A')});
  // 以翠绿林坡、冷蓝灰岩脊和大块洁白雪冠形成明确分区，避免整座山发灰。
  float rockBand = smoothstep(17.0, 25.5, hLand);
  float snowLine = 21.5 + 2.0 * wn(p, 12.0, 523u) + (wf(p, 28.0, 3, 525u) - 0.5) * 2.0;
  // 积雪集中在主峰而非零碎的小山肩，避免宽幅画面边角只露出孤立的白色半截。
  float snow = smoothstep(snowLine, snowLine + 5.0, hLand)
    * smoothstep(0.58, 0.82, peaks)
    * (0.92 + 0.08 * wf(p, 10.0, 3, 509u));
  vec3 rock = mix(${C('#6F91A3')}, ${C('#AFCAD5')}, wf(p, 26.0, 3, 510u));
  vec3 highland = mix(forestCol, rock, rockBand * (1.0 - snow));
  vec3 snowShade = mix(${C('#C3D9E8')}, ${C('#FFFFFF')}, smoothstep(0.24, 0.78, wf(p + 9.0, 30.0, 2, 511u)));
  // 轻微补偿陡坡受光不足，同时保留雪面的冷暖层次与阴影细节。
  highland = mix(highland, snowShade * 1.02, snow);

  vec3 gravel = mix(${C('#B8CFA7')}, ${C('#E3EBD1')}, wf(p, 76.0, 2, 512u));
  float bank = 1.0 - smoothstep(rw + 1.0, rw + 3.8, rd);
  vec3 waterCol = mix(${C('#A7DFE6')}, ${C('#4DB3C8')}, smoothstep(0.0, 1.0, (rw - rd) / rw));
  waterCol = mix(waterCol, ${C('#347F9B')}, smoothstep(0.5, 1.0, (rw - rd) / rw));
  vec3 col = mix(highland, gravel, bank * (1.0 - water));
  col = mix(col, waterCol, water);

  vec3 westPath = cDist(2, p);
  vec3 eastPath = cDist(1, p);
  float dp = min(abs(westPath.x), abs(eastPath.x));
  float path = 1.0 - smoothstep(1.1, 2.0, dp);
  path *= smoothstep(rw + 4.0, rw + 8.0, rd) * (1.0 - water);
  col = mix(col, ${C('#AAB99A')}, path * 0.72);

  float frozen = smoothstep(17.0, 25.0, hLand);
  float forest = smoothstep(0.06, 0.52, wf(p, 6.0, 4, 513u)) * (1.0 - frozen);
  // 林海铺满雪线以下的山坡，河谷两侧保留一条明亮开阔的草甸。
  forest *= smoothstep(rw + 2.0, rw + 14.0, rd);
  float riparian = smoothstep(rw + 2.0, rw + 5.0, rd) * (1.0 - smoothstep(rw + 14.0, rw + 22.0, rd));
  float upperForest = smoothstep(0.18, 0.55, peaks) * (1.0 - frozen) * smoothstep(0.28, 0.6, n);
  g.tree = max(forest, upperForest) * (1.0 - path) * (1.0 - water);
  g.tree = max(g.tree, riparian * 0.34 * (1.0 - frozen) * (1.0 - path));
  // 谷底混入圆冠阔叶，越往高处越过渡到针叶林，避免整片树林像同一种小圣诞树。
  g.conifer = mix(0.48, 0.94, smoothstep(8.0, 26.0, hLand));

  float clearings = smoothstep(0.62, 0.78, wf(p, 7.0, 3, 514u));
  float nearRoad = max(1.0 - smoothstep(6.0, 18.0, abs(westPath.x)),
    0.8 * (1.0 - smoothstep(5.0, 15.0, abs(eastPath.x))));
  g.village = nearRoad * clearings * (1.0 - smoothstep(0.62, 0.9, g.tree))
    * (1.0 - water) * (1.0 - frozen) * smoothstep(rw + 5.0, rw + 10.0, rd);
  g.lone = (1.0 - g.tree) * (1.0 - g.village) * (1.0 - water) * (1.0 - path) * 0.13;
  g.flower = smoothstep(0.58, 0.78, wf(p, 18.0, 3, 515u)) * valley * (1.0 - water) * (1.0 - g.tree) * 0.16;
  g.wind = (1.0 - frozen) * (1.0 - g.tree) * (1.0 - water) * 0.28;

  g.h = hLand;
  g.alb = col;
  g.water = water;
  g.depth = water * clamp((rw - rd) / rw, 0.0, 1.0);
  g.shore = water * (1.0 - smoothstep(rw - 0.2, rw + 0.55, rd)) * 0.48;
  g.cls = water > 0.5 ? CL_WATER : frozen > 0.55 ? CL_ROCK : path > 0.5 ? CL_ROAD : g.tree > 0.52 ? CL_FOREST : CL_MEADOW;
  return g;
}
`;
