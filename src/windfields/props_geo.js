// 小物件的几何：房子（墙+山墙 / 屋顶）、车、牛、羊、帆船。顶点色放在 aCol 里。
import * as THREE from 'three';
import { mergeGeometries, fillAttr, mulberry32 } from './config.js';

export function rgb(hex) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}

function box(w, h, d, x, y, z, col) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return fillAttr(g, 'aCol', rgb(col));
}

const EX = [{ name: 'aCol', size: 3 }];

function tri(verts, col) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return fillAttr(g, 'aCol', rgb(col));
}

// 单位房子：墙高 1，屋脊沿 x，山墙高 GH（实例缩放 (w, h, d)）
const GH = 0.6;
export function houseWalls() {
  const b = box(1, 1, 1, 0, 0.5, 0, '#ffffff');
  const parts = [b];
  for (const s of [-1, 1]) {
    const x = s * 0.5;
    const v = s > 0
      ? [x, 1, -0.5, x, 1 + GH, 0, x, 1, 0.5]
      : [x, 1, 0.5, x, 1 + GH, 0, x, 1, -0.5];
    parts.push(tri(v, '#ffffff'));
  }
  // 门和窗（深色）
  parts.push(box(0.16, 0.42, 0.02, -0.18, 0.21, 0.505, '#4d4036'));
  parts.push(box(0.2, 0.2, 0.02, 0.2, 0.55, 0.505, '#4b5a63'));
  parts.push(box(0.2, 0.2, 0.02, 0.2, 0.55, -0.505, '#4b5a63'));
  return mergeGeometries(parts, EX);
}

// 白墙、青砖勒脚、木格窗与门套：仅用于江南水乡的沿河民居。
export function jiangnanHouseWalls() {
  const parts = [box(1, 1, 1, 0, 0.5, 0, '#ffffff')];
  for (const s of [-1, 1]) {
    const x = s * 0.5;
    const v = s > 0
      ? [x, 1, -0.5, x, 1.62, 0, x, 1, 0.5]
      : [x, 1, 0.5, x, 1.62, 0, x, 1, -0.5];
    parts.push(tri(v, '#ffffff'));
  }

  for (const side of [-1, 1]) {
    // 低矮青灰砖基座与白墙分色，表现常见的水乡石脚。
    parts.push(box(1.02, 0.13, 1.02, 0, 0.075, 0, '#b8c0bb'));
    parts.push(box(0.99, 0.055, 0.045, 0, 0.17, side * 0.505, '#f1eee4'));

    // 立柱、窗楣和门框让沿河立面不再像无细节的白色方盒。
    for (const x of [-0.44, 0.44]) {
      parts.push(box(0.045, 0.78, 0.045, x, 0.56, side * 0.515, '#8c7058'));
    }
    parts.push(box(0.95, 0.045, 0.045, 0, 0.93, side * 0.515, '#8c7058'));

    const winX = side > 0 ? 0.21 : -0.19;
    const winY = 0.61;
    parts.push(box(0.27, 0.29, 0.035, winX, winY, side * 0.52, '#465d62'));
    parts.push(box(0.33, 0.045, 0.055, winX, winY + 0.17, side * 0.53, '#8a7058'));
    parts.push(box(0.33, 0.045, 0.055, winX, winY - 0.17, side * 0.53, '#8a7058'));
    parts.push(box(0.035, 0.34, 0.055, winX - 0.17, winY, side * 0.53, '#8a7058'));
    parts.push(box(0.035, 0.34, 0.055, winX + 0.17, winY, side * 0.53, '#8a7058'));
    // 窗格木棂。
    parts.push(box(0.024, 0.27, 0.035, winX, winY, side * 0.56, '#c2ad8e'));
    parts.push(box(0.28, 0.024, 0.035, winX, winY, side * 0.56, '#c2ad8e'));

    if (side > 0) {
      parts.push(box(0.22, 0.44, 0.035, -0.2, 0.25, 0.52, '#80583d'));
      parts.push(box(0.27, 0.045, 0.055, -0.2, 0.48, 0.53, '#ad8059'));
    }
  }

  return mergeGeometries(parts, EX);
}

