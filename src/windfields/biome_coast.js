// 海湾渔村：宽阔蓝海、浅色沙滩、汇入海湾的小溪与沿岸村落。
// 沿用同一套实时地貌烘焙和纸感合成，不把参考图当作动画背景。
import { C } from './config.js';

export const coastCurves = [
  { c: -10, t: [[1, 24, 0.15], [2, 4, 0.7], [3, 2, 4.1]] }, // 0 弧形海岸线
  { c: 2, t: [[1, 24, 0.15], [2, 4, 0.7], [3, 2, 4.1], [1, 30, -1.176]] }, // 1 从村落弯向海湾的小溪
  { c: 16, t: [[1, 24, 0.15], [2, 4, 0.7], [3, 2, 4.1], [1, 30, -1.176]] }, // 2 沿溪村道
  { c: 39, t: [[1, 24, 0.15], [2, 4, 0.7], [3, 2, 4.1], [1, 10, -1.176]] }, // 3 村中支路
];

export const coastGLSL = /* glsl */ `
Ground biome(vec2 p) {
  Ground g = ground0();
  vec2 coastalP = warp2(p, 5.0, 2.8, 301u);
  vec3 coast = cDist(0, coastalP);
  float shoreD = coast.x + 0.38 * wn(p, 96.0, 302u);

  // 海占画面的大半，岸线以外是连成片的海水；近岸浅、远海逐渐转深蓝。
  float sea = 1.0 - smoothstep(-0.78, 0.78, shoreD);
  float seaDepth = clamp(-shoreD / 42.0, 0.0, 1.0);
  vec3 ocean = mix(${C('#50B4C1')}, ${C('#347EAD')}, smoothstep(0.02, 0.88, seaDepth));
  ocean = mix(ocean, ${C('#286B9D')}, smoothstep(0.68, 1.0, seaDepth) * 0.52);

  // 岸边留一条自然起伏的奶油色沙滩，沙滩外缘有少量细碎颗粒。
  float beach = 1.0 - smoothstep(2.6, 11.0, shoreD + 0.32 * wn(p, 72.0, 303u));
  vec3 sand = mix(${C('#DCD9CC')}, ${C('#EEEBDD')}, wf(p, 64.0, 2, 304u));
  sand = mix(sand, ${C('#D8CBAF')}, speck(p, 1.0, 0.22, 0.3, 305u) * 0.2);

  // 村庄坐落在海岸内侧的平缓草地上，远离湿沙和潮线。
  float hill = wf(p, 5.0, 4, 306u);
  float inland = max(shoreD - 10.0, 0.0);
  float h = 0.4 + 0.28 * hill * hill + 0.22 * wf(p, 28.0, 3, 307u);
  h += smoothstep(62.0, 104.0, inland) * (2.0 + 5.0 * wf(p, 8.0, 3, 308u));
  vec3 grassCol = grass(p, ${C('#91C66F')}, ${C('#528D5A')}, ${C('#A5BE78')});
  vec3 land = mix(grassCol, sand, beach);

  // 一条窄溪穿过村落，在蜿蜒岸线处汇入海湾，避免变成第二条大河。
  vec3 creek = cDist(1, coastalP);
  float creekW = 2.25 + 0.2 * wf(p, 16.0, 2, 310u);
  float creekD = abs(creek.x) + 0.18 * wn(p, 96.0, 311u);
  float stream = (1.0 - smoothstep(creekW - 0.28, creekW + 0.28, creekD)) * (1.0 - sea);
  float streamBank = (1.0 - smoothstep(creekW + 0.5, creekW + 2.4, creekD)) * (1.0 - sea);
  vec3 bankCol = mix(${C('#A9C58A')}, ${C('#D8D5C7')}, beach);
  land = mix(land, bankCol, streamBank * (1.0 - stream));
  vec3 streamBed = mix(${C('#56B5C2')}, ${C('#3283AA')}, smoothstep(0.0, 1.0, creekW - creekD));
  land = mix(land, streamBed, stream);
  vec3 col = mix(land, ocean, sea);
  h = mix(h, 0.25, beach * (1.0 - sea));
  h = mix(h, max(0.1, h - 0.36), stream);
  h = mix(h, 0.0, sea);

  // 两条浅色乡间路串起海边小屋与稍高处的树丛。
  vec3 road = cDist(2, p);
  vec3 lane = cDist(3, p);
  float dRoad = abs(road.x), dLane = abs(lane.x);
  float onRoad = (1.0 - smoothstep(1.75, 2.65, dRoad + 0.22 * wn(p, 96.0, 312u)));
  float onLane = (1.0 - smoothstep(1.0, 1.65, dLane + 0.18 * wn(p, 96.0, 313u)));
  float onPath = max(onRoad, onLane) * (1.0 - beach) * (1.0 - sea);
  vec3 pathCol = mix(${C('#CFCBB8')}, ${C('#BDB9A7')}, wf(p, 48.0, 2, 314u));
  col = mix(col, pathCol, onPath);

  // 房屋只在道路两旁、离海岸稍远的地带成簇出现，形成小渔村而非城市网格。
  float roadHomes = (1.0 - smoothstep(8.0, 23.0, dRoad)) * smoothstep(3.0, 5.0, dRoad);
  float laneHomes = 0.72 * (1.0 - smoothstep(6.0, 16.0, dLane)) * smoothstep(2.5, 4.5, dLane);
  float clusters = smoothstep(0.3, 0.56, wf(p, 8.0, 3, 315u));
  float settled = max(roadHomes, laneHomes) * mix(0.18, 1.0, clusters);
  g.village = settled * smoothstep(6.0, 12.0, shoreD)
    * (1.0 - beach) * (1.0 - sea) * (1.0 - stream * 0.9)
    * (1.0 - smoothstep(0.72, 1.08, h - 0.4));

  // 村外的树带沿海岸与地势边缘疏密交错；房屋周围留出空地。
  float grove = smoothstep(0.28, 0.64, wf(p, 7.0, 4, 316u));
  float inlandTrees = smoothstep(38.0, 70.0, shoreD);
  float shoreTrees = smoothstep(7.0, 17.0, shoreD) * (1.0 - smoothstep(20.0, 32.0, shoreD));
  float villageClear = smoothstep(0.48, 0.88, g.village);
  float tree = max(inlandTrees * (0.35 + 0.65 * grove), shoreTrees * (0.2 + 0.5 * grove));
  tree *= (1.0 - villageClear) * (1.0 - beach) * (1.0 - sea) * (1.0 - onPath) * (1.0 - streamBank * 0.65);
  g.tree = tree;
  g.conifer = 0.08 + 0.12 * smoothstep(48.0, 90.0, shoreD);
  col = mix(col, ${C('#5B874C')}, smoothstep(0.25, 0.82, tree) * 0.5);

  // 房前草地与少量花点作为过渡，不在海滩上铺花。
  float meadow = (1.0 - tree) * (1.0 - onPath) * (1.0 - beach) * (1.0 - sea) * (1.0 - stream);
  g.lone = meadow * (1.0 - g.village * 0.75);
  g.flower = meadow * smoothstep(0.63, 0.82, wf(p, 14.0, 3, 317u)) * 0.32;
  g.wind = meadow * 0.65;

  float water = max(sea, stream);
  float depth = max(seaDepth * sea, (1.0 - creekD / creekW) * stream * 0.45);
  g.h = h;
  g.alb = col;
  g.water = water;
  g.depth = clamp(depth, 0.0, 1.0);
  g.shore = max(sea * (1.0 - smoothstep(0.0, 9.0, -shoreD)) * 0.82,
    stream * (1.0 - smoothstep(creekW - 0.2, creekW + 0.4, creekD)) * 0.35);
  g.cls = water > 0.5 ? CL_WATER
    : onPath > 0.5 ? CL_ROAD
    : beach > 0.5 ? CL_SAND
    : tree > 0.48 ? CL_FOREST
    : CL_MEADOW;
  return g;
}
`;
