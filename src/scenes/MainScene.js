import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
// Importa tutti i componenti dalla cartella components
import * as SceneComponents from '../components/index';

export class MainScene {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = null;
        this.scene = null;
        this.platform = null;
        this.gui = null;
        this.shadowGenerator = null;
        this.glowLayer = null;
        this.purpleParticles = null;
        this.spider = null;
        this._rafId = null;
    }

    _renderScene() {
        if (this.scene) {
            try {
                this.scene.render();
            } catch (e) {
                console.error('Errore durante il render della scena:', e);
            }
        }
    }

    async initialize() {
        // Create engine
        this.engine = new BABYLON.Engine(this.canvas, true);

        // Create scene
        this.scene = new BABYLON.Scene(this.engine);

        try {
            // Crea la galassia come sfondo
            SceneComponents.createGalaxy(this.scene);
        } catch (error) {
            console.warn('Errore durante la creazione della galassia:', error);
        }
        
    // Imposta il colore di sfondo della scena a un blu molto scuro
    this.scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.05, 1);

        // GUI
        const textTexture = new BABYLON.DynamicTexture("textTexture", 512, this.scene, true);
        const textContext = textTexture.getContext();
        
        // Imposta il font e il testo
        textContext.font = "24px RunicMagic";
        textContext.fillStyle = "cyan";
        textContext.textAlign = "right";
        textContext.fillText("Ciao Mondo", 490, 30);
        
        textTexture.update();
        
        // Crea un plane per mostrare il testo
        const textPlane = BABYLON.MeshBuilder.CreatePlane("textPlane", {width: 5, height: 1}, this.scene);
        textPlane.position = new BABYLON.Vector3(8, 8, 0);
        
        const textMaterial = new BABYLON.StandardMaterial("textMaterial", this.scene);
        textMaterial.diffuseTexture = textTexture;
        textMaterial.emissiveTexture = textTexture;
        textMaterial.opacityTexture = textTexture;
        textMaterial.diffuseTexture.hasAlpha = true;
        textMaterial.useAlphaFromDiffuseTexture = true;
        textPlane.material = textMaterial;
        
        // Fai sempre guardare il testo verso la camera
        textPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        // Camera
        const camera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI / 3, 30, BABYLON.Vector3.Zero(), this.scene);
        camera.attachControl(this.canvas, true);
        camera.setPosition(new BABYLON.Vector3(0, 15, -30));
        
        // Illuminazione base
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
    // luce ambientale più morbida per evitare sovraesposizione
    light.intensity = 0.25;

        // Crea la piattaforma composta da blocchi in anelli concentrici
        this.platform = new BABYLON.TransformNode("platformRoot", this.scene);

        // Materiale base pietra (PBR - grigio-bluastra) con texture procedurali
        const platformMaterial = new BABYLON.PBRMaterial("platformMat", this.scene);
        platformMaterial.albedoColor = new BABYLON.Color3(0.45, 0.47, 0.55);
        platformMaterial.metallic = 0.0;
        platformMaterial.roughness = 1.0; // molto ruvida (pietra)

        // Genera una texture procedurale per l'albedo (macchie, anelli concentrici e giunture)
        const texSize = 2048;
        const albedoDT = new BABYLON.DynamicTexture("platformAlbedo", {width: texSize, height: texSize}, this.scene, false);
        const aCtx = albedoDT.getContext();

        // sfondo base
        const baseR = 110, baseG = 116, baseB = 145;
        aCtx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
        aCtx.fillRect(0, 0, texSize, texSize);

        // funzione helper per variazioni di colore
        const noiseColor = (r,g,b, amount) => {
            const nr = Math.max(0, Math.min(255, r + (Math.random()-0.5)*amount));
            const ng = Math.max(0, Math.min(255, g + (Math.random()-0.5)*amount));
            const nb = Math.max(0, Math.min(255, b + (Math.random()-0.5)*amount));
            return `rgb(${nr},${ng},${nb})`;
        };

        // Disegno sottili anelli concentrici e blocchi radiali per suggerire le giunture
        const center = texSize/2;
        for (let r = 600; r > 80; r -= 200) {
            aCtx.beginPath();
            aCtx.lineWidth = 18;
            aCtx.strokeStyle = noiseColor(baseR-10, baseG-10, baseB-10, 20);
            aCtx.arc(center, center, r, 0, Math.PI*2);
            aCtx.stroke();
        }

        // Aggiungi giunture/segmenti radiali
        aCtx.lineWidth = 6;
        for (let s = 0; s < 32; s++) {
            const ang = (s/32) * Math.PI * 2;
            const x1 = center + Math.cos(ang) * 720;
            const y1 = center + Math.sin(ang) * 720;
            const x2 = center + Math.cos(ang) * 120;
            const y2 = center + Math.sin(ang) * 120;
            aCtx.strokeStyle = noiseColor(baseR-30, baseG-30, baseB-30, 30);
            aCtx.beginPath();
            aCtx.moveTo(x1, y1);
            aCtx.lineTo(x2, y2);
            aCtx.stroke();
        }

        // Aggiungi crepe casuali
        aCtx.strokeStyle = 'rgba(30,30,40,0.9)';
        aCtx.lineWidth = 2;
        for (let c = 0; c < 40; c++) {
            let sx = center + (Math.random()-0.5) * 900;
            let sy = center + (Math.random()-0.5) * 900;
            aCtx.beginPath();
            aCtx.moveTo(sx, sy);
            for (let p = 0; p < 6; p++) {
                sx += (Math.random()-0.5) * 60;
                sy += (Math.random()-0.5) * 60;
                aCtx.lineTo(sx, sy);
            }
            aCtx.stroke();
        }

        // Piccole macchie e variazioni
        for (let i = 0; i < 2000; i++) {
            aCtx.fillStyle = noiseColor(baseR, baseG, baseB, 40);
            const rx = Math.floor(Math.random() * texSize);
            const ry = Math.floor(Math.random() * texSize);
            aCtx.fillRect(rx, ry, 2, 2);
        }

        albedoDT.update();
    platformMaterial.albedoTexture = albedoDT;
    platformMaterial.albedoTexture.uScale = 1.5;
    platformMaterial.albedoTexture.vScale = 1.5;
    // Non usare emissive sulla piattaforma (era una impostazione di debug che causa sovraesposizione)
    platformMaterial.emissiveColor = new BABYLON.Color3(0,0,0);
    platformMaterial.emissiveTexture = null;
    // Parametri PBR conservativi
    platformMaterial.metallic = 0.0;
    platformMaterial.roughness = 0.9;

        // Genera una mappa di bump semplice (grayscale) basata sulle giunture/crepe
        const bumpDT = new BABYLON.DynamicTexture("platformBump", {width: texSize, height: texSize}, this.scene);
        const bCtx = bumpDT.getContext();
        // inizializza chiaro (pietra elevata) ma non troppo per lasciare spazio alle alteluci
        bCtx.fillStyle = '#9f9f9f';
        bCtx.fillRect(0, 0, texSize, texSize);

        // Funzione helper per noise coerente
        const smoothNoise = (x, y, scale = 1) => {
            const s = scale * 0.1;
            return (Math.sin(x*s) * Math.sin(y*s) + Math.random()) * 0.5;
        };

        // Aggiungi rumore base alla superficie per micro-dettagli
        const imageData = bCtx.getImageData(0, 0, texSize, texSize);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const x = (i/4) % texSize;
            const y = Math.floor((i/4) / texSize);
            const noise = smoothNoise(x, y, 2) * 20;
            data[i] = data[i+1] = data[i+2] = Math.max(0, Math.min(255, 159 + noise));
        }
        bCtx.putImageData(imageData, 0, 0);

        // riproduci le crepe e giunti: scuri con bordi più definiti
        bCtx.strokeStyle = '#2a2a2a';
        bCtx.lineWidth = 8;
        for (let r = 600; r > 80; r -= 200) {
            bCtx.beginPath();
            bCtx.arc(center, center, r, 0, Math.PI*2);
            bCtx.stroke();
        }
        bCtx.lineWidth = 3;
        for (let s = 0; s < 32; s++) {
            const ang = (s/32) * Math.PI * 2;
            const x1 = center + Math.cos(ang) * 720;
            const y1 = center + Math.sin(ang) * 720;
            const x2 = center + Math.cos(ang) * 120;
            const y2 = center + Math.sin(ang) * 120;
            bCtx.beginPath();
            bCtx.moveTo(x1, y1);
            bCtx.lineTo(x2, y2);
            bCtx.stroke();
        }
        // crepe casuali
        bCtx.strokeStyle = '#2f2f2f';
        for (let c = 0; c < 40; c++) {
            let sx = center + (Math.random()-0.5) * 900;
            let sy = center + (Math.random()-0.5) * 900;
            bCtx.beginPath();
            bCtx.moveTo(sx, sy);
            for (let p = 0; p < 6; p++) {
                sx += (Math.random()-0.5) * 60;
                sy += (Math.random()-0.5) * 60;
                bCtx.lineTo(sx, sy);
            }
            bCtx.stroke();
        }
        bumpDT.update();
    platformMaterial.bumpTexture = bumpDT; // semplice mappa di profondità

    // MATERIAL DEBUG: StandardMaterial che usa le texture procedurali per mostrare subito il risultato
    const platformStdMaterial = new BABYLON.StandardMaterial("platformStdMat", this.scene);
    platformStdMaterial.diffuseTexture = albedoDT;
    platformStdMaterial.diffuseTexture.uScale = 1.5;
    platformStdMaterial.diffuseTexture.vScale = 1.5;
    platformStdMaterial.bumpTexture = bumpDT;
    platformStdMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    platformStdMaterial.specularPower = 16;
    platformStdMaterial.roughness = 1.0;

        // Piccole impostazioni finali
        platformMaterial.useAmbientOcclusionFromMetallicTextureRed = false;
        platformMaterial.useRoughnessFromMetallicTextureGreen = false;

        // Funzione helper: crea un blocco di pietra (box leggermente irregolare)
        const createStoneBlock = (w, h, d, pos, rot = 0) => {
            const box = BABYLON.MeshBuilder.CreateBox("stoneBlock", {width: w, height: h, depth: d}, this.scene);
            box.position = pos.clone();
            box.rotation.y = rot;
            // piccolo rumore sui vertici per irregolarità
            const positions = box.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            if (positions) {
                for (let i = 0; i < positions.length; i += 3) {
                    // solo leggera perturbazione
                    positions[i] += (Math.random() - 0.5) * 0.02 * h;
                    positions[i+1] += (Math.random() - 0.5) * 0.02 * h;
                    positions[i+2] += (Math.random() - 0.5) * 0.02 * h;
                }
                box.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
            }
            box.material = platformStdMaterial;
            box.parent = this.platform;
            return box;
        };

        // Crea una texture specifica per i pilastri
    const pillarTexSize = 512;
    const pillarDT = new BABYLON.DynamicTexture("pillarTexture", {width: pillarTexSize, height: pillarTexSize}, this.scene);
    const pCtx = pillarDT.getContext();
    
    // Base color simile alla piattaforma ma leggermente più chiaro
    pCtx.fillStyle = `rgb(${baseR + 20},${baseG + 20},${baseB + 20})`;
    pCtx.fillRect(0, 0, pillarTexSize, pillarTexSize);
    
    // Aggiungi dettagli verticali per le scanalature
    const numVerticalLines = 12;
    for (let i = 0; i < numVerticalLines; i++) {
        const x = (i + 0.5) * (pillarTexSize / numVerticalLines);
        pCtx.strokeStyle = noiseColor(baseR - 15, baseG - 15, baseB - 15, 15);
        pCtx.lineWidth = pillarTexSize / numVerticalLines * 0.3;
        pCtx.beginPath();
        pCtx.moveTo(x, 0);
        pCtx.lineTo(x, pillarTexSize);
        pCtx.stroke();
        
        // Aggiungi ombreggiature laterali per profondità
        pCtx.strokeStyle = `rgba(0,0,0,0.2)`;
        pCtx.lineWidth = 2;
        pCtx.beginPath();
        pCtx.moveTo(x - pillarTexSize / numVerticalLines * 0.15, 0);
        pCtx.lineTo(x - pillarTexSize / numVerticalLines * 0.15, pillarTexSize);
        pCtx.stroke();
    }
    
    // Aggiungi rumore e variazioni
    for (let i = 0; i < 1000; i++) {
        pCtx.fillStyle = noiseColor(baseR, baseG, baseB, 30);
        const rx = Math.floor(Math.random() * pillarTexSize);
        const ry = Math.floor(Math.random() * pillarTexSize);
        pCtx.fillRect(rx, ry, 2, 2);
    }
    
    pillarDT.update();
    
    // Crea un materiale specifico per i pilastri basato su quello standard
    const pillarMaterial = platformStdMaterial.clone("pillarMaterial");
    pillarMaterial.diffuseTexture = pillarDT;
    pillarMaterial.bumpTexture = pillarDT; // usa la stessa texture per il bump mapping
    pillarMaterial.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    pillarMaterial.specularPower = 64;

    // Parametri della piattaforma
        const platformThickness = 2.5; // spessore totale
    const ringConfigs = [
            {radius: 10.8, width: 2.2, count: 24}, // anello esterno (blocchi grandi)
            {radius: 7.5, width: 1.8, count: 20},  // anello medio
            {radius: 4.0, width: 1.2, count: 12}   // anello centrale
        ];

        // Costruiamo gli anelli con blocchi
    ringConfigs.forEach((cfg) => {
            const arc = (2 * Math.PI) / cfg.count;
            for (let i = 0; i < cfg.count; i++) {
                const angle = i * arc;
                // lunghezza approssimativa del blocco lungo la circonferenza
                const circum = arc * cfg.radius;
                const w = Math.max(0.8, circum * 0.95);
                const h = platformThickness;
                const d = cfg.width;
                const x = Math.cos(angle) * cfg.radius;
                const z = Math.sin(angle) * cfg.radius;
                const y = 0; // superficie piatta
                const rot = -angle + Math.PI/2;
                createStoneBlock(w, h, d, new BABYLON.Vector3(x, y, z), rot);
            }
        });

        // Bordo esterno / cornice rialzata: un anello di blocchi più largo
        const rim = BABYLON.MeshBuilder.CreateCylinder("rim", {height: 0.9, diameter: 23.6, tessellation: 64}, this.scene);
        rim.position.y = 0.45;
    rim.material = platformStdMaterial;
        rim.parent = this.platform;

        // Sotto-piattaforma (sottostante a discesa) -> una base cilindrica leggermente più piccola e scura
        const underside = BABYLON.MeshBuilder.CreateCylinder("underside", {height: 1.6, diameter: 20.8, tessellation: 64}, this.scene);
        underside.position.y = -1.2;
    underside.material = platformStdMaterial;
        underside.parent = this.platform;

        // Quattro pilastri: cilindri con base quadrata e capitello semplice
        const pillarHeight = platformThickness * 2.2;
        const pillarRadius = 0.6;
        const pillarOffsets = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
        pillarOffsets.forEach((ang, idx) => {
            const px = Math.cos(ang) * 10.4;
            const pz = Math.sin(ang) * 10.4;
            // base quadrata
            const base = BABYLON.MeshBuilder.CreateBox(`pillarBase${idx}`, {width: 1.6, depth: 1.6, height: 0.4}, this.scene);
            base.position = new BABYLON.Vector3(px, -0.2, pz);
            base.material = platformStdMaterial;
            base.parent = this.platform;

            // corpo cilindrico con scanalature
            const pillarSegments = 20;
            const pillar = BABYLON.MeshBuilder.CreateCylinder(
                `pillar${idx}`, 
                {
                    height: pillarHeight, 
                    diameter: pillarRadius*2, 
                    tessellation: pillarSegments
                }, 
                this.scene
            );
            
            // Modifichiamo i vertici per creare le scanalature
            const positions = pillar.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const indices = pillar.getIndices();
            const normals = pillar.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            
            if (positions && indices && normals) {
                for (let i = 0; i < positions.length; i += 3) {
                    // Calcoliamo l'angolo del vertice attuale
                    const x = positions[i];
                    const z = positions[i + 2];
                    const angle = Math.atan2(z, x);
                    
                    // Modulazione sinusoidale per le scanalature
                    const flutingDepth = 0.04;
                    const numFlutes = 12;
                    const radiusModulation = 1.0 + Math.sin(angle * numFlutes) * flutingDepth;
                    
                    // Modifichiamo la posizione radiale
                    const radius = Math.sqrt(x * x + z * z);
                    positions[i] = x / radius * (radius * radiusModulation);
                    positions[i + 2] = z / radius * (radius * radiusModulation);
                    
                    // Aggiorniamo anche le normali per il lighting corretto
                    const nx = normals[i];
                    const nz = normals[i + 2];
                    const nAngle = Math.atan2(nz, nx);
                    const tangentAngle = nAngle + Math.PI/2;
                    const flutingNormalFactor = Math.cos(angle * numFlutes) * flutingDepth;
                    normals[i] = nx + Math.cos(tangentAngle) * flutingNormalFactor;
                    normals[i + 2] = nz + Math.sin(tangentAngle) * flutingNormalFactor;
                }
                
                pillar.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
                pillar.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
            }
            
            pillar.position = new BABYLON.Vector3(px, pillarHeight/2 - 0.2, pz);
            pillar.material = pillarMaterial;
            pillar.parent = this.platform;

            // capitello semplice
            const cap = BABYLON.MeshBuilder.CreateBox(`pillarCap${idx}`, {width: 1.0, depth: 1.0, height: 0.3}, this.scene);
            cap.position = new BABYLON.Vector3(px, pillarHeight - 0.05, pz);
            cap.material = platformStdMaterial;
            cap.parent = this.platform;
        });

        // Rimosso codice catene

        // Posiziona l'intera piattaforma
        this.platform.position.y = -1.5;

        // Aggiungi illuminazione direzionale (key), emisferica (fill) e una luce di rim (back) per migliore contrasto
        const directionalLight = new BABYLON.DirectionalLight("directional", new BABYLON.Vector3(-0.5, -1, -0.5), this.scene);
        directionalLight.intensity = 0.5; // key light
        directionalLight.diffuse = new BABYLON.Color3(1.0, 0.95, 0.9);
        directionalLight.specular = new BABYLON.Color3(0.6, 0.6, 0.6);

        // --- Sole viola realistico (luce direzionale con ombre) ---
        const sunLight = new BABYLON.DirectionalLight("sunLight", new BABYLON.Vector3(-0.2, -1, 0.1), this.scene);
        sunLight.position = new BABYLON.Vector3(0, 40, -60);
        sunLight.intensity = 1.1;
        // colore viola caldo
        sunLight.diffuse = new BABYLON.Color3(0.6, 0.2, 0.8);
        sunLight.specular = new BABYLON.Color3(0.7, 0.5, 0.9);

        // Shadow generator per ombre morbide/realistiche
        try {
            const shadowMapSize = 2048;
            const shadowGen = new BABYLON.ShadowGenerator(shadowMapSize, sunLight);
            // usare kernel blur per ombre più morbide
            shadowGen.useKernelBlur = true;
            shadowGen.kernelBlur = 32;
            shadowGen.bias = 0.0005;
            shadowGen.normalBias = 0.05;
            shadowGen.forceBackFacesOnly = true;

            // Salviamo il generatore di ombre per uso futuro (es. dopo il caricamento del ragno)
            this.shadowGenerator = shadowGen;

            // Aggiungi tutti i figli della piattaforma come caster e abilita ricezione ombre
            try {
                const platformMeshes = this.platform.getChildMeshes ? this.platform.getChildMeshes(true) : [];
                platformMeshes.forEach(m => {
                    try {
                        if (m && m.getTotalVertices && m.getTotalVertices() > 0) {
                            shadowGen.addShadowCaster(m, true);
                        }
                        // Assicuriamoci che la mesh riceva ombre
                        m.receiveShadows = true;
                    } catch { /* ignore per sicurezza */ }
                });
            } catch (e) { console.warn('Errore aggiungendo caster di ombre alla piattaforma:', e); }
        } catch (e) {
            console.warn('ShadowGenerator non disponibile o fallito:', e);
        }

        // Emispheric already created earlier acts as soft fill; reduce slightly
        try {
            light.intensity = 0.18;
            light.diffuse = new BABYLON.Color3(0.6, 0.65, 0.75);
    } catch { /* ignore if not present */ }

        // luce di rim (punto/blu) per separare silhouette
        const rimLight = new BABYLON.PointLight('rimLight', new BABYLON.Vector3(0, 6, 10), this.scene);
        rimLight.intensity = 0.25;
        rimLight.diffuse = new BABYLON.Color3(0.4, 0.6, 0.85);
        rimLight.specular = new BABYLON.Color3(0.2, 0.25, 0.3);

        // Aggiungi un GlowLayer per enfatizzare i materiali emissivi (runic rings) e il sole
        try {
            const glow = new BABYLON.GlowLayer("glow", this.scene);
            // intensità più bassa per evitare sbavature forti
            glow.intensity = 0.35;
            this.glowLayer = glow;
            // Escludi i mesh della piattaforma dal glow (vogliamo glow solo per le rune e il sole)
            if (this.platform && this.platform.getChildMeshes) {
                const meshes = this.platform.getChildMeshes ? this.platform.getChildMeshes(true) : [];
                meshes.forEach(m => {
                    try { glow.addExcludedMesh(m); } catch { /* ignore */ }
                });
            }

            // Crea il sole visivo: sfera emissiva + disco flare
            try {
                const sunPos = new BABYLON.Vector3(0, 40, -60);
                const sunMesh = BABYLON.MeshBuilder.CreateSphere('sunVisual', {diameter: 14, segments: 32}, this.scene);
                sunMesh.position = sunPos.clone();
                const sunMat = new BABYLON.StandardMaterial('sunMat', this.scene);
                sunMat.emissiveColor = new BABYLON.Color3(0.6, 0.2, 0.8);
                sunMat.disableLighting = true;
                sunMat.alpha = 0.98;
                sunMesh.material = sunMat;
                sunMesh.receiveShadows = false;

                const flare = BABYLON.MeshBuilder.CreateDisc('sunFlare', {radius: 18, tessellation: 32}, this.scene);
                flare.position = sunPos.clone();
                flare.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
                const flareMat = new BABYLON.StandardMaterial('flareMat', this.scene);
                flareMat.diffuseColor = BABYLON.Color3.Black();
                flareMat.emissiveColor = new BABYLON.Color3(0.9, 0.45, 1.0);
                flareMat.alpha = 0.28;
                flareMat.disableLighting = true;
                flare.material = flareMat;

                // Assicuriamoci che il sole sia influenzato dal GlowLayer
                try { if (this.glowLayer) this.glowLayer.addIncludedOnlyMesh ? this.glowLayer.addIncludedOnlyMesh(sunMesh) : null; } catch { /* ignore */ }
            } catch { /* ignore creazione sole visivo */ }

        } catch (e) {
            console.warn('GlowLayer non disponibile:', e);
        }

        // Riduci un po' l'exposure globale della scena per controllare la luminosità
        try {
            if (this.scene.imageProcessingConfiguration) {
                this.scene.imageProcessingConfiguration.exposure = 0.55;
                this.scene.imageProcessingConfiguration.contrast = 1.02;
                // regola gamma e toe per un look meno piatto
                this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
            }
        } catch {
            // ignore
        }

        // --- Particelle viola luminescenti che si muovono nello spazio ---
        try {
            const pSize = 128;
            const particleDynTex = new BABYLON.DynamicTexture('particleTex', {width: pSize, height: pSize}, this.scene, false);
            const pctx = particleDynTex.getContext();
            // sfondo trasparente
            pctx.clearRect(0, 0, pSize, pSize);
            const grad = pctx.createRadialGradient(pSize/2, pSize/2, 1, pSize/2, pSize/2, pSize/2);
            grad.addColorStop(0, 'rgba(230,180,255,1)');
            grad.addColorStop(0.3, 'rgba(160,80,230,0.95)');
            grad.addColorStop(1, 'rgba(30,10,60,0)');
            pctx.fillStyle = grad;
            pctx.fillRect(0, 0, pSize, pSize);
            particleDynTex.update();

            const particles = new BABYLON.ParticleSystem('purpleParticles', 800, this.scene);
            particles.particleTexture = particleDynTex;
            // emetti dall'intero volume attorno alla piattaforma
            particles.emitter = new BABYLON.Vector3(0, 5, 0);
            particles.minEmitBox = new BABYLON.Vector3(-40, -20, -40);
            particles.maxEmitBox = new BABYLON.Vector3(40, 30, 40);
            particles.color1 = new BABYLON.Color4(0.9, 0.5, 1.0, 1.0);
            particles.color2 = new BABYLON.Color4(0.7, 0.25, 0.95, 0.9);
            particles.colorDead = new BABYLON.Color4(0.15, 0.03, 0.25, 0.0);
            particles.minSize = 0.06;
            particles.maxSize = 0.6;
            particles.minLifeTime = 8;
            particles.maxLifeTime = 22;
            particles.emitRate = 120;
            particles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE; // additive
            particles.gravity = new BABYLON.Vector3(0, 0, 0);
            particles.direction1 = new BABYLON.Vector3(-0.3, -0.02, -0.3);
            particles.direction2 = new BABYLON.Vector3(0.3, 0.02, 0.3);
            particles.minAngularSpeed = -0.5;
            particles.maxAngularSpeed = 0.5;
            particles.minInitialRotation = 0;
            particles.maxInitialRotation = Math.PI * 2;
            particles.updateSpeed = 0.016;
            particles.start();
            // memorizziamo in this per eventuale controllo futuro
            this.purpleParticles = particles;
        } catch (e) {
            console.warn('Creazione particelle fallita:', e);
        }

        // Aggiungi SSAO (ambient occlusion) se disponibile nella build di Babylon
        try {
            if (typeof BABYLON.SSAO2RenderingPipeline === 'function') {
                // ssaoRatio basso per qualità/performance bilanciata
                const ssaoRatio = 0.5;
                // alcuni costruttori accettano (name, scene, ratio, cameras)
                const ssao = new BABYLON.SSAO2RenderingPipeline("ssao", this.scene, ssaoRatio, [camera]);
                ssao.samples = 16;
                ssao.radius = 1.5;
                ssao.totalStrength = 1.2;
                ssao.base = 0.5;
                ssao.expensiveBlur = true;
                // attacca alla camera
                ssao.supportBlending = true;
            }
        } catch (e) {
            console.warn('SSAO2RenderingPipeline non disponibile o fallita l\'inizializzazione:', e);
        }

        // Cerchi di luce con lettere RunicMagic
        await this.createMagicLetterCircles();

        // Carica e posiziona il ragno
        await this.loadSpiderModel();

        // Render loop: usa requestAnimationFrame manuale per garantire che la callback sia sempre una Function valida
        this._rafId = null;
        const _loop = () => {
            this._renderScene();
            this._rafId = window.requestAnimationFrame(_loop);
        };
        this._rafId = window.requestAnimationFrame(_loop);

        // Gestione del resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    async createMagicLetterCircles() {
        // Carica il font una sola volta
        const font = new FontFace('RunicMagic', 'url(/fonts/RunicMagic.ttf)');
        await font.load();
        document.fonts.add(font);

        // Specifiche dei dischi (raggio in unità della scena, testo, vertical offset, velocità e numero minimo di caratteri)
        const specs = [
            { radius: 12, text: this._randomText(10), y: 0.01, speed: 0.0004, charCount: 32 },
            { radius: 7, text: this._randomText(5), y: 0.01, speed: -0.0006, charCount: 24 },
            { radius: 4, text: this._randomText(1), y: 0.01, speed: 0.0008, charCount: 1 }
        ];

        // Crea ogni disco con la sua texture testuale
        for (let i = 0; i < specs.length; i++) {
            const spec = specs[i];
            const size = 2048; // texture size per nitidezza
            const texture = new BABYLON.DynamicTexture('circleText' + i, { width: size, height: size }, this.scene, false);
            const ctx = texture.getContext();
            ctx.clearRect(0, 0, size, size);

            // impostazioni testo
            ctx.fillStyle = '#00ffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // dimensione del font più grande per testi più lunghi
            const fontPx = i === 2 ? Math.floor(size * 0.3) : Math.max(48, Math.floor(size * 0.08));
            ctx.font = fontPx + 'px RunicMagic';

            // prepariamo il testo finale: assicuriamoci che ogni disco abbia abbastanza caratteri
            let finalText = String(spec.text);
            const targetChars = spec.charCount || Math.max(20, Math.floor(spec.radius * 2.5));
            while (finalText.replace(/\s/g, '').length < targetChars) {
                finalText += ' ' + this._randomText(3);
            }

            // scrittura circolare
            ctx.save();
            ctx.translate(size / 2, size / 2);
            const chars = finalText.split('');
            
            if (i === 2) {
                // Per il cerchio centrale, posiziona il carattere direttamente al centro
                ctx.textBaseline = 'middle';
                ctx.fillText(chars[0], 0, 0);
            } else {
                // Per gli altri cerchi, disposizione circolare
                const angleStep = (2 * Math.PI) / chars.length;
                const textRadius = Math.floor(size / 3.2);
                for (let c = 0; c < chars.length; c++) {
                    const angle = c * angleStep;
                    const x = Math.cos(angle) * textRadius;
                    const y = Math.sin(angle) * textRadius;
                    ctx.save();
                    ctx.translate(x, y);
                    // mantieni le lettere leggibili: ruota in senso opposto alla tangente
                    ctx.rotate(angle + Math.PI / 2);
                    ctx.fillText(chars[c], 0, 0);
                    ctx.restore();
                }
            }
            ctx.restore();
            texture.update();

            // Crea il disco piatto
            const disc = BABYLON.MeshBuilder.CreateDisc('magicCircle' + i, { radius: spec.radius, tessellation: 128 }, this.scene);
            disc.position.y = spec.y;
            // Rendilo piatto (parallelo alla piattaforma)
            disc.rotation.x = Math.PI / 2;

            // Materiale principale per il disco
            const mat = new BABYLON.StandardMaterial('matCircle' + i, this.scene);
            mat.emissiveTexture = texture;
            mat.diffuseColor = BABYLON.Color3.Black();
            mat.emissiveColor = new BABYLON.Color3(0, 1, 1);
            mat.opacityTexture = texture;
            mat.alpha = 0.95;
            disc.material = mat;

            // (Nessun disco di bagliore)

            // Ruotare il disco sul suo piano (asse locale Z dopo aver ruotato X)
            const speed = spec.speed;
            this.scene.registerBeforeRender(() => {
                disc.rotation.z += speed;
            });
        }
    }
    
    _randomText(len) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
        let s = '';
        for (let i = 0; i < len; i++) {
            s += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return s.trim();
    }
    async loadSpiderModel() {
        try {
            console.log("Caricamento del modello spider.glb...");

            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "", // nome mesh da importare (vuoto = tutte)
                "/modelli/", // cartella base
                "spider.glb", // nome file
                this.scene,
                (evt) => {
                    // Progress callback
                    if (evt.lengthComputable) {
                        const loadedPercent = (evt.loaded * 100 / evt.total).toFixed();
                        console.log(`Caricamento: ${loadedPercent}%`);
                    }
                }
            );

            if (!result || !result.meshes || result.meshes.length === 0) {
                throw new Error("Nessuna mesh trovata nel modello caricato");
            }

            // Ottieni il root mesh del modello
            const spiderRoot = result.meshes[0];
            
            // Debug info sui materiali
            console.log("Materiali trovati nel modello:", result.materials);
            console.log("Mesh trovate:", result.meshes.map(m => ({
                name: m.name,
                material: m.material ? m.material.name : 'no material',
                hasVertexColors: m.hasVertexColors,
                geometryId: m.geometryId
            })));

            // Applica un materiale PBR di default se necessario
            result.meshes.forEach(mesh => {
                if (!mesh.material) {
                    const material = new BABYLON.PBRMaterial("spiderMaterial-" + mesh.name, this.scene);
                    material.albedoColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                    material.metallic = 0.5;
                    material.roughness = 0.4;
                    material.emissiveColor = new BABYLON.Color3(0, 0.3, 0); // leggero effetto emissivo verde
                    mesh.material = material;
                }
            });
            
            // Scala il ragno a una dimensione appropriata per la scena
            spiderRoot.scaling = new BABYLON.Vector3(0.05, 0.05, 0.05);
            
            // Posiziona il ragno sulla piattaforma
            spiderRoot.position = new BABYLON.Vector3(0, 1.5, 0);
            
            // Ruota il ragno per orientarlo correttamente
            spiderRoot.rotation = new BABYLON.Vector3(0, Math.PI, 0);
            
            // Salva il riferimento al ragno per uso futuro
            this.spider = spiderRoot;

            // Se abbiamo uno shadow generator, registriamo le mesh del ragno come caster di ombre
            try {
                if (this.shadowGenerator) {
                    result.meshes.forEach(m => {
                        try {
                            if (m && m.getTotalVertices && m.getTotalVertices() > 0) {
                                this.shadowGenerator.addShadowCaster(m, true);
                            }
                            m.receiveShadows = true;
                        } catch { /* ignore */ }
                    });
                }
            } catch (e) { console.warn('Non è stato possibile registrare il ragno come shadow caster:', e); }
            
            // Se ci sono animazioni, riproducile
            if (result.animationGroups && result.animationGroups.length > 0) {
                console.log("Animazioni trovate:", result.animationGroups.map(a => a.name));
                result.animationGroups[0].start(true); // loop
            }
            
            console.log("Modello caricato e configurato con successo!");
            
        } catch (error) {
            console.error("Errore durante il caricamento del modello:", error);
            // Non rilanciare l'errore per evitare che si propaghi
        }
    }

    dispose() {
        if (this.spider) {
            this.spider.dispose();
        }
        if (this.platform) {
            this.platform.dispose();
        }
        if (this.scene) {
            this.scene.dispose();
        }
        if (this.engine) {
            this.engine.dispose();
        }
        // pulisci requestAnimationFrame se attivo
        if (this._rafId) {
            try {
                window.cancelAnimationFrame(this._rafId);
            } catch {
                // ignore
            }
            this._rafId = null;
        }
    }
}