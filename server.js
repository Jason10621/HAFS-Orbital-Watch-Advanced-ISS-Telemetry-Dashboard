// =======================================================================
// HAFS Grand Observatory (V16.1 Absolute Master Core)
// Project Creator: 10621 이정욱
// Rules Enforced: 100% Quantity Preservation, Unlimited Length.
// Fixed: Slider bugs resolved, Image repetition & raw URLs fixed.
// =======================================================================

const App = { mode: 'lobby', scene: null, camera: null, renderer: null, controls: null };

// --- 1. 천문 대백과사전 데이터베이스 (이미지 원본 고화질 URL 적용 완료) ---
const DB = {
    deepspace: {
        'home': { 
            name: "MILKY WAY (우리은하)", type: "galaxy", coords: new THREE.Vector3(0, 0, 0), color: 0x88bbff, count: 25000, 
            img: "https://upload.wikimedia.org/wikipedia/commons/4/43/ESO-VLT-Laser-phot-33a-07.jpg",
            desc: "아름다운 대수 나선(Logarithmic Spiral) 구조를 가진 우리은하입니다.", 
            details: "은하 중심의 거대한 벌지(Bulge)와 4개의 주요 나선팔로 이루어져 있습니다. 질량의 대부분은 눈에 보이지 않는 암흑 물질이 차지하고 있습니다.", 
            metrics: [{n: "암흑 물질", p: 85, c: "#221144"}, {n: "항성/성단", p: 10, c: "#e6c27a"}, {n: "성간 가스/먼지", p: 5, c: "#4488ff"}],
            subs: [{t: "Orion Arm (오리온 팔)", d: "태양계가 위치한 변두리 나선팔"}, {t: "Galactic Bulge", d: "항성들이 밀집된 밝은 은하 중심부"}] 
        },
        'sgra': { 
            name: "SAGITTARIUS A* (초거대 블랙홀)", type: "blackhole", coords: new THREE.Vector3(200, 50, -200), 
            img: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Black_hole_-_Messier_87_crop_max_res.jpg",
            desc: "상대성 이론의 극치, 중심부의 초거대 블랙홀입니다.", 
            details: "안정적인 케플러 궤도를 도는 강착 원반을 시뮬레이션했습니다. 지구를 향해 다가오는 가스는 도플러 빔 효과로 인해 밝고 푸르게 빛납니다." 
        },
        'carina': { 
            name: "CARINA NEBULA (용골자리 성운)", type: "nebula", coords: new THREE.Vector3(1200, 300, -800), color: 0xff5522, count: 20000, 
            img: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Carina_Nebula_by_Webb_Telescope_%28high_res%29.jpg",
            desc: "지구에서 8,500광년 떨어진 거대한 별의 요람입니다.", 
            details: "항성풍에 의해 깎여나간 거대한 기둥 형태의 성간운이 특징입니다.", 
            metrics: [{n: "수소 가스", p: 70, c: "#ff4422"}, {n: "헬륨", p: 25, c: "#ffaa55"}, {n: "중원소 먼지", p: 5, c: "#665544"}],
            subs: [{t: "Eta Carinae", d: "폭발 직전의 극대거성 쌍성계"}, {t: "Cosmic Cliffs", d: "별이 탄생하는 우주 절벽"}] 
        },
        'smacs': { 
            name: "SMACS 0723 (중력렌즈 은하단)", type: "cluster", coords: new THREE.Vector3(3500, -2000, -4000), color: 0x5544ff, count: 30000, 
            img: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Webb%27s_First_Deep_Field.jpg",
            desc: "거대한 질량으로 시공간을 렌즈처럼 휘게 만드는 은하단입니다.", 
            details: "은하단의 막대한 암흑물질이 시공간을 왜곡하여 배경 은하의 빛을 둥글게 늘려버립니다.", 
            metrics: [{n: "암흑 물질", p: 90, c: "#111122"}, {n: "은하단 간 가스", p: 8, c: "#aa44ff"}, {n: "은하 질량", p: 2, c: "#ffffff"}],
            subs: [{t: "Gravitational Arcs", d: "왜곡되어 원호 형태로 보이는 130억 년 전의 빛"}] 
        }
    },
    solarsystem: [
        { 
            id: "mercury", name: "MERCURY (수성)", r: 1.2, d: 20, speed: 0.047, color: 0xa9a9a9, 
            img: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg", 
            temp: "430°C", orb: "47.36", 
            desc: "태양과 가장 가까운 암석 행성. 대기가 없어 일교차가 극심합니다.", details: "수많은 운석 충돌 구덩이가 보존되어 있습니다.", 
            atm: [{n: "산소", p: 42, c: "#a3c2c2"}, {n: "나트륨", p: 29, c: "#ffdb4d"}, {n: "수소", p: 22, c: "#4da6ff"}], internal: [{n: "맨틀", p: 20, c: "#b33c00"}, {n: "철 코어", p: 80, c: "#ff6600"}], moons: [] 
        },
        { 
            id: "venus", name: "VENUS (금성)", r: 1.8, d: 30, speed: 0.035, color: 0xeeddcc, 
            img: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg", 
            temp: "471°C", orb: "35.02", 
            desc: "극단적 온실효과를 지닌 태양계에서 가장 뜨거운 행성입니다.", details: "두꺼운 이산화탄소 대기와 황산 구름으로 덮여 지표면의 압력이 지구의 90배에 달합니다.", 
            atm: [{n: "이산화탄소", p: 96, c: "#ff6666"}, {n: "질소", p: 3, c: "#c2c2d6"}], internal: [{n: "지각", p: 5, c: "#d4a373"}, {n: "맨틀", p: 65, c: "#a0522d"}, {n: "코어", p: 30, c: "#552500"}], moons: [] 
        },
        { 
            id: "earth", name: "EARTH (지구)", r: 2.0, d: 45, speed: 0.029, color: 0x3366ff, 
            img: "https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg", 
            temp: "15°C", orb: "29.78", 
            desc: "액체 물이 존재하는 생명체 거주 행성.", details: "다이나모 이론에 의한 자기장 형성으로 태양풍으로부터 생명체를 보호합니다.", 
            atm: [{n: "질소", p: 78, c: "#8892b0"}, {n: "산소", p: 21, c: "#66ccff"}], internal: [{n: "지각", p: 5, c: "#8b7355"}, {n: "맨틀", p: 40, c: "#b33c00"}, {n: "외핵", p: 35, c: "#ff6600"}, {n: "내핵", p: 20, c: "#ffcc00"}], 
            moons: [
                {id:"luna", name:"Luna (달)", r:0.5, d:4, speed:0.08, color:0xaaaaaa, img: "https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg", desc:"지구와의 조석 고정으로 항상 같은 면만 보입니다. 조석간만의 차를 만들어냅니다.", period: "27.3 Days", grav: "1.62 m/s²"}
            ] 
        },
        { 
            id: "mars", name: "MARS (화성)", r: 1.5, d: 60, speed: 0.024, color: 0xff4422, 
            img: "https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg", 
            temp: "-63°C", orb: "24.07", 
            desc: "산화철로 붉게 보이며 과거 물이 흘렀던 뚜렷한 흔적이 있는 행성.", details: "과거에는 두꺼운 대기가 있었으나 태양풍에 빼앗겼습니다.", 
            atm: [{n: "이산화탄소", p: 95, c: "#ff6666"}, {n: "질소", p: 3, c: "#8892b0"}], internal: [{n: "지각", p: 10, c: "#cc4422"}, {n: "맨틀", p: 60, c: "#993311"}, {n: "코어", p: 30, c: "#551100"}], 
            moons: [
                {id:"phobos", name:"Phobos", r:0.2, d:2, speed:0.15, color:0x888888, img: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Phobos_colour_2008.jpg", desc:"미래에 화성과 충돌할 운명인 감자 모양의 위성.", period: "0.3 Days", grav: "0.005 m/s²"}, 
                {id:"deimos", name:"Deimos", r:0.15, d:3, speed:0.1, color:0x777777, img: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Deimos-MRO.jpg", desc:"화성의 두 번째 위성으로 매우 작고 어두운 표면을 가졌습니다.", period: "1.2 Days", grav: "0.003 m/s²"}
            ] 
        },
        { 
            id: "jupiter", name: "JUPITER (목성)", r: 5.5, d: 95, speed: 0.013, color: 0xdda050, 
            img: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg", 
            temp: "-110°C", orb: "13.07", 
            desc: "태양계에서 가장 거대한 가스 행성.", details: "내부의 거대한 액체 금속 수소 바다가 초강력 자기장을 만들어냅니다. 대적점 폭풍이 특징입니다.", 
            atm: [{n: "수소", p: 89, c: "#4da6ff"}, {n: "헬륨", p: 10, c: "#ffcc99"}], internal: [{n: "기체 수소", p: 15, c: "#ffeebb"}, {n: "액체 금속 수소", p: 70, c: "#99aacc"}, {n: "암석 코어", p: 15, c: "#444444"}], 
            moons: [
                {id:"io", name:"Io", r:0.4, d:7, speed:0.12, color:0xffff00, img: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Io_highest_resolution_true_color.jpg", desc:"조석력으로 인해 태양계에서 화산 활동이 가장 활발합니다.", period: "1.7 Days", grav: "1.79 m/s²"}, 
                {id:"europa", name:"Europa", r:0.35, d:9, speed:0.09, color:0xeeeeee, img: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Europa-moon.jpg", desc:"얼음 지각 아래 거대한 바다가 존재하여 생명체 탐사 1순위 위성입니다.", period: "3.5 Days", grav: "1.31 m/s²"},
                {id:"ganymede", name:"Ganymede", r:0.6, d:11, speed:0.07, color:0xaaaaaa, img: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Ganymede_g1_true.jpg", desc:"태양계 최대의 위성으로, 수성보다 큽니다. 유일하게 자체 자기장을 가지고 있습니다.", period: "7.1 Days", grav: "1.42 m/s²"},
                {id:"callisto", name:"Callisto", r:0.55, d:13, speed:0.05, color:0x888888, img: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Callisto.jpg", desc:"크레이터가 가장 밀집된 천체로, 죽어있는 얼음 위성입니다.", period: "16.6 Days", grav: "1.23 m/s²"}
            ] 
        },
        { 
            id: "saturn", name: "SATURN (토성)", r: 4.5, d: 130, speed: 0.009, color: 0xead6b8, 
            img: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg", 
            temp: "-140°C", orb: "9.69", 
            desc: "아름다운 고리 시스템을 가진 거대 가스 행성.", details: "밀도가 물보다 낮습니다. 수많은 얼음 조각들로 이루어진 광대한 고리를 가졌습니다.", 
            atm: [{n: "수소", p: 96, c: "#4da6ff"}, {n: "헬륨", p: 3, c: "#ffcc99"}], internal: [{n: "기체 수소", p: 20, c: "#eeddcc"}, {n: "금속 수소", p: 60, c: "#8899aa"}, {n: "암석 코어", p: 20, c: "#333333"}], 
            hasRing: true, ringColor: 0xeeddcc, ringInner: 1.5, ringOuter: 2.8, 
            moons: [
                {id:"titan", name:"Titan", r:0.7, d:8, speed:0.05, color:0xffaa55, img: "https://upload.wikimedia.org/wikipedia/commons/9/90/Titan_in_true_color.jpg", desc:"짙은 대기와 메탄 호수를 가진 유일한 위성입니다.", period: "15.9 Days", grav: "1.35 m/s²"},
                {id:"enceladus", name:"Enceladus", r:0.2, d:6, speed:0.08, color:0xffffff, img: "https://upload.wikimedia.org/wikipedia/commons/8/83/Enceladus_stripes_104.jpg", desc:"얼음 표면의 갈라진 틈에서 수증기와 유기물이 우주 공간으로 뿜어져 나오는 경이로운 위성입니다.", period: "1.3 Days", grav: "0.11 m/s²"},
                {id:"mimas", name:"Mimas", r:0.15, d:5, speed:0.1, color:0xaaaaaa, img: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Mimas_Cassini.jpg", desc:"표면에 거대한 '허셜 크레이터'가 존재하여 영화 스타워즈의 데스 스타와 닮았습니다.", period: "0.9 Days", grav: "0.06 m/s²"}
            ] 
        },
        { 
            id: "uranus", name: "URANUS (천왕성)", r: 3.2, d: 165, speed: 0.006, color: 0x66ccff, 
            img: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg", 
            temp: "-195°C", orb: "6.81", 
            desc: "자전축이 98도 기울어져 누운 채로 공전하는 얼음 거성.", details: "메탄 가스가 붉은빛을 흡수해 청록색으로 보입니다.", 
            atm: [{n: "수소", p: 83, c: "#4da6ff"}, {n: "헬륨", p: 15, c: "#ffcc99"}, {n: "메탄", p: 2, c: "#66ffcc"}], internal: [{n: "대기(가스)", p: 20, c: "#66ccff"}, {n: "얼음 맨틀", p: 60, c: "#3388cc"}, {n: "암석 코어", p: 20, c: "#222222"}], 
            hasRing: true, ringColor: 0x888888, ringInner: 1.3, ringOuter: 1.4,
            moons: [
                {id:"miranda", name:"Miranda", r:0.1, d:4, speed:0.06, color:0x999999, img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Miranda.jpg", desc:"협곡으로 표면이 심하게 짜깁기된 듯한 누더기 모양의 위성입니다.", period: "1.4 Days", grav: "0.07 m/s²"},
                {id:"titania", name:"Titania", r:0.25, d:6, speed:0.04, color:0xbbbbbb, img: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Titania_%28moon%29.jpg", desc:"천왕성의 위성 중 가장 크며 얼음과 암석으로 이루어져 있습니다.", period: "8.7 Days", grav: "0.37 m/s²"}
            ] 
        },
        { 
            id: "neptune", name: "NEPTUNE (해왕성)", r: 3.0, d: 200, speed: 0.005, color: 0x3333cc, 
            img: "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg", 
            temp: "-200°C", orb: "5.43", 
            desc: "초음속 강풍이 부는 태양계 최외곽 얼음 거성.", details: "태양에서 가장 멀리 떨어져 폭력적인 바람이 붑니다.", 
            atm: [{n: "수소", p: 80, c: "#4da6ff"}, {n: "헬륨", p: 19, c: "#ffcc99"}, {n: "메탄", p: 1, c: "#66ffcc"}], internal: [{n: "가스 대기", p: 15, c: "#3333cc"}, {n: "얼음 맨틀", p: 65, c: "#222288"}, {n: "암석 코어", p: 20, c: "#111111"}], 
            moons: [
                {id:"triton", name:"Triton", r:0.4, d:5, speed:0.04, color:0xaabbcc, img: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Triton_moon_mosaic_Voyager_2_%28large%29.jpg", desc:"해왕성의 자전 방향과 정반대로 공전하는 '역행' 위성. 액체 질소 간헐천을 뿜어냅니다.", period: "-5.8 Days", grav: "0.77 m/s²"}
            ] 
        }
    ],
    probes: [
        { id: "voyager1", name: "VOYAGER 1", launch: "1977", target: "Interstellar Space", distAU: 162.5, vel: "17.0", img: "https://upload.wikimedia.org/wikipedia/commons/6/60/Voyager_spacecraft_model.png", power: 40, desc: "인류 역사상 가장 멀리 떨어진 탐사선.", details: "성간 공간에 진입했습니다.", angle: Math.PI / 4 },
        { id: "voyager2", name: "VOYAGER 2", launch: "1977", target: "Outer Planets", distAU: 136.0, vel: "15.3", img: "https://upload.wikimedia.org/wikipedia/commons/6/60/Voyager_spacecraft_model.png", power: 38, desc: "외행성계 그랜드 투어 완수.", details: "목, 토, 천, 해왕성을 모두 방문했습니다.", angle: Math.PI * 1.8 },
        { id: "pioneer10", name: "PIONEER 10", launch: "1972", target: "Jupiter", distAU: 135.0, vel: "11.9", img: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Pioneer_10_spacecraft.png", power: 0, desc: "최초로 소행성대를 통과한 개척선.", details: "현재 알데바란을 향해 관성 비행 중입니다.", angle: Math.PI * 1.3 },
        { id: "pioneer11", name: "PIONEER 11", launch: "1973", target: "Saturn", distAU: 111.0, vel: "11.2", img: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Pioneer_10_spacecraft.png", power: 0, desc: "토성 고리를 최초 관측한 탐사선.", details: "1995년에 통신이 끊겼습니다.", angle: Math.PI * 1.5 },
        { id: "newhorizons", name: "NEW HORIZONS", launch: "2006", target: "Pluto / Kuiper Belt", distAU: 58.0, vel: "13.8", img: "https://upload.wikimedia.org/wikipedia/commons/f/fb/New_Horizons_Transparent.png", power: 75, desc: "명왕성과 카이퍼 벨트를 탐사 중인 우주선.", details: "명왕성의 하트 모양 지형을 촬영했습니다.", angle: Math.PI },
        { id: "cassini", name: "CASSINI-HUYGENS", launch: "1997", target: "Saturn System", distAU: 9.5, vel: "Terminated", img: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Cassini_Saturn_Orbit_Insertion.jpg", power: 0, desc: "토성계의 비밀을 밝혀낸 위대한 궤도선.", details: "2017년 토성 대기로 뛰어들어 임무를 종료했습니다.", angle: Math.PI * 0.7 },
        { id: "rosetta", name: "ROSETTA", launch: "2004", target: "Comet 67P", distAU: 3.5, vel: "Landed", img: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Rosetta_spacecraft.png", power: 0, desc: "최초로 혜성 표면에 착륙한 탐사선.", details: "태양계 초기의 혜성 화학 성분을 정밀 분석했습니다.", angle: Math.PI * 0.2 }
    ],
    GenesisData: [
        { t: 0, epoch: "SINGULARITY (특이점)", age: "0 Years", temp: "10^32 K (Planck Temp)", size: "1.6 × 10^-35 m", comp: "Unified Superforce", redshift: "Infinite", desc: "빅뱅. 모든 물질과 에너지가 상상할 수 없는 밀도의 한 점에 응축되어 있는 우주의 시작점입니다.", details: "공간과 시간의 개념이 탄생하는 순간이며, 현재의 물리학 법칙으로는 설명할 수 없는 플랑크 시대(Planck Epoch)입니다.", img: "https://upload.wikimedia.org/wikipedia/commons/6/6f/CMB_Timeline300_no_WMAP.jpg" },
        { t: 10, epoch: "COSMIC INFLATION", age: "10^-32 Seconds", temp: "10^27 K", size: "~10 cm (Grapefruit)", comp: "Quark-Gluon Plasma", redshift: "> 10^25", desc: "우주가 빛보다 빠른 속도로 기하급수적 팽창(Inflation)을 겪으며, 구조의 양자적 씨앗이 우주 전체로 흩뿌려집니다.", details: "공간 자체가 팽창하므로 상대성이론에 위배되지 않습니다. 쿼크와 글루온이 자유롭게 떠다니는 초고온 플라즈마 상태입니다.", img: "https://upload.wikimedia.org/wikipedia/commons/3/37/Universe_expansion2.png" },
        { t: 30, epoch: "RECOMBINATION (CMB)", age: "380,000 Years", temp: "3,000 K", size: "~42 Million Light Years", comp: "Radiation (Photons)", redshift: "z ≈ 1,100", desc: "우주가 식으면서 전자와 원자핵이 결합해 중성 원자가 형성되고, 갇혀 있던 빛이 마침내 우주 공간으로 퍼져나갑니다.", details: "우주가 투명해진 이 순간에 방출된 최초의 빛이 바로 오늘날 우리가 관측하는 '우주 배경 복사(Cosmic Microwave Background)'입니다.", img: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Ilc_9yr_moll4096.png" },
        { t: 60, epoch: "DARK AGES & FIRST STARS", age: "400 Million Years", temp: "30 K", size: "~1 Billion Light Years", comp: "Dark Matter & Hydrogen", redshift: "z ≈ 20", desc: "우주의 암흑기를 깨고, 거대한 수소 구름들이 암흑 물질의 중력으로 뭉쳐 제1세대 항성(Population III)들이 불을 밝힙니다.", details: "이 거대한 별들은 짧은 수명을 마치고 초신성 폭발을 일으켜, 우주 공간에 산소, 탄소, 철과 같은 무거운 원소들을 처음으로 흩뿌리기 시작합니다.", img: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Webb%27s_First_Deep_Field.jpg" },
        { t: 100, epoch: "PRESENT UNIVERSE", age: "13.8 Billion Years", temp: "2.73 K", size: "93 Billion Light Years", comp: "Dark Energy (68%)", redshift: "z = 0", desc: "암흑 물질의 중력 뼈대(Cosmic Web)를 따라 수많은 은하와 은하단이 형성된 현재의 우주입니다.", details: "미스터리한 암흑 에너지가 우주의 팽창 속도를 점점 더 가속화시키고 있습니다. 우리은하를 포함한 수천억 개의 은하들이 존재합니다.", img: "https://upload.wikimedia.org/wikipedia/commons/4/43/ESO-VLT-Laser-phot-33a-07.jpg" }
    ]
};

// --- 엔진 시스템 변수 ---
const DSEngine = { objects: {}, bh: { eh: null, ps: null, disk: null, speeds: [], count: 35000, geometry: null } };
const SSEngine = { planets: [], moons: [], tracked: null, speedMulti: 1.0 };
const PREngine = { probes: [], tracked: null };
const GNEngine = { particles: null, pos0: null, pos1: null, pos2: null, count: 50000 };
const SLEngine = { star: null, particles: null, count: 40000, pos0: null, pos1: null, pos2: null, pos3: null, pos4: null };

// --- DOM 바인딩 ---
const DOM = {
    lobby: document.getElementById('ui-lobby'), btnHub: document.getElementById('btn-return-hub'),
    uiDS: document.getElementById('ui-deepspace'), uiSS: document.getElementById('ui-solarsystem'), 
    uiPR: document.getElementById('ui-probes'), uiGN: document.getElementById('ui-genesis'),
    uiSL: document.getElementById('ui-stellar'),
    
    // DS
    dsTargets: document.querySelectorAll('.ds-target'), dsInfo: document.getElementById('ds-info'), dsTitle: document.getElementById('ds-title'), dsMedia: document.getElementById('ds-media'), dsDesc: document.getElementById('ds-desc'), dsDetails: document.getElementById('ds-details'),
    dsNormal: document.getElementById('ds-normal-info'), dsSubList: document.getElementById('ds-sub-list'), dsBHCtrl: document.getElementById('ds-bh-controls'), bhMass: document.getElementById('bh-mass'), bhDist: document.getElementById('bh-dist'), dsMetricsBar: document.getElementById('ds-metrics-bar'), dsMetricsLegend: document.getElementById('ds-metrics-legend'),
    
    // SS
    ssList: document.getElementById('ss-planet-list'), ssSpeed: document.getElementById('ss-speed'), ssBtnReset: document.getElementById('btn-ss-reset'),
    ssInfo: document.getElementById('ss-info'), ssName: document.getElementById('ss-name'), ssMedia: document.getElementById('ss-media'), ssDesc: document.getElementById('ss-desc'), ssDetails: document.getElementById('ss-details'), ssTemp: document.getElementById('ss-temp'), ssOrb: document.getElementById('ss-orb'), ssCompBar: document.getElementById('ss-comp-bar'), ssCompLegend: document.getElementById('ss-comp-legend'),
    ssInternalBar: document.getElementById('ss-internal-bar'), ssInternalLegend: document.getElementById('ss-internal-legend'), ssMoonsCont: document.getElementById('ss-moons-container'), ssMoonsList: document.getElementById('ss-moons-list'),
    ssPlanetData: document.getElementById('ss-planet-data'), ssMoonData: document.getElementById('ss-moon-data'), ssMoonPeriod: document.getElementById('ss-moon-period'), ssMoonGrav: document.getElementById('ss-moon-grav'),
    
    // PR
    prList: document.getElementById('pr-list'), btnPrReset: document.getElementById('btn-pr-reset'),
    prInfo: document.getElementById('pr-info'), prName: document.getElementById('pr-name'), prMedia: document.getElementById('pr-media'), prDesc: document.getElementById('pr-desc'), prDetails: document.getElementById('pr-details'), prLaunch: document.getElementById('pr-launch'), prTarget: document.getElementById('pr-target'), prPowerBar: document.getElementById('pr-power-bar'), prDist: document.getElementById('pr-dist'), prVel: document.getElementById('pr-vel'), prDelay: document.getElementById('pr-delay'),

    // GN
    gnTimeline: document.getElementById('gn-timeline'), gnEpoch: document.getElementById('gn-epoch'), gnAge: document.getElementById('gn-age'), gnTemp: document.getElementById('gn-temp'), gnMedia: document.getElementById('gn-media'), gnDesc: document.getElementById('gn-desc'), gnDetails: document.getElementById('gn-details'),
    gnSize: document.getElementById('gn-size'), gnComp: document.getElementById('gn-comp'), gnRedshift: document.getElementById('gn-redshift'),

    // SL
    btnSlReset: document.getElementById('btn-sl-reset'), slMass: document.getElementById('sl-mass'), slTime: document.getElementById('sl-time'), slMassVal: document.getElementById('sl-mass-val'), slClassLabel: document.getElementById('sl-class-label'), slStageVal: document.getElementById('sl-stage-val'), slTemp: document.getElementById('sl-temp'), slLum: document.getElementById('sl-lum'), slRad: document.getElementById('sl-rad'), slFate: document.getElementById('sl-fate'), slHrDiagram: document.getElementById('sl-hr-diagram')
};

// ================= [ 글로벌 초기화 ] =================
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
    window.addEventListener('resize', () => { App.camera.aspect = window.innerWidth / window.innerHeight; App.camera.updateProjectionMatrix(); App.renderer.setSize(window.innerWidth, window.innerHeight); });
    animate();
}

function clearScene() {
    while(App.scene.children.length > 0) { App.scene.remove(App.scene.children[0]); }
    DSEngine.objects = {}; DSEngine.bh.disk = null; DSEngine.bh.geometry = null;
    SSEngine.planets = []; SSEngine.moons = []; SSEngine.tracked = null;
    PREngine.probes = []; PREngine.tracked = null;
    GNEngine.particles = null;
    SLEngine.star = null; SLEngine.particles = null;
}

function buildLobbyBackground() {
    App.scene.fog = new THREE.FogExp2(0x020204, 0.0005);
    const bgGeo = new THREE.BufferGeometry(); const bgPos = new Float32Array(5000 * 3);
    for(let i=0; i<5000*3; i++) bgPos[i] = (Math.random() - 0.5) * 1000;
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    App.scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({color: 0x667788, size: 2})));
    App.camera.position.set(0, 0, 500); App.controls.target.set(0, 0, 0);
}

// ================= [ M1: DEEP SPACE ] =================
function launchDeepSpace() {
    App.mode = 'deepspace'; clearScene(); App.scene.fog = new THREE.FogExp2(0x020204, 0.0001);
    const bgGeo = new THREE.BufferGeometry(); const bgPos = new Float32Array(15000 * 3);
    for(let i=0; i<15000*3; i++) bgPos[i] = (Math.random() - 0.5) * 15000;
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    App.scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({color: 0x445566, size: 2})));

    for (const [key, data] of Object.entries(DB.deepspace)) {
        if (data.type === 'galaxy') {
            const geo = new THREE.BufferGeometry(); const pos = new Float32Array(data.count * 3); const col = new Float32Array(data.count * 3);
            const baseCol = new THREE.Color(data.color); const arms = 4;
            for(let i=0; i<data.count; i++) {
                let r = Math.random() * 300; let armOffset = (i % arms) * (Math.PI * 2 / arms);
                let theta = r * 0.03 + armOffset + (Math.random()-0.5)*0.8; 
                let x = Math.cos(theta) * r, z = Math.sin(theta) * r;
                let y = (Math.random()-0.5) * (1500 / (r*r + 50)); 
                pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
                const mix = new THREE.Color(0xffeedd).lerp(baseCol, r/300); col[i*3] = mix.r; col[i*3+1] = mix.g; col[i*3+2] = mix.b;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
            cloud.position.copy(data.coords); App.scene.add(cloud); DSEngine.objects[key] = cloud;
        } 
        else if (data.type === 'nebula' || data.type === 'cluster') {
            const geo = new THREE.BufferGeometry(); const pos = new Float32Array(data.count * 3); const col = new Float32Array(data.count * 3);
            const baseCol = new THREE.Color(data.color);
            for(let i=0; i<data.count * 3; i+=3) {
                const r = Math.pow(Math.random(), 2), t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
                const spread = 350; pos[i] = r * Math.sin(p) * Math.cos(t) * spread; pos[i+1] = r * Math.sin(p) * Math.sin(t) * (spread * 0.4); pos[i+2] = r * Math.cos(p) * spread;
                const mix = new THREE.Color(0xffffff).lerp(baseCol, r); col[i] = mix.r; col[i+1] = mix.g; col[i+2] = mix.b;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
            cloud.position.copy(data.coords); App.scene.add(cloud); DSEngine.objects[key] = cloud;
        }
        else if (data.type === 'blackhole') {
            const bhGroup = new THREE.Group();
            DSEngine.bh.eh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), new THREE.MeshBasicMaterial({ color: 0x000000 }));
            DSEngine.bh.ps = new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 64), new THREE.MeshBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, side: THREE.BackSide }));
            bhGroup.add(DSEngine.bh.eh); bhGroup.add(DSEngine.bh.ps);

            const geo = new THREE.BufferGeometry(); const pos = new Float32Array(DSEngine.bh.count * 3); const col = new Float32Array(DSEngine.bh.count * 3);
            for(let i=0; i < DSEngine.bh.count; i++) {
                const r = 1.6 + Math.pow(Math.random(), 2) * 25; const t = Math.random() * Math.PI * 2;
                pos[i*3] = Math.cos(t) * r; pos[i*3+1] = (Math.random() - 0.5) * (1.5 / Math.sqrt(r)); pos[i*3+2] = Math.sin(t) * r;
                DSEngine.bh.speeds[i] = 2.5 / Math.pow(r, 1.5); col[i*3] = 1.0; col[i*3+1] = 0.5; col[i*3+2] = 0.0;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            DSEngine.bh.geometry = geo; 
            DSEngine.bh.disk = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.25, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
            bhGroup.add(DSEngine.bh.disk); bhGroup.position.copy(data.coords); bhGroup.rotation.x = 0.15; 
            App.scene.add(bhGroup); DSEngine.objects[key] = bhGroup;
        }
    }
    App.camera.position.set(0, 0, 500); App.controls.target.set(0, 0, 0); dsWarpTo('home'); 
}

function dsWarpTo(targetKey) {
    const data = DB.deepspace[targetKey]; const targetObj = DSEngine.objects[targetKey];
    DOM.dsInfo.style.opacity = "0";
    const zoomOffset = data.type === 'blackhole' ? 50 : 450;
    const endPosition = new THREE.Vector3(targetObj.position.x, targetObj.position.y + (zoomOffset/4), targetObj.position.z + zoomOffset);

    new TWEEN.Tween(App.camera.position).to(endPosition, 3500).easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => App.camera.lookAt(targetObj.position))
        .onComplete(() => {
            App.controls.target.copy(targetObj.position);
            DOM.dsTitle.textContent = data.name; DOM.dsMedia.style.backgroundImage = `url('${data.img}')`;
            DOM.dsDesc.textContent = data.desc; DOM.dsDetails.textContent = data.details;
            
            if (data.type === 'blackhole') {
                DOM.dsNormal.style.display = 'none'; DOM.dsBHCtrl.style.display = 'block'; dsUpdatePhysics();
            } else {
                DOM.dsNormal.style.display = 'block'; DOM.dsBHCtrl.style.display = 'none';
                DOM.dsMetricsBar.innerHTML = ''; DOM.dsMetricsLegend.innerHTML = '';
                if(data.metrics) { data.metrics.forEach(c => { DOM.dsMetricsBar.innerHTML += `<div class="comp-segment" style="width:${c.p}%; background:${c.c};">${c.p}%</div>`; DOM.dsMetricsLegend.innerHTML += `<div class="legend-item"><div class="legend-color" style="background:${c.c};"></div>${c.n}</div>`; }); }
                DOM.dsSubList.innerHTML = ''; data.subs.forEach(s => DOM.dsSubList.innerHTML += `<li><span class="sub-title">${s.t}</span><span class="sub-detail">${s.d}</span></li>`);
            }
            DOM.dsInfo.style.opacity = "1";
        }).start();
}

function dsUpdatePhysics() {
    const mass = parseFloat(DOM.bhMass.value), dist = parseFloat(DOM.bhDist.value);
    const rs = mass * 3.0, scale = Math.max(1, mass / 10);
    if(DSEngine.bh.eh) { DSEngine.bh.eh.scale.set(scale, scale, scale); DSEngine.bh.ps.scale.set(scale, scale, scale); DSEngine.bh.disk.scale.set(scale, scale, scale); }
    const timeDilation = (dist * rs > rs) ? 1 / Math.sqrt(1 - (rs / (dist * rs))) : 0;
    document.getElementById('bh-mass-val').textContent = mass.toFixed(1); document.getElementById('bh-dist-val').textContent = `${dist} Rs`;
    document.getElementById('bh-rs').textContent = `${rs.toFixed(2)} km`;
    document.getElementById('bh-time').textContent = timeDilation > 0 ? timeDilation.toFixed(4) + "x" : "INFINITE";
}

// ================= [ M2: SOLAR SYSTEM ] =================
function launchSolarSystem() {
    App.mode = 'solarsystem'; clearScene(); App.scene.fog = new THREE.FogExp2(0x020204, 0.0005);
    
    const starsGeo = new THREE.BufferGeometry(); const starsPos = new Float32Array(5000 * 3);
    for(let i=0; i<5000*3; i++) starsPos[i] = (Math.random() - 0.5) * 2000;
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
    App.scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({color: 0xaaaaaa, size: 1.5})));

    const sun = new THREE.Mesh(new THREE.SphereGeometry(8, 64, 64), new THREE.MeshBasicMaterial({ color: 0xffcc33 }));
    App.scene.add(sun); App.scene.add(new THREE.PointLight(0xffffff, 2, 800)); App.scene.add(new THREE.AmbientLight(0x333333));

    DOM.ssList.innerHTML = '';
    
    DB.solarsystem.forEach(pData => {
        const pMesh = new THREE.Mesh(new THREE.SphereGeometry(pData.r, 32, 32), new THREE.MeshStandardMaterial({ color: pData.color, roughness: 0.6 }));
        pMesh.position.x = pData.d;

        if(pData.hasRing) {
            const ring = new THREE.Mesh(new THREE.RingGeometry(pData.r * pData.ringInner, pData.r * pData.ringOuter, 64), new THREE.MeshStandardMaterial({ color: pData.ringColor, side: THREE.DoubleSide, transparent:true, opacity:0.7 }));
            ring.rotation.x = Math.PI / 2; pMesh.add(ring);
        }

        if(pData.moons && pData.moons.length > 0) {
            pData.moons.forEach(mData => {
                const mMesh = new THREE.Mesh(new THREE.SphereGeometry(mData.r, 16, 16), new THREE.MeshStandardMaterial({color: mData.color}));
                mMesh.position.x = mData.d;
                const mPivot = new THREE.Group(); mPivot.add(mMesh); pMesh.add(mPivot);
                const mOrbit = new THREE.Mesh(new THREE.RingGeometry(mData.d - 0.05, mData.d + 0.05, 64), new THREE.MeshBasicMaterial({ color: 0x555555, side: THREE.DoubleSide, transparent:true, opacity:0.5 }));
                mOrbit.rotation.x = Math.PI / 2; pMesh.add(mOrbit);
                SSEngine.moons.push({ id: mData.id, pivot: mPivot, mesh: mMesh, speed: mData.speed, parent: pMesh, data: mData });
            });
        }

        const pivot = new THREE.Group(); pivot.add(pMesh); App.scene.add(pivot);
        const orbit = new THREE.Mesh(new THREE.RingGeometry(pData.d - 0.1, pData.d + 0.1, 128), new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide }));
        orbit.rotation.x = Math.PI / 2; App.scene.add(orbit);

        SSEngine.planets.push({ id: pData.id, pivot, mesh: pMesh, speed: pData.speed, data: pData, type: 'planet' });

        const btn = document.createElement('button'); btn.className = 'target-btn ss-target';
        btn.innerHTML = `<span class="btn-title" style="display:flex; align-items:center; gap:8px;"><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#${pData.color.toString(16)}"></span>${pData.name}</span>`;
        btn.onclick = () => {
            document.querySelectorAll('.ss-target').forEach(b => b.classList.remove('active')); btn.classList.add('active');
            SSEngine.tracked = SSEngine.planets.find(p => p.id === pData.id);
            ssUpdatePlanetInfo(pData, false);
        };
        DOM.ssList.appendChild(btn);
    });
    App.camera.position.set(0, 150, 200); App.controls.target.set(0, 0, 0);
}

function ssUpdatePlanetInfo(data, isMoon = false) {
    DOM.ssName.textContent = data.name; 
    DOM.ssMedia.style.backgroundImage = `url('${data.img}')`; 
    DOM.ssDesc.textContent = isMoon ? `[위성 데이터] ${data.desc}` : data.desc; 
    DOM.ssDetails.textContent = isMoon ? "" : data.details;

    if(isMoon) {
        DOM.ssPlanetData.style.display = 'none';
        DOM.ssMoonData.style.display = 'grid';
        DOM.ssMoonPeriod.textContent = data.period;
        DOM.ssMoonGrav.textContent = data.grav;
    } else {
        DOM.ssMoonData.style.display = 'none';
        DOM.ssPlanetData.style.display = 'grid';
        DOM.ssTemp.textContent = data.temp; 
        DOM.ssOrb.textContent = `${data.orb} km/s`;
    }

    DOM.ssCompBar.innerHTML = ''; DOM.ssCompLegend.innerHTML = '';
    if(data.atm) {
        data.atm.forEach(c => {
            DOM.ssCompBar.innerHTML += `<div class="comp-segment" style="width:${c.p}%; background:${c.c};">${c.p}%</div>`;
            DOM.ssCompLegend.innerHTML += `<div class="legend-item"><div class="legend-color" style="background:${c.c};"></div>${c.n}</div>`;
        });
    }

    DOM.ssInternalBar.innerHTML = ''; DOM.ssInternalLegend.innerHTML = '';
    if(data.internal) {
        data.internal.forEach(layer => {
            DOM.ssInternalBar.innerHTML += `<div class="internal-segment" style="height:${layer.p * 1.5}px; background:${layer.c}; border-bottom:1px solid rgba(0,0,0,0.5);">${layer.p}%</div>`;
            DOM.ssInternalLegend.innerHTML += `<div class="legend-item"><div class="legend-color" style="background:${layer.c};"></div>${layer.n}</div>`;
        });
    }

    if(!isMoon && data.moons && data.moons.length > 0) {
        DOM.ssMoonsCont.style.display = 'block'; DOM.ssMoonsList.innerHTML = '';
        data.moons.forEach(mData => {
            const btn = document.createElement('button'); btn.className = 'moon-btn'; btn.textContent = mData.name;
            btn.onclick = () => {
                document.querySelectorAll('.moon-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
                SSEngine.tracked = SSEngine.moons.find(m => m.id === mData.id);
                ssUpdatePlanetInfo(mData, true);
            };
            DOM.ssMoonsList.appendChild(btn);
        });
    } else if (!isMoon) {
        DOM.ssMoonsCont.style.display = 'none';
    }
    DOM.ssInfo.style.opacity = "1";
}

// ================= [ M3: INTERSTELLAR PROBES ] =================
function launchProbes() {
    App.mode = 'probes'; clearScene(); App.scene.fog = new THREE.FogExp2(0x010205, 0.0001); 
    
    const starsGeo = new THREE.BufferGeometry(); const starsPos = new Float32Array(10000 * 3);
    for(let i=0; i<10000*3; i++) starsPos[i] = (Math.random() - 0.5) * 15000;
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
    App.scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({color: 0x888888, size: 2})));

    const sun = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffddaa }));
    App.scene.add(sun); App.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const refOrbits = [0.39, 0.72, 1.0, 1.52, 5.2, 9.5, 19.2, 30.1]; const scaleAU = 10;
    refOrbits.forEach(r => {
        const orbit = new THREE.Mesh(new THREE.RingGeometry(r*scaleAU - 0.2, r*scaleAU + 0.2, 128), new THREE.MeshBasicMaterial({ color: 0x112233, side: THREE.DoubleSide }));
        orbit.rotation.x = Math.PI / 2; App.scene.add(orbit);
    });

    DOM.prList.innerHTML = '';
    
    DB.probes.forEach(pData => {
        const dist = pData.distAU * scaleAU;
        const x = Math.cos(pData.angle) * dist; const z = Math.sin(pData.angle) * dist;
        
        const pGroup = new THREE.Group();
        const core = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshBasicMaterial({ color: 0xa277ff, wireframe: true }));
        const dish = new THREE.Mesh(new THREE.RingGeometry(1.5, 2.5, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }));
        dish.rotation.x = Math.PI / 2;
        pGroup.add(core); pGroup.add(dish);
        pGroup.position.set(x, 0, z);
        App.scene.add(pGroup);

        const points = [new THREE.Vector3(0,0,0), new THREE.Vector3(x, 0, z)];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xa277ff, transparent: true, opacity: 0.3 });
        const line = new THREE.Line(lineGeo, lineMat); App.scene.add(line);

        PREngine.probes.push({ id: pData.id, mesh: pGroup, data: pData });

        const btn = document.createElement('button'); btn.className = 'target-btn pr-target';
        btn.innerHTML = `<span class="btn-title" style="color:#a277ff;">${pData.name}</span>`;
        btn.onclick = () => {
            document.querySelectorAll('.pr-target').forEach(b => b.classList.remove('active')); btn.classList.add('active');
            PREngine.tracked = PREngine.probes.find(p => p.id === pData.id);
            prUpdateInfo(pData);
        };
        DOM.prList.appendChild(btn);
    });
    App.camera.position.set(0, 500, 800); App.controls.target.set(0, 0, 0);
}

