import ChartScene from "./lib/index.es.js";
import world from "./lib/world.json";
import * as THREE from "./three.module.js";

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

ChartScene.registerMap("world", world);

const globeRadius = 160;

const chart = ChartScene.init({
  dom: container,
  map: "world",
  autoRotate: true,
  rotateSpeed: 0.003,
  mode: "3d",
  config: {
    R: globeRadius,
    enableZoom: true,
    stopRotateByHover: true,
    earth: {
      color: "#13162c",
      material: "MeshPhongMaterial"
    },
    bgStyle: {
      color: "#040D21",
      opacity: 1,
    },
    mapStyle: {
      areaColor: "#2e3564",
      lineColor: "#4a5a9a",
    },
    spriteStyle: {
      color: "#4a90e2",
      show: true,
      size: 2.5,
    },
    pathStyle: {
      color: "#d9b26d",
      show: true,
    },
    flyLineStyle: {
      color: "#f0c677",
      duration: 2000,
    },
    scatterStyle: {
      color: "#f0c677",
      show: false,
    },
  },
});

const london = { lat: 51.5072, lon: -0.1276 };
const artifactGroup = new THREE.Group();
artifactGroup.name = "artifacts";
chart.mainContainer.add(artifactGroup);

const raycaster = new THREE.Raycaster();
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

container.addEventListener("pointerdown", onPointerDown);

function onPointerDown(event) {
  const rect = container.getBoundingClientRect();
  const pointer = new THREE.Vector2();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, chart.camera);
  const hits = raycaster.intersectObjects(clickableCards, false);
  if (hits.length > 0) {
    const artifact = hits[0].object.userData.artifact;
    showArtifactDetail(artifact);
  }
}

window.addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  chart.renderer.setSize(width, height);
  if (chart.camera.isPerspectiveCamera) {
    chart.camera.aspect = width / height;
    chart.camera.updateProjectionMatrix();
  }
});

const clock = new THREE.Clock();

function lon2xyz(R, longitude, latitude, offset = 1) {
  let lon = (longitude * Math.PI) / 180;
  let lat = (latitude * Math.PI) / 180;
  lon = -lon;
  const x = R * offset * Math.cos(lat) * Math.cos(lon);
  const y = R * offset * Math.sin(lat);
  const z = R * offset * Math.cos(lat) * Math.sin(lon);
  return new THREE.Vector3(x, y, z);
}

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

  const countryCoords = {};
  data.forEach(item => {
    if (!countryCoords[item.originCountry]) {
      countryCoords[item.originCountry] = { lat: item.lat, lon: item.lon };
    }
  });

  const markers = Object.entries(countryCoords).map(([country, coords]) => ({
    text: country,
    position: { lon: coords.lon, lat: coords.lat },
    style: {
      fontSize: 16,
      color: "#f0c677"
    }
  }));
  chart.setData("textMark", markers);
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
    focusOnCountry(value);
  });
  return btn;
}

function focusOnCountry(countryName) {
  if (countryName === "ALL") {
    chart.options.autoRotate = true;
    return;
  }
  chart.options.autoRotate = false;
  const artifacts = allArtifacts.filter(a => a.originCountry === countryName);
  if (artifacts.length > 0) {
    const centerLat = artifacts.reduce((sum, a) => sum + a.lat, 0) / artifacts.length;
    const centerLon = artifacts.reduce((sum, a) => sum + a.lon, 0) / artifacts.length;
    rotateToPosition(centerLat, centerLon);
  }
}

function rotateToPosition(lat, lon) {
  const targetRotationY = -(lon * Math.PI) / 180 - Math.PI / 2;
  const targetRotationX = lat * Math.PI / 180;
  animateCameraRotation(targetRotationY, targetRotationX);
}

