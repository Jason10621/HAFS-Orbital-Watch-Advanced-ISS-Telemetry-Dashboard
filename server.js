// =======================================================================
// HAFS Orbital Watch - Backend Server (Node.js) v2.0
// =======================================================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const satellite = require('satellite.js');

const app = express();
app.use(cors());

// [업그레이드] 한국 위성 및 다수 위성 카탈로그 추가
const SATELLITES = {
    'iss': 25544,       // 국제 우주 정거장
    'hubble': 20580,    // 허블 우주 망원경
    'tiangong': 48274,  // 중국 톈궁 우주 정거장
    'aqua': 27424,      // 지구 관측 위성(Aqua)
    'kompsat2': 29268,  // 아리랑 2호 (대한민국)
    'kompsat3': 38338,  // 아리랑 3호 (대한민국)
    'kompsat5': 39227,  // 아리랑 5호 (대한민국)
    'starlink': 44235,  // 스타링크 (SpaceX)
    'goes16': 41866,    // 정지궤도 기상위성 (적도 상공 고정)
    'noaa19': 33591     // 극궤도 기상위성
};

let tleCache = {};

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
            console.log(`[System] TLE Data Synced: ${lines[0].trim()}`);
        }
    } catch (error) {
        console.error(`[Error] Failed to fetch TLE for ${noradId}:`, error.message);
    }
}

app.get('/api/telemetry/:satKey', async (req, res) => {
    const satKey = req.params.satKey;
    const noradId = SATELLITES[satKey];

    if (!noradId) return res.status(400).json({ error: "Invalid Satellite" });

    // 1시간 주기로 TLE 데이터 갱신
    if (!tleCache[noradId] || (Date.now() - tleCache[noradId].lastUpdated > 3600000)) {
        await fetchTLE(noradId);
    }

    const satData = tleCache[noradId];
    if (!satData) return res.status(500).json({ error: "Data unavailable" });

    // SGP4 궤도 역학 연산
    const satrec = satellite.twoline2satrec(satData.tle1, satData.tle2);
    const now = new Date();
    const positionAndVelocity = satellite.propagate(satrec, now);
    
    // 예외 처리 (궤도 데이터 파싱 실패 시)
    if (!positionAndVelocity.position) return res.status(500).json({ error: "Calculation Error" });

    const gmst = satellite.gstime(now);
    const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
    
    const latitude = satellite.degreesLat(positionGd.latitude);
    const longitude = satellite.degreesLong(positionGd.longitude);
    const altitude = positionGd.height;

    const v = positionAndVelocity.velocity;
    const velocityKmH = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z) * 3600;

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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 HAFS Orbital Backend v2.0 running on port ${PORT}`);
    Object.values(SATELLITES).forEach(id => fetchTLE(id)); // 서버 시작 시 전체 위성 데이터 동기화
});