function prUpdateInfo(pData) {
    DOM.prName.textContent = pData.name; DOM.prMedia.style.backgroundImage = `url('${pData.img}')`; 
    DOM.prDesc.textContent = pData.desc; DOM.prDetails.textContent = pData.details;
    DOM.prLaunch.textContent = pData.launch; DOM.prTarget.textContent = pData.target;
    
    DOM.prPowerBar.style.width = `${pData.power}%`;
    DOM.prPowerBar.textContent = pData.power > 0 ? `${pData.power}%` : "OFFLINE";
    DOM.prPowerBar.style.background = pData.power > 30 ? "#a277ff" : "#ff3366";

    DOM.prDist.textContent = `${pData.distAU} AU`;
    DOM.prVel.textContent = `${pData.vel} km/s`;
    
    const distKm = pData.distAU * 1.496e8; const seconds = distKm / 300000;
    DOM.prDelay.textContent = `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;

    DOM.prInfo.style.opacity = "1";

    const tPos = PREngine.tracked.mesh.position;
    new TWEEN.Tween(App.controls.target).to(tPos, 1500).start();
    const dirToSun = tPos.clone().normalize().multiplyScalar(-20); 
    new TWEEN.Tween(App.camera.position).to(tPos.clone().add(new THREE.Vector3(0, 10, 0)).add(dirToSun), 1500).start();
}

// ================= [ M4: GENESIS ENGINE ] =================
function launchGenesis() {
    App.mode = 'genesis'; clearScene(); App.scene.fog = new THREE.FogExp2(0x020204, 0.0002);
    
    const geo = new THREE.BufferGeometry();
    GNEngine.pos0 = new Float32Array(GNEngine.count * 3);
    GNEngine.pos1 = new Float32Array(GNEngine.count * 3);
    GNEngine.pos2 = new Float32Array(GNEngine.count * 3);
    const currentPos = new Float32Array(GNEngine.count * 3);
    const colors = new Float32Array(GNEngine.count * 3);

    for(let i=0; i<GNEngine.count; i++) {
        GNEngine.pos0[i*3] = (Math.random()-0.5)*2; GNEngine.pos0[i*3+1] = (Math.random()-0.5)*2; GNEngine.pos0[i*3+2] = (Math.random()-0.5)*2;
        
        const u = Math.random(), v = Math.random();
        const theta = 2 * Math.PI * u; const phi = Math.acos(2 * v - 1);
        const r1 = Math.cbrt(Math.random()) * 200; 
        GNEngine.pos1[i*3] = r1 * Math.sin(phi) * Math.cos(theta);
        GNEngine.pos1[i*3+1] = r1 * Math.sin(phi) * Math.sin(theta);
        GNEngine.pos1[i*3+2] = r1 * Math.cos(phi);

        let r2 = Math.random() * 400; let t2 = Math.random() * Math.PI * 2; let p2 = Math.acos(2 * Math.random() - 1);
        let fX = Math.sin(t2 * 3) * Math.cos(p2 * 2);
        let fY = Math.cos(t2 * 2) * Math.sin(p2 * 3);
        let fZ = Math.sin(p2 * 4);
        
        GNEngine.pos2[i*3] = r2 * Math.sin(p2) * Math.cos(t2) * (1 + fX*0.5);
        GNEngine.pos2[i*3+1] = r2 * Math.sin(p2) * Math.sin(t2) * (1 + fY*0.5);
        GNEngine.pos2[i*3+2] = r2 * Math.cos(p2) * (1 + fZ*0.5);

        currentPos[i*3] = GNEngine.pos0[i*3]; currentPos[i*3+1] = GNEngine.pos0[i*3+1]; currentPos[i*3+2] = GNEngine.pos0[i*3+2];
        colors[i*3] = 1.0; colors[i*3+1] = 1.0; colors[i*3+2] = 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(currentPos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    GNEngine.particles = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.2, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
    App.scene.add(GNEngine.particles);

    App.camera.position.set(0, 0, 300); App.controls.target.set(0, 0, 0);
    gnUpdateTimeline(0); 
}

function gnUpdateTimeline(val) {
    if(!GNEngine.particles) return;
    
    let stageInfo;
    if(val < 15) stageInfo = DB.GenesisData[0];
    else if(val < 40) stageInfo = DB.GenesisData[1];
    else if(val < 70) stageInfo = DB.GenesisData[2];
    else if(val < 90) stageInfo = DB.GenesisData[3];
    else stageInfo = DB.GenesisData[4];

    DOM.gnEpoch.textContent = stageInfo.epoch;
    DOM.gnAge.textContent = stageInfo.age;
    DOM.gnTemp.textContent = stageInfo.temp;
    DOM.gnDesc.textContent = stageInfo.desc;
    DOM.gnDetails.textContent = stageInfo.details;
    DOM.gnMedia.style.backgroundImage = `url('${stageInfo.img}')`;
    
    DOM.gnSize.textContent = stageInfo.size;
    DOM.gnComp.textContent = stageInfo.comp;
    DOM.gnRedshift.textContent = stageInfo.redshift;

    const positions = GNEngine.particles.geometry.attributes.position.array;
    const colors = GNEngine.particles.geometry.attributes.color.array;
    
    for(let i=0; i<GNEngine.count; i++) {
        let px, py, pz; let cr, cg, cb;
        
        if (val <= 30) {
            let ratio = val / 30; ratio = 1 - Math.pow(1 - ratio, 3);
            px = GNEngine.pos0[i*3] + (GNEngine.pos1[i*3] - GNEngine.pos0[i*3]) * ratio;
            py = GNEngine.pos0[i*3+1] + (GNEngine.pos1[i*3+1] - GNEngine.pos0[i*3+1]) * ratio;
            pz = GNEngine.pos0[i*3+2] + (GNEngine.pos1[i*3+2] - GNEngine.pos0[i*3+2]) * ratio;
            cr = 1.0; cg = 1.0 - ratio*0.5; cb = 1.0 - ratio;
        } else {
            let ratio = (val - 30) / 70;
            px = GNEngine.pos1[i*3] + (GNEngine.pos2[i*3] - GNEngine.pos1[i*3]) * ratio;
            py = GNEngine.pos1[i*3+1] + (GNEngine.pos2[i*3+1] - GNEngine.pos1[i*3+1]) * ratio;
            pz = GNEngine.pos1[i*3+2] + (GNEngine.pos2[i*3+2] - GNEngine.pos1[i*3+2]) * ratio;
            cr = 1.0 - ratio*0.5; cg = 0.5 - ratio*0.3; cb = 0.0 + ratio;
        }
        
        positions[i*3] = px; positions[i*3+1] = py; positions[i*3+2] = pz;
        colors[i*3] = cr; colors[i*3+1] = cg; colors[i*3+2] = cb;
    }
    
    GNEngine.particles.geometry.attributes.position.needsUpdate = true;
    GNEngine.particles.geometry.attributes.color.needsUpdate = true;
}

// ================= [ M5: STELLAR LIFECYCLE ENGINE ] =================
function launchStellar() {
    App.mode = 'stellar'; clearScene(); App.scene.fog = new THREE.FogExp2(0x020204, 0.0002);
    App.camera.position.set(0, 50, 400); App.controls.target.set(0, 0, 0);

    SLEngine.star = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64), 
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
    );
    App.scene.add(SLEngine.star);

    const geo = new THREE.BufferGeometry();
    SLEngine.pos0 = new Float32Array(SLEngine.count * 3);
    SLEngine.pos1 = new Float32Array(SLEngine.count * 3);
    SLEngine.pos2 = new Float32Array(SLEngine.count * 3);
    SLEngine.pos3 = new Float32Array(SLEngine.count * 3);
    SLEngine.pos4 = new Float32Array(SLEngine.count * 3);
    const currentPos = new Float32Array(SLEngine.count * 3);

    for(let i=0; i<SLEngine.count; i++) {
        const setPos = (arr, radius, noiseMultiplier) => {
            const u = Math.random(), v = Math.random();
            const theta = 2 * Math.PI * u; const phi = Math.acos(2 * v - 1);
            const r = radius + (Math.random() - 0.5) * noiseMultiplier;
            arr[i*3] = r * Math.sin(phi) * Math.cos(theta);
            arr[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            arr[i*3+2] = r * Math.cos(phi);
        };
        setPos(SLEngine.pos0, 300, 200);  
        setPos(SLEngine.pos1, 80, 50);    
        setPos(SLEngine.pos2, 5, 2);      
        setPos(SLEngine.pos3, 150, 20);   
        setPos(SLEngine.pos4, 400, 100);  
        currentPos[i*3] = SLEngine.pos0[i*3]; currentPos[i*3+1] = SLEngine.pos0[i*3+1]; currentPos[i*3+2] = SLEngine.pos0[i*3+2];
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(currentPos, 3));
    SLEngine.particles = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.5, color: 0xffaa55, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
    App.scene.add(SLEngine.particles);

    drawHRDiagramBackground();
    updateStellarState();
}

function drawHRDiagramBackground() {
    let bgStars = '';
    for(let i=0; i<150; i++) {
        let x = 50 + Math.random() * 400; let y = 30 + (x - 50) * 0.6 + (Math.random()-0.5)*30;
        bgStars += `<circle cx="${x}" cy="${y}" r="1.5" fill="rgba(255,255,255,0.3)" />`;
    }
    for(let i=0; i<50; i++) {
        let x = 300 + Math.random() * 150; let y = 30 + Math.random() * 80;
        bgStars += `<circle cx="${x}" cy="${y}" r="2" fill="rgba(255,100,50,0.4)" />`;
    }
    for(let i=0; i<30; i++) {
        let x = 80 + Math.random() * 100; let y = 250 + Math.random() * 50;
        bgStars += `<circle cx="${x}" cy="${y}" r="1" fill="rgba(100,200,255,0.4)" />`;
    }

    DOM.slHrDiagram.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 500 320" preserveAspectRatio="none">
            <line x1="50" y1="20" x2="480" y2="20" class="hr-grid"/>
            <line x1="50" y1="160" x2="480" y2="160" class="hr-grid"/>
            <line x1="50" y1="300" x2="480" y2="300" class="hr-axis"/>
            <line x1="50" y1="20" x2="50" y2="300" class="hr-axis"/>
            <line x1="265" y1="20" x2="265" y2="300" class="hr-grid"/>
            <line x1="480" y1="20" x2="480" y2="300" class="hr-axis"/>
            <text x="265" y="315" class="hr-text" text-anchor="middle">Surface Temperature (K) [Hot ← Cold]</text>
            <text x="50" y="315" class="hr-text" text-anchor="middle">30,000</text>
            <text x="265" y="315" class="hr-text" text-anchor="middle">6,000</text>
            <text x="480" y="315" class="hr-text" text-anchor="middle">3,000</text>
            <text x="15" y="160" class="hr-text" transform="rotate(-90 15,160)" text-anchor="middle">Luminosity (L☉)</text>
            <text x="40" y="25" class="hr-text" text-anchor="end">10^5</text>
            <text x="40" y="165" class="hr-text" text-anchor="end">1</text>
            <text x="40" y="300" class="hr-text" text-anchor="end">10^-4</text>
            ${bgStars}
            <circle id="sl-hr-dot" class="hr-dot" cx="265" cy="160" r="8" fill="#ffcc00" style="filter: drop-shadow(0 0 8px #ffcc00); stroke: #fff; stroke-width: 1.5;"/>
        </svg>
    `;
}

