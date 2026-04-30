// =======================================================================
// HAFS Grand Orbital Watch V3.0 - Unified 3D Engine
// =======================================================================

// --- 글로벌 엔진 상태 ---
const engine = {
    scene: null, camera: null, renderer: null, controls: null,
    animationId: null, currentMode: 'solar',
    objects: {}, // 모드별 3D 객체 저장소
    timeOffset: 0
};

// --- DOM 요소 바인딩 ---
const UI = {
    container: document.getElementById('three-container'),
    modeSelect: document.getElementById('sim-mode'),
    modeDisplay: document.getElementById('mode-name-display'),
    infoTitle: document.getElementById('info-title'),
    infoDesc: document.getElementById('info-desc'),
    metricTitle: document.getElementById('metric-title'),
    metricVal: document.getElementById('metric-val'),
    crosshair: document.getElementById('crosshair'),
    
    // 컨트롤 패널들
    panels: {
        solar: document.getElementById('controls-solar'),
        eclipse: document.getElementById('controls-eclipse'),
        jwst: document.getElementById('controls-jwst')
    },
    
    // 입력 요소
    solarSpeed: document.getElementById('solar-speed'),
    solarSpeedVal: document.getElementById('solar-speed-val'),
    eclipseOffset: document.getElementById('eclipse-offset'),
    eclipseOffsetVal: document.getElementById('eclipse-offset-val'),
    eclipseDist: document.getElementById('eclipse-dist'),
    eclipseDistVal: document.getElementById('eclipse-dist-val'),
    jwstTarget: document.getElementById('jwst-target'),
    jwstScanBtn: document.getElementById('btn-scan')
};

// ================= [ 엔진 초기화 ] =================
function initEngine() {
    engine.scene = new THREE.Scene();
    
    // 카메라 설정
    engine.camera = new THREE.PerspectiveCamera(45, UI.container.clientWidth / UI.container.clientHeight, 0.1, 10000);
    
    // 렌더러 설정 (그림자 렌더링 활성화 - 일식의 핵심)
    engine.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    engine.renderer.setSize(UI.container.clientWidth, UI.container.clientHeight);
    engine.renderer.shadowMap.enabled = true;
    engine.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 부드러운 그림자
    UI.container.appendChild(engine.renderer.domElement);

    // 궤도 컨트롤러
    engine.controls = new THREE.OrbitControls(engine.camera, engine.renderer.domElement);
    engine.controls.enableDamping = true;
    engine.controls.dampingFactor = 0.05;

    // 리사이즈 이벤트
    window.addEventListener('resize', () => {
        engine.camera.aspect = UI.container.clientWidth / UI.container.clientHeight;
        engine.camera.updateProjectionMatrix();
        engine.renderer.setSize(UI.container.clientWidth, UI.container.clientHeight);
    });

    // 이벤트 리스너 바인딩
    setupEventListeners();

    // 첫 화면 로드
    switchMode('solar');
}

// 씬 초기화 (모드 변경 시 호출)
function clearScene() {
    if (engine.animationId) cancelAnimationFrame(engine.animationId);
    while(engine.scene.children.length > 0){ 
        const obj = engine.scene.children[0];
        engine.scene.remove(obj); 
    }
    engine.objects = {};
    engine.timeOffset = 0;
}

// ================= [ 모드 스위처 ] =================
function switchMode(mode) {
    clearScene();
    engine.currentMode = mode;
    
    // UI 패널 토글
    Object.values(UI.panels).forEach(p => p.style.display = 'none');
    UI.panels[mode].style.display = 'block';
    UI.crosshair.style.display = mode === 'jwst' ? 'block' : 'none';

    // 모드별 씬 빌드
    if (mode === 'solar') buildSolarSystem();
    else if (mode === 'eclipse') buildEclipseSimulator();
    else if (mode === 'jwst') buildJWSTObservatory();
}

