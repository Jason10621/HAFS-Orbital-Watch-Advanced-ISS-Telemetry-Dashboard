// =======================================================================
// HAFS Orbital Watch - 3D Frontend & Backend Communication
// =======================================================================

const HAFS_COORDS = { lat: 37.3323, lon: 127.2415 };
const BACKEND_URL = 'http://localhost:3000/api/telemetry/'; // 내가 만든 서버 주소
const UPDATE_INTERVAL_MS = 3000; // 3초마다 부드럽게 업데이트

// --- 상태 변수 ---
let world; // 3D 지구본 객체
let isMetric = true;
let currentSatId = 'iss';
let trajectoryData = []; // 3D 궤적을 그리기 위한 배열

// --- DOM 요소 ---
const el = {
    lat: document.getElementById('lat-val'),
    lon: document.getElementById('lon-val'),
    alt: document.getElementById('alt-val'),
    vel: document.getElementById('vel-val'),
    distHafs: document.getElementById('dist-hafs'),
    lastUpdate: document.getElementById('last-update'),
    satName: document.getElementById('sat-name-display'),
    satSelect: document.getElementById('sat-select'),
    unitToggle: document.getElementById('unit-toggle'),
    themeToggle: document.getElementById('theme-toggle')
};

// ================= [ 1. 3D 지구본(Globe.gl) 초기화 ] =================
function initGlobe() {
    console.log("Initializing 3D Globe...");
    
    // Globe 객체 생성 및 HTML 요소에 부착
    world = Globe()(document.getElementById('globeViz'))
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg') // 밝은 테마 기본 맵
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .pointOfView({ lat: HAFS_COORDS.lat, lng: HAFS_COORDS.lon, altitude: 2.5 }) // 시작 시점을 HAFS로
        
        // HAFS 위치에 금색 기둥(Ring/Point) 표시
        .ringsData([{ lat: HAFS_COORDS.lat, lng: HAFS_COORDS.lon }])
        .ringColor(() => '#d4af37')
        .ringMaxRadius(2)
        .ringPropagationSpeed(1)
        .ringRepeatPeriod(1000);

    // 이벤트 리스너 등록
    el.unitToggle.addEventListener('click', toggleUnits);
    el.themeToggle.addEventListener('click', toggleTheme);
    el.satSelect.addEventListener('change', (e) => {
        currentSatId = e.target.value;
        trajectoryData = []; // 위성이 바뀌면 궤적 초기화
        fetchSatelliteData(); // 즉시 새 위성 정보 불러오기
    });

    // 메인 루프 시작
    fetchSatelliteData();
    setInterval(fetchSatelliteData, UPDATE_INTERVAL_MS);
}

// ================= [ 2. 백엔드 통신 및 데이터 처리 ] =================
async function fetchSatelliteData() {
    try {
        // 내가 만든 Node.js 서버에 데이터 요청
        const response = await fetch(BACKEND_URL + currentSatId);
        if (!response.ok) throw new Error("Backend Server Error");
        const data = await response.json();

        updateTelemetryDom(data);
        update3DGlobe(data);
        
        // 3D 공간 상의 유클리드 거리 및 표면 거리 복합 계산
        const dist = calculateHaversineDistance(HAFS_COORDS.lat, HAFS_COORDS.lon, data.latitude, data.longitude);
        updateHafsSpecialData(dist, data.altitude);

    } catch (error) {
        console.error("Connection to backend failed. Is server.js running?", error);
        el.satName.textContent = "SERVER OFFLINE";
        el.satName.style.color = "red";
    }
}

// ================= [ 3. 3D 시각화 업데이트 ] =================
function update3DGlobe(data) {
    // Globe.gl은 고도를 지구 반경(1.0)에 대한 비율로 계산합니다. (지구 반경 약 6371km)
    const normalizedAlt = data.altitude / 6371;

    // 현재 위성 위치를 배열로 만듦 (Globe.gl은 배열 데이터를 받음)
    const satData = [{
        lat: data.latitude,
        lng: data.longitude,
        alt: normalizedAlt,
        name: data.name
    }];

    // 궤적(Path) 데이터 추가
    trajectoryData.push([data.latitude, data.longitude, normalizedAlt]);
    if (trajectoryData.length > 200) trajectoryData.shift(); // 메모리 관리

    // 1. 위성 본체 그리기 (사이버틱한 민트/골드 색상 점)
    world.customLayerData(satData)
         .customThreeObject(d => new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x64ffda })
         ))
         .customThreeObjectUpdate((obj, d) => {
             Object.assign(obj.position, world.getCoords(d.lat, d.lng, d.alt));
         });

    // 2. 궤적 선 그리기
    const pathData = [{ path: trajectoryData }];
    world.pathsData(pathData)
         .pathColor(() => 'rgba(212, 175, 55, 0.8)') // HAFS 골드
         .pathPointAlt(p => p[2])
         .pathStroke(2);
}

// ================= [ 4. 데이터 표출 및 테마 로직 ] =================
function updateTelemetryDom(data) {
    el.satName.textContent = data.name;
    el.satName.style.color = "var(--color-status-green)";
    el.lastUpdate.textContent = `Update: ${new Date(data.timestamp).toLocaleTimeString()}`;

    const latDir = data.latitude >= 0 ? 'N' : 'S';
    const lonDir = data.longitude >= 0 ? 'E' : 'W';
    el.lat.textContent = `${Math.abs(data.latitude).toFixed(4)}° ${latDir}`;
    el.lon.textContent = `${Math.abs(data.longitude).toFixed(4)}° ${lonDir}`;

    const factor = isMetric ? 1 : 0.621371;
    const unitDist = isMetric ? 'km' : 'mi';
    const unitVel = isMetric ? 'km/h' : 'mph';

    el.alt.textContent = `${(data.altitude * factor).toFixed(2)} ${unitDist}`;
    el.vel.textContent = `${(data.velocity * factor).toFixed(0).toLocaleString()} ${unitVel}`;
}

function updateHafsSpecialData(surfaceDist, altitude) {
    // 피타고라스 정리를 응용하여 3D 직선거리(Line of sight) 근사치 계산
    const dist3D = Math.sqrt(Math.pow(surfaceDist, 2) + Math.pow(altitude, 2));
    const factor = isMetric ? 1 : 0.621371;
    const unit = isMetric ? 'km' : 'mi';
    el.distHafs.textContent = `${(dist3D * factor).toFixed(2).toLocaleString()} ${unit}`;
}

// 하버사인 공식 (지표면 곡면 거리)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function toggleUnits() {
    isMetric = !isMetric;
    el.unitToggle.textContent = isMetric ? "Metric (km/h)" : "Imperial (mph)";
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    el.themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    
    // 테마에 따라 3D 지구본 텍스처 변경 (핵심 시각 효과)
    if (isDark) {
        world.globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg');
    } else {
        world.globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    }
}

// 창이 열릴 때 시스템 가동
window.onload = initGlobe;