function updateStellarState() {
    if(App.mode !== 'stellar') return;
    const mass = parseFloat(DOM.slMass.value);
    const time = parseFloat(DOM.slTime.value);
    
    const msLum = Math.pow(mass, 3.5);
    const msRad = Math.pow(mass, 0.8);
    const msTemp = 5778 * Math.pow(msLum / Math.pow(msRad, 2), 0.25);

    let fateName, fateCol, fateTemp, fateLum, fateRad;
    let massClass;
    let rgbMain;

    if (mass < 0.8) { 
        massClass = "Red Dwarf"; rgbMain = 0xff4422; 
        fateName = "White Dwarf"; fateTemp = 10000; fateLum = 0.001; fateRad = 0.01; fateCol = 0xddddff;
    } else if (mass <= 8) { 
        massClass = "Sun-like Star"; rgbMain = 0xffaa00; 
        fateName = "White Dwarf"; fateTemp = 25000; fateLum = 0.01; fateRad = 0.01; fateCol = 0xffffff;
    } else if (mass <= 25) { 
        massClass = "Massive Star"; rgbMain = 0x88ccff; 
        fateName = "Neutron Star (Supernova)"; fateTemp = 1000000; fateLum = 0.0001; fateRad = 0.00001; fateCol = 0x00ffff;
    } else { 
        massClass = "Hypergiant"; rgbMain = 0x4488ff; 
        fateName = "Black Hole (Hypernova)"; fateTemp = 0.1; fateLum = 0.00001; fateRad = 0.00001; fateCol = 0x000000;
    }

    DOM.slMassVal.innerHTML = `${mass.toFixed(1)} M☉ (<span style="color:#ffaa00">${massClass}</span>)`;
    DOM.slFate.textContent = fateName;

    const stages = [
        { t: 0, temp: 50, lum: 0.001, rad: 500, col: 0x4455aa, name: "Stellar Nebula (분자 구름)" },
        { t: 25, temp: 3000, lum: msLum*5, rad: msRad*10, col: 0xff6600, name: "Protostar (원시성)" },
        { t: 50, temp: msTemp, lum: msLum, rad: msRad, col: rgbMain, name: "Main Sequence (주계열성)" },
        { t: 80, temp: msTemp*0.6, lum: msLum*50, rad: msRad*80, col: 0xff3300, name: mass > 8 ? "Red Supergiant (적색 초거성)" : "Red Giant (적색 거성)" },
        { t: 100, temp: fateTemp, lum: fateLum, rad: fateRad, col: fateCol, name: fateName }
    ];

    let sA=0, sB=1, ratio=0;
    for(let i=0; i<stages.length-1; i++) {
        if(time >= stages[i].t && time <= stages[i+1].t) {
            sA = i; sB = i+1;
            ratio = (time - stages[i].t) / (stages[i+1].t - stages[i].t);
            break;
        }
    }

    const dA = stages[sA]; const dB = stages[sB];
    const curTemp = dA.temp + (dB.temp - dA.temp) * ratio;
    const curLum = Math.pow(10, Math.log10(dA.lum) + (Math.log10(dB.lum) - Math.log10(dA.lum)) * ratio); 
    const curRad = dA.rad + (dB.rad - dA.rad) * ratio;

    DOM.slStageVal.textContent = time < 100 ? dA.name : dB.name;
    DOM.slTemp.textContent = `${Math.round(curTemp).toLocaleString()} K`;
    DOM.slLum.textContent = curLum < 0.01 ? `${curLum.toFixed(4)} L☉` : `${Math.round(curLum).toLocaleString()} L☉`;
    DOM.slRad.textContent = curRad < 0.1 ? `${curRad.toFixed(3)} R☉` : `${Math.round(curRad).toLocaleString()} R☉`;

    const logT = Math.log10(Math.max(curTemp, 2500));
    const logTMax = Math.log10(30000); const logTMin = Math.log10(3000);
    let svgX = 50 + ((logTMax - logT) / (logTMax - logTMin)) * 430;
    
    const logL = Math.log10(Math.max(curLum, 0.0001));
    const logLMax = 5; const logLMin = -4;
    let svgY = 20 + ((logLMax - logL) / (logLMax - logLMin)) * 280;

    const dot = document.getElementById('sl-hr-dot');
    if(dot) {
        dot.setAttribute('cx', Math.min(Math.max(svgX, 50), 480));
        dot.setAttribute('cy', Math.min(Math.max(svgY, 20), 300));
        dot.setAttribute('fill', '#' + new THREE.Color(dA.col).lerp(new THREE.Color(dB.col), ratio).getHexString());
    }

    let visualScale = Math.max(0.2, Math.cbrt(curRad) * 1.5);
    if(time >= 95 && mass > 25) visualScale = 0; 
    SLEngine.star.scale.set(visualScale, visualScale, visualScale);
    SLEngine.star.material.color.setHex(new THREE.Color(dA.col).lerp(new THREE.Color(dB.col), ratio).getHex());

    const positions = SLEngine.particles.geometry.attributes.position.array;
    const arrA = SLEngine[`pos${sA}`];
    const arrB = SLEngine[`pos${sB}`];
    
    let pOpacity = 0.6;
    if(time > 30 && time < 80) pOpacity = 0.05; 
    else if(time >= 80) pOpacity = 0.8; 
    SLEngine.particles.material.opacity = pOpacity;

    for(let i=0; i<SLEngine.count * 3; i++) {
        positions[i] = arrA[i] + (arrB[i] - arrA[i]) * ratio;
    }
    SLEngine.particles.geometry.attributes.position.needsUpdate = true;
}


