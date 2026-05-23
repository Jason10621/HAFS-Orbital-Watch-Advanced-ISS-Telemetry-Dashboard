// =======================================================================
// HAFS Grand Observatory — Apple-Inspired Edition
// Features: Better images, loading screens for all modules, modern design
// =======================================================================

const App = { mode: 'lobby', scene: null, camera: null, renderer: null, controls: null };

// ── Loader helpers ──────────────────────────────────────────────────────
const Loader = {
    el: null, fill: null, text: null,
    show(msg = 'Loading...') {
        if (!this.el) {
            this.el   = document.getElementById('module-loader');
            this.fill = document.getElementById('loader-bar-fill');
            this.text = document.getElementById('loader-text');
        }
        this.text.textContent = msg;
        this.fill.style.width = '0%';
        this.el.style.display = 'flex';
        this.el.style.opacity = '1';
    },
    progress(pct) {
        if (this.fill) this.fill.style.width = Math.min(100, pct) + '%';
    },
    hide(delay = 400) {
        if (!this.el) return;
        this.progress(100);
        setTimeout(() => {
            this.el.style.opacity = '0';
            setTimeout(() => { this.el.style.display = 'none'; }, 600);
        }, delay);
    },
    // Animate progress bar without real loading (for particle engines)
    fake(duration = 1800, msg = 'Initializing...') {
        this.show(msg);
        const start = performance.now();
        const step = () => {
            const p = Math.min(99, ((performance.now() - start) / duration) * 100);
            this.progress(p);
            if (p < 99) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }
};

function setSafeImage(element, url, isContain = false) {
    element.style.backgroundImage = 'none';
    element.innerHTML = '<span style="color:#48484a; font-family:var(--font-mono); font-size:10px; letter-spacing:.06em;">CONNECTING...</span>';
    element.style.backgroundSize   = isContain ? 'contain' : 'cover';
    element.style.backgroundColor  = isContain ? '#050508' : '#0a0a0a';
    element.style.backgroundPosition = 'center';
    element.style.backgroundRepeat  = 'no-repeat';

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { element.style.backgroundImage = `url('${url}')`; element.innerHTML = ''; };
    img.onerror = () => {
        element.style.backgroundImage = 'linear-gradient(135deg, #111 0%, #1c1c1e 100%)';
        element.innerHTML = '<span style="color:#ff453a; font-family:var(--font-mono); font-size:10px; text-align:center;">SIGNAL LOST<br><span style="font-size:8px; color:#666;">Telemetry Offline</span></span>';
    };
    img.src = url;
}

// ── Database ─────────────────────────────────────────────────────────────
const DB = {
    deepspace: {
        'home': {
            name: "MILKY WAY (우리은하)", type: "galaxy",
            coords: new THREE.Vector3(0, 0, 0), color: 0x88bbff, count: 25000,
            img: "https://upload.wikimedia.org/wikipedia/commons/4/43/ESO-VLT-Laser-phot-33a-07.jpg",
            desc: "아름다운 대수 나선(Logarithmic Spiral) 구조를 가진 우리은하입니다.",
            details: "은하 중심의 거대한 벌지(Bulge)와 4개의 주요 나선팔로 이루어져 있습니다.",
            metrics: [
                {n: "암흑 물질", p: 85, c: "#221144"},
                {n: "항성/성단", p: 10, c: "#d4af37"},
                {n: "성간 가스/먼지", p: 5, c: "#2997ff"}
            ],
            subs: [
                {t: "Orion Arm (오리온 팔)", d: "태양계가 위치한 변두리 나선팔"},
                {t: "Galactic Bulge", d: "항성들이 밀집된 밝은 은하 중심부"}
            ]
        },
        'sgra': {
            name: "SAGITTARIUS A* (초거대 블랙홀)", type: "blackhole",
            coords: new THREE.Vector3(200, 50, -200),
            img: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Black_hole_-_Messier_87_crop_max_res.jpg",
            desc: "상대성 이론의 극치, 중심부의 초거대 블랙홀입니다.",
            details: "안정적인 케플러 궤도를 도는 강착 원반을 시뮬레이션했습니다."
        },
        'carina': {
            name: "CARINA NEBULA (용골자리 성운)", type: "nebula",
            coords: new THREE.Vector3(1200, 300, -800), color: 0xff5522, count: 20000,
            img: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Carina_Nebula_by_Webb_Telescope_%28high_res%29.jpg",
            desc: "지구에서 8,500광년 떨어진 거대한 별의 요람입니다.",
            details: "항성풍에 의해 깎여나간 거대한 기둥 형태의 성간운이 특징입니다.",
            metrics: [
                {n: "수소 가스", p: 70, c: "#ff4422"},
                {n: "헬륨", p: 25, c: "#ffaa55"},
                {n: "중원소 먼지", p: 5, c: "#665544"}
            ],
            subs: [
                {t: "Eta Carinae", d: "폭발 직전의 극대거성 쌍성계"},
                {t: "Cosmic Cliffs", d: "별이 탄생하는 우주 절벽"}
            ]
        },
        'smacs': {
            name: "SMACS 0723 (중력렌즈 은하단)", type: "cluster",
            coords: new THREE.Vector3(3500, -2000, -4000), color: 0x5544ff, count: 30000,
            img: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Webb%27s_First_Deep_Field.jpg",
            desc: "거대한 질량으로 시공간을 렌즈처럼 휘게 만드는 은하단입니다.",
            details: "은하단의 막대한 암흑물질이 시공간을 왜곡하여 배경 은하의 빛을 둥글게 늘려버립니다.",
            metrics: [
                {n: "암흑 물질", p: 90, c: "#111122"},
                {n: "은하단 간 가스", p: 8, c: "#aa44ff"},
                {n: "은하 질량", p: 2, c: "#ffffff"}
            ],
            subs: [{t: "Gravitational Arcs", d: "왜곡되어 원호 형태로 보이는 130억 년 전의 빛"}]
        }
    },
    solarsystem: [
        {
            id: "mercury", name: "MERCURY (수성)", r: 1.2, d: 20, speed: 0.047, color: 0xa9a9a9,
            img: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg",
            temp: "430°C", orb: "47.36",
            desc: "태양과 가장 가까운 암석 행성. 대기가 없어 일교차가 극심합니다.",
            details: "수많은 운석 충돌 구덩이가 보존되어 있습니다.",
            atm: [{n: "산소", p: 42, c: "#a3c2c2"}, {n: "나트륨", p: 29, c: "#ffdb4d"}, {n: "수소", p: 22, c: "#2997ff"}],
            internal: [{n: "맨틀", p: 20, c: "#b33c00"}, {n: "철 코어", p: 80, c: "#ff6600"}], moons: []
        },
        {
            id: "venus", name: "VENUS (금성)", r: 1.8, d: 30, speed: 0.035, color: 0xeeddcc,
            img: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg",
            temp: "471°C", orb: "35.02",
            desc: "극단적 온실효과를 지닌 태양계에서 가장 뜨거운 행성입니다.",
            details: "두꺼운 이산화탄소 대기와 황산 구름으로 덮여 지표면의 압력이 지구의 90배에 달합니다.",
            atm: [{n: "이산화탄소", p: 96, c: "#ff6666"}, {n: "질소", p: 3, c: "#c2c2d6"}],
            internal: [{n: "지각", p: 5, c: "#d4a373"}, {n: "맨틀", p: 65, c: "#a0522d"}, {n: "코어", p: 30, c: "#552500"}], moons: []
        },
        {
            id: "earth", name: "EARTH (지구)", r: 2.0, d: 45, speed: 0.029, color: 0x3366ff,
            img: "https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg",
            textureMap: "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
            bumpMap: "https://unpkg.com/three-globe/example/img/earth-topology.png",
            specularMap: "https://unpkg.com/three-globe/example/img/earth-water.png",
            cloudMap: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png",
            temp: "15°C", orb: "29.78",
            desc: "액체 상태의 물이 존재하는 생명체 거주 행성.",
            details: "다이나모 이론에 의한 자기장 형성으로 태양풍으로부터 생명체를 보호합니다.",
            atm: [{n: "질소", p: 78, c: "#8892b0"}, {n: "산소", p: 21, c: "#66ccff"}],
            internal: [{n: "지각", p: 5, c: "#8b7355"}, {n: "맨틀", p: 40, c: "#b33c00"}, {n: "외핵", p: 35, c: "#ff6600"}, {n: "내핵", p: 20, c: "#ffcc00"}],
            moons: [{id:"luna", name:"Luna (달)", r:0.5, d:4, speed:0.08, color:0xaaaaaa, img: "https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg", desc:"지구와의 조석 고정으로 항상 같은 면만 보입니다.", period: "27.3 Days", grav: "1.62 m/s²"}]
        },
        {
            id: "mars", name: "MARS (화성)", r: 1.5, d: 60, speed: 0.024, color: 0xff4422,
            img: "https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg",
            temp: "-63°C", orb: "24.07",
            desc: "산화철로 인해 붉게 보이며 과거 물이 흘렀던 흔적이 있는 행성.",
            details: "과거에는 두꺼운 대기가 있었으나 태양풍에 빼앗겼습니다.",
            atm: [{n: "이산화탄소", p: 95, c: "#ff6666"}, {n: "질소", p: 3, c: "#8892b0"}],
            internal: [{n: "지각", p: 10, c: "#cc4422"}, {n: "맨틀", p: 60, c: "#993311"}, {n: "코어", p: 30, c: "#551100"}],
            moons: [{id:"phobos", name:"Phobos", r:0.2, d:2, speed:0.15, color:0x888888, img: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Phobos_colour_2008.jpg", desc:"미래에 화성과 충돌할 운명인 감자 모양의 위성.", period: "0.3 Days", grav: "0.005 m/s²"}]
        },
        {
            id: "jupiter", name: "JUPITER (목성)", r: 5.5, d: 95, speed: 0.013, color: 0xdda050,
            img: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg",
            textureMap: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/jupiter.jpg",
            temp: "-110°C", orb: "13.07",
            desc: "태양계에서 가장 거대한 가스 행성.",
            details: "거대한 액체 금속 수소 바다가 초강력 자기장을 만듭니다.",
            atm: [{n: "수소", p: 89, c: "#4da6ff"}, {n: "헬륨", p: 10, c: "#ffcc99"}],
            internal: [{n: "기체 수소", p: 15, c: "#ffeebb"}, {n: "액체 금속 수소", p: 70, c: "#99aacc"}, {n: "암석 코어", p: 15, c: "#444444"}],
            moons: []
        },
        {
            id: "saturn", name: "SATURN (토성)", r: 4.5, d: 130, speed: 0.009, color: 0xead6b8,
            img: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg",
            temp: "-140°C", orb: "9.69",
            desc: "아름다운 고리 시스템을 가진 거대 가스 행성.",
            details: "밀도가 물보다 낮습니다.",
            atm: [{n: "수소", p: 96, c: "#4da6ff"}, {n: "헬륨", p: 3, c: "#ffcc99"}],
            internal: [{n: "기체 수소", p: 20, c: "#eeddcc"}, {n: "금속 수소", p: 60, c: "#8899aa"}, {n: "암석 코어", p: 20, c: "#333333"}],
            hasRing: true, ringColor: 0xeeddcc, ringInner: 1.5, ringOuter: 2.8, moons: []
        },
        {
            id: "uranus", name: "URANUS (천왕성)", r: 3.2, d: 165, speed: 0.006, color: 0x66ccff,
            img: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg",
            temp: "-195°C", orb: "6.81",
            desc: "자전축이 98도 기울어져 누운 채로 공전하는 얼음 거성.",
            details: "메탄 가스가 붉은빛을 흡수해 청록색으로 보입니다.",
            atm: [{n: "수소", p: 83, c: "#4da6ff"}, {n: "헬륨", p: 15, c: "#ffcc99"}, {n: "메탄", p: 2, c: "#66ffcc"}],
            internal: [{n: "대기", p: 20, c: "#66ccff"}, {n: "얼음 맨틀", p: 60, c: "#3388cc"}, {n: "암석 코어", p: 20, c: "#222222"}],
            hasRing: true, ringColor: 0x888888, ringInner: 1.3, ringOuter: 1.4, moons: []
        },
        {
            id: "neptune", name: "NEPTUNE (해왕성)", r: 3.0, d: 200, speed: 0.005, color: 0x3333cc,
            img: "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg",
            temp: "-200°C", orb: "5.43",
            desc: "초음속 강풍이 부는 태양계 최외곽 얼음 거성.",
            details: "태양에서 가장 멀리 떨어져 폭력적인 바람이 붑니다.",
            atm: [{n: "수소", p: 80, c: "#4da6ff"}, {n: "헬륨", p: 19, c: "#ffcc99"}, {n: "메탄", p: 1, c: "#66ffcc"}],
            internal: [{n: "가스 대기", p: 15, c: "#3333cc"}, {n: "얼음 맨틀", p: 65, c: "#222288"}, {n: "암석 코어", p: 20, c: "#111111"}],
            moons: []
        }
    ],
    probes: [
        {
            id: "voyager1", name: "VOYAGER 1", launch: "1977", target: "Interstellar Space",
            distAU: 162.5, vel: "17.0",
            img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Voyager_1%2C_2_spacecraft.png/800px-Voyager_1%2C_2_spacecraft.png",
            power: 40,
            desc: "인류 역사상 가장 멀리 떨어진 탐사선.",
            details: "성간 공간에 진입하여 태양계의 흔적을 뒤로 하고 나아가는 중입니다.",
            angle: Math.PI / 4
        },
        {
            id: "voyager2", name: "VOYAGER 2", launch: "1977", target: "Outer Planets",
            distAU: 136.0, vel: "15.3",
            img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Voyager_1%2C_2_spacecraft.png/800px-Voyager_1%2C_2_spacecraft.png",
            power: 38,
            desc: "외행성계 그랜드 투어 완수.",
            details: "목, 토, 천, 해왕성을 모두 방문한 위대한 업적을 달성했습니다.",
            angle: Math.PI * 1.8
        },
        {
            id: "pioneer10", name: "PIONEER 10", launch: "1972", target: "Jupiter",
            distAU: 135.0, vel: "11.9",
            img: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Pioneer_10_spacecraft.png",
            power: 0,
            desc: "최초로 소행성대를 통과한 개척선.",
            details: "현재 알데바란을 향해 관성 비행 중입니다.",
            angle: Math.PI * 1.3
        },
        {
            id: "newhorizons", name: "NEW HORIZONS", launch: "2006", target: "Pluto / Kuiper Belt",
            distAU: 58.0, vel: "13.8",
            img: "https://upload.wikimedia.org/wikipedia/commons/f/fb/New_Horizons_Transparent.png",
            power: 75,
            desc: "명왕성과 카이퍼 벨트를 탐사 중인 우주선.",
            details: "명왕성의 하트 모양 지형을 촬영했습니다.",
            angle: Math.PI
        },
        {
            id: "cassini", name: "CASSINI-HUYGENS", launch: "1997", target: "Saturn System",
            distAU: 9.5, vel: "Terminated",
            img: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Cassini_Saturn_Orbit_Insertion.jpg",
            power: 0,
            desc: "토성계의 비밀을 밝혀낸 위대한 궤도선.",
            details: "2017년 토성 대기로 뛰어들어 임무를 종료했습니다.",
            angle: Math.PI * 0.7
        }
    ]
};

const GenesisData = [
    {
        t: 0, epoch: "SINGULARITY", age: "0 Years", temp: "10³² K",
        size: "1.6 × 10⁻³⁵ m", comp: "Unified Superforce", redshift: "Infinite",
        desc: "빅뱅. 모든 물질과 에너지가 한 점에 응축된 상태입니다.",
        details: "공간과 시간의 개념이 탄생하는 순간입니다.",
        img: "https://upload.wikimedia.org/wikipedia/commons/6/6f/CMB_Timeline300_no_WMAP.jpg"
    },
    {
        t: 30, epoch: "RECOMBINATION", age: "380,000 Years", temp: "3,000 K",
        size: "~42 Million L.Y.", comp: "Radiation", redshift: "z ≈ 1,100",
        desc: "우주가 식으며 최초의 빛이 퍼져나갑니다.",
        details: "우주 배경 복사가 형성된 순간입니다.",
        img: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Ilc_9yr_moll4096.png"
    },
    {
        t: 100, epoch: "PRESENT", age: "13.8 Billion Years", temp: "2.73 K",
        size: "93 Billion L.Y.", comp: "Dark Energy (68%)", redshift: "z = 0",
        desc: "암흑 물질의 중력 뼈대를 따라 수많은 은하가 형성되었습니다.",
        details: "암흑 에너지가 팽창을 가속하고 있습니다.",
        img: "https://upload.wikimedia.org/wikipedia/commons/4/43/ESO-VLT-Laser-phot-33a-07.jpg"
    }
];

const DSEngine = { objects: {}, bh: { eh: null, ps: null, disk: null, speeds: [], count: 35000, geometry: null } };
const SSEngine = { planets: [], moons: [], tracked: null, speedMulti: 1.0 };
const PREngine = { probes: [], tracked: null, ism: null, heliosphere: null };
const GNEngine = { particles: null, pos0: null, pos1: null, pos2: null, count: 50000 };

const DOM = {
    lobby: document.getElementById('ui-lobby'),
    btnHub: document.getElementById('btn-return-hub'),
    uiDS: document.getElementById('ui-deepspace'),
    uiSS: document.getElementById('ui-solarsystem'),
    uiPR: document.getElementById('ui-probes'),
    uiGN: document.getElementById('ui-genesis'),

    dsTargets: document.querySelectorAll('.ds-target'),
    dsInfo: document.getElementById('ds-info'),
    dsTitle: document.getElementById('ds-title'),
    dsMedia: document.getElementById('ds-media'),
    dsDesc: document.getElementById('ds-desc'),
    dsDetails: document.getElementById('ds-details'),
    dsNormal: document.getElementById('ds-normal-info'),
    dsSubList: document.getElementById('ds-sub-list'),
    dsBHCtrl: document.getElementById('ds-bh-controls'),
    bhMass: document.getElementById('bh-mass'),
    bhDist: document.getElementById('bh-dist'),
    dsMetricsBar: document.getElementById('ds-metrics-bar'),
    dsMetricsLegend: document.getElementById('ds-metrics-legend'),

    ssList: document.getElementById('ss-planet-list'),
    ssSpeed: document.getElementById('ss-speed'),
    ssBtnReset: document.getElementById('btn-ss-reset'),
    ssInfo: document.getElementById('ss-info'),
    ssName: document.getElementById('ss-name'),
    ssMedia: document.getElementById('ss-media'),
    ssDesc: document.getElementById('ss-desc'),
    ssDetails: document.getElementById('ss-details'),
    ssTemp: document.getElementById('ss-temp'),
    ssOrb: document.getElementById('ss-orb'),
    ssCompBar: document.getElementById('ss-comp-bar'),
    ssCompLegend: document.getElementById('ss-comp-legend'),
    ssInternalBar: document.getElementById('ss-internal-bar'),
    ssInternalLegend: document.getElementById('ss-internal-legend'),
    ssMoonsCont: document.getElementById('ss-moons-container'),
    ssMoonsList: document.getElementById('ss-moons-list'),
    ssPlanetData: document.getElementById('ss-planet-data'),
    ssMoonData: document.getElementById('ss-moon-data'),
    ssMoonPeriod: document.getElementById('ss-moon-period'),
    ssMoonGrav: document.getElementById('ss-moon-grav'),

    prList: document.getElementById('pr-list'),
    btnPrReset: document.getElementById('btn-pr-reset'),
    prInfo: document.getElementById('pr-info'),
    prName: document.getElementById('pr-name'),
    prMedia: document.getElementById('pr-media'),
    prDesc: document.getElementById('pr-desc'),
    prDetails: document.getElementById('pr-details'),
    prLaunch: document.getElementById('pr-launch'),
    prTarget: document.getElementById('pr-target'),
    prPowerBar: document.getElementById('pr-power-bar'),
    prDist: document.getElementById('pr-dist'),
    prVel: document.getElementById('pr-vel'),
    prDelay: document.getElementById('pr-delay'),

    gnTimeline: document.getElementById('gn-timeline'),
    gnEpoch: document.getElementById('gn-epoch'),
    gnAge: document.getElementById('gn-age'),
    gnTemp: document.getElementById('gn-temp'),
    gnMedia: document.getElementById('gn-media'),
    gnDesc: document.getElementById('gn-desc'),
    gnDetails: document.getElementById('gn-details'),
    gnSize: document.getElementById('gn-size'),
    gnComp: document.getElementById('gn-comp'),
    gnRedshift: document.getElementById('gn-redshift')
};

// ── Core ─────────────────────────────────────────────────────────────────
function initGlobalCore() {
    const container = document.getElementById('three-canvas');
    App.scene = new THREE.Scene();
    App.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 25000);
    App.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    App.renderer.setSize(window.innerWidth, window.innerHeight);
    App.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(App.renderer.domElement);
    App.controls = new THREE.OrbitControls(App.camera, App.renderer.domElement);
    App.controls.enableDamping = true; App.controls.dampingFactor = 0.05;
    buildLobbyBackground();
    window.addEventListener('resize', () => {
        App.camera.aspect = window.innerWidth / window.innerHeight;
        App.camera.updateProjectionMatrix();
        App.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    animate();
}

function clearScene() {
    while (App.scene.children.length > 0) App.scene.remove(App.scene.children[0]);
    DSEngine.objects = {}; DSEngine.bh.disk = null; DSEngine.bh.geometry = null;
    SSEngine.planets = []; SSEngine.moons = []; SSEngine.tracked = null;
    PREngine.probes = []; PREngine.tracked = null; PREngine.ism = null; PREngine.heliosphere = null;
    GNEngine.particles = null;
}

function buildLobbyBackground() {
    App.scene.fog = new THREE.FogExp2(0x000000, 0.0005);
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(6000 * 3);
    for (let i = 0; i < 6000 * 3; i++) bgPos[i] = (Math.random() - 0.5) * 1000;
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    App.scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({ color: 0x556677, size: 1.5 })));
    App.camera.position.set(0, 0, 500); App.controls.target.set(0, 0, 0);
}

// ── [ 1 ] DEEP SPACE ────────────────────────────────────────────────────
function launchDeepSpace() {
    App.mode = 'deepspace';
    Loader.fake(1400, 'Rendering Deep Space Particles...');
    clearScene();
    App.scene.fog = new THREE.FogExp2(0x000000, 0.0001);

    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(15000 * 3);
    for (let i = 0; i < 15000 * 3; i++) bgPos[i] = (Math.random() - 0.5) * 15000;
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    App.scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({ color: 0x445566, size: 1.5 })));

    for (const [key, data] of Object.entries(DB.deepspace)) {
        if (data.type === 'galaxy') {
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(data.count * 3);
            const col = new Float32Array(data.count * 3);
            const baseCol = new THREE.Color(data.color); const arms = 4;
            for (let i = 0; i < data.count; i++) {
                let r = Math.random() * 300;
                let armOffset = (i % arms) * (Math.PI * 2 / arms);
                let theta = r * 0.03 + armOffset + (Math.random() - 0.5) * 0.8;
                pos[i*3] = Math.cos(theta) * r; pos[i*3+1] = (Math.random()-0.5) * (1500/(r*r+50)); pos[i*3+2] = Math.sin(theta) * r;
                const mix = new THREE.Color(0xffeedd).lerp(baseCol, r/300);
                col[i*3] = mix.r; col[i*3+1] = mix.g; col[i*3+2] = mix.b;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
            cloud.position.copy(data.coords); App.scene.add(cloud); DSEngine.objects[key] = cloud;
        } else if (data.type === 'nebula' || data.type === 'cluster') {
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(data.count * 3);
            const col = new Float32Array(data.count * 3);
            const baseCol = new THREE.Color(data.color);
            for (let i = 0; i < data.count * 3; i += 3) {
                const r = Math.pow(Math.random(), 2), t = Math.random()*Math.PI*2, p = Math.acos(2*Math.random()-1);
                const spread = 350;
                pos[i] = r*Math.sin(p)*Math.cos(t)*spread; pos[i+1] = r*Math.sin(p)*Math.sin(t)*(spread*0.4); pos[i+2] = r*Math.cos(p)*spread;
                const mix = new THREE.Color(0xffffff).lerp(baseCol, r);
                col[i] = mix.r; col[i+1] = mix.g; col[i+2] = mix.b;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
            cloud.position.copy(data.coords); App.scene.add(cloud); DSEngine.objects[key] = cloud;
        } else if (data.type === 'blackhole') {
            const bhGroup = new THREE.Group();
            DSEngine.bh.eh = new THREE.Mesh(new THREE.SphereGeometry(1,64,64), new THREE.MeshBasicMaterial({color:0x000000}));
            DSEngine.bh.ps = new THREE.Mesh(new THREE.SphereGeometry(1.5,64,64), new THREE.MeshBasicMaterial({color:0xff453a,transparent:true,opacity:0.12,blending:THREE.AdditiveBlending,side:THREE.BackSide}));
            bhGroup.add(DSEngine.bh.eh); bhGroup.add(DSEngine.bh.ps);
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(DSEngine.bh.count * 3);
            const col = new Float32Array(DSEngine.bh.count * 3);
            for (let i = 0; i < DSEngine.bh.count; i++) {
                const r = 1.6 + Math.pow(Math.random(),2)*25, t = Math.random()*Math.PI*2;
                pos[i*3] = Math.cos(t)*r; pos[i*3+1] = (Math.random()-0.5)*(1.5/Math.sqrt(r)); pos[i*3+2] = Math.sin(t)*r;
                DSEngine.bh.speeds[i] = 2.5 / Math.pow(r,1.5);
                col[i*3] = 1.0; col[i*3+1] = 0.5; col[i*3+2] = 0.0;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
            geo.setAttribute('color', new THREE.BufferAttribute(col,3));
            DSEngine.bh.geometry = geo;
            DSEngine.bh.disk = new THREE.Points(geo, new THREE.PointsMaterial({size:0.25,vertexColors:true,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false}));
            bhGroup.add(DSEngine.bh.disk); bhGroup.position.copy(data.coords); bhGroup.rotation.x = 0.15;
            App.scene.add(bhGroup); DSEngine.objects[key] = bhGroup;
        }
    }
    App.camera.position.set(0,0,500); App.controls.target.set(0,0,0);

    setTimeout(() => { Loader.hide(200); dsWarpTo('home'); }, 1200);
}

function dsWarpTo(targetKey) {
    const data = DB.deepspace[targetKey]; const targetObj = DSEngine.objects[targetKey];
    DOM.dsInfo.style.opacity = "0";
    const zoomOffset = data.type === 'blackhole' ? 50 : 450;
    const endPos = new THREE.Vector3(targetObj.position.x, targetObj.position.y+(zoomOffset/4), targetObj.position.z+zoomOffset);
    new TWEEN.Tween(App.camera.position).to(endPos, 3500).easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => App.camera.lookAt(targetObj.position))
        .onComplete(() => {
            App.controls.target.copy(targetObj.position);
            DOM.dsTitle.textContent = data.name;
            setSafeImage(DOM.dsMedia, data.img, false);
            DOM.dsDesc.textContent = data.desc; DOM.dsDetails.textContent = data.details;
            if (data.type === 'blackhole') {
                DOM.dsNormal.style.display = 'none'; DOM.dsBHCtrl.style.display = 'block'; dsUpdatePhysics();
            } else {
                DOM.dsNormal.style.display = 'block'; DOM.dsBHCtrl.style.display = 'none';
                DOM.dsMetricsBar.innerHTML = ''; DOM.dsMetricsLegend.innerHTML = '';
                if (data.metrics) data.metrics.forEach(c => {
                    DOM.dsMetricsBar.innerHTML += `<div class="comp-segment" style="width:${c.p}%;background:${c.c};border-radius:2px;"></div>`;
                    DOM.dsMetricsLegend.innerHTML += `<div class="legend-item"><div class="legend-color" style="background:${c.c};"></div>${c.n}</div>`;
                });
                DOM.dsSubList.innerHTML = '';
                data.subs.forEach(s => { DOM.dsSubList.innerHTML += `<li><span class="sub-title">${s.t}</span><span class="sub-detail">${s.d}</span></li>`; });
            }
            DOM.dsInfo.style.opacity = "1";
        }).start();
}

function dsUpdatePhysics() {
    const mass = parseFloat(DOM.bhMass.value), dist = parseFloat(DOM.bhDist.value);
    const rs = mass * 3.0, scale = Math.max(1, mass/10);
    if (DSEngine.bh.eh) { DSEngine.bh.eh.scale.set(scale,scale,scale); DSEngine.bh.ps.scale.set(scale,scale,scale); DSEngine.bh.disk.scale.set(scale,scale,scale); }
    const td = (dist*rs > rs) ? 1/Math.sqrt(1-(rs/(dist*rs))) : 0;
    document.getElementById('bh-mass-val').textContent = mass.toFixed(1);
    document.getElementById('bh-dist-val').textContent = `${dist} Rs`;
    document.getElementById('bh-rs').textContent = `${rs.toFixed(2)} km`;
    document.getElementById('bh-time').textContent = td > 0 ? td.toFixed(4)+'x' : 'INFINITE';
}

// ── [ 2 ] SOLAR SYSTEM ───────────────────────────────────────────────────
function launchSolarSystem() {
    App.mode = 'solarsystem';
    clearScene();
    App.scene.fog = new THREE.FogExp2(0x000000, 0.0005);

    const loaderScreen = document.getElementById('module-loader');
    const loaderFill   = document.getElementById('loader-bar-fill');
    const loaderText   = document.getElementById('loader-text');
    loaderText.textContent = 'Loading Planetary Textures...';
    loaderFill.style.width = '0%';
    loaderScreen.style.display = 'flex'; loaderScreen.style.opacity = '1';

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (url, loaded, total) => { loaderFill.style.width = (loaded/total*100)+'%'; };
    loadingManager.onLoad = () => {
        setTimeout(() => { loaderScreen.style.opacity = '0'; setTimeout(() => loaderScreen.style.display='none', 600); }, 400);
    };

    const textureLoader = new THREE.TextureLoader(loadingManager);
    const starsGeo = new THREE.BufferGeometry();
    const starsPos = new Float32Array(5000*3);
    for (let i = 0; i < 5000*3; i++) starsPos[i] = (Math.random()-0.5)*2000;
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos,3));
    App.scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({color:0xaaaaaa,size:1.2})));

    App.scene.add(new THREE.Mesh(new THREE.SphereGeometry(8,64,64), new THREE.MeshBasicMaterial({color:0xffdd55})));
    App.scene.add(new THREE.PointLight(0xffffff,2.5,1000));
    App.scene.add(new THREE.AmbientLight(0x222222));

    DOM.ssList.innerHTML = '';
    DB.solarsystem.forEach(pData => {
        const matConfig = { color: pData.color, roughness: 0.7, metalness: 0.1 };
        if (pData.textureMap) matConfig.map = textureLoader.load(pData.textureMap);
        if (pData.bumpMap) { matConfig.bumpMap = textureLoader.load(pData.bumpMap); matConfig.bumpScale = 0.05; }
        if (pData.specularMap) { matConfig.roughnessMap = textureLoader.load(pData.specularMap); matConfig.roughness = 0.5; }
        const pMat = new THREE.MeshStandardMaterial(matConfig);
        const pMesh = new THREE.Mesh(new THREE.SphereGeometry(pData.r,64,64), pMat);
        pMesh.position.x = pData.d;

        let cloudMesh = null;
        if (pData.cloudMap) {
            const cloudMat = new THREE.MeshStandardMaterial({map:textureLoader.load(pData.cloudMap),transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false});
            cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(pData.r*1.02,64,64), cloudMat);
            pMesh.add(cloudMesh);
        }
        if (pData.hasRing) {
            const ring = new THREE.Mesh(new THREE.RingGeometry(pData.r*pData.ringInner,pData.r*pData.ringOuter,64), new THREE.MeshStandardMaterial({color:pData.ringColor,side:THREE.DoubleSide,transparent:true,opacity:0.7}));
            ring.rotation.x = Math.PI/2; pMesh.add(ring);
        }
        if (pData.moons && pData.moons.length > 0) {
            pData.moons.forEach(mData => {
                const mMesh = new THREE.Mesh(new THREE.SphereGeometry(mData.r,32,32), new THREE.MeshStandardMaterial({color:mData.color}));
                mMesh.position.x = mData.d;
                const mPivot = new THREE.Group(); mPivot.add(mMesh); pMesh.add(mPivot);
                const mOrbit = new THREE.Mesh(new THREE.RingGeometry(mData.d-0.05,mData.d+0.05,64), new THREE.MeshBasicMaterial({color:0x333333,side:THREE.DoubleSide,transparent:true,opacity:0.4}));
                mOrbit.rotation.x = Math.PI/2; pMesh.add(mOrbit);
                SSEngine.moons.push({id:mData.id,pivot:mPivot,mesh:mMesh,speed:mData.speed,parent:pMesh,data:mData});
            });
        }
        const pivot = new THREE.Group(); pivot.add(pMesh); App.scene.add(pivot);
        const orbit = new THREE.Mesh(new THREE.RingGeometry(pData.d-0.1,pData.d+0.1,128), new THREE.MeshBasicMaterial({color:0x222222,side:THREE.DoubleSide}));
        orbit.rotation.x = Math.PI/2; App.scene.add(orbit);
        SSEngine.planets.push({id:pData.id,pivot,mesh:pMesh,clouds:cloudMesh,speed:pData.speed,data:pData,type:'planet'});

        const btn = document.createElement('button'); btn.className = 'target-btn ss-target';
        btn.innerHTML = `<span class="btn-title" style="display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#${pData.color.toString(16).padStart(6,'0')};flex-shrink:0;"></span>${pData.name}</span>`;
        btn.onclick = () => {
            document.querySelectorAll('.ss-target').forEach(b => b.classList.remove('active')); btn.classList.add('active');
            SSEngine.tracked = SSEngine.planets.find(p => p.id === pData.id);
            ssUpdatePlanetInfo(pData, false);
        };
        DOM.ssList.appendChild(btn);
    });
    App.camera.position.set(0,150,200); App.controls.target.set(0,0,0);
}

