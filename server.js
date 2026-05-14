// =======================================================================
// [ADDITIVE MODULES: 05 Stellar, 06 Exoplanet, 07 Collision, 08 Observatory]
// =======================================================================

// --- EXTENDING DOM BINDINGS ---
DOM.uiSL = document.getElementById('ui-stellar');
DOM.uiEP = document.getElementById('ui-exoplanet');
DOM.uiCC = document.getElementById('ui-collision');
DOM.uiOBS = document.getElementById('ui-observatory');

// --- MODULE 05: STELLAR LIFECYCLE DATA & ENGINE ---
const SLData = [
    { temp: 50, lum: 0.001, radius: 100000, color: 0xaabbff, name: "Nebula Cloud" },
    { temp: 3000, lum: 1, radius: 5, color: 0xff6600, name: "Protostar" },
    { temp: 15000, lum: 1000, radius: 3, color: 0xffffff, name: "Main Sequence" },
    { temp: 4000, lum: 50000, radius: 200, color: 0xff3300, name: "Red Giant" },
    { temp: 25000, lum: 0.01, radius: 0.01, color: 0xaaddff, name: "White Dwarf" },
    { temp: 1000000, lum: 0.001, radius: 0.00001, color: 0xffffff, name: "Neutron Star" },
    { temp: 0, lum: 0, radius: 0, color: 0x000000, name: "Black Hole" }
];
const SLEngine = { star: null, particles: null, count: 30000, pos0: null, pos1: null, pos2: null, pos3: null, pos4: null };

