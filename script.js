// =======================================================================
// HAFS Orbital Watch - Ultimate 3D Engine & Control Logic
// =======================================================================

const HAFS_COORDS = { lat: 37.3323, lon: 127.2415 };
const BACKEND_URL = 'http://localhost:3000/api/telemetry/'; 
const UPDATE_INTERVAL_MS = 2000; // 더 부드러운 움직임을 위해 2초로 단축

// 상태 변수
let world; 
let isMetric = true;
let currentSatId = 'iss';
let trajectoryData = []; 

// 5가지 옵션 상태
let opts = {
    autoTrack: true,
    showTrail: true,
    atmosphere: true,
    stars: true,
    nightMap: false
};

const el = {
    lat: document.getElementById('lat-val'), lon: document.getElementById('lon-val'),
    alt: document.getElementById('alt-val'), vel: document.getElementById('vel-val'),
    distHafs: document.getElementById('dist-hafs'), lastUpdate: document.getElementById('last-update'),
    satName: document.getElementById('sat-name-display'), satSelect: document.getElementById('sat-select'),
    unitToggle: document.getElementById('unit-toggle'), themeToggle: document.getElementById('theme-toggle'),
    
    // 5가지 옵션 체크박스
    chkTrack: document.getElementById('opt-autotrack'), chkTrail: document.getElementById('opt-trail'),
    chkAtmo: document.getElementById('opt-atmosphere'), chkStars: document.getElementById('opt-stars'),
    chkNight: document.getElementById('opt-nightmap')
};

// ================= [ 1. 고품질 3D 위성 모델링 (Three.js) ] =================
function createSatelliteMesh() {
    const group = new THREE.Group();
    
    // 1. 위성 본체 (금색 실린더)
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xd4af37, emissive: 0x222222 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2; // 눕히기
    
    // 2. 태양광 패널 (파란색 판 2개)
    const panelGeometry = new THREE.BoxGeometry(3, 0.1, 1.5);
    const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x1e90ff, side: THREE.DoubleSide });
    
    const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
    panel1.position.y = 1;
    const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
    panel2.position.y = -1;

    group.add(body);
    group.add(panel1);
    group.add(panel2);
    
    // 크기를 지구 스케일에 맞게 아주 작게 조정
    group.scale.set(0.5, 0.5, 0.5); 
    return group;
}

// ================= [ 2. 3D 지구본 초기화 ] =================
function initGlobe() {
    const container = document.getElementById('globeViz');
    
    // 텍스처 (기본: 낮 지도, 별빛 우주)
    const mapDay = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
    const bgStars = 'https://unpkg.com/three-globe/example/img/night-sky.png';

    world = Globe()(container)
        .globeImageUrl(mapDay)
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl(bgStars)
        .showAtmosphere(opts.atmosphere) // 옵션 연동
        .atmosphereColor('#38bdf8')
        .atmosphereAltitude(0.15)
        .pointOfView({ lat: HAFS_COORDS.lat, lng: HAFS_COORDS.lon, altitude: 2.5 })
        
        // HAFS 마커
        .ringsData([{ lat: HAFS_COORDS.lat, lng: HAFS_COORDS.lon }])
        .ringColor(() => '#d4af37')
        .ringMaxRadius(3)
        .ringPropagationSpeed(1)
        .ringRepeatPeriod(1000);

    // 카메라 조명 추가 (위성 모델이 잘 보이도록)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1, 1, 1);
    world.scene().add(directionalLight);

    setupEventListeners();
    fetchSatelliteData();
    setInterval(fetchSatelliteData, UPDATE_INTERVAL_MS);
}

// ================= [ 3. 백엔드 통신 및 시각화 업데이트 ] =================
async function fetchSatelliteData() {
    try {
        const response = await fetch(BACKEND_URL + currentSatId);
        if (!response.ok) throw new Error("Backend Sync Error");
        const data = await response.json();

        updateTelemetryDom(data);
        update3DGlobe(data);
        
        const dist = calculateHaversineDistance(HAFS_COORDS.lat, HAFS_COORDS.lon, data.latitude, data.longitude);
        updateHafsSpecialData(dist, data.altitude);

    } catch (error) {
        console.error("Fetch Error:", error);
        el.satName.textContent = "OFFLINE";
        el.satName.style.color = "red";
    }
}