// ================= [ 1. 고해상도 태양계 모드 ] =================
function buildSolarSystem() {
    UI.modeDisplay.textContent = "SOLAR SYSTEM MECHANICS";
    UI.infoTitle.textContent = "KEPLER'S LAWS OF PLANETARY MOTION";
    UI.infoDesc.textContent = "지구를 포함한 행성들은 케플러의 법칙에 따라 태양을 중심으로 타원에 가까운 궤도를 공전합니다. 지구 곁에는 위성인 달(Moon)이 함께 공전하고 있습니다.";
    UI.metricTitle.textContent = "ELAPSED TIME";
    
    engine.camera.position.set(0, 100, 150);
    engine.controls.target.set(0, 0, 0);

    // 기본 조명
    engine.scene.add(new THREE.AmbientLight(0x222222));
    const sunLight = new THREE.PointLight(0xffffff, 2, 500);
    engine.scene.add(sunLight);

    // 태양
    const sunGeo = new THREE.SphereGeometry(10, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    engine.scene.add(sun);

    // 행성 데이터 (수성, 금성, 지구(+달), 화성, 목성, 토성)
    const planetsData = [
        { name: "Mercury", r: 1, d: 20, speed: 0.04, color: 0xaaaaaa },
        { name: "Venus", r: 2, d: 30, speed: 0.015, color: 0xffdd99 },
        { name: "Earth", r: 2.2, d: 45, speed: 0.01, color: 0x3366ff, hasMoon: true },
        { name: "Mars", r: 1.5, d: 60, speed: 0.008, color: 0xff4422 },
        { name: "Jupiter", r: 6, d: 90, speed: 0.002, color: 0xdda050 },
        { name: "Saturn", r: 5, d: 130, speed: 0.0009, color: 0xead6b8, hasRing: true }
    ];

    engine.objects.planets = [];

    planetsData.forEach(pData => {
        // 행성 생성
        const pMat = new THREE.MeshStandardMaterial({ color: pData.color, roughness: 0.8 });
        const pMesh = new THREE.Mesh(new THREE.SphereGeometry(pData.r, 32, 32), pMat);
        pMesh.position.x = pData.d;

        // 토성 고리
        if(pData.hasRing) {
            const ringGeo = new THREE.RingGeometry(pData.r * 1.5, pData.r * 2.5, 32);
            const ringMat = new THREE.MeshStandardMaterial({ color: pData.color, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            pMesh.add(ring);
        }

        // 지구의 달 추가 (핵심 디테일)
        if(pData.hasMoon) {
            const moonGeo = new THREE.SphereGeometry(0.5, 16, 16);
            const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            const moon = new THREE.Mesh(moonGeo, moonMat);
            moon.position.x = 4; // 지구로부터의 거리
            
            const moonPivot = new THREE.Group();
            moonPivot.add(moon);
            pMesh.add(moonPivot); // 달을 지구 메쉬에 종속시킴
            engine.objects.moonPivot = moonPivot;
        }

        const pivot = new THREE.Group();
        pivot.add(pMesh);
        engine.scene.add(pivot);

        // 궤도선
        const path = new THREE.Mesh(
            new THREE.RingGeometry(pData.d - 0.2, pData.d + 0.2, 64),
            new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide })
        );
        path.rotation.x = Math.PI / 2;
        engine.scene.add(path);

        engine.objects.planets.push({ pivot, mesh: pMesh, speed: pData.speed });
    });

    addStarfield(5000, 300);
    animateSolar();
}

function animateSolar() {
    if(engine.currentMode !== 'solar') return;
    engine.animationId = requestAnimationFrame(animateSolar);

    const speed = parseFloat(UI.solarSpeed.value);
    engine.timeOffset += speed / 100;
    UI.metricVal.textContent = `Day ${Math.floor(engine.timeOffset)}`;

    engine.objects.planets.forEach(p => {
        p.pivot.rotation.y += p.speed * speed;
        p.mesh.rotation.y += 0.05; // 행성 자전
    });

    // 달의 공전 (지구 주위)
    if(engine.objects.moonPivot) {
        engine.objects.moonPivot.rotation.y += 0.05 * speed;
    }

    engine.controls.update();
    engine.renderer.render(engine.scene, engine.camera);
}

// ================= [ 2. 3D 일식/월식 시뮬레이터 (그림자 연동 완벽 수정) ] =================
function buildEclipseSimulator() {
    UI.modeDisplay.textContent = "3D ECLIPSE DYNAMICS";
    UI.infoTitle.textContent = "SHADOW GEOMETRY";
    UI.infoDesc.textContent = "슬라이더를 조절하여 태양, 달, 지구의 3D 정렬을 맞춰보세요. Z축 오프셋이 0일 때 달의 본그림자(Umbra)가 지구에 닿아 개기일식이 발생합니다.";
    UI.metricTitle.textContent = "MOON Z-OFFSET";
    
    // 시점 설정 (지구 뒤에서 태양을 바라봄)
    engine.camera.position.set(0, 20, 100);
    engine.controls.target.set(0, 0, 0);

    // [핵심] 실제 그림자를 캐스팅하는 태양빛 설정
    engine.scene.add(new THREE.AmbientLight(0x111111));
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(0, 0, -500); // 태양은 아주 멀리 Z축 마이너스 방향에 위치
    sunLight.target.position.set(0, 0, 0);
    
    // 그림자 해상도 및 범위 설정
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 1000;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    engine.scene.add(sunLight);
    engine.scene.add(sunLight.target);

    // 시각용 태양 구체 (빛을 내는 역할만 함, 그림자는 위 DirectionalLight가 담당)
    const sunVis = new THREE.Mesh(
        new THREE.SphereGeometry(20, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    );
    sunVis.position.set(0, 0, -450);
    engine.scene.add(sunVis);

    // 1. 지구 (가운데 고정)
    const earth = new THREE.Mesh(
        new THREE.SphereGeometry(15, 64, 64),
        new THREE.MeshStandardMaterial({ color: 0x1e90ff, roughness: 0.6 })
    );
    earth.position.set(0, 0, 0);
    earth.receiveShadow = true; // 지구는 그림자를 받음!
    engine.scene.add(earth);

    // 2. 달 (사용자가 슬라이더로 움직일 객체)
    const moon = new THREE.Mesh(
        new THREE.SphereGeometry(4, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 1.0 })
    );
    moon.castShadow = true; // 달은 그림자를 만듦!
    moon.receiveShadow = true;
    engine.scene.add(moon);
    
    engine.objects.earth = earth;
    engine.objects.moon = moon;

    addStarfield(2000, 500);
    
    // 초기 위치 설정
    updateEclipsePhysics();
    animateEclipse();
}

// 일식 슬라이더 물리 업데이트 로직
function updateEclipsePhysics() {
    if(engine.currentMode !== 'eclipse') return;
    
    const zOffset = parseFloat(UI.eclipseOffset.value); // 부분일식용 위아래 조절
    const dist = parseFloat(UI.eclipseDist.value);      // 금환일식용 거리 조절
    
    // 달의 위치를 슬라이더 값에 따라 태양과 지구 사이(-Z 방향)에 배치
    engine.objects.moon.position.set(0, zOffset, -dist);
    
    // UI 업데이트
    UI.eclipseOffsetVal.textContent = zOffset === 0 ? "Perfect Alignment (Total)" : `Offset: ${zOffset}`;
    UI.eclipseDistVal.textContent = `${dist * 10000} km`;
    UI.metricVal.textContent = `${zOffset}`;
}

function animateEclipse() {
    if(engine.currentMode !== 'eclipse') return;
    engine.animationId = requestAnimationFrame(animateEclipse);
    
    // 지구 자전
    engine.objects.earth.rotation.y += 0.005;
    
    engine.controls.update();
    engine.renderer.render(engine.scene, engine.camera);
}


// ================= [ 3. JWST 심우주 관측소 (파티클 엔진) ] =================
function buildJWSTObservatory() {
    UI.modeDisplay.textContent = "JWST DEEP SPACE OBSERVATORY";
    UI.infoTitle.textContent = "INFRARED IMAGING (NIRCam)";
    UI.infoDesc.textContent = "제임스 웹 우주 망원경은 가시광선이 아닌 적외선을 포착하여, 우주 먼지 너머에 숨겨진 별들의 탄생(성운)과 수십억 광년 떨어진 은하의 빛을 관측합니다.";
    UI.metricTitle.textContent = "SENSOR STATUS";
    UI.metricVal.textContent = "STANDBY";
    UI.metricVal.style.color = "var(--color-jwst-red)";
    
    engine.camera.position.set(0, 0, 200);
    engine.controls.target.set(0, 0, 0);
    
    // 깊고 방대한 별 배경
    addStarfield(10000, 1000);

    engine.objects.nebulae = {};

    // 1. 카리나 성운 (Carina Nebula - 주황/푸른색 가스구름)
    engine.objects.nebulae['carina'] = createNebula(0xff5500, 0x00ffff, 8000, new THREE.Vector3(300, 100, -200));
    
    // 2. 스테판의 오중주 (Stephan's Quintet - 5개의 은하 은은한 노란색)
    engine.objects.nebulae['stephan'] = createNebula(0xffddaa, 0xddbb88, 5000, new THREE.Vector3(-400, -200, 100));
    
    // 3. SMACS 0723 (딥 필드 - 붉고 푸른 점들의 은하단)
    engine.objects.nebulae['smacs'] = createNebula(0xff2222, 0x4444ff, 6000, new THREE.Vector3(100, -300, -500), true);

    animateJWST();
}

// 절차적 성운(Nebula) 생성기 - 수학적 파티클 분산
function createNebula(color1, color2, particleCount, position, isGalaxyCluster = false) {
    const geo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);
    
    const colorObj1 = new THREE.Color(color1);
    const colorObj2 = new THREE.Color(color2);

    for(let i=0; i<particleCount * 3; i+=3) {
        // 가우스 분포에 가까운 중앙 집중형 난수 생성
        const x = (Math.random() - 0.5) * (Math.random() * 200);
        const y = (Math.random() - 0.5) * (Math.random() * 150);
        const z = (Math.random() - 0.5) * (Math.random() * 100);
        
        posArray[i] = x; posArray[i+1] = y; posArray[i+2] = z;

        // 색상 혼합
        const mixRatio = Math.random();
        const c = colorObj1.clone().lerp(colorObj2, mixRatio);
        colorArray[i] = c.r; colorArray[i+1] = c.g; colorArray[i+2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    const mat = new THREE.PointsMaterial({
        size: isGalaxyCluster ? 2.0 : 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending // 빛이 겹칠수록 밝아지는 효과
    });

    const nebula = new THREE.Points(geo, mat);
    nebula.position.copy(position);
    engine.scene.add(nebula);
    return nebula;
}

function animateJWST() {
    if(engine.currentMode !== 'jwst') return;
    engine.animationId = requestAnimationFrame(animateJWST);
    
    // 성운들이 아주 미세하게 회전하며 생동감 부여
    Object.values(engine.objects.nebulae).forEach(nebula => {
        nebula.rotation.y += 0.0005;
        nebula.rotation.x += 0.0002;
    });

    engine.controls.update();
    engine.renderer.render(engine.scene, engine.camera);
}


// ================= [ 유틸리티 및 이벤트 리스너 ] =================
function addStarfield(count, radius) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count*3; i++) { pos[i] = (Math.random() - 0.5) * radius * 2; }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({color: 0xffffff, size: 0.5, transparent:true, opacity:0.6});
    engine.scene.add(new THREE.Points(geo, mat));
}