function ssUpdatePlanetInfo(data, isMoon=false) {
    DOM.ssName.textContent = data.name;
    setSafeImage(DOM.ssMedia, data.img, false);
    DOM.ssDesc.textContent = isMoon ? `[위성 데이터] ${data.desc}` : data.desc;
    DOM.ssDetails.textContent = isMoon ? "" : data.details;
    if (isMoon) {
        DOM.ssPlanetData.style.display='none'; DOM.ssMoonData.style.display='grid';
        DOM.ssMoonPeriod.textContent=data.period; DOM.ssMoonGrav.textContent=data.grav;
    } else {
        DOM.ssMoonData.style.display='none'; DOM.ssPlanetData.style.display='grid';
        DOM.ssTemp.textContent=data.temp; DOM.ssOrb.textContent=`${data.orb} km/s`;
    }
    DOM.ssCompBar.innerHTML=''; DOM.ssCompLegend.innerHTML='';
    if (data.atm) data.atm.forEach(c => {
        DOM.ssCompBar.innerHTML += `<div class="comp-segment" style="width:${c.p}%;background:${c.c};"></div>`;
        DOM.ssCompLegend.innerHTML += `<div class="legend-item"><div class="legend-color" style="background:${c.c};"></div>${c.n}</div>`;
    });
    DOM.ssInternalBar.innerHTML=''; DOM.ssInternalLegend.innerHTML='';
    if (data.internal) data.internal.forEach(layer => {
        DOM.ssInternalBar.innerHTML += `<div class="internal-segment" style="height:${layer.p*1.5}px;background:${layer.c};border-bottom:1px solid rgba(0,0,0,0.4);">${layer.p}%</div>`;
        DOM.ssInternalLegend.innerHTML += `<div class="legend-item"><div class="legend-color" style="background:${layer.c};"></div>${layer.n}</div>`;
    });
    if (!isMoon && data.moons && data.moons.length > 0) {
        DOM.ssMoonsCont.style.display='block'; DOM.ssMoonsList.innerHTML='';
        data.moons.forEach(mData => {
            const btn = document.createElement('button'); btn.className='moon-btn'; btn.textContent=mData.name;
            btn.onclick = () => {
                document.querySelectorAll('.moon-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
                SSEngine.tracked = SSEngine.moons.find(m=>m.id===mData.id);
                ssUpdatePlanetInfo(mData, true);
            };
            DOM.ssMoonsList.appendChild(btn);
        });
    } else if (!isMoon) {
        DOM.ssMoonsCont.style.display='none';
    }
    DOM.ssInfo.style.opacity="1";
}

// ── [ 3 ] INTERSTELLAR PROBES ────────────────────────────────────────────
function launchProbes() {
    App.mode = 'probes';
    Loader.fake(1600, 'Mapping Interstellar Trajectories...');
    clearScene();
    App.scene.fog = new THREE.FogExp2(0x010205, 0.0001);
    const scaleAU = 10;

    const ismGeo = new THREE.BufferGeometry();
    const ismCount = 15000, ismPos = new Float32Array(ismCount*3), ismCol = new Float32Array(ismCount*3);
    for (let i = 0; i < ismCount; i++) {
        const r = 120*scaleAU + Math.random()*200*scaleAU, theta = Math.random()*Math.PI*2, phi = Math.acos(2*Math.random()-1);
        ismPos[i*3]=r*Math.sin(phi)*Math.cos(theta); ismPos[i*3+1]=r*Math.sin(phi)*Math.sin(theta); ismPos[i*3+2]=r*Math.cos(phi);
        ismCol[i*3]=0.1+Math.random()*0.2; ismCol[i*3+1]=0.2+Math.random()*0.3; ismCol[i*3+2]=0.6+Math.random()*0.4;
    }
    ismGeo.setAttribute('position', new THREE.BufferAttribute(ismPos,3));
    ismGeo.setAttribute('color', new THREE.BufferAttribute(ismCol,3));
    PREngine.ism = new THREE.Points(ismGeo, new THREE.PointsMaterial({size:2.0,vertexColors:true,transparent:true,opacity:0.5,blending:THREE.AdditiveBlending}));
    App.scene.add(PREngine.ism);

    const helioGeo = new THREE.SphereGeometry(120*scaleAU,64,64);
    const helioMat = new THREE.MeshBasicMaterial({color:0x2255ff,transparent:true,opacity:0.03,blending:THREE.AdditiveBlending,side:THREE.BackSide,wireframe:true});
    PREngine.heliosphere = new THREE.Mesh(helioGeo, helioMat); App.scene.add(PREngine.heliosphere);

    const gridGroup = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({color:0x1a2233,transparent:true,opacity:0.5});
    for (let i=1; i<=15; i++) {
        const r=i*10*scaleAU, pts=[];
        for (let th=0; th<=Math.PI*2; th+=0.1) pts.push(new THREE.Vector3(Math.cos(th)*r,0,Math.sin(th)*r));
        pts.push(pts[0]);
        gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    for (let i=0; i<12; i++) {
        const th=(Math.PI*2/12)*i;
        gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(Math.cos(th)*150*scaleAU,0,Math.sin(th)*150*scaleAU)]), gridMat));
    }
    App.scene.add(gridGroup);
    App.scene.add(new THREE.Mesh(new THREE.SphereGeometry(2,32,32), new THREE.MeshBasicMaterial({color:0xffdd99})));
    App.scene.add(new THREE.AmbientLight(0xffffff,0.5));

    DOM.prList.innerHTML='';
    DB.probes.forEach(pData => {
        const dist=pData.distAU*scaleAU, x=Math.cos(pData.angle)*dist, z=Math.sin(pData.angle)*dist;
        const pGroup=new THREE.Group();
        const core=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,1.2), new THREE.MeshBasicMaterial({color:0xbf5af2,wireframe:true}));
        const dish=new THREE.Mesh(new THREE.RingGeometry(1.5,2.5,16), new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:0.4}));
        dish.rotation.x=Math.PI/2; pGroup.add(core); pGroup.add(dish);
        pGroup.position.set(x,0,z); App.scene.add(pGroup);

        const points=[new THREE.Vector3(0,0,0)];
        if (pData.id==='voyager1') {
            points.push(new THREE.Vector3(Math.cos(pData.angle-0.4)*52,0,Math.sin(pData.angle-0.4)*52));
            points.push(new THREE.Vector3(Math.cos(pData.angle-0.1)*95,0,Math.sin(pData.angle-0.1)*95));
        } else if (pData.id==='voyager2') {
            points.push(new THREE.Vector3(Math.cos(pData.angle-0.5)*52,0,Math.sin(pData.angle-0.5)*52));
            points.push(new THREE.Vector3(Math.cos(pData.angle-0.3)*95,0,Math.sin(pData.angle-0.3)*95));
            points.push(new THREE.Vector3(Math.cos(pData.angle-0.1)*192,0,Math.sin(pData.angle-0.1)*192));
        } else if (pData.id.includes('pioneer')) {
            points.push(new THREE.Vector3(Math.cos(pData.angle-0.3)*52,0,Math.sin(pData.angle-0.3)*52));
        } else {
            points.push(new THREE.Vector3(Math.cos(pData.angle)*dist*0.5,0,Math.sin(pData.angle)*dist*0.5));
        }
        points.push(new THREE.Vector3(x,0,z));
        const curve=new THREE.CatmullRomCurve3(points);
        const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)), new THREE.LineBasicMaterial({color:0xbf5af2,transparent:true,opacity:0.35}));
        App.scene.add(line);
        PREngine.probes.push({id:pData.id,mesh:pGroup,data:pData});

        const btn=document.createElement('button'); btn.className='target-btn pr-target';
        btn.innerHTML=`<span class="btn-title" style="color:#bf5af2;">${pData.name}</span>`;
        btn.onclick=()=>{
            document.querySelectorAll('.pr-target').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
            PREngine.tracked=PREngine.probes.find(p=>p.id===pData.id);
            prUpdateInfo(pData);
        };
        DOM.prList.appendChild(btn);
    });
    App.camera.position.set(0,800,1200); App.controls.target.set(0,0,0);
    setTimeout(() => Loader.hide(200), 1400);
}