export function houseRoof() {
  const ov = 0.1;
  const ez = 0.64;
  const ey = 1 + GH * (1 - ez / 0.5) + 0.03;
  const ry = 1 + GH + 0.03;
  const x0 = -0.5 - ov, x1 = 0.5 + ov;
  const v = [];
  for (const s of [-1, 1]) {
    const z = s * ez;
    const a = [x0, ry, 0], b = [x1, ry, 0], c = [x1, ey, z], d = [x0, ey, z];
    if (s > 0) v.push(...a, ...d, ...c, ...a, ...c, ...b);
    else v.push(...a, ...b, ...c, ...a, ...c, ...d);
  }
  const g = tri(v, '#ffffff');
  const ridge = box(1 + ov * 2, 0.05, 0.08, 0, ry + 0.01, 0, '#ffffff');
  return mergeGeometries([g, ridge], EX);
}

// 江南民居瓦顶：两面青瓦、细密瓦垄、翘起的檐角和屋脊压顶。
// 几何仍按单位房屋制作，由实例缩放适配每栋房子的大小。
export function jiangnanHouseRoof() {
  const parts = [];
  const x0 = -0.65, x1 = 0.65, zEdge = 0.71;
  const ridgeY = 1.66, eaveY = 1.03;
  const edgeY = (x) => eaveY + 0.27 * Math.pow(Math.abs(x) / 0.65, 4);
  const strips = 14;

  for (const side of [-1, 1]) {
    // 屋面略微扭起两端，远看也能看出江南屋檐的轻盈轮廓。
    for (let i = 0; i < strips; i++) {
      const xa = x0 + (x1 - x0) * i / strips;
      const xb = x0 + (x1 - x0) * (i + 1) / strips;
      parts.push(tri([
        xa, ridgeY, 0, xb, ridgeY, 0, xb, edgeY(xb), side * zEdge,
        xa, ridgeY, 0, xb, edgeY(xb), side * zEdge, xa, edgeY(xa), side * zEdge,
      ], '#ffffff'));
    }

    // 顺着屋脊到檐口的细瓦垄，避免屋顶变成一整块没有纹理的黑面。
    for (let i = 1; i < strips; i++) {
      const x = x0 + (x1 - x0) * i / strips;
      const xa = x - 0.017, xb = x + 0.017;
      parts.push(tri([
        xa, ridgeY + 0.012, 0, xb, ridgeY + 0.012, 0, xb, edgeY(xb) + 0.012, side * zEdge,
        xa, ridgeY + 0.012, 0, xb, edgeY(xb) + 0.012, side * zEdge, xa, edgeY(xa) + 0.012, side * zEdge,
      ], '#d4ddda'));
    }
  }

  // 屋脊瓦与檐口收边；端部的脊饰略抬高，形成克制的翘檐。
  parts.push(box(1.24, 0.11, 0.12, 0, ridgeY + 0.015, 0, '#ffffff'));
  for (const side of [-1, 1]) {
    for (let i = 0; i < strips; i++) {
      const xa = x0 + (x1 - x0) * i / strips;
      const xb = x0 + (x1 - x0) * (i + 1) / strips;
      const xm = (xa + xb) * 0.5;
      parts.push(box(xb - xa + 0.012, 0.065, 0.09, xm, edgeY(xm) + 0.005, side * (zEdge - 0.015), '#f4f1e9'));
    }
  }
  return mergeGeometries(parts, EX);
}