function setupEventListeners() {
    // 1. 모드 스위치
    UI.modeSelect.addEventListener('change', (e) => switchMode(e.target.value));

    // 2. 태양계 슬라이더
    UI.solarSpeed.addEventListener('input', (e) => UI.solarSpeedVal.textContent = `${e.target.value}x`);

    // 3. 일식 슬라이더 (실시간 3D 업데이트 트리거)
    UI.eclipseOffset.addEventListener('input', updateEclipsePhysics);
    UI.eclipseDist.addEventListener('input', updateEclipsePhysics);

    // 4. JWST 망원경 조준 버튼
    UI.jwstScanBtn.addEventListener('click', () => {
        const targetKey = UI.jwstTarget.value;
        const targetObj = engine.objects.nebulae[targetKey];
        
        UI.metricVal.textContent = "SLEWING...";
        UI.metricVal.style.color = "var(--color-accent-gold)";
        
        // 간단한 카메라 이동 애니메이션 (현업에서는 GSAP 등 사용)
        let progress = 0;
        const startPos = engine.controls.target.clone();
        
        function panCamera() {
            progress += 0.02;
            if(progress <= 1) {
                engine.controls.target.lerpVectors(startPos, targetObj.position, progress);
                engine.camera.position.lerpVectors(engine.camera.position, 
                    new THREE.Vector3(targetObj.position.x, targetObj.position.y, targetObj.position.z + 100), 0.05);
                requestAnimationFrame(panCamera);
            } else {
                UI.metricVal.textContent = "DATA CAPTURED";
                UI.metricVal.style.color = "var(--color-status-green)";
            }
        }
        panCamera();
    });
}

// 런타임 시작
window.onload = initEngine;