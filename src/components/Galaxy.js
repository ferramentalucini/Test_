import {
  Scene,
  Vector3,
  Color3,
  Color4,
  PointsCloudSystem,
  Mesh,
  HemisphericLight,
  ParticleSystem,
  Texture,
} from "@babylonjs/core";

// Configurazione della Galassia
const NUM_STARS = 20000; // Ridotto per migliori performance
const GALAXY_RADIUS = 50;
const SPIRAL_ARMS = 4;
const ARM_TIGHTNESS = 0.3;
const GALAXY_HEIGHT = 5;
const ROTATION_SPEED = 0.0001;

/**
 * Genera un colore casuale entro un certo intervallo, simulando la variazione stellare.
 * @returns {Color4} Un colore (r, g, b, alpha) per una stella.
 */
function getRandomStarColor() {
  const r = Math.random() * 0.4 + 0.6;
  const g = Math.random() * 0.4 + 0.6;
  const b = Math.random() * 0.5 + 0.5;
  const alpha = Math.random() * 0.5 + 0.5;
  return new Color4(r, g, b, alpha);
}

/**
 * Crea una galassia a spirale 3D animata utilizzando PointsCloudSystem.
 * @param {Scene} scene La scena di Babylon.js a cui aggiungere la galassia.
 * @returns {PointsCloudSystem} Il sistema di punti nuvola della galassia.
 */
export function createGalaxy(scene) {
  // Illuminazione base
  const light = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
  light.intensity = 0.7;

  // Array per pre-calcolare posizioni e colori
  const positions = [];
  const colors = [];

  // Pre-calcola tutte le posizioni e colori
  for (let i = 0; i < NUM_STARS; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * GALAXY_RADIUS;
    const arm = Math.floor(Math.random() * SPIRAL_ARMS);
    const spiralAngle = angle + (radius * ARM_TIGHTNESS) + (arm * Math.PI * 2 / SPIRAL_ARMS);
    
    const distorsion = Math.random() * 0.5 + 0.5;
    const x = Math.cos(spiralAngle) * radius * distorsion;
    const z = Math.sin(spiralAngle) * radius * distorsion;
    const y = (Math.random() - 0.5) * GALAXY_HEIGHT * (1 - radius / GALAXY_RADIUS) * 2;
    
    positions.push(new Vector3(x, y, z));
    colors.push(getRandomStarColor());
  }

  // Crea il sistema di punti
  const pcs = new PointsCloudSystem("galaxyPCS", 2, scene);

  // Aggiungi i punti pre-calcolati
  pcs.addPoints(NUM_STARS, (particle, i) => {
    particle.position = positions[i];
    particle.color = colors[i];
    particle.size = Math.random() * 0.8 + 0.2;
  });

  // Costruisci il mesh in modo asincrono
  pcs.buildMeshAsync().then(mesh => {
    if (mesh) {
      mesh.renderingGroupId = 1;
      
      // Aggiungi rotazione
      scene.registerBeforeRender(() => {
        mesh.rotation.y += ROTATION_SPEED;
      });
    }
  });

  // Effetto nebulosa centrale
  // Simula la nebulosità centrale con un effetto di "Glow" e un Point Light
  const coreLight = new Mesh("coreLight", scene);
  coreLight.position = new Vector3(0, 0, 0);

  // Uso di un ParticleSystem separato per un effetto di nebulosa centrale/bagliore
  const coreParticles = new ParticleSystem("coreParticles", 2000, scene);
  coreParticles.particleTexture = new Texture(
    "https://www.babylonjs.com/textures/flare.png",
    scene
  );
  coreParticles.emitter = coreLight; // La sorgente è al centro
  coreParticles.minEmitPower = 0.5;
  coreParticles.maxEmitPower = 2.0;
  coreParticles.minLifeTime = 0.5;
  coreParticles.maxLifeTime = 1.0;
  coreParticles.emitRate = 1000;
  coreParticles.direction1 = new Vector3(-1, -1, -1);
  coreParticles.direction2 = new Vector3(1, 1, 1);
  coreParticles.minSize = 5;
  coreParticles.maxSize = 10;
  coreParticles.updateSpeed = 0.05;

  // Colore del nucleo caldo (giallo/bianco)
  coreParticles.color1 = new Color4(0.8, 0.8, 1.0, 0.0);
  coreParticles.color2 = new Color4(1.0, 0.9, 0.7, 0.5);
  coreParticles.colorDead = new Color4(0, 0, 0, 0.0);

  coreParticles.start();

  // Nebbia per profondità
  scene.fogMode = Scene.FOGMODE_EXP;
  scene.fogColor = new Color3(0.02, 0.02, 0.05);
  scene.fogDensity = 0.001;

  return pcs;
}

// Questo video di Babylon.js illustra come gli effetti di particelle e luce possano essere utilizzati per creare visualizzazioni atmosferiche come le nebulose.
// **Nota:** Il PointsCloudSystem (PCS) è stato utilizzato per le stelle per un maggiore controllo della geometria.

/* Babylon.js Tutorial - AR Portal Pt3: Particle System and Glow Effects (https://www.youtube.com/watch?v=Pft-QsiAUqs) */