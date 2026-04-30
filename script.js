// =======================================================================
// HAFS Starlink Mega-Constellation Tracker V5.0
// 빅데이터 파싱 및 렌더링 최적화 엔진
// =======================================================================

let world;
let starlinkData = []; // 6000+ 개의 위성 데이터를 담을 배열
let selectedSat = null; // 클릭한 위성
let updateInterval;

const DOM = {
    totalSats: document.getElementById('total-sats'),
    statusText: document.getElementById('status-text'),
    statusDot: document.querySelector('.status-dot'),
    telemetryPanel: document.getElementById('telemetry-panel'),
    satName: document.getElementById('sat-name'),
    satId: document.getElementById('sat-id'),
    satAlt: document.getElementById('sat-alt'),
    satVel: document.getElementById('sat-vel'),
    satCoords: document.getElementById('sat-coords'),
    btnClear: document.getElementById('btn-clear')
};

// ================= [ 1. 빅데이터(6,000+ TLE) Fetching ] =================
async function fetchStarlinkData() {
    setStatus("DOWNLOADING STARLINK CONSTELLATION DATA (~1MB)...", true);
    
    // Celestrak의 Starlink 전용 그룹 TLE 주소
    const celestrakUrl = `https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle`;
    
    // CORS 프록시 폴백
    const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(celestrakUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(celestrakUrl)}`
    ];

    let rawData = null;

    for (const proxy of proxies) {
        try {
            console.log(`Fetching from: ${proxy}`);
            const res = await fetch(proxy);
            if (res.ok) {
                const text = await res.text();
                if (text.length > 1000) { // 스타링크 데이터는 크기가 큼
                    rawData = text;
                    break;
                }
            }
        } catch (e) {
            console.warn("Proxy failed, trying next...");
        }
    }

    if (rawData) {
        setStatus("PARSING 6000+ SGP4 MODELS...", true);
        // 브라우저가 멈추는 것을 방지하기 위해 약간의 딜레이 후 파싱 시작
        setTimeout(() => {
            parseBigDataTLE(rawData);
            initGlobe();
            setStatus("CONSTELLATION LIVE", false);
            
            // 2초마다 모든 위성의 위치 업데이트 (6000개를 매 프레임 업데이트하면 CPU 터짐)
            updateInterval = setInterval(updateAllPositions, 2000);
        }, 100);
    } else {
        setStatus("FATAL: UNABLE TO DOWNLOAD CONSTELLATION DATA", false);
    }
}

function parseBigDataTLE(tleText) {
    const lines = tleText.trim().split('\n');
    let validCount = 0;

    for (let i = 0; i < lines.length; i += 3) {
        if(i + 2 >= lines.length) break;
        const name = lines[i].trim();
        const tleLine1 = lines[i+1].trim();
        const tleLine2 = lines[i+2].trim();
        
        try {
            const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
            const id = parseInt(tleLine2.substring(2, 7));
            
            starlinkData.push({ id, name, satrec });
            validCount++;
        } catch (e) {
            // 오래된 데이터나 파싱 에러 발생 시 무시
        }
    }
    
    DOM.totalSats.textContent = validCount.toLocaleString();
    DOM.totalSats.classList.remove('loading-pulse');
    console.log(`[System] Successfully parsed ${validCount} satellites.`);
}

function setStatus(msg, isLoading) {
    DOM.statusText.textContent = msg;
    DOM.statusDot.style.backgroundColor = isLoading ? "var(--color-accent-gold)" : "var(--color-status-green)";
    if(isLoading) DOM.statusText.style.color = "var(--color-accent-gold)";
    else DOM.statusText.style.color = "var(--color-status-green)";
}

// ================= [ 2. Globe.gl 하드웨어 가속 렌더링 ] =================
function initGlobe() {
    const container = document.getElementById('globeViz');
    
    world = Globe()(container)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg') // 어두운 테마가 수천 개의 위성을 보기에 좋음
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .showAtmosphere(true)
        .atmosphereColor('#1e90ff')
        
        // 1. 군집 위성 점(Point) 렌더링: 매우 빠름
        .pointAltitude(d => d.alt)
        .pointColor(d => d.id === selectedSat?.id ? '#00ffcc' : 'rgba(255, 255, 255, 0.6)')
        .pointRadius(d => d.id === selectedSat?.id ? 0.05 : 0.01) // 선택된 건 크게
        .pointResolution(8)
        .onPointClick(handleSatelliteClick) // 위성 클릭 이벤트
        
        // 2. 선택된 위성의 통신 커버리지 (Ring) 렌더링
        .ringsData([])
        .ringColor(() => 'rgba(0, 255, 204, 0.3)')
        .ringMaxRadius(d => d.coverage) // 고도 기반 커버리지
        .ringPropagationSpeed(0)
        .ringRepeatPeriod(0)
        
        // 3. 선택된 위성의 미래/과거 궤적 (Path) 렌더링
        .pathsData([])
        .pathColor(() => '#d4af37')
        .pathStroke(1.5)
        .pathDashLength(0.01)
        .pathDashGap(0.01)
        .pathDashAnimateTime(5000);

    // 초기 시점 설정
    world.pointOfView({ altitude: 2.5 });
    
    // 첫 데이터 주입
    updateAllPositions();
}

// ================= [ 3. 물리 연산 및 최적화 ] =================

function updateAllPositions() {
    const now = new Date();
    const points = [];

    // 6000개 위성의 현재 위치 연산 (2초마다 실행됨)
    for (const sat of starlinkData) {
        const posAndVel = satellite.propagate(sat.satrec, now);
        if(!posAndVel.position) continue;

        const gmst = satellite.gstime(now);
        const posGd = satellite.eciToGeodetic(posAndVel.position, gmst);
        
        const lat = satellite.degreesLat(posGd.latitude);
        const lng = satellite.degreesLong(posGd.longitude);
        const altRatio = posGd.height / 6371; // 지구 반경 대비 비율

        points.push({ id: sat.id, name: sat.name, lat, lng, alt: altRatio, rawAlt: posGd.height, vel: posAndVel.velocity });
        
        // 선택된 위성이면 텔레메트리 업데이트
        if (selectedSat && sat.id === selectedSat.id) {
            updateSelectedTelemetry(sat.name, sat.id, posGd.height, posAndVel.velocity, lat, lng);
            updateSelectedVisuals(sat, posGd.height);
        }
    }

    // Globe에 대규모 점 데이터 주입
    world.pointsData(points);
}

// 위성 클릭 시 실행
function handleSatelliteClick(point) {
    // 원본 데이터를 찾아 선택
    selectedSat = starlinkData.find(s => s.id === point.id);
    DOM.telemetryPanel.style.display = 'block';
    
    // 즉시 화면 강제 업데이트
    updateAllPositions(); 
    
    // 카메라를 선택한 위성으로 부드럽게 이동
    world.pointOfView({ lat: point.lat, lng: point.lng, altitude: point.alt + 1 }, 1000);
}

// 선택 해제 버튼
DOM.btnClear.addEventListener('click', () => {
    selectedSat = null;
    DOM.telemetryPanel.style.display = 'none';
    world.ringsData([]); // 커버리지 지우기
    world.pathsData([]); // 궤적 지우기
    updateAllPositions(); // 색상 원래대로
});

// 선택된 위성만을 위한 고부하 연산 (궤적 및 커버리지 반경)
function updateSelectedVisuals(sat, altitudeKm) {
    const now = new Date();
    const trajectory = [];
    
    // 앞뒤 60분 (총 120분) 궤적 계산
    for(let i = -60; i <= 60; i += 2) {
        const time = new Date(now.getTime() + i * 60000);
        const p = satellite.propagate(sat.satrec, time);
        if(!p.position) continue;
        const gmst = satellite.gstime(time);
        const posGd = satellite.eciToGeodetic(p.position, gmst);
        trajectory.push([
            satellite.degreesLat(posGd.latitude),
            satellite.degreesLong(posGd.longitude),
            posGd.height / 6371
        ]);
    }

    world.pathsData([{ path: trajectory }]);

    // 통신 커버리지 계산 (간단한 수학적 근사: 고도가 높을수록 커버리지가 넓어짐)
    // Starlink의 가시 반경은 보통 수백 km. 이를 각도(Degree)로 변환
    const earthRadiusKm = 6371;
    const coverageAngle = Math.acos(earthRadiusKm / (earthRadiusKm + altitudeKm)) * (180 / Math.PI);
    
    // 현재 위치에 반투명 링 렌더링
    const currentPos = trajectory[30]; // 현재 시간 인덱스 (대략 중간)
    if(currentPos) {
        world.ringsData([{ 
            lat: currentPos[0], 
            lng: currentPos[1], 
            coverage: coverageAngle * 0.8 // 링 크기 적용
        }]);
    }
}

// UI 텍스트 렌더링
function updateSelectedTelemetry(name, id, alt, vel, lat, lng) {
    DOM.satName.textContent = name;
    DOM.satId.textContent = id;
    DOM.satAlt.textContent = `${alt.toFixed(1)} km`;
    
    const speedKmS = Math.sqrt(vel.x*vel.x + vel.y*vel.y + vel.z*vel.z);
    DOM.satVel.textContent = `${speedKmS.toFixed(2)} km/s`;
    
    DOM.satCoords.textContent = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N':'S'}, ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E':'W'}`;
}

// 창 크기 변경 대응
window.addEventListener('resize', () => {
    world.width(window.innerWidth);
    world.height(window.innerHeight);
});

// 런타임 시작
window.onload = fetchStarlinkData;