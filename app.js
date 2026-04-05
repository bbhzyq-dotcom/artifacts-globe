import * as THREE from "./three.module.js";
import { OrbitControls } from "./OrbitControls.js";

const container = document.getElementById("three-container");
const countryListEl = document.getElementById("country-list");
const yearEl = document.getElementById("timeline-year");
const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));
const playButton = document.getElementById("play-timeline");
const searchInput = document.getElementById("search-input");
const sortButtons = Array.from(document.querySelectorAll(".sort-btn"));

const detailPanel = document.getElementById("detail-panel");
const closeDetail = document.getElementById("close-detail");
const detailImage = document.getElementById("detail-image");
const detailTitle = document.getElementById("detail-title");
const detailCountry = document.getElementById("detail-country");
const detailYear = document.getElementById("detail-year");
const detailDesc = document.getElementById("detail-desc");
const detailLink = document.getElementById("detail-link");

let searchKeyword = "";
let sortBy = "year";

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0c1621, 8, 18);

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const camera = new THREE.PerspectiveCamera(isMobile ? 60 : 52, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, isMobile ? 1.0 : 1.2, isMobile ? 4 : 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = isMobile ? 2 : 2.4;
controls.maxDistance = isMobile ? 7 : 9;
controls.enablePan = !isMobile;
controls.enableZoom = true;
controls.autoRotate = isMobile;

scene.add(new THREE.HemisphereLight(0xe8f3ff, 0x2a1b11, 0.9));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
dirLight.position.set(2.5, 2.8, 2.2);
scene.add(dirLight);

const globeRadius = 1.25;
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = "anonymous";
// 地球纹理贴图 - 使用更简单的SVG格式
const earthTexture = textureLoader.load(
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1024' height='512' viewBox='0 0 1024 512'%3E%3Crect width='1024' height='512' fill='%23274364'/%3E%3Cpath d='M200 150 L300 120 L400 140 L500 100 L600 130 L700 110 L800 140' fill='none' stroke='%233a5a7a' stroke-width='3'/%3E%3Cpath d='M200 350 L300 380 L400 360 L500 400 L600 370 L700 390 L800 360' fill='none' stroke='%233a5a7a' stroke-width='3'/%3E%3Cpath d='M150 250 L250 220 L350 240 L450 210 L550 230 L650 210 L750 230 L850 250' fill='none' stroke='%233a5a7a' stroke-width='3'/%3E%3Ccircle cx='512' cy='256' r='50' fill='none' stroke='%233a5a7a' stroke-width='2'/%3E%3Ccircle cx='512' cy='256' r='100' fill='none' stroke='%233a5a7a' stroke-width='2'/%3E%3Ccircle cx='512' cy='256' r='150' fill='none' stroke='%233a5a7a' stroke-width='2'/%3E%3C/svg%3E",
  () => {
    console.log('地球纹理加载成功');
  },
  undefined,
  () => {
    console.log('地球纹理加载失败');
  }
);
earthTexture.colorSpace = THREE.SRGBColorSpace;

const globe = new THREE.Mesh(
  new THREE.SphereGeometry(globeRadius, 72, 72),
  new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.7,
    metalness: 0.08,
    emissive: 0x06121f,
    emissiveIntensity: 0.22
  })
);
scene.add(globe);

const globeGrid = new THREE.Mesh(
  new THREE.SphereGeometry(globeRadius * 1.002, 48, 48),
  new THREE.MeshBasicMaterial({ color: 0x4f7398, wireframe: true, opacity: 0.16, transparent: true })
);
scene.add(globeGrid);

const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(globeRadius * 1.015, 72, 72),
  new THREE.MeshBasicMaterial({
    color: 0xf0f8ff,
    transparent: true,
    opacity: 0.15
  })
);
scene.add(clouds);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(globeRadius * 1.05, 72, 72),
  new THREE.MeshBasicMaterial({
    color: 0x4a90e2,
    transparent: true,
    opacity: 0.1
  })
);
scene.add(atmosphere);

const particleGroup = new THREE.Group();
scene.add(particleGroup);