// 乌篷船：尖头木船身、暖木色舱板和黑色弧形篷顶，船头朝 -z。
export function wupengBoatGeo() {
  const parts = [];
  const outline = [
    [-0.42, 1.72], [0.42, 1.72], [0.62, 1.08],
    [0.56, -1.12], [0, -2.05], [-0.56, -1.12], [-0.62, 1.08],
  ];
  const center = [0, 0.32, 0];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    parts.push(tri([
      ...center, a[0], 0.32, a[1], b[0], 0.32, b[1],
    ], '#9a6743'));
    const inset = 0.76;
    const ai = [a[0] * inset, 0.08, a[1] * inset];
    const bi = [b[0] * inset, 0.08, b[1] * inset];
    parts.push(tri([a[0], 0.32, a[1], ...ai, ...bi], '#704a34'));
    parts.push(tri([a[0], 0.32, a[1], ...bi, b[0], 0.32, b[1]], '#704a34'));
  }

  // 舱内木地板和两道横向坐凳，从俯视角也能辨认出是载人小船。
  parts.push(box(0.78, 0.045, 1.8, 0, 0.35, 0.1, '#c18a59'));
  parts.push(box(0.7, 0.09, 0.14, 0, 0.43, -0.72, '#d0a06b'));
  parts.push(box(0.7, 0.09, 0.14, 0, 0.43, 0.7, '#d0a06b'));

  // 沿船身延伸的半圆拱篷，篷布逐截成面而不是球形顶盖。
  const canopySegments = 12;
  const canopyLength = 1.48;
  const canopyHalfWidth = 0.43;
  const canopySpring = 0.44;
  const canopyRise = 0.49;
  const canopyPos = [];
  const canopyCol = [];
  for (let iz = 0; iz < 4; iz++) {
    const z0 = -canopyLength * 0.5 + canopyLength * iz / 4;
    const z1 = -canopyLength * 0.5 + canopyLength * (iz + 1) / 4;
    for (let i = 0; i < canopySegments; i++) {
      const a0 = Math.PI - Math.PI * i / canopySegments;
      const a1 = Math.PI - Math.PI * (i + 1) / canopySegments;
      const point = (a, z) => [Math.cos(a) * canopyHalfWidth, canopySpring + Math.sin(a) * canopyRise, z];
      const v = [...point(a0, z0), ...point(a1, z0), ...point(a1, z1),
        ...point(a0, z0), ...point(a1, z1), ...point(a0, z1)];
      canopyPos.push(...v);
      const shade = 0.93 + 0.07 * Math.sin(i * 1.7 + iz * 0.9);
      const color = new THREE.Color('#343d3d').multiplyScalar(shade);
      for (let k = 0; k < v.length / 3; k++) canopyCol.push(color.r, color.g, color.b);
    }
  }
  const canopy = new THREE.BufferGeometry();
  canopy.setAttribute('position', new THREE.Float32BufferAttribute(canopyPos, 3));
  canopy.setAttribute('aCol', new THREE.Float32BufferAttribute(canopyCol, 3));
  canopy.computeVertexNormals();
  parts.push(canopy);

  // 半圆拱形乌篷，肋骨沿船身重复排列。
  for (const z of [-0.5, -0.12, 0.26, 0.64]) {
    const rib = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.43, canopySpring, z),
      new THREE.Vector3(-0.36, 0.78, z),
      new THREE.Vector3(0, canopySpring + canopyRise, z),
      new THREE.Vector3(0.36, 0.78, z),
      new THREE.Vector3(0.43, canopySpring, z),
    ]);
    parts.push(fillAttr(new THREE.TubeGeometry(rib, 10, 0.025, 5, false), 'aCol', rgb('#565e5c')));
  }

  return mergeGeometries(parts, EX);
}

export function carGeo(col) {
  return mergeGeometries([
    box(1.7, 0.62, 3.6, 0, 0.55, 0, col),
    box(1.46, 0.5, 1.8, 0, 1.1, 0.25, '#4c606b'),
    box(1.5, 0.08, 1.7, 0, 1.38, 0.25, col),
    box(1.6, 0.06, 0.5, 0, 0.88, -1.45, '#f2efe6'),
    ...[[-0.8, -1.15], [0.8, -1.15], [-0.8, 1.15], [0.8, 1.15]].map(([x, z]) => box(0.22, 0.5, 0.62, x, 0.25, z, '#2e2b29')),
  ], EX);
}