function launchStellar() {
    App.mode = 'stellar'; clearScene(); App.scene.fog = new THREE.FogExp2(0x020204, 0.0002);
    App.camera.position.set(0, 50, 300); App.controls.target.set(0, 0, 0);

    // Central Star
    SLEngine.star = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    App.scene.add(SLEngine.star);

    // Particle Shells
    const geo = new THREE.BufferGeometry();
    SLEngine.pos0 = new Float32Array(SLEngine.count * 3); // Nebula
    SLEngine.pos1 = new Float32Array(SLEngine.count * 3); // Protostar
    SLEngine.pos2 = new Float32Array(SLEngine.count * 3); // Main Sequence
    SLEngine.pos3 = new Float32Array(SLEngine.count * 3); // Red Giant
    SLEngine.pos4 = new Float32Array(SLEngine.count * 3); // Remnant
    const currentPos = new Float32Array(SLEngine.count * 3);

    for(let i=0; i<SLEngine.count; i++) {
        const u = Math.random(), v = Math.random();
        const theta = 2 * Math.PI * u; const phi = Math.acos(2 * v - 1);
        const setPos = (arr, r, noise) => {
            const rad = r + (Math.random()-0.5)*noise;
            arr[i*3] = rad * Math.sin(phi) * Math.cos(theta);
            arr[i*3+1] = rad * Math.sin(phi) * Math.sin(theta);
            arr[i*3+2] = rad * Math.cos(phi);
        };
        setPos(SLEngine.pos0, 200, 100);
        setPos(SLEngine.pos1, 30, 20);
        setPos(SLEngine.pos2, 10, 2);
        setPos(SLEngine.pos3, 120, 10);
        setPos(SLEngine.pos4, 250, 50); // Expanding planetary nebula
        currentPos[i*3] = SLEngine.pos0[i*3]; currentPos[i*3+1] = SLEngine.pos0[i*3+1]; currentPos[i*3+2] = SLEngine.pos0[i*3+2];
    }
    geo.setAttribute('position', new THREE.BufferAttribute(currentPos, 3));
    SLEngine.particles = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.5, color: 0xff9944, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
    App.scene.add(SLEngine.particles);

    // Initial SVG HR Diagram
    const svgContainer = document.getElementById('sl-hr-diagram');
    svgContainer.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 500 350">
            <line x1="50" y1="300" x2="480" y2="300" class="hr-axis"/>
            <line x1="50" y1="20" x2="50" y2="300" class="hr-axis"/>
            <text x="250" y="330" class="hr-text" text-anchor="middle">Temperature (K) ← Hot to Cold</text>
            <text x="20" y="175" class="hr-text" transform="rotate(-90 20,175)" text-anchor="middle">Luminosity (L☉)</text>
            <path d="M 100,50 Q 250,150 400,280" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="20"/>
            <circle id="sl-hr-dot" cx="450" cy="300" r="6" fill="#ff9944" style="filter: drop-shadow(0 0 5px #ff9944);"/>
        </svg>
    `;

    document.getElementById('sl-mass').addEventListener('input', updateStellarState);
    document.getElementById('sl-time').addEventListener('input', updateStellarState);
    updateStellarState();
}

function updateStellarState() {
    if(App.mode !== 'stellar') return;
    const mass = parseFloat(document.getElementById('sl-mass').value);
    const time = parseFloat(document.getElementById('sl-time').value);
    
    let fateClass = "White Dwarf"; let fateIdx = 4;
    let massClass = "Sun-like Star";
    if (mass < 0.8) { massClass = "Red Dwarf"; }
    else if (mass > 8 && mass <= 20) { massClass = "Massive Star"; fateClass = "Neutron Star"; fateIdx = 5; }
    else if (mass > 20) { massClass = "Hypergiant"; fateClass = "Black Hole"; fateIdx = 6; }

    document.getElementById('sl-mass-val').innerHTML = `${mass.toFixed(1)} M☉ (<span style="color:#ffaa00">${massClass}</span>)`;
    document.getElementById('sl-fate').textContent = fateClass;

    // Determine current interpolation stages
    let sA, sB, ratio;
    if (time < 25) { sA = 0; sB = 1; ratio = time / 25; }
    else if (time < 50) { sA = 1; sB = 2; ratio = (time - 25) / 25; }
    else if (time < 75) { sA = 2; sB = 3; ratio = (time - 50) / 25; }
    else { sA = 3; sB = fateIdx; ratio = (time - 75) / 25; }

    const dA = SLData[sA]; const dB = SLData[sB];
    const curTemp = dA.temp + (dB.temp - dA.temp) * ratio;
    const curLum = dA.lum * Math.pow((dB.lum / dA.lum), ratio); // Logarithmic interpolation for lum
    const curRad = dA.radius + (dB.radius - dA.radius) * ratio;
    
    document.getElementById('sl-stage-val').textContent = time < 50 ? (time < 25 ? "Nebula Collapse" : "Protostar Formation") : (time < 75 ? "Main Sequence Phase" : "End of Life");
    document.getElementById('sl-temp').textContent = `${Math.round(curTemp).toLocaleString()} K`;
    document.getElementById('sl-lum').textContent = `${curLum.toFixed(3)} L☉`;
    document.getElementById('sl-rad').textContent = `${curRad.toFixed(3)} R☉`;

    // Update HR Diagram Dot
    // X axis: log(Temp) inverted. 30000K -> x=50, 3000K -> x=450
    const logT = Math.max(0, Math.log10(curTemp || 1));
    const x = 50 + ((Math.log10(30000) - logT) / (Math.log10(30000) - Math.log10(100))) * 400;
    // Y axis: log(Lum). 10^5 -> y=50, 10^-4 -> y=300
    const logL = Math.log10(curLum || 0.0001);
    const y = 300 - ((logL + 4) / 9) * 250;
    
    const dot = document.getElementById('sl-hr-dot');
    if(dot) { dot.setAttribute('cx', Math.min(Math.max(x, 50), 480)); dot.setAttribute('cy', Math.min(Math.max(y, 20), 320)); }

    // Update 3D Geometry
    SLEngine.star.scale.set(Math.max(0.1, curRad*0.2), Math.max(0.1, curRad*0.2), Math.max(0.1, curRad*0.2));
    SLEngine.star.material.color.setHex(new THREE.Color(dA.color).lerp(new THREE.Color(dB.color), ratio).getHex());

    const positions = SLEngine.particles.geometry.attributes.position.array;
    const arrA = SLEngine[`pos${sA}`] || SLEngine.pos4; // Fallback to expanding shell
    const arrB = SLEngine[`pos${sB===4||sB===5||sB===6 ? 4 : sB}`];
    
    for(let i=0; i<SLEngine.count; i++) {
        positions[i*3] = arrA[i*3] + (arrB[i*3] - arrA[i*3]) * ratio;
        positions[i*3+1] = arrA[i*3+1] + (arrB[i*3+1] - arrA[i*3+1]) * ratio;
        positions[i*3+2] = arrA[i*3+2] + (arrB[i*3+2] - arrA[i*3+2]) * ratio;
    }
    SLEngine.particles.geometry.attributes.position.needsUpdate = true;
}

// --- MODULE 06: EXOPLANET HUNTER DATA & ENGINE ---
const EPData = [
    { id: "trappist1", starTemp: 2550, starRadius: 0.11, habZone: [0.02, 0.05], planets: [
        { name: "TRAPPIST-1b", orbitalPeriod_days: 1.51, radius_earth: 1.116, mass_earth: 1.37, esi: 0.55, inHZ: false, discovered: 2016, desc: "A rocky world too close to its star." },
        { name: "TRAPPIST-1c", orbitalPeriod_days: 2.42, radius_earth: 1.097, mass_earth: 1.30, esi: 0.61, inHZ: false, discovered: 2016, desc: "Likely has a thick Venus-like atmosphere." },
        { name: "TRAPPIST-1d", orbitalPeriod_days: 4.05, radius_earth: 0.788, mass_earth: 0.38, esi: 0.90, inHZ: false, discovered: 2016, desc: "A small planet near the inner edge of the habitable zone." },
        { name: "TRAPPIST-1e", orbitalPeriod_days: 6.10, radius_earth: 0.920, mass_earth: 0.69, esi: 0.95, inHZ: true, discovered: 2017, desc: "One of the most Earth-like exoplanets discovered, comfortably in the Habitable Zone." },
        { name: "TRAPPIST-1f", orbitalPeriod_days: 9.20, radius_earth: 1.045, mass_earth: 1.04, esi: 0.68, inHZ: true, discovered: 2017, desc: "A potentially water-rich world in the outer habitable zone." },
        { name: "TRAPPIST-1g", orbitalPeriod_days: 12.35, radius_earth: 1.127, mass_earth: 1.32, esi: 0.58, inHZ: true, discovered: 2017, desc: "The largest planet in the system, sitting on the cold edge of the HZ." },
        { name: "TRAPPIST-1h", orbitalPeriod_days: 18.77, radius_earth: 0.755, mass_earth: 0.32, esi: 0.45, inHZ: false, discovered: 2017, desc: "A distant, frozen world." }
    ]},
    { id: "kepler452", starTemp: 5757, starRadius: 1.11, habZone: [0.9, 1.3], planets: [
        { name: "Kepler-452b", orbitalPeriod_days: 384.8, radius_earth: 1.63, mass_earth: 5.0, esi: 0.83, inHZ: true, discovered: 2015, desc: "Known as 'Earth's older cousin', orbiting a sun-like star." }
    ]},
    { id: "proxima", starTemp: 3042, starRadius: 0.14, habZone: [0.04, 0.08], planets: [
        { name: "Proxima Centauri b", orbitalPeriod_days: 11.18, radius_earth: 1.07, mass_earth: 1.17, esi: 0.87, inHZ: true, discovered: 2016, desc: "The closest known exoplanet to the Solar System." }
    ]}
];
const EPEngine = { activeSys: null, activePlanet: null, meshes: [], time: 0 };

function launchExoplanet() {
    App.mode = 'exoplanet'; clearScene(); App.scene.fog = new THREE.FogExp2(0x020204, 0.002);
    App.camera.position.set(0, 30, 80); App.controls.target.set(0, 0, 0);

    const btnContainer = document.getElementById('ep-system-list');
    btnContainer.innerHTML = '';
    EPData.forEach(sys => {
        const btn = document.createElement('button'); btn.className = 'target-btn ep-sys-btn';
        btn.innerHTML = `<span class="btn-title">${sys.id.toUpperCase()}</span>`;
        btn.onclick = () => buildExoSystem(sys, btn);
        btnContainer.appendChild(btn);
    });
    
    // Auto-load first
    buildExoSystem(EPData[0], btnContainer.firstChild);
}

function buildExoSystem(sysData, btnElem) {
    document.querySelectorAll('.ep-sys-btn').forEach(b => b.classList.remove('active'));
    if(btnElem) btnElem.classList.add('active');
    
    EPEngine.meshes.forEach(m => App.scene.remove(m));
    EPEngine.meshes = []; EPEngine.activeSys = sysData; EPEngine.time = 0;

    // Star
    const starColor = sysData.starTemp > 5000 ? 0xffffff : (sysData.starTemp > 3000 ? 0xffaa00 : 0xff4400);
    const star = new THREE.Mesh(new THREE.SphereGeometry(6 * sysData.starRadius, 32, 32), new THREE.MeshBasicMaterial({ color: starColor }));
    App.scene.add(star); EPEngine.meshes.push(star);

    // Habitable Zone Torus
    const hzIn = sysData.habZone[0] * 500; const hzOut = sysData.habZone[1] * 500;
    const hzGeo = new THREE.RingGeometry(hzIn, hzOut, 64);
    const hzMat = new THREE.MeshBasicMaterial({ color: 0x64ffda, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
    const hzMesh = new THREE.Mesh(hzGeo, hzMat);
    hzMesh.rotation.x = Math.PI / 2;
    App.scene.add(hzMesh); EPEngine.meshes.push(hzMesh);

    // Planets
    sysData.planets.forEach((p, idx) => {
        const orbitScale = 20 + idx * 10;
        const orbitLine = new THREE.Mesh(new THREE.RingGeometry(orbitScale-0.1, orbitScale+0.1, 64), new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide }));
        orbitLine.rotation.x = Math.PI / 2; App.scene.add(orbitLine); EPEngine.meshes.push(orbitLine);

        const pMesh = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.5, p.radius_earth*0.5), 16, 16), new THREE.MeshStandardMaterial({ color: p.inHZ ? 0x64ffda : 0x888888 }));
        pMesh.position.x = orbitScale;
        const pivot = new THREE.Group(); pivot.add(pMesh);
        App.scene.add(pivot); EPEngine.meshes.push(pivot);

        p.meshObj = pMesh; p.pivotObj = pivot; p.orbitRadius = orbitScale;
        // Kepler 3rd Law approx speed (P^2 = a^3)
        p.angularSpeed = 0.5 / Math.sqrt(Math.pow(orbitScale, 3));
    });

    App.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    App.scene.add(new THREE.PointLight(starColor, 2, 200));

    // Select first planet by default
    selectExoplanet(sysData.planets[0]);
    drawESIBars(sysData);
}

function selectExoplanet(pData) {
    EPEngine.activePlanet = pData;
    document.getElementById('ep-planet-name').textContent = pData.name;
    document.getElementById('ep-planet-desc').textContent = pData.desc;
    document.getElementById('ep-period').textContent = `${pData.orbitalPeriod_days} Days`;
    document.getElementById('ep-radius').textContent = `${pData.radius_earth} R⊕`;
    document.getElementById('ep-mass').textContent = `${pData.mass_earth} M⊕`;
    document.getElementById('ep-year').textContent = pData.discovered;

    new TWEEN.Tween(App.controls.target).to(pData.meshObj.getWorldPosition(new THREE.Vector3()), 1000).start();
}

function drawESIBars(sysData) {
    const container = document.getElementById('ep-esi-chart');
    let svgHTML = `<svg width="100%" height="100%" viewBox="0 0 400 180">
        <line x1="10" y1="160" x2="390" y2="160" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        <text x="10" y="15" fill="#fff" font-size="10" font-family="Roboto Mono">Earth Similarity Index (0.0 to 1.0)</text>`;
    
    const barWidth = 350 / sysData.planets.length;
    sysData.planets.forEach((p, i) => {
        const h = p.esi * 130; const x = 20 + i * barWidth;
        const color = p.inHZ ? "#64ffda" : "#555";
        svgHTML += `<rect x="${x}" y="${160-h}" width="${barWidth*0.6}" height="${h}" fill="${color}" opacity="0.8"/>`;
        svgHTML += `<text x="${x + barWidth*0.3}" y="175" fill="#aaa" font-size="8" text-anchor="middle" font-family="Roboto Mono">${p.name.split('-')[1]||p.name}</text>`;
        svgHTML += `<text x="${x + barWidth*0.3}" y="${155-h}" fill="${color}" font-size="9" text-anchor="middle" font-family="Roboto Mono">${p.esi.toFixed(2)}</text>`;
    });
    svgHTML += `</svg>`;
    container.innerHTML = svgHTML;
}

// --- MODULE 07: COSMIC COLLISION DATA & ENGINE ---
const CCStages = [
    { t: 0, sep: "2.5 Mly", vel: "110 km/s", prob: "99.9%", desc: "현재: 우리은하와 안드로메다 은하가 초당 110km의 속도로 서로를 향해 접근하고 있습니다." },
    { t: 25, sep: "1.0 Mly", vel: "300 km/s", prob: "100%", desc: "T+20억 년: 두 은하의 헤일로가 교차하며 중력적 상호작용이 본격화됩니다." },
    { t: 50, sep: "0.2 Mly", vel: "800 km/s", prob: "100%", desc: "T+40억 년 (첫 번째 근접 통과): 폭발적인 항성 탄생(Starburst)이 일어나고 조석 꼬리가 길게 늘어납니다." },
    { t: 75, sep: "0.8 Mly", vel: "200 km/s", prob: "100%", desc: "T+50억 년: 관성을 이기지 못하고 다시 분리되지만, 강한 중력에 묶여 다시 돌아옵니다." },
    { t: 100, sep: "0 Mly", vel: "0 km/s", prob: "100%", desc: "T+70억 년 (밀코메다): 두 은하의 핵이 하나로 융합되어 거대한 타원 은하를 형성합니다." }
];
const CCEngine = { particles: null, count: 40000, stages: [], showHalo: true, showTidal: true };

function launchCollision() {
    App.mode = 'collision'; clearScene(); App.scene.fog = new THREE.FogExp2(0x020204, 0.001);
    App.camera.position.set(0, 300, 600); App.controls.target.set(0, 0, 0);

    const geo = new THREE.BufferGeometry();
    const colors = new Float32Array(CCEngine.count * 3);
    
    // Precompute 5 stages
    for(let s=0; s<5; s++) CCEngine.stages[s] = new Float32Array(CCEngine.count * 3);

    const buildGalaxy = (startIdx, numPts, coreX, coreZ, colHex, isAndromeda) => {
        const c = new THREE.Color(colHex);
        for(let i=0; i<numPts; i++) {
            const idx = startIdx + i;
            colors[idx*3] = c.r; colors[idx*3+1] = c.g; colors[idx*3+2] = c.b;

            // Base Spiral coords
            const r = Math.random() * 150; 
            const arms = 2; const armOffset = (i % arms) * Math.PI;
            const theta = r * 0.05 + armOffset + (Math.random()-0.5);
            const bx = Math.cos(theta) * r; const bz = Math.sin(theta) * r; const by = (Math.random()-0.5)*10 * (150/(r+10));
            
            // Stage 0: Approach
            const s0X = coreX + bx; const s0Z = coreZ + bz;
            CCEngine.stages[0][idx*3] = s0X; CCEngine.stages[0][idx*3+1] = by; CCEngine.stages[0][idx*3+2] = s0Z;
            
            // Stage 1: First Contact (closer)
            const dirX = isAndromeda ? -1 : 1;
            CCEngine.stages[1][idx*3] = s0X - dirX*100; CCEngine.stages[1][idx*3+1] = by; CCEngine.stages[1][idx*3+2] = s0Z;

            // Stage 2: Pericentre (Tidal tails - particles flung out based on radius)
            const fling = r > 80 ? 2.5 : 1.0;
            CCEngine.stages[2][idx*3] = (s0X - dirX*coreX) * fling;
            CCEngine.stages[2][idx*3+1] = by + (Math.random()-0.5)*50;
            CCEngine.stages[2][idx*3+2] = (s0Z) * fling;

            // Stage 3: Separation (Further out, highly distorted)
            CCEngine.stages[3][idx*3] = (s0X - dirX*coreX*1.5) * fling * 1.5;
            CCEngine.stages[3][idx*3+1] = by * 2;
            CCEngine.stages[3][idx*3+2] = (s0Z) * fling * 1.5;

            // Stage 4: Merger (Elliptical distribution)
            const finalR = Math.cbrt(Math.random()) * 200;
            const fPhi = Math.acos(2 * Math.random() - 1); const fTheta = Math.random() * Math.PI * 2;
            CCEngine.stages[4][idx*3] = finalR * Math.sin(fPhi) * Math.cos(fTheta);
            CCEngine.stages[4][idx*3+1] = finalR * Math.sin(fPhi) * Math.sin(fTheta);
            CCEngine.stages[4][idx*3+2] = finalR * Math.cos(fPhi);
        }
    };

    buildGalaxy(0, 20000, -200, 0, 0x88bbff, false); // Milky Way
    buildGalaxy(20000, 20000, 200, -50, 0xffaa55, true); // Andromeda

    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CCEngine.stages[0]), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    CCEngine.particles = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
    App.scene.add(CCEngine.particles);

    document.getElementById('cc-time').addEventListener('input', updateCollisionState);
    updateCollisionState();
}

function updateCollisionState() {
    if(App.mode !== 'collision') return;
    const val = parseFloat(document.getElementById('cc-time').value);
    
    let sIdx = Math.floor(val / 25);
    if(sIdx >= 4) sIdx = 3;
    const ratio = (val % 25) / 25.0;

    const data = CCStages[Math.round(val/25) === 5 ? 4 : Math.round(val/25)];
    document.getElementById('cc-stage-val').textContent = data.desc.split(':')[0];
    document.getElementById('cc-desc').textContent = data.desc.split(':')[1] || data.desc;
    document.getElementById('cc-sep').textContent = data.sep;
    document.getElementById('cc-vel').textContent = data.vel;

    const positions = CCEngine.particles.geometry.attributes.position.array;
    const arrA = CCEngine.stages[sIdx];
    const arrB = CCEngine.stages[sIdx + 1];

    for(let i=0; i<CCEngine.count * 3; i++) {
        positions[i] = arrA[i] + (arrB[i] - arrA[i]) * ratio;
    }
    CCEngine.particles.geometry.attributes.position.needsUpdate = true;
}

// --- MODULE 08: OBSERVATORY HISTORY DATA & ENGINE ---
const OBSData = [
    { name: "Galileo Refractor", year: 1609, loc: "Italy", wave: "Visible", aperture: "0.037m", disc: "Jupiter's moons, Lunar craters", color: "#ffffff", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Galileo%27s_telescope.jpg/800px-Galileo%27s_telescope.jpg", desc: "The first documented use of a telescope for astronomy." },
    { name: "Herschel 40-foot", year: 1789, loc: "UK", wave: "Visible", aperture: "1.2m", disc: "Uranus moons Enceladus and Mimas", color: "#ffffff", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Herschel_40_foot_telescope.jpg/800px-Herschel_40_foot_telescope.jpg", desc: "The largest telescope in the world for 50 years." },
    { name: "Mount Wilson", year: 1917, loc: "USA", wave: "Visible", aperture: "2.5m", disc: "Expansion of the universe (Hubble's Law)", color: "#ffffff", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Mt_Wilson_100_inch_Hooker_Telescope.jpg/800px-Mt_Wilson_100_inch_Hooker_Telescope.jpg", desc: "Edwin Hubble used this to discover galaxies beyond the Milky Way." },
    { name: "Arecibo", year: 1963, loc: "Puerto Rico", wave: "Radio", aperture: "305m", disc: "First binary pulsar, Exoplanet discovery", color: "#ff3333", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Arecibo_Observatory_Aerial_View.jpg/800px-Arecibo_Observatory_Aerial_View.jpg", desc: "An iconic radio telescope built into a natural sinkhole." },
    { name: "Hubble (HST)", year: 1990, loc: "LEO Orbit", wave: "Vis/UV", aperture: "2.4m", disc: "Age of universe, Deep fields, Dark energy", color: "#66ccff", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HST-SM4.jpeg/800px-HST-SM4.jpeg", desc: "Changed astronomy forever by operating above Earth's atmosphere." },
    { name: "Chandra", year: 1999, loc: "HEO Orbit", wave: "X-Ray", aperture: "1.2m", disc: "Black hole emissions, Supernova remnants", color: "#cc33ff", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Chandra_X-ray_Observatory.jpg/800px-Chandra_X-ray_Observatory.jpg", desc: "Detects X-ray emissions from very hot regions of the universe." },
    { name: "Spitzer", year: 2003, loc: "Solar Orbit", wave: "Infrared", aperture: "0.85m", disc: "TRAPPIST-1 system, Galactic dust rings", color: "#ff9900", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Spitzer_Space_Telescope.jpg/800px-Spitzer_Space_Telescope.jpg", desc: "Pierced through cosmic dust using infrared vision." },
    { name: "James Webb (JWST)", year: 2021, loc: "L2 Point", wave: "Infrared", aperture: "6.5m", disc: "Oldest galaxies, Exoplanet atmospheres", color: "#ffcc00", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/James_Webb_Space_Telescope.jpg/800px-James_Webb_Space_Telescope.jpg", desc: "The ultimate infrared successor, revealing the early universe." }
];
const OBSEngine = { earth: null, wireframe: null };

function launchObservatory() {
    App.mode = 'observatory'; clearScene(); App.scene.fog = new THREE.FogExp2(0x020204, 0.001);
    App.camera.position.set(0, 0, 50); App.controls.target.set(0, 0, 0);

    // Earth
    OBSEngine.earth = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 32), new THREE.MeshBasicMaterial({ color: 0x113366, wireframe: true }));
    App.scene.add(OBSEngine.earth);
    
    // Ambient stars
    const geo = new THREE.BufferGeometry(); const pos = new Float32Array(2000 * 3);
    for(let i=0; i<2000*3; i++) pos[i] = (Math.random()-0.5)*200;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    App.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({color: 0x888888, size: 1})));

    // Populate CSS Timeline
    const tlContainer = document.getElementById('obs-timeline');
    tlContainer.innerHTML = '';
    OBSData.forEach(obs => {
        const div = document.createElement('div'); div.className = 'obs-timeline-item';
        div.innerHTML = `<div class="obs-year">${obs.year}</div><div class="obs-title">${obs.name}</div>`;
        div.onclick = () => selectObservatory(obs, div);
        tlContainer.appendChild(div);
    });
    
    selectObservatory(OBSData[0], tlContainer.firstChild);
}

function selectObservatory(obs, elem) {
    document.querySelectorAll('.obs-timeline-item').forEach(e => e.classList.remove('active'));
    if(elem) elem.classList.add('active');

    DOM.obsName = document.getElementById('obs-name');
    DOM.obsMedia = document.getElementById('obs-media');
    DOM.obsDesc = document.getElementById('obs-desc');
    
    DOM.obsName.textContent = obs.name;
    DOM.obsMedia.style.backgroundImage = `url('${obs.img}')`;
    DOM.obsDesc.textContent = obs.desc;
    document.getElementById('obs-loc').textContent = obs.loc;
    document.getElementById('obs-aperture').textContent = obs.aperture;
    document.getElementById('obs-discovery').textContent = obs.disc;

    // Draw Spectrum SVG
    const svgCont = document.getElementById('obs-spectrum');
    let highlightX = 0; let highlightW = 0;
    if(obs.wave.includes("Radio")) { highlightX = 80; highlightW = 20; }
    else if(obs.wave.includes("Infrared")) { highlightX = 60; highlightW = 20; }
    else if(obs.wave.includes("Visible")) { highlightX = 40; highlightW = 10; }
    else if(obs.wave.includes("X-Ray") || obs.wave.includes("UV")) { highlightX = 10; highlightW = 20; }

    svgCont.innerHTML = `
        <svg width="100%" height="100%">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#cc33ff;stop-opacity:1" />
                    <stop offset="40%" style="stop-color:#3366ff;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#55ff55;stop-opacity:1" />
                    <stop offset="60%" style="stop-color:#ff9900;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#ff3333;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad)" opacity="0.3"/>
            <rect x="${highlightX}%" y="0" width="${highlightW}%" height="100%" fill="none" stroke="#fff" stroke-width="3" style="filter: drop-shadow(0 0 5px #fff);"/>
            <text x="5" y="25" fill="#fff" font-family="Roboto Mono" font-size="10">Gamma/X-Ray</text>
            <text x="95%" y="25" fill="#fff" font-family="Roboto Mono" font-size="10" text-anchor="end">Radio</text>
        </svg>
    `;

    // Swap Wireframe model
    if(OBSEngine.wireframe) App.scene.remove(OBSEngine.wireframe);
    const wfGroup = new THREE.Group();
    const isSpace = obs.loc.includes("Orbit") || obs.loc.includes("L2");
    
    // Procedural simple representation
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(obs.color), wireframe: true });
    if(isSpace) {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 8, 8), mat); body.rotation.x = Math.PI/2;
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(15, 4), mat);
        wfGroup.add(body); wfGroup.add(panel);
        wfGroup.position.set(20, 10, 0);
    } else {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8, 0, Math.PI*2, 0, Math.PI/2), mat);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 4, 8), mat); base.position.y = -2;
        wfGroup.add(dome); wfGroup.add(base);
        wfGroup.position.set(12, 0, 0);
    }
    App.scene.add(wfGroup);
    OBSEngine.wireframe = wfGroup;
}


// --- 🧩 REQUIRED ADDITIONS FOR ROUTING AND ANIMATION LOOP 🧩 ---
// 1. Add click handlers for the new cards. Ensure these lines are integrated into your existing card.addEventListener logic.
/*
    else if (targetMod === 'stellar')     { DOM.uiSL.style.display = 'block'; launchStellar(); }
    else if (targetMod === 'exoplanet')   { DOM.uiEP.style.display = 'block'; launchExoplanet(); }
    else if (targetMod === 'collision')   { DOM.uiCC.style.display = 'block'; launchCollision(); }
    else if (targetMod === 'observatory') { DOM.uiOBS.style.display = 'block'; launchObservatory(); }
*/

// 2. Add these blocks to the existing animate() function's if/else chain:
/*
    else if (App.mode === 'stellar') {
        if(SLEngine.particles) SLEngine.particles.rotation.y += 0.002;
        if(SLEngine.star) SLEngine.star.rotation.y += 0.005;
    }
    else if (App.mode === 'exoplanet') {
        EPEngine.time += 0.05;
        // Host star gentle rotation
        if(EPEngine.meshes[0]) EPEngine.meshes[0].rotation.y += 0.005;
        
        // Planet revolutions
        if(EPEngine.activeSys) {
            EPEngine.activeSys.planets.forEach(p => {
                if(p.pivotObj) p.pivotObj.rotation.y += p.angularSpeed;
                if(p.meshObj) p.meshObj.rotation.y += 0.05;
            });
        }
        
        // Dynamic Transit Light Curve SVG update for active planet
        if(EPEngine.activePlanet) {
            const svgCont = document.getElementById('ep-light-curve');
            if(svgCont) {
                const phase = (EPEngine.time % (Math.PI * 2)) / (Math.PI * 2); // 0 to 1
                let dip = 0;
                // Dip occurs when planet is in front (phase near 0.25 if cos is used, lets define 0.45 to 0.55)
                if(phase > 0.4 && phase < 0.6) {
                    const depth = Math.pow(EPEngine.activePlanet.radius_earth * 0.05, 2) * 50; // visual multiplier
                    dip = Math.sin((phase - 0.4) * Math.PI * 5) * depth;
                }
                const baseY = 30;
                // Draw live moving dot and graph
                const cursorX = phase * 400;
                const currentY = baseY + Math.max(0, dip);
                
                svgCont.innerHTML = `
                    <svg width="100%" height="100%">
                        <text x="10" y="15" fill="#fff" font-size="9" font-family="Roboto Mono">Relative Flux</text>
                        <line x1="0" y1="${baseY}" x2="400" y2="${baseY}" stroke="rgba(255,255,255,0.2)" stroke-dasharray="2,2"/>
                        <path d="M 0,${baseY} L 160,${baseY} Q 200,${baseY + Math.max(0, dip*2)} 240,${baseY} L 400,${baseY}" fill="none" stroke="#64ffda" stroke-width="2"/>
                        <circle cx="${cursorX}" cy="${currentY}" r="4" fill="#ff4466" />
                    </svg>
                `;
            }
        }
    }
    else if (App.mode === 'collision') {
        if(CCEngine.particles) {
            CCEngine.particles.rotation.y += 0.001;
            CCEngine.particles.rotation.z += 0.0005;
        }
    }
    else if (App.mode === 'observatory') {
        if(OBSEngine.earth) OBSEngine.earth.rotation.y += 0.002;
        if(OBSEngine.wireframe) {
            OBSEngine.wireframe.rotation.y += 0.005;
            OBSEngine.wireframe.rotation.x = Math.sin(Date.now()*0.001) * 0.2;
        }
    }
*/