// ================= [ 글로벌 이벤트 리스너 바인딩 및 라우팅 ] =================
document.querySelectorAll('.module-card').forEach(card => {
    card.addEventListener('click', () => {
        DOM.lobby.style.opacity = "0";
        setTimeout(() => {
            DOM.lobby.style.display = "none"; DOM.btnHub.style.display = "block"; 
            const targetMod = card.dataset.module;
            if (targetMod === 'deepspace') { DOM.uiDS.style.display = 'block'; launchDeepSpace(); }
            else if (targetMod === 'solarsystem') { DOM.uiSS.style.display = 'block'; launchSolarSystem(); }
            else if (targetMod === 'probes') { DOM.uiPR.style.display = 'block'; launchProbes(); }
            else if (targetMod === 'genesis') { DOM.uiGN.style.display = 'block'; launchGenesis(); }
            else if (targetMod === 'stellar') { DOM.uiSL.style.display = 'block'; launchStellar(); }
        }, 500);
    });
});

DOM.btnHub.addEventListener('click', () => {
    DOM.uiDS.style.display = 'none'; DOM.uiSS.style.display = 'none'; DOM.uiPR.style.display = 'none'; 
    DOM.uiGN.style.display = 'none'; DOM.uiSL.style.display = 'none';
    DOM.btnHub.style.display = 'none';
    App.mode = 'lobby'; clearScene(); buildLobbyBackground();
    DOM.lobby.style.display = 'flex'; setTimeout(() => DOM.lobby.style.opacity = "1", 100);
});