function animateCameraRotation(targetY, targetX) {
  const startY = chart.mainContainer.rotation.y;
  const startX = chart.mainContainer.rotation.x;
  const duration = 1000;
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    chart.mainContainer.rotation.y = startY + (targetY - startY) * ease;
    chart.mainContainer.rotation.x = startX + (targetX - startX) * ease;

    if (t < 1) {
      requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(tick);
}

function buildArtifacts(data) {
  const textureLoader = new THREE.TextureLoader();

  data.forEach((item, index) => {
    const root = new THREE.Group();
    artifactGroup.add(root);

    const homePos = lon2xyz(globeRadius * 0.98, item.lon, item.lat);
    const homeOut = homePos.clone().normalize();

    const startJitter = randomFromSeed(item.id) * Math.PI * 2;
    const scatteredPos = lon2xyz(globeRadius * 0.98, london.lon, london.lat)
      .clone()
      .add(new THREE.Vector3(
        Math.cos(startJitter),
        Math.sin(startJitter * 1.9),
        Math.sin(startJitter)
      ).multiplyScalar(20 + (index % 4) * 4));

    const flatPos = lon2xyz(globeRadius, item.lon, item.lat);

    const cardWidth = 16;
    const cardHeight = 10;

    const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%232a3b4c'/%3E%3Crect x='20' y='20' width='600' height='440' fill='none' stroke='%23f0c677' stroke-width='2'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='20' fill='%23f0c677' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(item.title)}%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='16' fill='%23e8edf3' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(item.originCountry)}%3C/text%3E%3C/svg%3E`;

    const placeholderTex = textureLoader.load(placeholderImage);
    placeholderTex.colorSpace = THREE.SRGBColorSpace;

    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(cardWidth, cardHeight),
      new THREE.MeshBasicMaterial({ map: placeholderTex, transparent: true, side: THREE.DoubleSide })
    );

    textureLoader.load(
      item.image,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        card.material.map = texture;
      },
      undefined,
      () => {}
    );

    card.position.copy(homeOut.clone().multiplyScalar(globeRadius + 10));
    card.userData.artifact = item;
    clickableCards.push(card);
    root.add(card);

    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(cardWidth + 0.8, cardHeight + 0.8),
      new THREE.MeshBasicMaterial({ color: 0xe9d7aa, side: THREE.DoubleSide })
    );
    frame.position.copy(card.position);
    frame.position.z -= 0.5;
    root.add(frame);

    const stemLine = buildLine([
      homeOut.clone().multiplyScalar(globeRadius * 0.98),
      homeOut.clone().multiplyScalar(globeRadius + 4)
    ], 0x7fb7ff, 0.6);
    root.add(stemLine);

    const londonVec = lon2xyz(globeRadius * 0.98, london.lon, london.lat);
    const route = buildLine([
      londonVec.clone(),
      scatteredPos.clone()
    ], 0xd9b26d, 0.45);
    root.add(route);

    root.position.copy(scatteredPos);

    item.runtime = {
      root,
      card,
      frame,
      stemLine,
      route,
      homePos: homeOut.clone().multiplyScalar(globeRadius + 10),
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
}

function setMode(nextMode) {
  mode = nextMode;
  modeButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.mode === mode));

  if (mode === "particles") {
    yearEl.textContent = "Year: 粒子模式";
    return;
  }

  allArtifacts.forEach((item) => {
    if (!item.runtime) return;
    const runtime = item.runtime;
    runtime.arrived = false;
    if (mode === "homecoming" || mode === "standing") {
      runtime.targetPos = runtime.homeOut.clone().multiplyScalar(globeRadius + 10);
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
        runtime.targetPos = runtime.homeOut.clone().multiplyScalar(globeRadius + 10);
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
  let sortedArtifacts = [...allArtifacts];
  if (sortBy === "year") {
    sortedArtifacts.sort((a, b) => a.acquisitionYear - b.acquisitionYear);
  } else if (sortBy === "country") {
    sortedArtifacts.sort((a, b) => a.originCountry.localeCompare(b.originCountry));
  }

  allArtifacts.forEach((item) => {
    const countryMatch = visibleCountry === "ALL" || item.originCountry === visibleCountry;
    const searchMatch = !searchKeyword ||
      item.title.toLowerCase().includes(searchKeyword) ||
      item.originCountry.toLowerCase().includes(searchKeyword) ||
      item.originCity.toLowerCase().includes(searchKeyword);
    const visible = countryMatch && searchMatch;

    item.runtime.visible = visible;
    item.runtime.root.visible = visible;
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

function updateArtifactMotion() {
  const elapsed = clock.getElapsedTime();

  for (const artifact of allArtifacts) {
    if (!artifact.runtime || !artifact.runtime.visible) continue;
    const runtime = artifact.runtime;

    const distance = runtime.currentPos.distanceTo(runtime.targetPos);
    if (distance > 0.5) {
      const easeFactor = Math.min(0.12, distance * 0.05);
      runtime.currentPos.lerp(runtime.targetPos, easeFactor);
      runtime.root.position.copy(runtime.currentPos);
    }

    if (mode === "flat") {
      runtime.root.lookAt(chart.camera.position);
    } else {
      const normal = runtime.currentPos.clone().normalize();
      const lookAtTarget = runtime.currentPos.clone().add(normal);
      runtime.root.lookAt(lookAtTarget);
    }

    if (mode === "scattered") {
      runtime.root.rotation.z += Math.sin(elapsed * 1.2 + randomFromSeed(artifact.id)) * 0.002;
    } else if (mode === "homecoming" && !runtime.arrived) {
      runtime.root.rotation.z += Math.sin(elapsed * 2 + randomFromSeed(artifact.id)) * 0.03;
      const scale = 1 + Math.sin(elapsed * 3 + randomFromSeed(artifact.id)) * 0.15;
      runtime.root.scale.set(scale, scale, scale);
    } else {
      runtime.root.rotation.z *= 0.9;
      runtime.root.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }

    const londonVec = lon2xyz(globeRadius * 0.98, london.lon, london.lat);
    const lineEnd = mode === "homecoming" || mode === "standing"
      ? runtime.homeOut.clone().multiplyScalar(globeRadius * 0.98)
      : runtime.currentPos.clone();
    runtime.route.geometry.setFromPoints([londonVec, lineEnd]);
    runtime.route.material.opacity = Math.max(0.15, distance * 0.02);
  }

  requestAnimationFrame(updateArtifactMotion);
}

updateArtifactMotion();

function showArtifactDetail(item) {
  detailImage.src = item.image;
  detailTitle.textContent = item.title;
  detailCountry.textContent = `国家/地点：${item.originCountry} · ${item.originCity}`;
  detailYear.textContent = `入藏年份：${item.acquisitionYear}`;
  detailDesc.textContent = item.description;
  detailLink.href = item.source;
  detailPanel.classList.remove("hidden");
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

chart.on("click", (event, mesh) => {
  chart.options.autoRotate = false;
});