// =======================================================================
// HAFS Orbital Worldview - Pure Frontend SGP4 Engine
// =======================================================================

// --- 관측 대상: NASA 및 세계 주요 위성 5개 ---
const TARGET_SATELLITES = [
    { id: 25544, name: "ISS (ZARYA)", desc: "국제 우주 정거장. 고도 약 400km에서 인류가 상주하는 거대한 연구 시설입니다.", color: "#00ffcc" },
    { id: 20580, name: "HST (HUBBLE)", desc: "허블 우주 망원경. 대기권 밖에서 심우주를 관측하는 인류의 눈입니다.", color: "#e5a93d" },
    { id: 27424, name: "AQUA", desc: "NASA 지구 관측 시스템(EOS). 물의 순환을 연구하는 태양동기궤도 위성입니다.", color: "#3366ff" },
    { id: 25994, name: "TERRA", desc: "NASA EOS 주력 위성. 지구 표면, 대기, 해양의 상태를 모니터링합니다.", color: "#ff5555" },
    { id: 37849, name: "SUOMI NPP", desc: "NOAA 기상 및 기후 관측 위성. 초정밀 야간 카메라(VIIRS)를 탑재하고 있습니다.", color: "#cc33ff" }
];

let world;
let satDataMap = {}; // 파싱된 위성 데이터(satrec) 저장
let activeSatId = 25544; // 기본 활성화 위성 (ISS)
let orbitTrailMinutes = 90; // 과거/미래 궤적 계산 길이

// DOM 캐싱
const el = {
    statusText: document.getElementById('status-text'),
    statusDot: document.querySelector('.status-dot'),
    satList: document.getElementById('sat-list'),
    trailSlider: document.getElementById('trail-slider'),
    trailVal: document.getElementById('trail-val'),
    teleName: document.getElementById('tele-name'),
    teleId: document.getElementById('tele-id'),
    teleLat: document.getElementById('tele-lat'),
    teleLon: document.getElementById('tele-lon'),
    teleAlt: document.getElementById('tele-alt'),
    teleVel: document.getElementById('tele-vel'),
    telePeriod: document.getElementById('tele-period')
};