DOM.dsTargets.forEach(btn => btn.addEventListener('click', (e) => { DOM.dsTargets.forEach(b => b.classList.remove('active')); e.target.closest('.target-btn').classList.add('active'); dsWarpTo(e.target.closest('.target-btn').dataset.target); }));
DOM.bhMass.addEventListener('input', dsUpdatePhysics); DOM.bhDist.addEventListener('input', dsUpdatePhysics);

DOM.ssBtnReset.addEventListener('click', () => {
    SSEngine.tracked = null; document.querySelectorAll('.ss-target, .moon-btn').forEach(b => b.classList.remove('active')); DOM.ssInfo.style.opacity = "0";
    new TWEEN.Tween(App.camera.position).to(new THREE.Vector3(0, 150, 200), 1500).start(); new TWEEN.Tween(App.controls.target).to(new THREE.Vector3(0,0,0), 1500).start();
});
DOM.ssSpeed.addEventListener('input', e => { SSEngine.speedMulti = parseFloat(e.target.value) / 10; document.getElementById('ss-speed-val').textContent = `${(SSEngine.speedMulti*10).toFixed(1)}x`; });

DOM.btnPrReset.addEventListener('click', () => {
    PREngine.tracked = null; document.querySelectorAll('.pr-target').forEach(b => b.classList.remove('active')); DOM.prInfo.style.opacity = "0";
    new TWEEN.Tween(App.camera.position).to(new THREE.Vector3(0, 500, 800), 1500).start(); new TWEEN.Tween(App.controls.target).to(new THREE.Vector3(0,0,0), 1500).start();
});

