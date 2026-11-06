// 热带群岛：大小、朝向与横向位置各不相同的岛屿错落分布，近处双岛与远处小岛都会同时入画。
import { C } from './config.js';

export const islandCurves = [
  { c: -28, t: [[1, 3.8, 0.25], [2, 1.7, 2.0]] }, // 0 西侧大岛步道
  { c: 38, t: [[1, 2.8, 0.9], [2, 1.2, 3.6]] },   // 1 东侧小岛步道
];

export const islandGLSL = /* glsl */ `
float islandEdge(vec2 p, vec2 center, vec2 radius, float phase) {
  float dz = mod(p.y - center.y + LOOP * 0.5, LOOP) - LOOP * 0.5;
  float rot = phase * 0.13;
  float c = cos(rot), s = sin(rot);
  vec2 q = vec2(c * (p.x - center.x) + s * dz, -s * (p.x - center.x) + c * dz) / radius;
  float a = atan(q.y, q.x);
  float lobes = 0.028 * sin(3.0 * a + phase) + 0.016 * sin(5.0 * a - phase * 1.7);
  return length(q) + lobes;
}

Ground biome(vec2 p) {
  Ground g = ground0();
  vec2 q = warp2(p, 5.0, 1.35, 601u);

  // 十座岛分成疏密不同的小群：横向错开，轮廓、尺度与朝向都不重复。
  // z 坐标按 LOOP 取最近周期副本，首尾衔接处同样保留自然的群岛节奏。
  float dA = islandEdge(q, vec2(-28.0, -12.0), vec2(33.0, 19.0), 0.4);
  float dB = islandEdge(q, vec2(38.0, 8.0), vec2(22.0, 13.0), 1.7);
  float dC = islandEdge(q, vec2(12.0, -20.0), vec2(7.0, 5.0), 2.5);
  float dD = islandEdge(q, vec2(-43.0, 75.0), vec2(17.0, 10.0), 3.4);
  float dE = islandEdge(q, vec2(27.0, 98.0), vec2(23.0, 13.0), 4.2);
  float dF = islandEdge(q, vec2(-40.0, -115.0), vec2(22.0, 13.0), 5.1);
  float dG = islandEdge(q, vec2(48.0, -96.0), vec2(15.0, 9.0), 5.8);
  float dH = islandEdge(q, vec2(50.0, -59.0), vec2(12.0, 8.0), 6.4);
  float dI = islandEdge(q, vec2(-58.0, 42.0), vec2(18.0, 11.0), 7.1);
  float dJ = islandEdge(q, vec2(18.0, 121.0), vec2(9.0, 6.0), 7.8);
  float rawD = min(min(min(dA, dB), min(dC, dD)),
    min(min(min(dE, dF), min(dG, dH)), min(dI, dJ)));
  float edge = rawD + 0.026 * wn(p, 40.0, 602u) + 0.014 * wn(p, 80.0, 603u);
  float land = 1.0 - smoothstep(0.99, 1.075, edge);
  float beach = smoothstep(0.82, 0.92, edge) * (1.0 - smoothstep(0.98, 1.035, edge)) * land;
  float shallow = smoothstep(1.02, 1.55, edge);
  float deep = smoothstep(1.55, 3.1, edge);
  float sea = 1.0 - land;

  vec3 ocean = mix(${C('#5CC8C2')}, ${C('#398EAE')}, smoothstep(1.0, 1.7, edge));
  ocean = mix(ocean, ${C('#236E99')}, deep * 0.88);
  ocean = mix(ocean, ${C('#8AD9CB')}, (1.0 - smoothstep(0.98, 1.24, edge)) * sea * 0.72);

  float hill = wf(p, 7.0, 4, 604u);
  float mound = max(0.0, 1.0 - edge);
  float h = 0.5 + 3.0 * mound + 0.42 * hill * mound;
  vec3 green = grass(p, ${C('#79B95F')}, ${C('#438452')}, ${C('#A4C37A')});
  vec3 sand = mix(${C('#EEE5CC')}, ${C('#D8CBAF')}, wf(p, 60.0, 2, 605u));
  vec3 island = mix(green, sand, beach);
  float inner = 1.0 - smoothstep(0.63, 0.86, edge);

  float islandA = 1.0 - smoothstep(0.98, 1.075, dA);
  float islandB = 1.0 - smoothstep(0.98, 1.075, dB);
  vec3 pathA = cDist(0, p);
  vec3 pathB = cDist(1, p);
  float da = abs(pathA.x), db = abs(pathB.x);
  float onPathA = (1.0 - smoothstep(1.05, 1.8, da)) * islandA;
  float onPathB = (1.0 - smoothstep(1.05, 1.8, db)) * islandB;
  float onPath = max(onPathA, onPathB) * land * (1.0 - beach);
  island = mix(island, ${C('#C8B88F')}, onPath);

  float settlementA = (1.0 - smoothstep(4.5, 16.0, da)) * smoothstep(2.4, 4.2, da) * islandA;
  float settlementB = 0.72 * (1.0 - smoothstep(4.0, 14.0, db)) * smoothstep(2.0, 4.0, db) * islandB;
  float settlement = max(settlementA, settlementB);
  g.village = settlement * smoothstep(0.18, 0.55, wf(p, 8.0, 3, 606u))
    * inner * land * (1.0 - beach) * (1.0 - onPath);

  float grove = smoothstep(0.25, 0.58, wf(p, 6.0, 4, 607u));
  float canopy = inner * land * (0.64 + 0.36 * grove);
  canopy *= (1.0 - smoothstep(0.58, 0.92, g.village)) * (1.0 - onPath);
  g.tree = canopy;
  g.alt = inner * land; // 密林树种切换为棕榈
  g.conifer = 0.0;
  g.lone = 0.0;
  g.flower = inner * land * smoothstep(0.7, 0.86, wf(p, 14.0, 3, 608u)) * 0.12;
  g.wind = inner * land * 0.38;

  g.h = mix(h, 0.0, sea);
  g.alb = mix(island, ocean, sea);
  g.water = sea;
  g.depth = sea * clamp(0.12 + shallow * 0.3 + deep * 0.7, 0.0, 1.0);
  g.shore = sea * (1.0 - smoothstep(1.0, 1.16, edge)) * 0.9;
  g.cls = sea > 0.5 ? CL_WATER : beach > 0.5 ? CL_SAND : onPath > 0.5 ? CL_ROAD : g.tree > 0.45 ? CL_FOREST : CL_MEADOW;
  return g;
}
`;
