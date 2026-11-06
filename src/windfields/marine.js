// 热带海面的偶发动态：飞鱼跃水、鲸鱼喷水、海鸟滑翔与游艇巡航。
// 所有造型均由 Three.js 几何体实时绘制，不依赖静态图片。
import * as THREE from 'three';
import { LOOP, WORLD_W, mergeGeometries, fillAttr, wrapNear } from './config.js';

const COLOR_ATTR = [{ name: 'aCol', size: 3 }];
const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function color(hex) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}

function paint(geo, hex) {
  return fillAttr(geo, 'aCol', color(hex));
}

function box(w, h, d, x, y, z, hex) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(x, y, z);
  return paint(geo, hex);
}

function ellipsoid(rx, ry, rz, x, y, z, hex, segments = 12) {
  const geo = new THREE.SphereGeometry(1, segments, Math.max(6, segments >> 1));
  geo.scale(rx, ry, rz);
  geo.translate(x, y, z);
  return paint(geo, hex);
}

function triangle(vertices, hex) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return paint(geo, hex);
}

function combine(parts) {
  const geo = mergeGeometries(parts, COLOR_ATTR);
  parts.forEach((part) => part.dispose());
  return geo;
}

// 朝向 -z。轮廓略宽、带浅色腹部和橙色尾鳍，俯视时也容易读成跃出海面的鱼。
function flyingFishGeo() {
  return combine([
    ellipsoid(0.56, 0.46, 1.65, 0, 0, 0, '#36A9A5', 14),
    ellipsoid(0.36, 0.18, 1.18, 0, -0.25, -0.05, '#D7EDE0', 12),
    triangle([0, 0.03, 1.38, -0.74, 0.02, 2.38, 0, 0.06, 2.08], '#F0A66F'),
    triangle([0, 0.03, 1.38, 0, 0.06, 2.08, 0.74, 0.02, 2.38], '#E59665'),
    triangle([0, 0.35, -0.05, -0.45, 0.05, 0.58, 0.42, 0.05, 0.52], '#74C7B7'),
    triangle([0.3, 0.01, -0.1, 1.2, -0.06, 0.55, 0.28, -0.07, 0.58], '#61BDB0'),
    triangle([-0.3, 0.01, -0.1, -0.28, -0.07, 0.58, -1.2, -0.06, 0.55], '#61BDB0'),
    ellipsoid(0.075, 0.075, 0.075, 0.37, 0.13, -1.12, '#233C45', 8),
    ellipsoid(0.075, 0.075, 0.075, -0.37, 0.13, -1.12, '#233C45', 8),
  ]);
}

