// 场景配置：目前只接入「草原河流」。地貌函数、曲线、色板、植被与小物件都在这里。
import { riverGLSL, riverCurves } from './biome_river.js';

// 树的色阶：[暗, 中, 亮, 高光]，每个场景给 4 套（树冠着色器按 pal 下标取）
const SUMMER = ['#2f5a3a', '#4f8a45', '#86b85a', '#cfe08a'];
const CEDAR = ['#22443a', '#335f45', '#58864f', '#9fbf72'];
const DEEP = ['#284c34', '#3f7440', '#6aa04e', '#b8d47a'];
const BUSH = ['#30563a', '#4e8644', '#7fb158', '#c2d985'];

export const river = {
  id: 'river',
  name: '草原河流',
  seed: 21,
  biome: riverGLSL,
  curves: riverCurves,
  flowers: ['#fbfaf2', '#f6e27a', '#f2a7b8', '#c7b6ea', '#f08a5d', '#9fd0f0'],
  flora: {
    palettes: [SUMMER, CEDAR, DEEP, BUSH],
    pal: [0, 2, 1, 0, 3],
    forestV: 1,
    loneV: 0,
    forest: [1.05, 1.5],
    lone: [1.6, 2.2],
    bush: [0.7, 1.1],
    loneP: 0.35,
    edgeBush: 0.35,
    yardTree: 0.7,
  },
  houses: {
    cell: 8,
    roads: [1, 2],
    walls: ['#f3ede0', '#efe6d2', '#8b6a4f', '#e9e2d0'],
    roofs: ['#3f6f8c', '#a5523f', '#4e5a63', '#2f7f7a', '#b9653c'],
  },
  overlay: { yard: '#d6c79f', soil: '#9c7650', crop: '#4f8a3a', path: '#d8c597' },
  animals: { herds: 7, cowShare: 0.45 },
  traffic: {
    cars: [
      { road: 1, z: -40, dir: 1, speed: 3.6, color: '#f2efe6' },
      { road: 1, z: 60, dir: -1, speed: 3.0, color: '#d9a441' },
      { road: 2, z: 10, dir: 1, speed: 2.4, color: '#7aa6b8', lane: 0 },
    ],
  },
  clouds: {
    count: 10, size: [5, 9], top: [40, 43], wind: [0.9, 0.5],
    lit: '#fffaf0', shade: '#c8d1e5', deep: '#929fc0',
  },
  fog: { color: '#d7e6ee', near: 150, far: 270, max: 0.42 },
  water: { sky: '#e9f5f4' },
  gust: '#eef3c6',
  hemiGround: '#a7c47e',
  grade: { glow: '#fff3d6', sat: 1.06 },
};