const artifactGroup = new THREE.Group();
scene.add(artifactGroup);

const london = { lat: 51.5072, lon: -0.1276 };
const londonVector = latLonToVector3(london.lat, london.lon, globeRadius * 1.01);
const londonMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.03, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xff8e5c })
);
londonMarker.position.copy(londonVector);
scene.add(londonMarker);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickableCards = [];

let allArtifacts = [];
let visibleCountry = "ALL";
let mode = "scattered";
let timelineRunning = false;

fetch("./data/artifacts.json")
  .then((res) => res.json())
  .then((data) => {
    allArtifacts = data.sort((a, b) => a.acquisitionYear - b.acquisitionYear);
    buildCountryList(allArtifacts);
    buildArtifacts(allArtifacts);
    setMode("scattered");
  })
  .catch((err) => {
    yearEl.textContent = "数据加载失败";
    console.error(err);
  });

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setMode(btn.dataset.mode);
    timelineRunning = false;
  });
});

playButton.addEventListener("click", () => {
  if (!allArtifacts.length) {
    return;
  }
  setMode("homecoming");
  startTimeline();
});

closeDetail.addEventListener("click", () => {
  detailPanel.classList.add("hidden");
});

searchInput.addEventListener("input", (e) => {
  searchKeyword = e.target.value.toLowerCase();
  applyFilters();
});

sortButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    sortBy = btn.dataset.sort;
    sortButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    applyFilters();
  });
});

window.addEventListener("pointerdown", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickableCards, false);
  if (hits.length > 0) {
    const artifact = hits[0].object.userData.artifact;
    showArtifactDetail(artifact);
  }
});

window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

const clock = new THREE.Clock();
const frustum = new THREE.Frustum();
const cameraMatrix = new THREE.Matrix4();
const box = new THREE.Box3();

function animate() {
  const elapsed = clock.getElapsedTime();
  const dt = clock.getDelta();

  globe.rotation.y += dt * 0.07;
  globeGrid.rotation.y += dt * 0.1;
  clouds.rotation.y += dt * 0.05;
  atmosphere.rotation.y += dt * 0.03;
  controls.update();

  // 计算视锥体
  camera.updateMatrixWorld();
  cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(cameraMatrix);

  for (const artifact of allArtifacts) {
    if (!artifact.runtime) continue;
    updateArtifactMotion(artifact, elapsed, frustum, box);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

function buildCountryList(data) {
  const counts = data.reduce((acc, item) => {
    acc[item.originCountry] = (acc[item.originCountry] || 0) + 1;
    return acc;
  }, {});

  const countries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const allCount = data.length;

  countryListEl.innerHTML = "";
  countryListEl.appendChild(createCountryButton("ALL", `全部`, allCount));
  countries.forEach(([country, count]) => {
    countryListEl.appendChild(createCountryButton(country, country, count));
  });
}

function createCountryButton(value, label, count) {
  const btn = document.createElement("button");
  btn.className = "country-item";
  if (value === visibleCountry) btn.classList.add("active");
  btn.innerHTML = `<span>${label}</span><strong>${count}</strong>`;
  btn.addEventListener("click", () => {
    visibleCountry = value;
    Array.from(countryListEl.children).forEach((item) => item.classList.remove("active"));
    btn.classList.add("active");
    applyFilters();
  });
  return btn;
}

function buildArtifacts(data) {
  data.forEach((item, index) => {
    const root = new THREE.Group();
    artifactGroup.add(root);

    const homePos = latLonToVector3(item.lat, item.lon, globeRadius + 0.06);
    const homeOut = homePos.clone().normalize();

    const startJitter = randomFromSeed(item.id) * Math.PI * 2;
    const scatteredPos = londonVector
      .clone()
      .add(new THREE.Vector3(Math.cos(startJitter), Math.sin(startJitter * 1.9), Math.sin(startJitter))
      .multiplyScalar(0.45 + (index % 4) * 0.08));

    const flatPos = latLonToFlat(item.lat, item.lon);

    const stemLine = buildLine([new THREE.Vector3(), homeOut.clone().multiplyScalar(0.25)], 0x7fb7ff, 0.6);
    root.add(stemLine);

    const cardWidth = 0.24;
    const cardHeight = 0.16;
    
    // 创建一个更明显的占位符，显示文物名称
    const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%232a3b4c'/%3E%3Crect x='20' y='20' width='600' height='440' fill='none' stroke='%23f0c677' stroke-width='2'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='20' fill='%23f0c677' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(item.title)}%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='16' fill='%23e8edf3' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(item.originCountry)}%3C/text%3E%3C/svg%3E`;
    
    // 创建占位图纹理
    const placeholderTex = textureLoader.load(placeholderImage);
    placeholderTex.colorSpace = THREE.SRGBColorSpace;
    
    // 创建卡片
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(cardWidth, cardHeight),
      new THREE.MeshBasicMaterial({ map: placeholderTex, transparent: true })
    );
    
    // 尝试加载实际图片
    const tex = textureLoader.load(
      item.image,
      (texture) => {
        // 图片加载成功，替换纹理
        texture.colorSpace = THREE.SRGBColorSpace;
        card.material.map = texture;
      },
      undefined,
      () => {
        // 图片加载失败，保持占位图
        console.log(`图片加载失败: ${item.image}`);
      }
    );
    card.position.copy(homeOut.clone().multiplyScalar(0.34));
    card.userData.artifact = item;
    clickableCards.push(card);
    root.add(card);

    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(cardWidth + 0.01, cardHeight + 0.01),
      new THREE.MeshBasicMaterial({ color: 0xe9d7aa })
    );
    frame.position.copy(card.position);
    frame.position.z -= 0.001;
    root.add(frame);

    const route = buildLine([londonVector.clone(), scatteredPos.clone()], 0xd9b26d, 0.45);
    scene.add(route);

    item.runtime = {
      root,
      card,
      frame,
      route,
      homePos,
      homeOut,
      scatteredPos,
      flatPos,
      currentPos: scatteredPos.clone(),
      targetPos: scatteredPos.clone(),
      visible: true,
      timelineDelay: index * 0.24,
      arrived: false
    };
  });

  buildParticles(data);
}