function update3DGlobe(data) {
    // GOES-16 같은 정지궤도 위성은 고도가 35,000km로 매우 높으므로 지구 반경(6371) 기준 정규화
    const normalizedAlt = data.altitude / 6371;

    const satData = [{ lat: data.latitude, lng: data.longitude, alt: normalizedAlt, name: data.name }];

    // 궤적 업데이트
    trajectoryData.push([data.latitude, data.longitude, normalizedAlt]);
    if (trajectoryData.length > 250) trajectoryData.shift(); 

    // 1. 위성 렌더링 (커스텀 3D 모델 사용)
    world.customLayerData(satData)
         .customThreeObject(() => createSatelliteMesh()) // 이 부분이 "밋밋함"을 해결하는 핵심입니다!
         .customThreeObjectUpdate((obj, d) => {
             Object.assign(obj.position, world.getCoords(d.lat, d.lng, d.alt));
             // 위성이 이동하는 방향으로 모델 회전 (간단한 임의 회전 적용)
             obj.rotation.y += 0.05; 
             obj.rotation.x += 0.02;
         });

    // 2. 궤적선 옵션 적용
    if (opts.showTrail) {
        world.pathsData([{ path: trajectoryData }])
             .pathColor(() => 'rgba(212, 175, 55, 0.8)')
             .pathPointAlt(p => p[2])
             .pathStroke(2);
    } else {
        world.pathsData([]); // 궤적 끄기
    }

    // 3. 자동 추적 옵션 적용
    if (opts.autoTrack) {
        // 부드러운 카메라 이동 (1초 동안 이동)
        // 정지궤도(GOES)처럼 고도가 높은 위성은 카메라를 더 뒤로 빼줍니다.
        const camAlt = normalizedAlt > 1 ? normalizedAlt + 1.5 : 2.5; 
        world.pointOfView({ lat: data.latitude, lng: data.longitude, altitude: camAlt }, 1000);
    }
}

// ================= [ 4. DOM 제어 및 5가지 옵션 로직 ] =================

function setupEventListeners() {
    el.unitToggle.addEventListener('click', () => { isMetric = !isMetric; el.unitToggle.textContent = isMetric ? "Metric (km)" : "Imperial (mi)"; });
    el.themeToggle.addEventListener('click', () => { document.body.classList.toggle('dark-mode'); });
    
    el.satSelect.addEventListener('change', (e) => {
        currentSatId = e.target.value;
        trajectoryData = []; // 위성 변경 시 궤적 초기화
        fetchSatelliteData();
    });

    // 5가지 시각 옵션 이벤트
    el.chkTrack.addEventListener('change', (e) => opts.autoTrack = e.target.checked);
    
    el.chkTrail.addEventListener('change', (e) => {
        opts.showTrail = e.target.checked;
        if(!opts.showTrail) world.pathsData([]);
    });

    el.chkAtmo.addEventListener('change', (e) => {
        opts.atmosphere = e.target.checked;
        world.showAtmosphere(opts.atmosphere);
    });

    el.chkStars.addEventListener('change', (e) => {
        opts.stars = e.target.checked;
        world.backgroundImageUrl(opts.stars ? 'https://unpkg.com/three-globe/example/img/night-sky.png' : null);
    });

    el.chkNight.addEventListener('change', (e) => {
        opts.nightMap = e.target.checked;
        world.globeImageUrl(opts.nightMap ? 
            'https://unpkg.com/three-globe/example/img/earth-night.jpg' : 
            'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    });
}

function updateTelemetryDom(data) {
    el.satName.textContent = data.name;
    el.satName.style.color = "var(--color-status-green)";
    el.lastUpdate.textContent = `Update: ${new Date(data.timestamp).toLocaleTimeString()}`;

    el.lat.textContent = `${Math.abs(data.latitude).toFixed(4)}° ${data.latitude >= 0 ? 'N' : 'S'}`;
    el.lon.textContent = `${Math.abs(data.longitude).toFixed(4)}° ${data.longitude >= 0 ? 'E' : 'W'}`;

    const f = isMetric ? 1 : 0.621371;
    el.alt.textContent = `${(data.altitude * f).toFixed(2)} ${isMetric ? 'km' : 'mi'}`;
    el.vel.textContent = `${(data.velocity * f).toFixed(0).toLocaleString()} ${isMetric ? 'km/h' : 'mph'}`;
}

function updateHafsSpecialData(surfaceDist, altitude) {
    const dist3D = Math.sqrt(Math.pow(surfaceDist, 2) + Math.pow(altitude, 2));
    el.distHafs.textContent = `${(dist3D * (isMetric ? 1 : 0.621371)).toFixed(2).toLocaleString()} ${isMetric ? 'km' : 'mi'}`;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

window.onload = initGlobe;