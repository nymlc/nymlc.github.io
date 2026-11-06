// 风过荒野：草原河流与海湾渔村的实时 WebGL 场景（移植自 cswfww123/wind-fields）。
// 页面只需要 createWindFields(canvas)：画布填满哪个容器，画面就跟着那个容器的尺寸走。
import * as THREE from 'three';
import { coast } from './scenes.js';
import { LOOP, SUN_DIR, wrapNear } from './config.js';
import { shared } from './shading.js';
import { TerrainBaker } from './bake.js';
import { World } from './world.js';
import { Rig, Flight } from './flight.js';
import { COMPOSITE_VERT, COMPOSITE_FRAG } from './composite.js';
import { createAirplane } from './airplane.js';

THREE.ColorManagement.enabled = false;

const MARGIN = 1.06;                 // 渲染区比纸窗略大一圈，留给撕纸边的毛刺
const INSET = { x: 0.016, y: 0.033 }; // 纸边离画布边缘的留白（占宽 / 高的比例，和海报图一致）
const SHADOW_SPAN = 200;             // 阴影相机覆盖的世界范围（要盖住拉远后的整个画面）
const MIN_PR = 0.75;
const PIXEL_BUDGET = 2.2e6;

export class WindFields {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ onFirstFrame?: () => void, onLost?: () => void, scene?: object }} [opts]
   */
  constructor(canvas, { onFirstFrame, onLost, scene } = {}) {
    this.canvas = canvas;
    this.onFirstFrame = onFirstFrame;
    this.onLost = onLost;
    this.clock = new THREE.Clock();
    this.time = 0;
    this.frames = 0;
    this.dtAvg = 1 / 60;
    this.running = false;
    this.disposed = false;
    this.mouse = null;
    this.resumeAfterContextRestore = false;

    // 触屏 / 小屏降一档：像素比、阴影图、抗锯齿采样都减半
    const lite = window.matchMedia('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 700;
    const quality = scene?.quality ?? {};
    this.devicePrCap = Math.min(window.devicePixelRatio || 1, lite ? 2 : 1.5);
    this.prCap = Math.min(this.devicePrCap, quality.pixelRatio ?? Infinity);
    this.prLimit = Infinity;   // 帧率撑不住时，adapt() 往下压
    this.pr = this.prCap;
    this.defaultShadowSize = lite ? 1024 : 2048;
    this.shadowMapSize = quality.shadowMapSize ?? this.defaultShadowSize;
    this.shadowTexel = SHADOW_SPAN / this.shadowMapSize;

    // Let the browser choose the available adapter. Forcing "high-performance"
    // can fail in sandboxed/virtualized Chrome where only the default adapter works.
    const r = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    r.setPixelRatio(this.pr);
    r.outputColorSpace = THREE.LinearSRGBColorSpace;
    r.setClearColor(0xffffff, 1);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    this.renderer = r;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 2, 900);
    this.rig = new Rig(this.camera);
    this.flight = new Flight();
    this.baker = new TerrainBaker(r);

    this.sun = new THREE.DirectionalLight(0xfff2dc, 2.3);
    this.sun.castShadow = true;
    const sc = this.sun.shadow;
    sc.mapSize.set(this.shadowMapSize, this.shadowMapSize);
    const half = SHADOW_SPAN / 2;
    Object.assign(sc.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 500 });
    sc.camera.updateProjectionMatrix();
    sc.bias = -0.0005;
    sc.normalBias = 0.05;
    sc.radius = 2.2;
    this.scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xe8f0ff, 0x9fbf7a, 1.5);
    this.scene.add(this.hemi);

    this.holder = new THREE.Group();
    this.airplane = createAirplane({ scale: 6.4 / 2.04 });
    this.airplane.group.scale.multiplyScalar(scene?.planeScale ?? 1);
    this.airplane.group.rotation.y = Math.PI;
    this.holder.add(this.airplane.group);
    this.scene.add(this.holder);

    this.rt = new THREE.WebGLRenderTarget(2, 2, {
      samples: lite ? 2 : 4,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: true,
      depthBuffer: true,
    });
    this.rt.texture.colorSpace = THREE.NoColorSpace;
    this.buildComposite();

    this.ndc = new THREE.Vector2();
    this.onMove = (e) => {
      if (e.pointerType === 'mouse') this.mouse = { x: e.offsetX, y: e.offsetY };
    };
    this.onLeave = () => { this.mouse = null; };
    this.onDown = (e) => {
      if (e.pointerType === 'mouse' && e.button === 0) this.flight.roll(1);
    };
    this.onContextLost = (e) => {
      e.preventDefault();
      this.resumeAfterContextRestore = this.running;
      this.stop();
      this.onLost?.();
    };
    this.onContextRestored = () => {
      if (this.disposed) return;
      this.frames = 0;
      if (this.resumeAfterContextRestore) this.start();
      this.resumeAfterContextRestore = false;
    };
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerleave', this.onLeave);
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
    this.loop = () => this.tick();
    this.applyScene(scene ?? coast);
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.clock.getDelta();
    this.renderer.setAnimationLoop(this.loop);
  }

  stop() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  buildComposite() {
    this.compScene = new THREE.Scene();
    this.compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.cu = {
      tScene: { value: this.rt.texture },
      uRes: { value: new THREE.Vector2(1, 1) },
      uCenter: { value: new THREE.Vector2() },
      uHalf: { value: new THREE.Vector2(1, 1) },
      uRtHalf: { value: new THREE.Vector2(1, 1) },
      uRtSize: { value: new THREE.Vector2(1, 1) },
      uPaper: { value: new THREE.Color('#ffffff') },
      uGlow: { value: new THREE.Color('#fff1cf') },
      uSat: { value: 1.05 },
      uBloom: { value: 1 },
      uWarm: { value: 1 },
    };
    this.compMat = new THREE.ShaderMaterial({ vertexShader: COMPOSITE_VERT, fragmentShader: COMPOSITE_FRAG, uniforms: this.cu, depthTest: false, depthWrite: false });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.compMat);
    quad.frustumCulled = false;
    this.compScene.add(quad);
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    // 画布总像素不超过 ~2.2M：大画布按 1.5 倍，小画布（手机）可以更清晰
    this.pr = Math.max(MIN_PR, Math.min(this.prCap, this.prLimit, Math.sqrt(PIXEL_BUDGET / (w * h))));
    const pr = this.pr;
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    const hx = w * (0.5 - INSET.x);
    const hy = h * (0.5 - INSET.y);
    this.art = { cx: w / 2, cy: h / 2, hx, hy };
    const sw = Math.max(2, Math.round(2 * hx * MARGIN * pr));
    const sh = Math.max(2, Math.round(2 * hy * MARGIN * pr));
    this.rt.setSize(sw, sh);
    this.rig.setFrame(hx / hy, MARGIN);
    this.cu.uRes.value.set(w * pr, h * pr);
    this.cu.uCenter.value.set(w * 0.5 * pr, h * 0.5 * pr);
    this.cu.uHalf.value.set(hx * pr, hy * pr);
    this.cu.uRtHalf.value.set(hx * MARGIN * pr, hy * MARGIN * pr);
    this.cu.uRtSize.value.set(sw, sh);
    this.applyFog();
  }

  /** 雾按镜头距离算，镜头拉远多少，雾的远近就跟着放大多少 */
  applyFog() {
    const f = this.cfg?.fog;
    if (!f) return;
    shared.uFogNear.value = f.near * this.rig.zoom;
    shared.uFogFar.value = f.far * this.rig.zoom;
  }

  applyScene(cfg) {
    if (this.world) {
      this.scene.remove(this.world.group);
      this.world.dispose();
    }
    this.cfg = cfg;
    this.prCap = Math.min(this.devicePrCap, cfg.quality?.pixelRatio ?? Infinity);
    this.prLimit = Infinity;
    const shadowMapSize = cfg.quality?.shadowMapSize ?? this.defaultShadowSize;
    if (shadowMapSize !== this.shadowMapSize) {
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
      this.shadowMapSize = shadowMapSize;
      this.sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
      this.shadowTexel = SHADOW_SPAN / shadowMapSize;
    }
    this.world = new World(cfg, this.baker);
    this.scene.add(this.world.group);
    this.applyFog();
    this.rig.pitch = THREE.MathUtils.degToRad(cfg.cameraPitch ?? 52);
    this.rig.setFrame(this.camera.aspect, MARGIN);
    this.airplane.group.scale.setScalar((6.4 / 2.04) * (cfg.planeScale ?? 1));
    this.hemi.groundColor.set(cfg.hemiGround ?? '#9fbf7a');
    this.sun.color.set(cfg.sunLight ?? '#fff2dc');
    this.cu.uGlow.value.set(cfg.grade?.glow ?? '#fff1cf');
    this.cu.uSat.value = cfg.grade?.sat ?? 1.05;
    this.cu.uBloom.value = cfg.grade?.bloom ?? 1;
    this.cu.uWarm.value = cfg.grade?.warm ?? 1;
    // 对准群岛入口的小岛群，而非对齐单个岛屿，切换时首屏能同时看到不同大小的岛。
    if (cfg.id === 'island') this.rig.fz = wrapNear(cfg.focusZ ?? 0, this.rig.fz);
    if (cfg.id === 'alpine') this.rig.fz = wrapNear(cfg.focusZ ?? 0, this.rig.fz);
    this.flight.setProfile(cfg.flightProfile);
    this.flight.reset(this.rig.fx, this.rig.fz);
    this.stats = this.world.stats;
    this.resize();
  }

  /** 鼠标在纸面内才接管飞机；返回相机 NDC，否则 null */
  mouseNdc() {
    const m = this.mouse;
    const a = this.art;
    if (!m || Math.abs(m.x - a.cx) > a.hx || Math.abs(m.y - a.cy) > a.hy) return null;
    return this.ndc.set((m.x - a.cx) / (a.hx * MARGIN), -(m.y - a.cy) / (a.hy * MARGIN));
  }

  updateSun() {
    const t = new THREE.Vector3(this.rig.fx, 0, this.rig.fz - 10);
    const r = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), SUN_DIR).normalize();
    const u = new THREE.Vector3().crossVectors(SUN_DIR, r);
    const texel = this.shadowTexel;
    const a = t.dot(r), b = t.dot(u);
    t.addScaledVector(r, Math.round(a / texel) * texel - a).addScaledVector(u, Math.round(b / texel) * texel - b);
    this.sun.target.position.copy(t);
    this.sun.position.copy(t).addScaledVector(SUN_DIR, 220);
    this.sun.target.updateMatrixWorld();
  }

  /** 持续跑不到 28fps 就把像素比降一档（下限 0.75），弱显卡上也不卡 */
  adapt(dt) {
    this.dtAvg += (dt - this.dtAvg) * 0.05;
    if (this.frames < 180 || this.frames % 90 !== 0) return;
    if (this.dtAvg > 0.036 && this.pr > MIN_PR) {
      this.prLimit = Math.max(MIN_PR, this.pr - 0.25);
      this.resize();
      this.dtAvg = 1 / 60;
    }
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    this.frames++;

    if (this.rig.fz < -LOOP / 2) {
      this.rig.fz += LOOP;
      this.flight.shift(LOOP);
      this.world.shift(LOOP);
    }
    this.rig.update(dt, this.flight.x);
    this.flight.update(dt, this.rig, this.mouseNdc(), this.camera);
    this.flight.apply(this.holder);
    this.airplane.update(dt);
    this.world.update(dt, this.time, this.rig);
    shared.uTime.value = this.time;
    shared.uWindT.value = (this.time * 4.5) % LOOP;
    this.updateSun();

    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.compScene, this.compCam);

    this.adapt(dt);
    if (this.frames === 2) this.onFirstFrame?.();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    const c = this.canvas;
    c.removeEventListener('pointermove', this.onMove);
    c.removeEventListener('pointerleave', this.onLeave);
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('webglcontextlost', this.onContextLost);
    c.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.ro.disconnect();
    this.world.dispose();
    this.baker.dispose();
    this.holder.traverse((o) => {
      o.geometry?.dispose();
      for (const m of [].concat(o.material ?? [])) m.dispose();
    });
    this.sun.shadow.map?.dispose();
    this.rt.dispose();
    this.compMat.dispose();
    this.compScene.traverse((o) => o.geometry?.dispose());
    this.renderer.dispose();
  }
}

export function createWindFields(canvas, opts) {
  return new WindFields(canvas, opts);
}