export function cowGeo() {
  return mergeGeometries([
    box(0.85, 0.75, 1.6, 0, 0.95, 0, '#f4f0e6'),
    box(0.6, 0.06, 0.6, 0.12, 1.34, -0.2, '#3a312a'),
    box(0.5, 0.06, 0.45, -0.15, 1.34, 0.45, '#3a312a'),
    box(0.5, 0.5, 0.55, 0, 1.15, -1.0, '#efe8da'),
    box(0.3, 0.22, 0.15, 0, 1.0, -1.32, '#c9b49a'),
    ...[[-0.3, -0.6], [0.3, -0.6], [-0.3, 0.6], [0.3, 0.6]].map(([x, z]) => box(0.18, 0.6, 0.18, x, 0.3, z, '#d8d0c2')),
  ], EX);
}

export function sheepGeo() {
  return mergeGeometries([
    box(0.8, 0.62, 1.05, 0, 0.72, 0, '#f7f4ea'),
    box(0.68, 0.18, 0.9, 0, 1.08, 0, '#fbf9f2'),
    box(0.34, 0.36, 0.4, 0, 0.82, -0.68, '#4a4238'),
    ...[[-0.24, -0.35], [0.24, -0.35], [-0.24, 0.35], [0.24, 0.35]].map(([x, z]) => box(0.12, 0.42, 0.12, x, 0.21, z, '#4a4238')),
  ], EX);
}

export function boatGeo() {
  const sail = tri([0, 0.5, -0.6, 0, 4.2, 0.1, 0, 0.5, 1.4], '#fbfaf4');
  const jib = tri([0, 0.5, -1.0, 0, 3.4, -0.7, 0, 0.5, -1.9], '#f3efe2');
  return mergeGeometries([
    box(1.3, 0.5, 4.2, 0, 0.2, 0, '#f6f3ec'),
    box(0.9, 0.35, 1.4, 0, 0.6, 0.5, '#2f6f8f'),
    box(0.08, 4.0, 0.08, 0, 2.3, -0.5, '#8a6a4a'),
    sail,
    jib,
  ], EX);
}