function setMode(nextMode) {
  mode = nextMode;
  modeButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.mode === mode));

  const showParticles = mode === "particles";
  particleGroup.visible = showParticles;
  artifactGroup.visible = !showParticles;

  if (showParticles) {
    yearEl.textContent = "Year: 粒子模式";
    return;
  }

  allArtifacts.forEach((item) => {
    if (!item.runtime) return;
    const runtime = item.runtime;
    runtime.arrived = false;
    if (mode === "homecoming" || mode === "standing") {
      runtime.targetPos = runtime.homePos.clone();
    } else if (mode === "flat") {
      runtime.targetPos = runtime.flatPos.clone();
    } else {
      runtime.targetPos = runtime.scatteredPos.clone();
    }
  });
}

function startTimeline() {
  timelineRunning = true;
  const start = performance.now();
  allArtifacts.forEach((item) => {
    item.runtime.arrived = false;
    item.runtime.targetPos = item.runtime.scatteredPos.clone();
  });

  function tick(now) {
    if (!timelineRunning) return;
    const t = (now - start) / 1000;

    let currentYear = allArtifacts[0].acquisitionYear;
    allArtifacts.forEach((item) => {
      const runtime = item.runtime;
      if (!runtime || !runtime.visible) return;
      if (t > runtime.timelineDelay) {
        runtime.targetPos = runtime.homePos.clone();
        runtime.arrived = true;
        currentYear = Math.max(currentYear, item.acquisitionYear);
      }
    });
    yearEl.textContent = `Year: ${currentYear}`;

    const maxDelay = allArtifacts.length * 0.24 + 1.2;
    if (t < maxDelay) {
      requestAnimationFrame(tick);
    } else {
      timelineRunning = false;
    }
  }

  requestAnimationFrame(tick);
}