// ================= [ 1. TLE 데이터 가져오기 (다중 프록시 폴백 시스템) ] =================
async function fetchTLEData() {
    setStatus("FETCHING TLE DATA...", true);
    
    const ids = TARGET_SATELLITES.map(s => s.id).join(',');
    const celestrakUrl = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${ids}&FORMAT=tle`;
    
    // 🔥 엔지니어링 핵심: 여러 개의 공용 프록시 서버를 배열로 준비 (내결함성 설계)
    const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(celestrakUrl)}`, // 1순위 프록시
        `https://api.allorigins.win/raw?url=${encodeURIComponent(celestrakUrl)}`, // 2순위 (기존)
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(celestrakUrl)}` // 3순위
    ];

    let tleText = null;

    // 프록시 배열을 순회하며 하나라도 성공할 때까지 시도 (Fallback Loop)
    for (const proxyUrl of proxies) {
        try {
            console.log(`[System] Trying proxy: ${proxyUrl.split('/')[2]}...`);
            const response = await fetch(proxyUrl);
            
            if (response.ok) {
                const text = await response.text();
                // 쓰레기 데이터가 아닌, 정상적인 TLE 텍스트(최소 3줄 이상)가 왔는지 검증
                if (text && text.split('\n').length >= 3) {
                    tleText = text;
                    console.log(`[System] Data fetched successfully via ${proxyUrl.split('/')[2]}`);
                    break; // 성공했으므로 반복문 탈출!
                }
            }
        } catch (error) {
            console.warn(`[Warning] Proxy failed, trying next fallback...`);
        }
    }

    // 최종 결과 처리
    if (tleText) {
        parseTLE(tleText);
        initUI();
        initGlobe();
        setStatus("SYSTEM ONLINE", false);
        
        // 1초마다 궤도 렌더링 루프 시작
        setInterval(updateSatellitePositions, 1000);
    } else {
        // 모든 프록시가 실패했을 경우의 치명적 에러 처리
        console.error("[Fatal Error] All CORS proxies failed.");
        setStatus("ALL PROXIES BLOCKED. TRY AGAIN LATER.", false);
        el.statusText.style.color = "red";
        alert("현재 전 세계 무료 공용 프록시 서버가 모두 응답하지 않거나 Celestrak 서버 점검 중입니다. 5~10분 뒤에 새로고침 해주세요.");
    }
}

// ================= [ 2. UI 및 상호작용 초기화 ] =================
function initUI() {
    el.satList.innerHTML = '';
    
    TARGET_SATELLITES.forEach(sat => {
        if(!satDataMap[sat.id]) return; // 데이터가 파싱되지 않았다면 스킵

        const div = document.createElement('div');
        div.className = `sat-item ${sat.id === activeSatId ? 'active' : ''}`;
        div.innerHTML = `
            <div class="sat-item-title" style="color: ${sat.color}">${sat.name}</div>
            <div class="sat-item-desc">${sat.desc}</div>
        `;
        
        div.onclick = () => {
            document.querySelectorAll('.sat-item').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            activeSatId = sat.id;
            updateSatellitePositions(); // 즉시 화면 갱신
            focusCameraOnActive(); // 카메라 이동
        };
        el.satList.appendChild(div);
    });

    el.trailSlider.addEventListener('input', (e) => {
        orbitTrailMinutes = parseInt(e.target.value);
        el.trailVal.textContent = `±${orbitTrailMinutes} Minutes`;
        updateSatellitePositions();
    });
}

function setStatus(text, isLoading) {
    el.statusText.textContent = text;
    if(isLoading) {
        el.statusDot.classList.add('loading');
        el.statusText.style.color = "var(--color-accent-gold)";
    } else {
        el.statusDot.classList.remove('loading');
        el.statusText.style.color = "var(--color-status-green)";
    }
}

// ================= [ 3. 3D Globe.gl 엔진 초기화 ] =================
function initGlobe() {
    const container = document.getElementById('globeViz');
    
    world = Globe()(container)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .showAtmosphere(true)
        .atmosphereColor('#3a7bd5')
        .atmosphereAltitude(0.15)
        
        // 3D 객체(위성 본체) 렌더링 설정
        .customLayerData([])
        .customThreeObject(d => {
            const isTarget = d.id === activeSatId;
            // 활성화된 위성은 크고 밝게, 나머지는 작게
            const size = isTarget ? 1.5 : 0.5;
            const geo = new THREE.SphereGeometry(size, 16, 16);
            const mat = new THREE.MeshBasicMaterial({ color: d.color });
            return new THREE.Mesh(geo, mat);
        })
        .customThreeObjectUpdate((obj, d) => {
            Object.assign(obj.position, world.getCoords(d.lat, d.lng, d.alt));
        });

    focusCameraOnActive();
    updateSatellitePositions();
}

function focusCameraOnActive() {
    if(!world) return;
    const now = new Date();
    const pos = calculateSGP4(satDataMap[activeSatId].satrec, now);
    // 선택한 위성의 위치로 카메라를 부드럽게 이동 (고도는 위성 고도의 2배 정도)
    world.pointOfView({ lat: pos.lat, lng: pos.lon, altitude: Math.max(1.5, pos.alt + 0.5) }, 1000);
}

// ================= [ 4. SGP4 궤도 물리 연산 및 렌더링 ] =================
function updateSatellitePositions() {
    if(!world) return;
    const now = new Date();
    const currentPositions = [];
    let pathData = [];

    TARGET_SATELLITES.forEach(satInfo => {
        const satData = satDataMap[satInfo.id];
        if(!satData) return;

        // 1. 현재 위치 계산
        const pos = calculateSGP4(satData.satrec, now);
        if(!pos) return;
        
        currentPositions.push({
            id: satInfo.id, name: satInfo.name, color: satInfo.color,
            lat: pos.lat, lng: pos.lon, alt: pos.alt // alt는 지구 반경 비율로 정규화됨
        });

        // 2. 텔레메트리 UI 업데이트 (활성화된 위성만)
        if(satInfo.id === activeSatId) {
            updateTelemetryUI(satInfo, pos, satData.periodMinutes);
            
            // 3. 궤적(Trail) 계산 (과거부터 미래까지)
            const trajectory = [];
            for(let i = -orbitTrailMinutes; i <= orbitTrailMinutes; i+=2) {
                const timePoint = new Date(now.getTime() + i * 60000);
                const p = calculateSGP4(satData.satrec, timePoint);
                if(p) trajectory.push([p.lat, p.lon, p.alt]);
            }
            pathData.push({ path: trajectory, color: satInfo.color });
        }
    });

    // Globe.gl 데이터 갱신
    world.customLayerData(currentPositions);
    
    world.pathsData(pathData)
         .pathColor(d => d.color)
         .pathPointAlt(p => p[2])
         .pathStroke(2)
         .pathDashLength(0.01)
         .pathDashGap(0.005)
         .pathDashAnimateTime(10000); // 궤적이 흐르는 애니메이션 효과
}

// 핵심 수학 함수: 시간(date)을 넣으면 위도/경도/고도/속도를 반환
function calculateSGP4(satrec, date) {
    const positionAndVelocity = satellite.propagate(satrec, date);
    if(!positionAndVelocity.position) return null;

    const gmst = satellite.gstime(date);
    const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
    
    const v = positionAndVelocity.velocity;
    const velocityKmS = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);

    return {
        lat: satellite.degreesLat(positionGd.latitude),
        lon: satellite.degreesLong(positionGd.longitude),
        altRaw: positionGd.height, // 실제 고도 (km)
        alt: positionGd.height / 6371, // Globe.gl용 고도 (지구 반경 비율)
        vel: velocityKmS
    };
}

function updateTelemetryUI(satInfo, pos, period) {
    el.teleName.textContent = satInfo.name;
    el.teleName.style.color = satInfo.color;
    el.teleId.textContent = satInfo.id;
    el.teleLat.textContent = `${Math.abs(pos.lat).toFixed(4)}° ${pos.lat >= 0 ? 'N' : 'S'}`;
    el.teleLon.textContent = `${Math.abs(pos.lon).toFixed(4)}° ${pos.lon >= 0 ? 'E' : 'W'}`;
    el.teleAlt.textContent = `${pos.altRaw.toFixed(1)} km`;
    el.teleVel.textContent = `${pos.vel.toFixed(2)} km/s`;
    el.telePeriod.textContent = `${period.toFixed(1)} mins`;
}

// 런타임 시작
window.onload = fetchTLEData;