DOM.gnTimeline.addEventListener('input', e => { gnUpdateTimeline(parseFloat(e.target.value)); });

// 스텔라 모듈의 슬라이더 작동을 위한 이벤트 리스너가 글로벌 영역에 누락되어 발생했던 오류를 확실하게 복구했습니다.
DOM.slMass.addEventListener('input', updateStellarState);
DOM.slTime.addEventListener('input', updateStellarState);
DOM.btnSlReset.addEventListener('click', () => {
    new TWEEN.Tween(App.camera.position).to(new THREE.Vector3(0, 50, 400), 1500).start();
    new TWEEN.Tween(App.controls.target).to(new THREE.Vector3(0,0,0), 1500).start();
});


// ================= [ 글로벌 마스터 애니메이션 루프 ] =================
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update(); 

    if (App.mode === 'lobby') { App.scene.rotation.y += 0.0005; } 
    else if (App.mode === 'deepspace') {
        Object.keys(DB.deepspace).forEach(k => { 
            if(DB.deepspace[k].type === 'nebula' || DB.deepspace[k].type === 'galaxy') {
                if(DSEngine.objects[k]) DSEngine.objects[k].rotation.y += 0.0002; 
            }
        });
        if (DSEngine.bh.disk && DSEngine.bh.geometry) {
            const positions = DSEngine.bh.geometry.attributes.position.array;
            const colors = DSEngine.bh.geometry.attributes.color.array;
            const massFactor = parseFloat(DOM.bhMass.value) / 10;
            
            for(let i=0; i < DSEngine.bh.count; i++) {
                let x = positions[i*3], z = positions[i*3+2]; let r = Math.sqrt(x*x + z*z); let t = Math.atan2(z, x);
                t += DSEngine.bh.speeds[i] * (1.0 / Math.max(0.1, massFactor));
                positions[i*3] = Math.cos(t) * r; positions[i*3+2] = Math.sin(t) * r;
                let approaching = x / r; let intensity = 1.0 - (r / 30); 
                colors[i*3] = 1.0 * intensity; colors[i*3+1] = (0.5 + approaching*0.4) * intensity; colors[i*3+2] = Math.max(0, approaching*0.8) * intensity;
            }
            DSEngine.bh.geometry.attributes.position.needsUpdate = true;
            DSEngine.bh.geometry.attributes.color.needsUpdate = true;
        }
    } 
    else if (App.mode === 'solarsystem') {
        SSEngine.planets.forEach(p => { p.pivot.rotation.y += p.speed * SSEngine.speedMulti; p.mesh.rotation.y += 0.05 * SSEngine.speedMulti; });
        SSEngine.moons.forEach(m => { m.pivot.rotation.y += m.speed * SSEngine.speedMulti; });
        if (SSEngine.tracked) {
            const tPos = new THREE.Vector3(); SSEngine.tracked.mesh.getWorldPosition(tPos); 
            App.controls.target.lerp(tPos, 0.2);
            const isMoon = SSEngine.tracked.data.speed !== undefined && SSEngine.tracked.parent !== undefined;
            const zDist = isMoon ? SSEngine.tracked.data.r * 8 + 3 : SSEngine.tracked.data.r * 5 + 10;
            App.camera.position.lerp(tPos.clone().add(new THREE.Vector3(zDist, zDist/2, zDist)), 0.08);
        }
    }
    else if (App.mode === 'probes') {
        PREngine.probes.forEach(p => p.mesh.rotation.y += 0.01);
    }
    else if (App.mode === 'genesis') {
        if(GNEngine.particles) GNEngine.particles.rotation.y -= 0.001; 
    }
    else if (App.mode === 'stellar') {
        if(SLEngine.particles) SLEngine.particles.rotation.y += 0.002;
        if(SLEngine.star) SLEngine.star.rotation.y += 0.005;
    }

    App.controls.update();
    App.renderer.render(App.scene, App.camera);
}

window.onload = initGlobalCore;