// 俯瞰时仍能读出树冠放射状叶片的棕榈：细长树干 + 多层弧形羽状叶。
export function palmGeometry(seed = 1) {
  const parts = [];
  const bark = '#76543a';
  const greens = ['#3f7448', '#528d4f', '#6aa65a'];
  const trunkH = 3.2;
  const segments = 7;
  for (let i = 0; i < segments; i++) {
    const y0 = (trunkH * i) / segments;
    const h = trunkH / segments + 0.02;
    const lean0 = 0.17 * (y0 / trunkH) ** 2;
    const lean1 = 0.17 * ((y0 + h) / trunkH) ** 2;
    const g = new THREE.CylinderGeometry(0.047 - i * 0.002, 0.061 - i * 0.002, h, 7, 1);
    g.rotateZ(Math.atan2(lean1 - lean0, h));
    g.translate((lean0 + lean1) * 0.5, y0 + h * 0.5, 0);
    fillAttr(g, 'aCol', rgb(i % 2 ? '#846344' : bark));
    fillAttr(g, 'aTrunk', [1]);
    fillAttr(g, 'aH', [0]);
    parts.push(g);
  }

  const rand = mulberry32(seed * 131 + 17);
  const positions = [];
  const colors = [];
  const addTri = (a, b, c, color) => {
    positions.push(...a, ...b, ...c);
    const col = rgb(color);
    colors.push(...col, ...col, ...col);
  };

  const crown = [0.17, trunkH, 0];
  const fronds = 9;
  for (let j = 0; j < fronds; j++) {
    const angle = (j / fronds) * Math.PI * 2 + rand() * 0.28;
    const dir = [Math.cos(angle), 0, Math.sin(angle)];
    const side = [-dir[2], 0, dir[0]];
    const length = 1.48 + rand() * 0.48;
    const drop = 0.7 + rand() * 0.3;
    const centerAt = (t) => [
      crown[0] + dir[0] * length * t,
      crown[1] + 0.36 * Math.sin(Math.PI * t) - drop * t * t,
      crown[2] + dir[2] * length * t,
    ];

    // 中央叶脉：略宽的细长带状叶片。
    for (let k = 0; k < 8; k++) {
      const t0 = k / 8, t1 = (k + 1) / 8;
      const c0 = centerAt(t0), c1 = centerAt(t1);
      const w0 = 0.045 * (1 - t0) + 0.012;
      const w1 = 0.045 * (1 - t1) + 0.008;
      const l0 = [c0[0] - side[0] * w0, c0[1], c0[2] - side[2] * w0];
      const r0 = [c0[0] + side[0] * w0, c0[1], c0[2] + side[2] * w0];
      const l1 = [c1[0] - side[0] * w1, c1[1], c1[2] - side[2] * w1];
      const r1 = [c1[0] + side[0] * w1, c1[1], c1[2] + side[2] * w1];
      const leafCol = greens[(j + k) % greens.length];
      addTri(l0, r0, r1, leafCol);
      addTri(l0, r1, l1, leafCol);
    }

    // 成对细叶沿叶脉分层向外伸展，避免树冠看成一圈圆球。
    for (let k = 1; k <= 7; k++) {
      const t = k / 8;
      const c = centerAt(t);
      const blade = 0.24 * (1.0 - 0.34 * t) + 0.05;
      for (const sign of [-1, 1]) {
        const root = [c[0], c[1] - 0.015, c[2]];
        const tip = [
          c[0] + dir[0] * blade * 0.48 + side[0] * blade * sign,
          c[1] - 0.18 - 0.1 * t,
          c[2] + dir[2] * blade * 0.48 + side[2] * blade * sign,
        ];
        const shoulder = [
          c[0] + dir[0] * blade,
          c[1] - 0.08,
          c[2] + dir[2] * blade,
        ];
        addTri(root, tip, shoulder, greens[(j + k + 1) % greens.length]);
      }
    }
  }

  const leaves = new THREE.BufferGeometry();
  leaves.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  leaves.setAttribute('aCol', new THREE.Float32BufferAttribute(colors, 3));
  leaves.computeVertexNormals();
  const heights = new Float32Array(leaves.attributes.position.count);
  for (let i = 0; i < heights.length; i++) heights[i] = Math.max(0, leaves.attributes.position.getY(i) / 4.15);
  fillAttr(leaves, 'aTrunk', [0]);
  leaves.setAttribute('aH', new THREE.BufferAttribute(heights, 1));
  parts.push(leaves);
  return mergeGeometries(parts, [...EX, { name: 'aTrunk', size: 1 }, { name: 'aH', size: 1 }]);
}

