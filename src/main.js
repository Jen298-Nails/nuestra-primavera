import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const ASSET_JEN = "./src/assets/jenifer.png";
const ASSET_ANG = "./src/assets/angel.png";

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.setClearColor(0x050816, 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b1b3a, 0.035);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 260);
camera.position.set(0, 2.1, 6);

const clock = new THREE.Clock();

// Lights
const hemi = new THREE.HemisphereLight(0xfff1d6, 0x24405f, 0.9);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xfff1c2, 1.15);
key.position.set(3.5, 7, 2);
scene.add(key);

const rim = new THREE.DirectionalLight(0x7aa6ff, 0.55);
rim.position.set(-6, 5, -4);
scene.add(rim);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(220, 220),
  new THREE.MeshStandardMaterial({ color: 0x1e7b5a, roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
scene.add(ground);

// Bushes placeholder (toon)
const bushMat = new THREE.MeshToonMaterial({ color: 0x2bb673 });
for (let i = 0; i < 90; i++) {
  const geo = new THREE.ConeGeometry(0.15 + Math.random() * 0.55, 0.2 + Math.random() * 1.2, 6);
  const m = new THREE.Mesh(geo, bushMat);
  const x = (Math.random() - 0.5) * 160;
  const z = (Math.random() - 0.5) * 160;
  m.position.set(x, 0, z);
  m.rotation.y = Math.random() * Math.PI;
  scene.add(m);
}

// Pollen particles
const pollenCount = 1300;
const positions = new Float32Array(pollenCount * 3);
for (let i = 0; i < pollenCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 70;
  positions[i * 3 + 1] = Math.random() * 6 + 0.3;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 70;
}
const pollenGeo = new THREE.BufferGeometry();
pollenGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const pollenMat = new THREE.PointsMaterial({
  color: 0xfff3c4,
  size: 0.028,
  transparent: true,
  opacity: 0.75
});
const pollen = new THREE.Points(pollenGeo, pollenMat);
pollen.position.set(0, 0.1, 0);
scene.add(pollen);

// Character (plane with toon texture)
function makeCharacter(texUrl) {
  const group = new THREE.Group();
  const tex = new THREE.TextureLoader().load(texUrl);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshToonMaterial({
    map: tex,
    transparent: true,
    opacity: 1
  });

  const geo = new THREE.PlaneGeometry(1.0, 1.9, 1, 1);
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  group.userData.mesh = mesh;
  group.userData.walkPhase = 0;
  return group;
}

const jen = makeCharacter(ASSET_JEN);
jen.position.set(0, 0, -2);
jen.scale.set(1.15, 1.15, 1.15);
scene.add(jen);

const angel = makeCharacter(ASSET_ANG);
angel.position.set(2.1, 0, -1.3);
angel.visible = false;
angel.scale.set(1.15, 1.15, 1.15);
scene.add(angel);

// HUD timeline
const hud = {
  t1: document.getElementById("t1"),
  t2: document.getElementById("t2"),
  t3: document.getElementById("t3"),
  t4: document.getElementById("t4"),
  hint: document.getElementById("hint"),
};

const show = (el, ms) => setTimeout(() => el.classList.add("show"), ms);
show(hud.t1, 500);
show(hud.t2, 1000);
show(hud.t3, 1500);
show(hud.t4, 38000);
setTimeout(() => { hud.hint.textContent = "Listo. ¡Disfruta la primavera!"; }, 1200);

function smoothDamp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function updateWalk(character, dt, speed = 1.0) {
  character.userData.walkPhase += dt * speed * 2.6;
  const p = character.userData.walkPhase;

  const bounce = Math.abs(Math.sin(p)) * 0.065;
  const tiltZ = Math.sin(p) * 0.04;
  const swayY = -0.08 + Math.sin(p * 0.5) * 0.035;

  character.position.y = bounce;
  character.rotation.z = tiltZ;
  character.rotation.y = swayY;

  const sx = 1 + Math.sin(p) * 0.02;
  const sy = 1 - Math.sin(p) * 0.015;
  character.scale.set(1.15 * sx, 1.15 * sy, 1.15);

  const mesh = character.userData.mesh;
  if (mesh) {
    mesh.rotation.y = Math.sin(p) * 0.04;
    mesh.rotation.x = -0.02 + Math.abs(Math.sin(p * 0.5)) * 0.02;
  }
}

const targetOffset = new THREE.Vector3(0, 1.25, 2.65);

function animate() {
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  pollen.rotation.y += dt * 0.07;
  pollen.position.y = 0.1 + Math.sin(t * 0.7) * 0.05;

  const travel = Math.min(2.05, t * 0.08);
  jen.position.z = -2 + travel;
  updateWalk(jen, dt, 0.95);

  const camTarget = jen.position.clone().add(targetOffset);
  camera.position.x = smoothDamp(camera.position.x, camTarget.x, 4.5, dt);
  camera.position.y = smoothDamp(camera.position.y, camTarget.y, 4.5, dt);
  camera.position.z = smoothDamp(camera.position.z, camTarget.z, 4.5, dt);
  camera.lookAt(jen.position.x, jen.position.y + 0.65, jen.position.z - 0.25);

  if (t > 28) {
    angel.visible = true;
    const enterT = Math.min(1, (t - 28) / 4);

    angel.position.x = 2.1 + (1.6 * enterT);
    angel.position.y = 0.0 + Math.abs(Math.sin(t * 2.2)) * 0.04;
    angel.position.z = -1.3 + (0.2 * enterT);

    angel.rotation.y = Math.sin(t * 0.9) * 0.08;
    const ap = (t - 28) * 1.6;
    angel.rotation.z = Math.sin(ap) * 0.02;
    
