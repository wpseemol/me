import * as THREE from "three";
import {
  FLIP_SHEETS,
  LEFT_ENDPAPER,
  RIGHT_BASE,
  meta,
  profile,
  type FlipSheet,
} from "./skillsData";
import {
  createPageCanvas,
  createPageEdgeCanvas,
  createPlainPageCanvas,
} from "./pageTextures";
import { asset } from "@/lib/asset";

const PAGE_W = 1.55;
const PAGE_H = 2.05;
const COVER_T = 0.04;
const BLOCK_T = 0.28;

export type SkillBookHandle = {
  setProgress: (t: number) => void;
  resize: (w: number, h: number) => void;
  dispose: () => void;
  getLabel: (t: number) => string;
};

type Leaf = {
  pivot: THREE.Group;
  sheet: FlipSheet;
};

/**
 * Real hardcover volume in Three.js.
 * Progress 0 → closed (Hobbit pose), open → page flips → closed again.
 */
export async function createSkillBook3D(
  canvas: HTMLCanvasElement,
): Promise<SkillBookHandle> {
  const dark = document.documentElement.classList.contains("dark");
  const width = canvas.clientWidth || 800;
  const height = canvas.clientHeight || 600;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 40);
  camera.position.set(0, 0.35, 6.4);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, dark ? 0.55 : 0.7));
  const key = new THREE.DirectionalLight(0xffffff, dark ? 1.1 : 1.35);
  key.position.set(3.2, 5.5, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9ec5ff, 0.35);
  fill.position.set(-4, 2, 2);
  scene.add(fill);

  // Ground shadow catcher
  const shadowMat = new THREE.ShadowMaterial({ opacity: dark ? 0.55 : 0.4 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), shadowMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -PAGE_H / 2 - 0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  const book = new THREE.Group();
  scene.add(book);

  const loader = new THREE.TextureLoader();
  const coverMap = await loader.loadAsync(asset("/images/skill-book-cover.jpg"));
  coverMap.colorSpace = THREE.SRGBColorSpace;
  coverMap.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const edgeMap = canvasTexture(createPageEdgeCanvas(dark));
  edgeMap.wrapS = edgeMap.wrapT = THREE.ClampToEdgeWrapping;

  const boardColor = dark ? 0x071640 : 0x0c2e8a;

  // —— Back cover (fixed)
  const backCover = makeBoard(PAGE_W, PAGE_H, COVER_T, boardColor);
  backCover.position.set(PAGE_W / 2, 0, -BLOCK_T - COVER_T / 2);
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  book.add(backCover);

  // —— Spine
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(COVER_T * 1.2, PAGE_H, BLOCK_T + COVER_T * 2),
    new THREE.MeshStandardMaterial({
      color: boardColor,
      roughness: 0.72,
      metalness: 0.08,
    }),
  );
  spine.position.set(0, 0, -BLOCK_T / 2 - COVER_T / 2);
  spine.castShadow = true;
  book.add(spine);

  // —— Page block (visible when closed)
  const blockGeo = new THREE.BoxGeometry(PAGE_W * 0.98, PAGE_H * 0.97, BLOCK_T);
  const blockMat = [
    new THREE.MeshStandardMaterial({ map: edgeMap, roughness: 0.9 }), // +x fore-edge
    new THREE.MeshStandardMaterial({ color: boardColor, roughness: 0.8 }), // -x
    new THREE.MeshStandardMaterial({ map: edgeMap, roughness: 0.9 }), // +y head
    new THREE.MeshStandardMaterial({ map: edgeMap, roughness: 0.9 }), // -y
    new THREE.MeshStandardMaterial({
      color: dark ? 0x171f30 : 0xf3efe6,
      roughness: 0.95,
    }), // +z
    new THREE.MeshStandardMaterial({
      color: dark ? 0x0d1320 : 0xebe4d8,
      roughness: 0.95,
    }), // -z
  ];
  // Remap edge texture orientation for top/bottom roughly
  const pageBlock = new THREE.Mesh(blockGeo, blockMat);
  pageBlock.position.set(PAGE_W / 2 + 0.01, 0, -BLOCK_T / 2 - COVER_T / 2);
  pageBlock.castShadow = true;
  pageBlock.receiveShadow = true;
  book.add(pageBlock);

  // Left endpaper (visible when open)
  const leftPivot = new THREE.Group();
  const leftPage = makePageMesh(
    createPlainPageCanvas(
      LEFT_ENDPAPER.eyebrow,
      meta.leftLeafTitle,
      LEFT_ENDPAPER.body,
      dark,
    ),
  );
  leftPage.position.set(-PAGE_W / 2, 0, -0.002);
  leftPivot.add(leftPage);
  book.add(leftPivot);

  // Right base endpaper
  const rightBase = makePageMesh(
    createPlainPageCanvas(
      RIGHT_BASE.eyebrow,
      RIGHT_BASE.title,
      RIGHT_BASE.body,
      dark,
    ),
  );
  rightBase.position.set(PAGE_W / 2, 0, -0.004);
  book.add(rightBase);

  // —— Flip leaves (hinged at spine x=0)
  const leaves: Leaf[] = [];
  FLIP_SHEETS.forEach((sheet, i) => {
    const pivot = new THREE.Group();
    pivot.position.set(0, 0, 0);

    const front = makePageMesh(createPageCanvas(sheet.front, dark, false));
    front.position.set(PAGE_W / 2, 0, 0.002 + i * 0.0015);

    const back = makePageMesh(createPageCanvas(sheet.back, dark, true));
    // Back face sits on reverse of leaf
    back.rotation.y = Math.PI;
    back.position.set(PAGE_W / 2, 0, -0.002 - i * 0.0015);

    pivot.add(front, back);
    pivot.rotation.y = 0;
    book.add(pivot);
    leaves.push({ pivot, sheet });
  });

  // —— Front cover (hinged at spine)
  const coverPivot = new THREE.Group();
  coverPivot.position.set(0, 0, COVER_T / 2);
  book.add(coverPivot);

  const coverFrontMat = new THREE.MeshStandardMaterial({
    map: coverMap,
    roughness: 0.55,
    metalness: 0.12,
  });
  const coverInsideMat = new THREE.MeshStandardMaterial({
    color: boardColor,
    roughness: 0.65,
    metalness: 0.05,
  });
  // Inside cover text
  const insideTex = canvasTexture(
    createPlainPageCanvas("Inside cover", meta.insideCover, `@${profile.handle}`, dark),
  );
  const coverInsidePage = new THREE.MeshStandardMaterial({
    map: insideTex,
    roughness: 0.85,
  });

  const coverGeo = new THREE.BoxGeometry(PAGE_W, PAGE_H, COVER_T);
  const coverMesh = new THREE.Mesh(coverGeo, [
    new THREE.MeshStandardMaterial({ color: boardColor, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: boardColor, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: boardColor, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: boardColor, roughness: 0.7 }),
    coverFrontMat, // +z outside when closed facing camera
    coverInsidePage, // -z inside
  ]);
  coverMesh.position.set(PAGE_W / 2, 0, 0);
  coverMesh.castShadow = true;
  coverMesh.receiveShadow = true;
  coverPivot.add(coverMesh);

  // Hinge groove accent
  const groove = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, PAGE_H * 0.92, COVER_T + 0.002),
    new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.85 }),
  );
  groove.position.set(0.02, 0, 0);
  coverPivot.add(groove);

  // Ribbon bookmark
  const ribbon = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.55, 0.008),
    new THREE.MeshStandardMaterial({
      color: 0xc41e3a,
      roughness: 0.7,
      metalness: 0.05,
    }),
  );
  ribbon.position.set(PAGE_W * 0.28, -PAGE_H / 2 - 0.12, -BLOCK_T * 0.35);
  ribbon.castShadow = true;
  book.add(ribbon);

  void coverInsideMat;

  let progress = 0;

  // Closed pose — three-quarter table view like a real hardcover
  const closed = {
    bookRX: THREE.MathUtils.degToRad(28),
    bookRY: THREE.MathUtils.degToRad(-38),
    bookRZ: THREE.MathUtils.degToRad(-4),
    bookY: -0.05,
    coverY: THREE.MathUtils.degToRad(-14), // ajar
    camZ: 5.8,
    camY: 0.85,
  };
  const open = {
    bookRX: THREE.MathUtils.degToRad(6),
    bookRY: 0,
    bookRZ: 0,
    bookY: 0,
    coverY: THREE.MathUtils.degToRad(-172),
    camZ: 5.4,
    camY: 0.12,
  };

  const n = leaves.length;

  const setProgress = (raw: number) => {
    const t = THREE.MathUtils.clamp(raw, 0, 1);
    progress = t;

    // Segments:
    // 0.00–0.08 hold closed
    // 0.08–0.26 open cover + face camera
    // 0.26–0.78 page turns
    // 0.78–1.00 close cover + return to closed pose
    let coverAngle = closed.coverY;
    let bookRX = closed.bookRX;
    let bookRY = closed.bookRY;
    let bookRZ = closed.bookRZ;
    let bookY = closed.bookY;
    let camZ = closed.camZ;
    let camY = closed.camY;
    let blockVis = 1;
    let ribbonVis = 1;

    const leafAngles = new Array(n).fill(0) as number[];

    if (t <= 0.08) {
      // closed hold
    } else if (t < 0.26) {
      const u = smooth((t - 0.08) / 0.18);
      coverAngle = lerp(closed.coverY, open.coverY, u);
      bookRX = lerp(closed.bookRX, open.bookRX, u);
      bookRY = lerp(closed.bookRY, open.bookRY, u);
      bookRZ = lerp(closed.bookRZ, open.bookRZ, u);
      bookY = lerp(closed.bookY, open.bookY, u);
      camZ = lerp(closed.camZ, open.camZ, u);
      camY = lerp(closed.camY, open.camY, u);
      blockVis = 1 - u;
      ribbonVis = 1 - u;
    } else if (t < 0.78) {
      coverAngle = open.coverY;
      bookRX = open.bookRX;
      bookRY = open.bookRY;
      bookRZ = open.bookRZ;
      bookY = open.bookY;
      camZ = open.camZ;
      camY = open.camY;
      blockVis = 0;
      ribbonVis = 0;

      const turnT = (t - 0.26) / 0.52;
      const per = 1 / n;
      for (let i = 0; i < n; i++) {
        const local = THREE.MathUtils.clamp((turnT - i * per) / (per * 0.85), 0, 1);
        leafAngles[i] = -Math.PI * gravity(local);
      }
    } else {
      // close again
      const u = smooth((t - 0.78) / 0.22);
      // Pages fold back under cover while closing
      for (let i = 0; i < n; i++) {
        leafAngles[i] = lerp(-Math.PI, 0, Math.min(1, u * 1.35));
      }
      coverAngle = lerp(open.coverY, closed.coverY, u);
      bookRX = lerp(open.bookRX, closed.bookRX, u);
      bookRY = lerp(open.bookRY, closed.bookRY, u);
      bookRZ = lerp(open.bookRZ, closed.bookRZ, u);
      bookY = lerp(open.bookY, closed.bookY, u);
      camZ = lerp(open.camZ, closed.camZ, u);
      camY = lerp(open.camY, closed.camY, u);
      blockVis = u;
      ribbonVis = Math.max(0, (u - 0.35) / 0.65);
    }

    coverPivot.rotation.y = coverAngle;
    book.rotation.set(bookRX, bookRY, bookRZ);
    book.position.y = bookY;
    camera.position.set(0, camY, camZ);
    camera.lookAt(0, bookY * 0.3, -0.2);

    pageBlock.visible = blockVis > 0.05;
    pageBlock.scale.set(1, 1, Math.max(0.15, blockVis));
    ribbon.visible = ribbonVis > 0.05;
    ribbon.material.opacity = ribbonVis;
    (ribbon.material as THREE.MeshStandardMaterial).transparent = true;

    const pagesLive = blockVis < 0.85;
    leftPivot.visible = pagesLive;
    rightBase.visible = pagesLive;

    leaves.forEach((leaf, i) => {
      leaf.pivot.visible = pagesLive;
      leaf.pivot.rotation.y = leafAngles[i]!;
      const a = Math.abs(leafAngles[i]!);
      const mid = Math.sin(a);
      leaf.pivot.position.z = mid * 0.1;
      const turned = leafAngles[i]! < -Math.PI / 2;
      leaf.pivot.renderOrder = turned ? i : n - i;
    });

    coverPivot.position.z = COVER_T / 2 + 0.02;
    coverPivot.renderOrder = n + 5;
    // Keep hardcover volume readable when closed
    backCover.visible = blockVis > 0.2;
    spine.visible = true;

    renderer.render(scene, camera);
  };

  setProgress(0);

  const getLabel = (raw: number) => {
    const t = THREE.MathUtils.clamp(raw, 0, 1);
    if (t < 0.08) return "Closed · Skill book";
    if (t < 0.26) return "Opening…";
    if (t >= 0.78) return t > 0.92 ? "Closed · Skill book" : "Closing…";
    const turnT = (t - 0.26) / 0.52;
    const idx = Math.min(n - 1, Math.max(0, Math.floor(turnT * n)));
    const sheet = FLIP_SHEETS[idx];
    if (!sheet) return "Turning page…";
    if (sheet.front.kind === "intro") return meta.introTitle;
    if (sheet.front.kind === "skill") return sheet.front.skill.name;
    return "Turning page…";
  };

  return {
    setProgress,
    getLabel,
    resize: (w, h) => {
      if (w < 2 || h < 2) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      setProgress(progress);
    },
    dispose: () => {
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          mats.forEach((m) => {
            Object.values(m).forEach((v) => {
              if (v instanceof THREE.Texture) v.dispose();
            });
            m.dispose();
          });
        }
      });
    },
  };
}

function makeBoard(w: number, h: number, t: number, color: number) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, t),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.08,
    }),
  );
  return mesh;
}

function makePageMesh(source: HTMLCanvasElement) {
  const map = canvasTexture(source);
  const mat = new THREE.MeshStandardMaterial({
    map,
    roughness: 0.92,
    metalness: 0,
    side: THREE.FrontSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PAGE_W, PAGE_H), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function canvasTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smooth(t: number) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Gravity page-turn curve */
function gravity(t: number) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
