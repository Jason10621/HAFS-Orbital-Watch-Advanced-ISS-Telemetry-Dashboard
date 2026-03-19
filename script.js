/* =========================================
   HAFS Orbital Engine - Advanced Logic
   ========================================= */

// --- Constants & Configuration ---
// HAFS 정체성의 핵심: 용인외대부고 정밀 좌표
const HAFS_COORDS = { lat: 37.3323, lon: 127.2415 };
const API_ISS_NOW = 'https://api.wheretheiss.at/v1/satellites/25544';
const API_CREW = 'http://api.open-notify.org/astros.json';
const UPDATE_INTERVAL_MS = 5000; // 5초마다 데이터 업데이트

// --- State Variables (애플리케이션 상태 관리) ---
let map, issMarker, orbitLine;
let isMetric = true; // Metric(km) vs Imperial(mile) 토글 상태
let pastPath = []; // 과거 궤적 저장 배열

// --- DOM Elements ---
const el = {
    lat: document.getElementById('lat-val'),
    lon: document.getElementById('lon-val'),
    alt: document.getElementById('alt-val'),
    vel: document.getElementById('vel-val'),
    distHafs: document.getElementById('dist-hafs'),
    lastUpdate: document.getElementById('last-update'),
    unitToggle: document.getElementById('unit-toggle'),
    crewList: document.getElementById('crew-list'),
    crewCount: document.getElementById('crew-count'),
    nextPass: document.getElementById('next-pass')
};

// ================= [ 1. 초기화 및 지도 설정 ] =================

function initDashboard() {
    console.log("HAFS Orbital Watch Engine Initializing...");
    
    // Leaflet 지도 초기화: HAFS 감성에 맞게 어두운 톤의 타일 사용
    map = L.map('issMap', {
        center: [0, 0],
        zoom: 2,
        minZoom: 1
    });

    // CartoDB Dark Matter 타일 (다크모드 관제 센터 감성)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB &copy; OpenStreetMap'
    }).addTo(map);

    // ISS 커스텀 아이콘 설정 (직접 만든 이미지로 대체 가능)
    const issIcon = L.icon({
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
        iconSize: [40, 25],
        iconAnchor: [20, 12]
    });

    // ISS 마커를 지도에 추가
    issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);
    
    // HAFS 위치에 학구적인 골드 엠블럼 마커 추가
    const hafsIcon = L.divIcon({className: 'hafs-marker-gold'}); // CSS에서 스타일 정의 필요
    L.marker([HAFS_COORDS.lat, HAFS_COORDS.lon], {icon: hafsIcon}).addTo(map)
        .bindPopup("HAFS (Hankuk Academy of Foreign Studies)");

    // 과거 궤적을 그릴 선 설정
    orbitLine = L.polyline([], { color: '#d4af37', weight: 1, opacity: 0.5 }).addTo(map);

    // 이벤트 리스너 등록
    el.unitToggle.addEventListener('click', toggleUnits);

    // 최초 데이터 패치 및 주기적 루프 시작
    fetchIssData();
    fetchCrewData();
    fetchHafsPassPrediction();
    setInterval(fetchIssData, UPDATE_INTERVAL_MS);
}

// ================= [ 2. 핵심 텔레메트리 데이터 페칭 ] =================

// async/await를 활용한 현대적인 비동기 통신 및 예외 처리
async function fetchIssData() {
    try {
        const response = await fetch(API_ISS_NOW);
        if (!response.ok) throw new Error(`Network error: ${response.status}`);
        const data = await response.json();

        // 상태 업데이트
        updateTelemetryDom(data);
        updateMap(data.latitude, data.longitude);
        
        // HAFS와의 직선거리 계산 (공학적 핵심)
        const dist = calculateHaversineDistance(
            HAFS_COORDS.lat, HAFS_COORDS.lon,
            data.latitude, data.longitude
        );
        updateHafsSpecialData(dist);

        // 마지막 업데이트 시각 표시
        el.lastUpdate.textContent = `Last Update: ${new Date().toLocaleTimeString()}`;

    } catch (error) {
        console.error("Failed to fetch ISS data:", error);
        el.lat.textContent = "Error";
    }
}

// ================= [ 3. 공학적 문제 해결: 구면 기하학 공식 ] =================