function prUpdateInfo(pData) {
    DOM.prName.textContent=pData.name;
    setSafeImage(DOM.prMedia, pData.img, pData.img.includes('.png'));
    DOM.prDesc.textContent=pData.desc; DOM.prDetails.textContent=pData.details;
    DOM.prLaunch.textContent=pData.launch; DOM.prTarget.textContent=pData.target;
    DOM.prPowerBar.style.width=`${pData.power}%`;
    DOM.prPowerBar.style.background=pData.power>30?'#bf5af2':'#ff453a';
    DOM.prDist.textContent=`${pData.distAU} AU`;
    DOM.prVel.textContent=`${pData.vel} km/s`;
    const distKm=pData.distAU*1.496e8, seconds=distKm/300000;
    DOM.prDelay.textContent=`${Math.floor(seconds/3600)}h ${Math.floor((seconds%3600)/60)}m`;
    DOM.prInfo.style.opacity="1";
    const tPos=PREngine.tracked.mesh.position;
    new TWEEN.Tween(App.controls.target).to(tPos,1500).start();
    const dir=tPos.clone().normalize().multiplyScalar(-20);
    new TWEEN.Tween(App.camera.position).to(tPos.clone().add(new THREE.Vector3(0,10,0)).add(dir),1500).start();
}