// 低矮石拱桥：分段抬高的桥面、两侧拱券和石栏杆，桥身下方保留开口。
export function bridgeGeo(length = 26, width = 6.2) {
  const parts = [];
  const count = 22;
  const step = length / count;
  const base = 0.55;
  const rise = 2.75;
  const deckH = 0.56;
  const topAt = (t) => base + rise * Math.sin(Math.PI * t);
  const lowerAt = (t) => 0.22 + rise * 0.68 * Math.sin(Math.PI * t);

  // 一张共享顶点的弧形石面，法线连续；只在少数位置加缝，避免看成分段木板。
  const deck = new THREE.BufferGeometry();
  const deckPos = [];
  const deckColor = [];
  const deckIndex = [];
  for (let i = 0; i <= count; i++) {
    const x = -length * 0.5 + i * step;
    const y = topAt(i / count);
    deckPos.push(x, y, -width * 0.5, x, y, width * 0.5);
    const stone = rgb('#c6d0cb');
    deckColor.push(...stone, ...stone);
    if (i < count) {
      const a = i * 2, b = a + 2;
      deckIndex.push(a, a + 1, b + 1, a, b + 1, b);
    }
  }
  deck.setAttribute('position', new THREE.Float32BufferAttribute(deckPos, 3));
  deck.setAttribute('aCol', new THREE.Float32BufferAttribute(deckColor, 3));
  deck.setIndex(deckIndex);
  deck.computeVertexNormals();
  parts.push(deck);

  for (let i = 0; i < count; i++) {
    const t0 = i / count, t1 = (i + 1) / count, tm = (t0 + t1) * 0.5;
    const x0 = -length * 0.5 + i * step, x1 = x0 + step;
    const x = (x0 + x1) * 0.5;
    const top = topAt(tm);
    const y0 = topAt(t0), y1 = topAt(t1);
    if (i % 5 === 0 && i > 0) {
      parts.push(box(0.025, 0.018, width - 0.8, x0, topAt(t0) + 0.012, 0, '#c6c8bd'));
    }

    // 桥面两侧略厚的石缘，顺着拱线连接，不露出木板式的横向端面。
    for (const side of [-1, 1]) {
      const z = side * (width * 0.5 - 0.16);
      parts.push(box(step + 0.012, deckH, 0.32, x, top - deckH * 0.5, z, '#9eafa9'));
    }

    const b0 = lowerAt(t0), b1 = lowerAt(t1);
    for (const z of [-width * 0.5 + 0.18, width * 0.5 - 0.18]) {
      const upper = ((y0 + y1) * 0.5) - deckH * 0.35;
      const lower = (b0 + b1) * 0.5;
      parts.push(box(
        step + 0.025, Math.max(0.12, upper - lower), 0.48, x,
        (upper + lower) * 0.5, z,
        i % 2 ? '#728783' : '#829893',
      ));
    }

    // 石栏采用矮基座、疏朗望柱和连续压顶，桥洞从俯视角也能露出来。
    for (const z of [-width * 0.5 + 0.32, width * 0.5 - 0.32]) {
      parts.push(box(step + 0.025, 0.14, 0.3, x, top + 0.08, z, i % 2 ? '#bac7c1' : '#c6d0ca'));
      if (i % 3 === 0 || i === count - 1) {
        parts.push(box(step * 0.42, 0.38, 0.34, x, top + 0.3, z, '#aabbb4'));
      }
      parts.push(box(step + 0.045, 0.075, 0.4, x, top + 0.49, z, '#dce4de'));
    }
  }
  return mergeGeometries(parts, EX);
}

// 乡下的巴士：奶油色车身 + 一道绿腰线，车头朝 -z（和车一致）
export function busGeo(body = '#f2ead2', band = '#5f9a6e') {
  return mergeGeometries([
    box(2.0, 1.5, 6.4, 0, 1.15, 0, body),
    box(2.04, 0.36, 6.44, 0, 0.62, 0, band),
    box(2.06, 0.5, 5.6, 0, 1.45, 0.15, '#4c606b'),
    box(1.9, 0.5, 0.06, 0, 1.5, -3.2, '#4c606b'),
    box(1.8, 0.1, 6.0, 0, 1.95, 0, body),
    ...[[-0.9, -2.2], [0.9, -2.2], [-0.9, 2.2], [0.9, 2.2]].map(([x, z]) => box(0.24, 0.56, 0.7, x, 0.28, z, '#2e2b29')),
  ], EX);
}

// 木电线杆：杆 + 两根横担 + 白瓷瓶。原点在杆脚，横担沿 x
export function poleGeo() {
  return mergeGeometries([
    box(0.2, 5.8, 0.2, 0, 2.9, 0, '#6b5a48'),
    box(1.6, 0.12, 0.14, 0, 5.4, 0, '#5a4c3e'),
    box(1.1, 0.1, 0.12, 0, 4.9, 0, '#5a4c3e'),
    ...[-0.7, 0.7].map((x) => box(0.12, 0.16, 0.12, x, 5.54, 0, '#eeeae0')),
  ], EX);
}
