// =======================================================================
// HAFS Orbital Watch - Backend Server (Node.js)
// SGP4 궤도 전파 모델(Orbital Propagation Model)을 활용한 위성 위치 계산기
// =======================================================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const satellite = require('satellite.js'); // SGP4 궤도 계산 라이브러리

const app = express();
app.use(cors()); // 프론트엔드와 백엔드의 통신 허용

// 지원할 주요 위성들의 NORAD 카탈로그 ID
const SATELLITES = {
    'iss': 25544,       // 국제 우주 정거장
    'hubble': 20580,    // 허블 우주 망원경
    'tiangong': 48274,  // 중국 톈궁 우주 정거장
    'aqua': 27424       // 지구 관측 위성(Aqua)
};

// 메모리에 TLE 데이터를 캐싱 (API 호출 제한 방지)
let tleCache = {};

// 1. Celestrak에서 원시 TLE 데이터를 가져오는 함수
async function fetchTLE(noradId) {
    try {
        const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=tle`;
        const response = await axios.get(url);
        const lines = response.data.trim().split('\n');
        
        if (lines.length >= 3) {
            tleCache[noradId] = {
                name: lines[0].trim(),
                tle1: lines[1].trim(),
                tle2: lines[2].trim(),
                lastUpdated: Date.now()
            };
            console.log(`[System] TLE Data Updated for NORAD ID: ${noradId}`);
        }
    } catch (error) {
        console.error(`[Error] Failed to fetch TLE for ${noradId}:`, error.message);
    }
}

// 2. 프론트엔드가 데이터를 요청할 때 응답하는 REST API 엔드포인트
app.get('/api/telemetry/:satKey', async (req, res) => {
    const satKey = req.params.satKey;
    const noradId = SATELLITES[satKey];

    if (!noradId) {
        return res.status(400).json({ error: "Invalid Satellite Selection" });
    }

    // TLE 캐시가 없거나 1시간이 지났으면 새로 업데이트
    if (!tleCache[noradId] || (Date.now() - tleCache[noradId].lastUpdated > 3600000)) {
        await fetchTLE(noradId);
    }

    const satData = tleCache[noradId];
    if (!satData) return res.status(500).json({ error: "TLE Data unavailable" });

    // --- 공학적 핵심: SGP4 모델을 이용한 현재 위치 계산 ---
    // 1. TLE 데이터를 바탕으로 위성 궤도 모델 생성
    const satrec = satellite.twoline2satrec(satData.tle1, satData.tle2);
    
    // 2. 현재 시각(UTC)을 기준으로 위성의 3차원 위치(Position) 및 속도(Velocity) 추론
    const now = new Date();
    const positionAndVelocity = satellite.propagate(satrec, now);
    
    // 3. 지구 중심 직교 좌표계(ECI)를 지리적 좌표계(위도, 경도, 고도)로 변환
    const gmst = satellite.gstime(now);
    const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
    
    // 4. 라디안(Radian)을 도(Degree)로 변환
    const latitude = satellite.degreesLat(positionGd.latitude);
    const longitude = satellite.degreesLong(positionGd.longitude);
    const altitude = positionGd.height; // km

    // 5. 속도 벡터(x, y, z)를 통해 스칼라 속력(km/s -> km/h) 계산
    const v = positionAndVelocity.velocity;
    const velocityKmS = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    const velocityKmH = velocityKmS * 3600;

    // 프론트엔드로 계산 완료된 데이터 전송
    res.json({
        id: satKey,
        name: satData.name,
        latitude: latitude,
        longitude: longitude,
        altitude: altitude,
        velocity: velocityKmH,
        timestamp: now.toISOString()
    });
});

// 서버 기동 (포트 3000)
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 HAFS Orbital Watch Backend Server running on http://localhost:${PORT}`);
    console.log(`Initializing Orbit Data...`);
    // 서버가 켜질 때 초기 데이터 미리 불러오기
    Object.values(SATELLITES).forEach(id => fetchTLE(id));
});