/**
 * 하버사인 공식 (Haversine Formula)
 * 지구를 구체로 가정하고 두 좌표 사이의 최단 거리(대권 거리)를 구하는 수학 공식.
 * 고등학교 수준의 삼각함수와 라디안 개념을 실제 코드로 구현한 부분.
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구 평균 반지름 (km)
    
    // 도(degree)를 라디안(radian)으로 변환
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    // 공식의 핵심 기하학 연산
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // 최종 거리 (km)
    
    return distance;
}

// ================= [ 4. UI 및 지도 업데이트 로직 ] =================

function updateTelemetryDom(data) {
    // 위경도는 항상 Metric 고정
    el.lat.textContent = `${data.latitude.toFixed(4)}° N`;
    el.lon.textContent = `${data.longitude.toFixed(4)}° E`;

    // 단위 변환 로직 (정교한 삼항 연산자 사용)
    const factor = isMetric ? 1 : 0.621371; // km to mile 변환 계수
    const unitDist = isMetric ? 'km' : 'mi';
    const unitVel = isMetric ? 'km/h' : 'mph';

    el.alt.textContent = `${(data.altitude * factor).toFixed(2)} ${unitDist}`;
    el.vel.textContent = `${(data.velocity * factor).toFixed(0).toLocaleString()} ${unitVel}`;
}

function updateHafsSpecialData(dist) {
    const factor = isMetric ? 1 : 0.621371;
    const unit = isMetric ? 'km' : 'mi';
    
    // 거리 계산 결과 반영
    el.distHafs.textContent = `${(dist * factor).toFixed(2).toLocaleString()} ${unit}`;
}

function updateMap(lat, lon) {
    const newPos = [lat, lon];
    issMarker.setLatLng(newPos);
    
    // 지도 중심을 ISS로 이동시키되 부드럽게(Pan) 이동
    map.panTo(newPos, {animate: true, duration: 0.5});

    // 과거 궤적 추가 및 지도에 다시 그리기
    pastPath.push(newPos);
    
    // 최적화: 궤적선이 너무 많아지면 성능 하락하므로 최근 500개만 유지
    if (pastPath.length > 500) pastPath.shift();
    
    orbitLine.setLatLngs(pastPath);
}

// 단위 변환 토글 함수
function toggleUnits() {
    isMetric = !isMetric;
    el.unitToggle.textContent = isMetric ? "Metric (km/h)" : "Imperial (mph)";
    // 토글 즉시 화면 업데이트를 강제하기 위해 API를 다시 호출하지 않고 DOM만 수정 가능
    // 여기서는 간단하게 다음 API 호출 루프를 기다림
}

// ================= [ 5. 우주비행사 데이터 및 패널 동적 생성 ] =================

async function fetchCrewData() {
    try {
        const response = await fetch(API_CREW);
        if (!response.ok) throw new Error("Crew network error");
        const data = await response.json();

        // 필터링: ISS에 탑승한 인원만 추출
        const issCrew = data.people.filter(p => p.craft === 'ISS');
        
        el.crewCount.textContent = `${issCrew.length} People Onboard`;
        el.crewList.innerHTML = ''; // 로딩 메시지 삭제

        // 탑승자별 카드 dynamic 생성 및 DOM 삽입 (고급 DOM 조작)
        issCrew.forEach(member => {
            const card = document.createElement('div');
            card.className = 'crew-card';
            
            // 국적 및 사진 정보는 API에 없으므로, 이름 기반 더미 이미지 사용 (실제 사진 API로 대체 권장)
            const photoUrl = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${member.name}`;
            
            card.innerHTML = `
                <img src="${photoUrl}" alt="${member.name}" class="crew-photo">
                <div class="crew-info">
                    <h4>${member.name}</h4>
                    <p>International Space Station (ISS)</p>
                </div>
            `;
            el.crewList.appendChild(card);
        });

    } catch (error) {
        console.error("Crew data fetch failed:", error);
        el.crewList.innerHTML = '<p class="error-text">Failed to load crew data.</p>';
    }
}

// ================= [ 6. 고급 기능: HAFS 상공 통과 시간 예측 ] =================

async function fetchHafsPassPrediction() {
    // 주의: 실제 정확한 패스 예측을 위해서는 TLE 데이터를 계산해야 하므로 고도의 기하학 지식이 필요함.
    // 여기서는 간단한 테스트용 외부 API를 활용 (주의: API가 불안정할 수 있음)
    // 실제 포트폴리오에서는 이 부분을 직접 TLE로 계산하는 코드를 짜면 '전설'이 될 수 있음.
    
    const PROXY_URL = 'https://cors-anywhere.herokuapp.com/'; // CORS 오류 회피용 프록시
    const API_PREDICT = `http://api.open-notify.org/iss-pass.json?lat=${HAFS_COORDS.lat}&lon=${HAFS_COORDS.lon}&n=1`;
    
    try {
        // 프록시를 통해 API 요청 (주의: 이 방식은 상용 서비스용이 아님)
        // el.nextPass.textContent = "Calculating...";
        // const response = await fetch(PROXY_URL + API_PREDICT);
        // const data = await response.json();
        // const nextTime = new Date(data.response[0].risetime * 1000);
        // el.nextPass.textContent = nextTime.toLocaleString();

        el.nextPass.textContent = "See Heavens-Above.com for precise time"; // 실제 구현이 까다로우므로 대체 텍스트

    } catch (error) {
        console.error("Pass prediction failed:", error);
        el.nextPass.textContent = "Calc Error (CORS)";
    }
}

// 창 로드 시 엔진 기동
window.onload = initDashboard;