function applyFilters() {
  // 排序
  let sortedArtifacts = [...allArtifacts];
  if (sortBy === "year") {
    sortedArtifacts.sort((a, b) => a.acquisitionYear - b.acquisitionYear);
  } else if (sortBy === "country") {
    sortedArtifacts.sort((a, b) => a.originCountry.localeCompare(b.originCountry));
  }

  // 应用过滤
  allArtifacts.forEach((item) => {
    const countryMatch = visibleCountry === "ALL" || item.originCountry === visibleCountry;
    const searchMatch = !searchKeyword || 
      item.title.toLowerCase().includes(searchKeyword) || 
      item.originCountry.toLowerCase().includes(searchKeyword) ||
      item.originCity.toLowerCase().includes(searchKeyword);
    const visible = countryMatch && searchMatch;
    
    item.runtime.visible = visible;
    item.runtime.root.visible = visible;
    item.runtime.route.visible = visible;
  });

  const matching = allArtifacts.filter((item) => item.runtime.visible);
  if (visibleCountry === "ALL" && !searchKeyword) {
    yearEl.textContent = `Year: -- (${matching.length})`;
  } else if (visibleCountry !== "ALL") {
    yearEl.textContent = `Year: ${visibleCountry} (${matching.length})`;
  } else {
    yearEl.textContent = `Year: 搜索结果 (${matching.length})`;
  }
}

function updateArtifactMotion(item, elapsed, frustum, box) {
  const runtime = item.runtime;
  if (!runtime.visible) return;

  const distance = runtime.currentPos.distanceTo(runtime.targetPos);
  if (distance > 0.01) {
    const easeFactor = Math.min(0.15, distance * 0.1);
    runtime.currentPos.lerp(runtime.targetPos, easeFactor);
    runtime.root.position.copy(runtime.currentPos);
  }

  if (mode === "flat") {
    runtime.root.lookAt(camera.position);
  } else {
    const normal = runtime.currentPos.clone().normalize();
    const lookAtTarget = runtime.currentPos.clone().add(normal);
    runtime.root.lookAt(lookAtTarget);
  }

  if (mode === "scattered") {
    runtime.root.rotation.z += Math.sin(elapsed * 1.2 + randomFromSeed(item.id)) * 0.001;
  } else if (mode === "homecoming" && !runtime.arrived) {
    runtime.root.rotation.z += Math.sin(elapsed * 2 + randomFromSeed(item.id)) * 0.02;
    const scale = 1 + Math.sin(elapsed * 3 + randomFromSeed(item.id)) * 0.1;
    runtime.root.scale.set(scale, scale, scale);
  } else {
    runtime.root.rotation.z = 0;
    runtime.root.scale.set(1, 1, 1);
  }

  runtime.route.geometry.setFromPoints([londonVector, runtime.currentPos]);
  runtime.route.material.opacity = Math.max(0.1, distance * 0.3);

  // 视锥体剔除
  box.setFromObject(runtime.root);
  const visible = frustum.intersectsBox(box);
  runtime.root.visible = visible && runtime.visible;
  runtime.route.visible = visible && runtime.visible;
}

function showArtifactDetail(item) {
  detailImage.src = item.image;
  detailTitle.textContent = item.title;
  detailCountry.textContent = `国家/地点：${item.originCountry} · ${item.originCity}`;
  detailYear.textContent = `入藏年份：${item.acquisitionYear}`;
  detailDesc.textContent = item.description;
  detailLink.href = item.source;
  detailPanel.classList.remove("hidden");
}

function buildParticles(data) {
  const points = [];
  data.forEach((item) => {
    points.push(latLonToVector3(item.lat, item.lon, globeRadius + 0.28));
  });

  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.PointsMaterial({ color: 0xf0c677, size: 0.04 });
  const cloud = new THREE.Points(geom, mat);
  particleGroup.add(cloud);
  particleGroup.visible = false;
}

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function latLonToFlat(lat, lon) {
  const x = (lon / 180) * 1.8;
  const z = (lat / 90) * 0.9;
  return new THREE.Vector3(x, 0.12, z);
}

function buildLine(points, color, opacity) {
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.Line(geom, mat);
}

function randomFromSeed(input) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(Math.sin(h));
}