function whaleBodyGeo() {
  // 沿身体长轴分段收尖，比单个椭球更像鲸：前额圆钝、肩背最宽、尾柄渐细。
  const sections = [
    [-5.7, 0.16, 0.22],
    [-5.15, 0.72, 0.65],
    [-4.2, 1.28, 1.05],
    [-2.7, 1.7, 1.28],
    [-0.7, 1.82, 1.38],
    [1.2, 1.6, 1.18],
    [2.8, 1.12, 0.82],
    [4.0, 0.62, 0.48],
    [4.75, 0.24, 0.22],
  ];
  const radial = 20;
  const positions = [];
  const colors = [];
  const indices = [];
  const top = new THREE.Color('#315965');
  const side = new THREE.Color('#527B80');
  const belly = new THREE.Color('#A9C9C2');

  for (const [z, rx, ry] of sections) {
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const cs = Math.cos(a), sn = Math.sin(a);
      positions.push(rx * sn, ry * cs, z);
      const c = top.clone().lerp(side, 1 - Math.abs(cs) * 0.55);
      c.lerp(belly, smooth(0.18, 0.92, -cs) * 0.82);
      colors.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < sections.length - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + (j + 1) % radial;
      const c = (i + 1) * radial + (j + 1) % radial;
      const d = (i + 1) * radial + j;
      indices.push(a, d, b, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aCol', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// 座头鲸的圆润背部、胸鳍与分叉尾鳍只在短暂浮出时露出水面。
function whaleGeo() {
  return combine([
    whaleBodyGeo(),
    triangle([0, 0.1, 4.35, -1.72, 0.2, 5.7, -0.35, 0.18, 4.8], '#416F78'),
    triangle([0, 0.1, 4.35, 0.35, 0.18, 4.8, 1.72, 0.2, 5.7], '#416F78'),
    triangle([0, -0.2, -0.2, 2.65, -0.5, 1.15, 0.8, -0.44, 1.7], '#527E83'),
    triangle([0, -0.2, -0.2, -0.8, -0.44, 1.7, -2.65, -0.5, 1.15], '#527E83'),
    triangle([0, 0.78, -1.65, -0.42, 0.2, -2.45, 0.42, 0.2, -2.45], '#456F77'),
    ellipsoid(0.16, 0.055, 0.2, 0, 1.22, -4.05, '#263F4A', 8),
  ]);
}

// 一艘低矮的白色机动游艇，艇头朝 -z。
function yachtGeo() {
  return combine([
    box(1.72, 0.38, 5.35, 0, 0.16, 0.05, '#F4F1E6'),
    triangle([0, 0.34, -3.28, -0.86, 0.34, -2.35, 0.86, 0.34, -2.35], '#FAF8F0'),
    triangle([-0.86, 0.18, -2.34, 0, -0.06, -3.12, 0, 0.34, -3.28], '#D7E4DF'),
    triangle([0.86, 0.18, -2.34, 0, 0.34, -3.28, 0, -0.06, -3.12], '#D7E4DF'),
    box(1.15, 0.8, 1.75, 0, 0.72, 0.55, '#F8F5EA'),
    box(1.02, 0.34, 0.07, 0, 0.91, -0.36, '#4F7780'),
    box(1.25, 0.13, 1.9, 0, 1.2, 0.55, '#EEE8D7'),
    box(0.12, 0.36, 0.12, 0.52, 0.63, 1.18, '#E8A16D'),
  ]);
}

function birdWingGeo() {
  return combine([
    triangle([0, 0, 0, 3.0, 0, -0.45, 2.55, 0, 0.1], '#F3F0E6'),
    triangle([0, 0, 0, 2.55, 0, 0.1, 0.82, 0, 0.47], '#E8E8DB'),
    triangle([2.55, 0, 0.1, 3.0, 0, -0.45, 2.73, 0, -0.26], '#526967'),
  ]);
}

function birdBodyGeo() {
  return combine([
    ellipsoid(0.25, 0.2, 0.62, 0, 0, 0.05, '#F4F0E6', 10),
    ellipsoid(0.2, 0.18, 0.23, 0, 0.015, -0.48, '#F8F5EC', 10),
    triangle([0, 0, -0.62, -0.1, -0.055, -0.9, 0.1, -0.055, -0.9], '#D9A871'),
  ]);
}

function makeBird(bodyGeo, wingGeo, mat, scale = 1) {
  const bird = new THREE.Group();
  bird.scale.setScalar(scale);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.castShadow = true;
  body.receiveShadow = false;
  bird.add(body);

  const left = new THREE.Group();
  left.position.set(-0.13, 0.035, -0.04);
  left.scale.x = -1;
  const leftWing = new THREE.Mesh(wingGeo, mat);
  leftWing.castShadow = true;
  leftWing.receiveShadow = false;
  left.add(leftWing);
  bird.add(left);

  const right = new THREE.Group();
  right.position.set(0.13, 0.035, -0.04);
  const rightWing = new THREE.Mesh(wingGeo, mat);
  rightWing.castShadow = true;
  rightWing.receiveShadow = false;
  right.add(rightWing);
  bird.add(right);
  return { group: bird, left, right };
}

function hasClearWater(field, x, z, radius) {
  if (field.water(x, z) < 0.97) return false;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    if (field.water(x + Math.cos(a) * radius, z + Math.sin(a) * radius) < 0.96) return false;
  }
  return true;
}

function findOceanSpots(field) {
  const spots = [];
  for (let z = -LOOP / 2 + 6; z < LOOP / 2; z += 8) {
    for (let x = -WORLD_W / 2 + 8; x < WORLD_W / 2 - 8; x += 8) {
      if (hasClearWater(field, x, z, 8)) spots.push({ x, z });
    }
  }
  return spots;
}

function chooseSpot(spots, rnd, rig, avoid = [], avoidDistance = 0) {
  if (!spots.length) return null;
  for (let i = 0; i < 80; i++) {
    const spot = spots[(rnd() * spots.length) | 0];
    if (rig) {
      const z = wrapNear(spot.z, rig.fz);
      if (Math.abs(spot.x - rig.fx) > 88 || z - rig.fz < -82 || z - rig.fz > 30) continue;
    }
    if (avoidDistance && avoid.some((p) =>
      Math.hypot(p.x - spot.x, wrapNear(p.z, spot.z) - spot.z) < avoidDistance)) continue;
    return { x: spot.x, z: rig ? wrapNear(spot.z, rig.fz) : spot.z };
  }
  return null;
}

export class Marine {
  constructor(mat, field, rnd, boats = [], focusZ = 0) {
    this.group = new THREE.Group();
    this.mat = mat;
    this.field = field;
    this.rnd = rnd;
    this.spots = findOceanSpots(field);
    this.timeStart = null;
    this.nextFish = 0;
    this.nextWhale = 0;
    this.fishEvent = null;
    this.whaleEvent = null;

    this.fishGeo = flyingFishGeo();
    this.fishMeshes = [0, 1].map((_, i) => {
      const mesh = new THREE.Mesh(this.fishGeo, mat);
      // 飞鱼只占鲸鱼的一小部分；成对出现时再略微错开体型。
      mesh.scale.setScalar(i === 0 ? 0.48 : 0.44);
      mesh.visible = false;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      return mesh;
    });

    this.whaleGeo = whaleGeo();
    this.whale = new THREE.Mesh(this.whaleGeo, mat);
    this.whale.visible = false;
    this.whale.castShadow = true;
    this.whale.receiveShadow = true;
    this.group.add(this.whale);

    this.ringGeo = new THREE.TorusGeometry(1, 0.07, 5, 24);
    this.ringGeo.rotateX(Math.PI / 2);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: '#D8F4EC', transparent: true, opacity: 0, depthWrite: false,
    });
    this.splashes = [0, 1].map(() => {
      const ring = new THREE.Mesh(this.ringGeo, this.ringMat);
      ring.visible = false;
      this.group.add(ring);
      return ring;
    });

    this.sprayMat = new THREE.MeshBasicMaterial({
      color: '#E9F8F1', transparent: true, opacity: 0, depthWrite: false,
    });
    this.sprayGeo = new THREE.SphereGeometry(1, 10, 7);
    this.sprayDropsGeo = new THREE.SphereGeometry(0.22, 8, 6);
    this.sprays = [-0.32, 0, 0.32].map((x, i) => {
      const cone = new THREE.Mesh(this.sprayGeo, this.sprayMat);
      cone.position.x = x;
      cone.rotation.z = (i - 1) * 0.12;
      this.group.add(cone);
      return cone;
    });
    // 分批喷出的水滴：错开相位后循环抛射，避免三颗水滴停在空中像装饰贴片。
    this.sprayDrops = [
      { side: -0.58, vx: -2.25, vz: 0.22, phase: 0.00, speed: 8.8, size: 0.15 },
      { side: -0.38, vx: -1.55, vz: -0.12, phase: 0.16, speed: 9.5, size: 0.19 },
      { side: -0.18, vx: -0.82, vz: 0.18, phase: 0.32, speed: 8.7, size: 0.14 },
      { side: 0.02, vx: -0.18, vz: -0.2, phase: 0.48, speed: 9.4, size: 0.17 },
      { side: 0.22, vx: 0.72, vz: 0.16, phase: 0.64, speed: 8.9, size: 0.2 },
      { side: 0.42, vx: 1.42, vz: -0.14, phase: 0.80, speed: 9.6, size: 0.15 },
      { side: 0.62, vx: 2.08, vz: 0.2, phase: 0.96, speed: 8.6, size: 0.18 },
      { side: -0.72, vx: -1.9, vz: -0.24, phase: 1.12, speed: 9.2, size: 0.13 },
    ].map((particle) => {
      const mesh = new THREE.Mesh(this.sprayDropsGeo, this.sprayMat);
      mesh.visible = false;
      this.group.add(mesh);
      return { ...particle, mesh };
    });
    this.sprayGroup = new THREE.Group();
    // Keep spray nodes together for easy per-event placement; reparent them from the world group.
    for (const node of [...this.sprays, ...this.sprayDrops.map((drop) => drop.mesh)]) {
      this.group.remove(node);
      this.sprayGroup.add(node);
    }
    this.group.add(this.sprayGroup);
    this.sprayGroup.visible = false;

    this.yachtGeo = yachtGeo();
    this.yachts = [];
    const home = { fx: 0, fz: focusZ };
    const yachtSpot = chooseSpot(this.spots, rnd, home, boats, 22) ??
      chooseSpot(this.spots, rnd, null, boats, 22);
    if (yachtSpot) {
      const mesh = new THREE.Mesh(this.yachtGeo, mat);
      mesh.scale.setScalar(1.25);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.yachts.push({ mesh, ...yachtSpot, phase: rnd() * Math.PI * 2, radius: 1.5 + rnd() * 1.2 });
    }

    this.birdBodyGeo = birdBodyGeo();
    this.birdWingGeo = birdWingGeo();
    this.birdFlocks = [];
    for (let i = 0; i < 2; i++) {
      const root = new THREE.Group();
      const count = i === 0 ? 3 : 4;
      const birds = [];
      for (let j = 0; j < count; j++) {
        const scale = 0.9 + rnd() * 0.28;
        const bird = makeBird(this.birdBodyGeo, this.birdWingGeo, mat, scale);
        bird.group.position.set((rnd() - 0.5) * 8, (rnd() - 0.5) * 1.8, (rnd() - 0.5) * 7);
        bird.phase = rnd() * Math.PI * 2;
        birds.push(bird);
        root.add(bird.group);
      }
      this.group.add(root);
      this.birdFlocks.push({
        root,
        birds,
        x: (rnd() - 0.5) * 72,
        z: focusZ + (i === 0 ? 18 : -54) + (rnd() - 0.5) * 20,
        altitude: 16 + rnd() * 9,
        phase: rnd() * Math.PI * 2,
        speed: 0.035 + rnd() * 0.025,
        radius: 13 + rnd() * 11,
      });
    }
  }

  pickVisiblePath(rig, radius, distance) {
    for (let i = 0; i < 120; i++) {
      const spot = this.spots[(this.rnd() * this.spots.length) | 0];
      if (!spot) return null;
      const z = wrapNear(spot.z, rig.fz);
      if (Math.abs(spot.x - rig.fx) > 88 || z - rig.fz < -82 || z - rig.fz > 30) continue;
      const heading = this.rnd() * Math.PI * 2;
      const dx = Math.sin(heading), dz = -Math.cos(heading);
      let clear = true;
      for (let j = 0; j <= 8; j++) {
        const p = j / 8;
        if (!hasClearWater(this.field, spot.x + dx * distance * p, z + dz * distance * p, radius)) {
          clear = false;
          break;
        }
      }
      if (clear) return { x: spot.x, z, heading, distance };
    }
    return null;
  }

  update(dt, time, rig) {
    if (this.timeStart === null) {
      this.timeStart = time;
      this.nextFish = time + 5 + this.rnd() * 7;
      this.nextWhale = time + 15 + this.rnd() * 10;
    }

    for (const yacht of this.yachts) {
      const t = time * 0.045 + yacht.phase;
      const x = yacht.x + Math.sin(t) * yacht.radius;
      const z = yacht.z + Math.cos(t * 0.82) * yacht.radius;
      yacht.mesh.position.set(x, 0.27 + Math.sin(time * 0.85 + yacht.phase) * 0.045, wrapNear(z, rig.fz));
      yacht.mesh.rotation.y = Math.sin(t * 0.7) * 0.15;
    }

    for (const flock of this.birdFlocks) {
      const t = time * flock.speed + flock.phase;
      const x = flock.x + Math.sin(t) * flock.radius;
      const z = flock.z + Math.cos(t * 0.83) * flock.radius;
      const vx = Math.cos(t) * flock.radius * flock.speed;
      const vz = -Math.sin(t * 0.83) * flock.radius * flock.speed * 0.83;
      flock.root.position.set(x, flock.altitude + Math.sin(t * 1.7) * 1.2, wrapNear(z, rig.fz));
      flock.root.rotation.y = Math.atan2(vx, -vz);
      for (const bird of flock.birds) {
        const flap = Math.sin(time * (2.2 + bird.phase * 0.08) + bird.phase);
        bird.left.rotation.z = -0.08 - flap * 0.28;
        bird.right.rotation.z = 0.08 + flap * 0.28;
        bird.group.position.y = Math.sin(time * 0.65 + bird.phase) * 0.32;
      }
    }

    if (!this.fishEvent && !this.whaleEvent && time >= this.nextFish) {
      // 缩短水平滑翔距离，同时保留抛物线跃起的观感。
      const path = this.pickVisiblePath(rig, 3.2, 15);
      if (path) {
        const pair = this.rnd() < 0.28;
        this.fishEvent = {
          start: time,
          ...path,
          count: pair ? 2 : 1,
          duration: 2.5 + this.rnd() * 0.45,
        };
        this.nextFish = time + 13 + this.rnd() * 17;
      } else {
        this.nextFish = time + 3;
      }
    }

    if (!this.fishEvent && !this.whaleEvent && time >= this.nextWhale) {
      const path = this.pickVisiblePath(rig, 6.5, 23);
      if (path) {
        this.whaleEvent = {
          start: time,
          ...path,
          duration: 7.8,
        };
        this.nextWhale = time + 25 + this.rnd() * 14;
      } else {
        this.nextWhale = time + 4;
      }
    }

    this.updateFish(time, rig.fz);
    this.updateWhale(time, rig.fz);
  }

  updateFish(time, refZ) {
    const event = this.fishEvent;
    if (!event) {
      this.fishMeshes.forEach((mesh) => { mesh.visible = false; });
      this.splashes.forEach((ring) => { ring.visible = false; });
      return;
    }
    const elapsed = time - event.start;
    const p = elapsed / event.duration;
    if (p >= 1) {
      this.fishEvent = null;
      this.fishMeshes.forEach((mesh) => { mesh.visible = false; });
      this.splashes.forEach((ring) => { ring.visible = false; });
      return;
    }

    const dirX = Math.sin(event.heading), dirZ = -Math.cos(event.heading);
    const sideX = Math.cos(event.heading), sideZ = Math.sin(event.heading);
    const travel = event.distance * p;
    const height = 4 * 5.2 * p * (1 - p);
    for (let i = 0; i < this.fishMeshes.length; i++) {
      const mesh = this.fishMeshes[i];
      const active = i < event.count;
      mesh.visible = active;
      if (!active) continue;
      const side = event.count === 2 ? (i === 0 ? -1 : 1) * 1.05 : 0;
      const curve = Math.sin(Math.PI * p) * 1.35;
      const x = event.x + dirX * travel + sideX * (side + curve);
      const z = event.z + dirZ * travel + sideZ * (side + curve);
      mesh.position.set(x, 0.4 + height, wrapNear(z, refZ));
      const climb = 4 * 5.2 * (1 - 2 * p);
      mesh.rotation.set(-Math.atan2(climb, event.distance), event.heading + (i ? 0.12 : -0.12),
        Math.sin(Math.PI * p) * (i ? 0.045 : -0.045));
    }

    for (let i = 0; i < this.splashes.length; i++) {
      const ring = this.splashes[i];
      const atStart = i === 0;
      const local = atStart ? p : p - 0.94;
      ring.visible = local >= 0 && local < 0.22 && event.count > i;
      if (!ring.visible) continue;
      const x = event.x + dirX * (atStart ? 0 : event.distance) + (atStart ? 0 : sideX * 1.35);
      const z = event.z + dirZ * (atStart ? 0 : event.distance) + (atStart ? 0 : sideZ * 1.35);
      ring.position.set(x, 0.12, wrapNear(z, refZ));
      const size = 0.65 + local * 8;
      ring.scale.setScalar(size);
      this.ringMat.opacity = clamp((1 - local / 0.22) * 0.55, 0, 0.55);
    }
  }

  updateWhale(time, refZ) {
    const event = this.whaleEvent;
    if (!event) {
      this.whale.visible = false;
      this.sprayGroup.visible = false;
      this.sprayMat.opacity = 0;
      this.sprayDrops.forEach(({ mesh }) => { mesh.visible = false; });
      return;
    }
    const elapsed = time - event.start;
    if (elapsed >= event.duration) {
      this.whaleEvent = null;
      this.whale.visible = false;
      this.sprayGroup.visible = false;
      this.sprayMat.opacity = 0;
      this.sprayDrops.forEach(({ mesh }) => { mesh.visible = false; });
      return;
    }

    const rise = smooth(0.55, 2.15, elapsed);
    const sink = smooth(4.7, 6.55, elapsed);
    const surface = rise * (1 - sink);
    const travel = event.distance * clamp(elapsed / event.duration, 0, 1);
    const dirX = Math.sin(event.heading), dirZ = -Math.cos(event.heading);
    const x = event.x + dirX * travel;
    const z = wrapNear(event.z + dirZ * travel, refZ);
    this.whale.visible = true;
    this.whale.position.set(x, -1.52 + surface * 0.92, z);
    this.whale.rotation.set(Math.sin(elapsed * 0.72) * 0.035, event.heading,
      Math.sin(elapsed * 0.58) * 0.07);

    const sprayTime = elapsed - 1.55;
    const sprayDuration = 2.45;
    const sprayP = clamp(sprayTime / sprayDuration, 0, 1);
    const pulse = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(sprayTime * 8.5));
    const sprayAlpha = sprayTime >= 0 && sprayTime <= sprayDuration
      ? smooth(0, 0.22, sprayTime) * (1 - smooth(1.86, sprayDuration, sprayTime)) * pulse * 0.86
      : 0;
    this.sprayGroup.visible = sprayAlpha > 0.01;
    this.sprayGroup.position.set(x + dirX * 3.7, 0.24 + surface * 0.35, z + dirZ * 3.7);
    this.sprayGroup.rotation.y = event.heading;
    this.sprayMat.opacity = sprayAlpha;
    const plume = 3.0 + Math.sin(sprayTime * 2.6) * 0.3;
    this.sprays.forEach((blob, i) => {
      const side = i - 1;
      const drift = Math.sin(sprayTime * 5.2 + i * 1.7);
      const breathe = 0.82 + 0.18 * Math.sin(sprayTime * 7.1 + i * 1.4);
      blob.position.set(
        side * (0.18 + sprayP * 0.42) + drift * 0.1,
        plume * (0.34 + i * 0.1) + Math.sin(sprayTime * 6.3 + i) * 0.1,
        side * 0.08 + Math.cos(sprayTime * 4.4 + i) * 0.06,
      );
      blob.scale.set(
        (0.26 + i * 0.025) * breathe,
        plume * (i === 1 ? 0.38 : 0.26) * breathe,
        0.26 * breathe,
      );
      blob.rotation.z = side * 0.12 + drift * 0.045;
    });
    this.sprayDrops.forEach(({ mesh, side, vx, vz, phase, speed, size }) => {
      const gravity = 15.2;
      const lifetime = (2 * speed) / gravity;
      const age = (sprayTime + phase) % 1.34;
      const alive = sprayAlpha > 0.02 && age < lifetime;
      mesh.visible = alive;
      if (!alive) return;
      const travelFade = 0.75 + 0.25 * Math.sin(Math.PI * age / lifetime);
      mesh.position.set(
        side + vx * age,
        0.22 + speed * age - 0.5 * gravity * age * age,
        vz * age,
      );
      const dropletSize = size * travelFade;
      mesh.scale.set(dropletSize * 0.82, dropletSize * 1.35, dropletSize * 0.82);
      mesh.rotation.z = -Math.atan2(speed - gravity * age, Math.max(0.1, Math.abs(vx)));
    });
  }

  dispose() {
    for (const geo of [
      this.fishGeo, this.whaleGeo, this.ringGeo, this.sprayGeo, this.sprayDropsGeo,
      this.yachtGeo, this.birdBodyGeo, this.birdWingGeo,
    ]) geo?.dispose();
    this.ringMat.dispose();
    this.sprayMat.dispose();
  }
}