// ── [ 4 ] GENESIS ENGINE ─────────────────────────────────────────────────
function launchGenesis() {
    App.mode = 'genesis';
    Loader.fake(2000, 'Simulating Big Bang Cosmology...');
    clearScene();
    App.scene.fog = new THREE.FogExp2(0x000000, 0.0002);

    const geo=new THREE.BufferGeometry();
    GNEngine.pos0=new Float32Array(GNEngine.count*3);
    GNEngine.pos1=new Float32Array(GNEngine.count*3);
    GNEngine.pos2=new Float32Array(GNEngine.count*3);
    const currentPos=new Float32Array(GNEngine.count*3);
    const colors=new Float32Array(GNEngine.count*3);

    for (let i=0; i<GNEngine.count; i++) {
        GNEngine.pos0[i*3]=(Math.random()-0.5)*2; GNEngine.pos0[i*3+1]=(Math.random()-0.5)*2; GNEngine.pos0[i*3+2]=(Math.random()-0.5)*2;
        const u=Math.random(),v=Math.random(),theta=2*Math.PI*u,phi=Math.acos(2*v-1),r1=Math.cbrt(Math.random())*200;
        GNEngine.pos1[i*3]=r1*Math.sin(phi)*Math.cos(theta); GNEngine.pos1[i*3+1]=r1*Math.sin(phi)*Math.sin(theta); GNEngine.pos1[i*3+2]=r1*Math.cos(phi);
        const r2=Math.random()*400,t2=Math.random()*Math.PI*2,p2=Math.acos(2*Math.random()-1);
        GNEngine.pos2[i*3]=r2*Math.sin(p2)*Math.cos(t2)*(1+Math.sin(t2*3)*Math.cos(p2*2)*0.5);
        GNEngine.pos2[i*3+1]=r2*Math.sin(p2)*Math.sin(t2)*(1+Math.cos(t2*2)*Math.sin(p2*3)*0.5);
        GNEngine.pos2[i*3+2]=r2*Math.cos(p2)*(1+Math.sin(p2*4)*0.5);
        currentPos[i*3]=GNEngine.pos0[i*3]; currentPos[i*3+1]=GNEngine.pos0[i*3+1]; currentPos[i*3+2]=GNEngine.pos0[i*3+2];
        colors[i*3]=1.0; colors[i*3+1]=1.0; colors[i*3+2]=1.0;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(currentPos,3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
    GNEngine.particles=new THREE.Points(geo, new THREE.PointsMaterial({size:1.2,vertexColors:true,transparent:true,opacity:0.8,blending:THREE.AdditiveBlending}));
    App.scene.add(GNEngine.particles);
    App.camera.position.set(0,0,300); App.controls.target.set(0,0,0);
    gnUpdateTimeline(0);
    setTimeout(() => Loader.hide(200), 1800);
}

function gnUpdateTimeline(val) {
    if (!GNEngine.particles) return;
    let stageInfo;
    if (val<15) stageInfo=GenesisData[0];
    else if (val<70) stageInfo=GenesisData[1];
    else stageInfo=GenesisData[2];
    DOM.gnEpoch.textContent=stageInfo.epoch; DOM.gnAge.textContent=stageInfo.age; DOM.gnTemp.textContent=stageInfo.temp;
    DOM.gnDesc.textContent=stageInfo.desc; DOM.gnDetails.textContent=stageInfo.details;
    setSafeImage(DOM.gnMedia, stageInfo.img, false);
    DOM.gnSize.textContent=stageInfo.size; DOM.gnComp.textContent=stageInfo.comp; DOM.gnRedshift.textContent=stageInfo.redshift;

    const positions=GNEngine.particles.geometry.attributes.position.array;
    const colors=GNEngine.particles.geometry.attributes.color.array;
    for (let i=0; i<GNEngine.count; i++) {
        let px,py,pz,cr,cg,cb;
        if (val<=30) {
            let ratio=val/30; ratio=1-Math.pow(1-ratio,3);
            px=GNEngine.pos0[i*3]+(GNEngine.pos1[i*3]-GNEngine.pos0[i*3])*ratio;
            py=GNEngine.pos0[i*3+1]+(GNEngine.pos1[i*3+1]-GNEngine.pos0[i*3+1])*ratio;
            pz=GNEngine.pos0[i*3+2]+(GNEngine.pos1[i*3+2]-GNEngine.pos0[i*3+2])*ratio;
            cr=1.0; cg=1.0-ratio*0.5; cb=1.0-ratio;
        } else {
            const ratio=(val-30)/70;
            px=GNEngine.pos1[i*3]+(GNEngine.pos2[i*3]-GNEngine.pos1[i*3])*ratio;
            py=GNEngine.pos1[i*3+1]+(GNEngine.pos2[i*3+1]-GNEngine.pos1[i*3+1])*ratio;
            pz=GNEngine.pos1[i*3+2]+(GNEngine.pos2[i*3+2]-GNEngine.pos1[i*3+2])*ratio;
            cr=1.0-ratio*0.5; cg=0.5-ratio*0.3; cb=ratio;
        }
        positions[i*3]=px; positions[i*3+1]=py; positions[i*3+2]=pz;
        colors[i*3]=cr; colors[i*3+1]=cg; colors[i*3+2]=cb;
    }
    GNEngine.particles.geometry.attributes.position.needsUpdate=true;
    GNEngine.particles.geometry.attributes.color.needsUpdate=true;
}

// ── Events ────────────────────────────────────────────────────────────────
document.querySelectorAll('.module-card').forEach(card => {
    card.addEventListener('click', () => {
        DOM.lobby.style.opacity="0";
        setTimeout(() => {
            DOM.lobby.style.display="none"; DOM.btnHub.style.display="block";
            const mod=card.dataset.module;
            if (mod==='deepspace') { DOM.uiDS.style.display='block'; launchDeepSpace(); }
            else if (mod==='solarsystem') { DOM.uiSS.style.display='block'; launchSolarSystem(); }
            else if (mod==='probes') { DOM.uiPR.style.display='block'; launchProbes(); }
            else if (mod==='genesis') { DOM.uiGN.style.display='block'; launchGenesis(); }
        }, 500);
    });
});

DOM.btnHub.addEventListener('click', () => {
    DOM.uiDS.style.display='none'; DOM.uiSS.style.display='none';
    DOM.uiPR.style.display='none'; DOM.uiGN.style.display='none';
    DOM.btnHub.style.display='none'; App.mode='lobby'; clearScene(); buildLobbyBackground();
    DOM.lobby.style.display='flex'; setTimeout(() => DOM.lobby.style.opacity="1", 100);
});

DOM.dsTargets.forEach(btn => btn.addEventListener('click', e => {
    DOM.dsTargets.forEach(b=>b.classList.remove('active'));
    e.target.closest('.target-btn').classList.add('active');
    dsWarpTo(e.target.closest('.target-btn').dataset.target);
}));
DOM.bhMass.addEventListener('input', dsUpdatePhysics);
DOM.bhDist.addEventListener('input', dsUpdatePhysics);

DOM.ssBtnReset.addEventListener('click', () => {
    SSEngine.tracked=null;
    document.querySelectorAll('.ss-target,.moon-btn').forEach(b=>b.classList.remove('active'));
    DOM.ssInfo.style.opacity="0";
    new TWEEN.Tween(App.camera.position).to(new THREE.Vector3(0,150,200),1500).start();
    new TWEEN.Tween(App.controls.target).to(new THREE.Vector3(0,0,0),1500).start();
});
DOM.ssSpeed.addEventListener('input', e => {
    SSEngine.speedMulti=parseFloat(e.target.value)/10;
    document.getElementById('ss-speed-val').textContent=`${(SSEngine.speedMulti*10).toFixed(1)}x`;
});

DOM.btnPrReset.addEventListener('click', () => {
    PREngine.tracked=null;
    document.querySelectorAll('.pr-target').forEach(b=>b.classList.remove('active'));
    DOM.prInfo.style.opacity="0";
    new TWEEN.Tween(App.camera.position).to(new THREE.Vector3(0,800,1200),1500).start();
    new TWEEN.Tween(App.controls.target).to(new THREE.Vector3(0,0,0),1500).start();
});

DOM.gnTimeline.addEventListener('input', e => gnUpdateTimeline(parseFloat(e.target.value)));

// ── Animate loop ──────────────────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate); TWEEN.update();
    if (App.mode==='lobby') { App.scene.rotation.y+=0.0005; }
    else if (App.mode==='deepspace') {
        Object.keys(DB.deepspace).forEach(k => {
            if (DB.deepspace[k].type==='nebula'||DB.deepspace[k].type==='galaxy') {
                if (DSEngine.objects[k]) DSEngine.objects[k].rotation.y+=0.0002;
            }
        });
        if (DSEngine.bh.disk && DSEngine.bh.geometry) {
            const positions=DSEngine.bh.geometry.attributes.position.array;
            const colors=DSEngine.bh.geometry.attributes.color.array;
            const massFactor=parseFloat(DOM.bhMass.value)/10;
            for (let i=0; i<DSEngine.bh.count; i++) {
                let x=positions[i*3],z=positions[i*3+2],r=Math.sqrt(x*x+z*z),t=Math.atan2(z,x);
                t+=DSEngine.bh.speeds[i]*(1.0/Math.max(0.1,massFactor));
                positions[i*3]=Math.cos(t)*r; positions[i*3+2]=Math.sin(t)*r;
                const approaching=x/r,intensity=1.0-(r/30);
                colors[i*3]=1.0*intensity; colors[i*3+1]=(0.5+approaching*0.4)*intensity; colors[i*3+2]=Math.max(0,approaching*0.8)*intensity;
            }
            DSEngine.bh.geometry.attributes.position.needsUpdate=true;
            DSEngine.bh.geometry.attributes.color.needsUpdate=true;
        }
    }
    else if (App.mode==='solarsystem') {
        SSEngine.planets.forEach(p => { p.pivot.rotation.y+=p.speed*SSEngine.speedMulti; p.mesh.rotation.y+=0.05*SSEngine.speedMulti; if(p.clouds)p.clouds.rotation.y+=0.06*SSEngine.speedMulti; });
        SSEngine.moons.forEach(m => m.pivot.rotation.y+=m.speed*SSEngine.speedMulti);
        if (SSEngine.tracked) {
            const tPos=new THREE.Vector3(); SSEngine.tracked.mesh.getWorldPosition(tPos);
            App.controls.target.lerp(tPos,0.2);
            const zDist=SSEngine.tracked.data.r*5+10;
            App.camera.position.lerp(tPos.clone().add(new THREE.Vector3(zDist,zDist/2,zDist)),0.08);
        }
    }
    else if (App.mode==='probes') {
        PREngine.probes.forEach(p=>p.mesh.rotation.y+=0.01);
        if (PREngine.ism) PREngine.ism.rotation.y-=0.0003;
        if (PREngine.heliosphere) PREngine.heliosphere.rotation.y+=0.0005;
    }
    else if (App.mode==='genesis') {
        if (GNEngine.particles) GNEngine.particles.rotation.y-=0.001;
    }
    App.controls.update();
    App.renderer.render(App.scene, App.camera);
}

window.onload = initGlobalCore;
