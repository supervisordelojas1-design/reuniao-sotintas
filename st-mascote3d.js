/* ═══════════════════════════════════════════════════════════════
   MASCOTE 3D — o personagem da Só Tintas em 3D na tela de boas-vindas.
   Carrega o modelo (mascote-3d.glb, ~600 KB) e anima por código:
   entra pulando, respira, olha para os lados, bate continência e gira
   quando a pessoa toca nele; dá para arrastar para virar.
   Se o aparelho não tiver WebGL ou o modelo demorar, fica a imagem.
   ═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MODELO = 'mascote-3d.glb?v=1';
let cacheModelo = null;
function carregar() {
  if (!cacheModelo) {
    const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
    cacheModelo = new Promise((ok, erro) => L.load(MODELO, ok, undefined, erro));
    cacheModelo.catch(() => { cacheModelo = null; });
  }
  return cacheModelo;
}
function temWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

/* monta o 3D dentro de 'caixa'. Resolve com { parar() } quando o primeiro quadro estiver pronto. */
function montar(caixa, opcoes) {
  opcoes = opcoes || {};
  if (!temWebGL()) return Promise.reject(new Error('sem WebGL'));
  return carregar().then((gltf) => {
    const largura = () => Math.max(1, caixa.clientWidth), altura = () => Math.max(1, caixa.clientHeight);
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.setSize(largura(), altura(), false);
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.LinearToneMapping; r.toneMappingExposure = 1.0;
    r.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;cursor:grab';
    r.domElement.setAttribute('aria-hidden', 'true');
    caixa.appendChild(r.domElement);

    const cena = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r); cena.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
    cena.add(new THREE.HemisphereLight(0xffffff, 0x1c3f8f, 0.9));
    const sol = new THREE.DirectionalLight(0xffffff, 1.6); sol.position.set(2, 4, 3); cena.add(sol);
    const contra = new THREE.DirectionalLight(0xffd200, 1.2); contra.position.set(-3, 2, -2.5); cena.add(contra);

    const cam = new THREE.PerspectiveCamera(28, largura() / altura(), 0.1, 50);
    cam.position.set(0, 0.15, 4.4); cam.lookAt(0, 0.05, 0);

    /* modelo: centraliza com os pés no chão (y = -1) e altura 2 */
    const corpo = gltf.scene.clone(true);
    corpo.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.metalness = Math.min(o.material.metalness, 0.35); o.material.envMapIntensity = 0.9; } });
    const bb = new THREE.Box3().setFromObject(corpo), tam = bb.getSize(new THREE.Vector3()), cen = bb.getCenter(new THREE.Vector3());
    const esc = 2 / tam.y; corpo.scale.setScalar(esc); corpo.position.set(-cen.x * esc, -bb.min.y * esc - 1, -cen.z * esc);
    const pivo = new THREE.Group(); pivo.add(corpo); cena.add(pivo);

    /* sombra de contato no chão */
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
    sombra.rotation.x = -Math.PI / 2; sombra.position.y = -1.0; cena.add(sombra);

    /* interação: arrastar gira; tocar dá um pulo com giro */
    let arrasto = 0, arrastando = false, x0 = 0, moveu = 0, giro = -1;
    const el = r.domElement;
    el.addEventListener('pointerdown', (e) => { arrastando = true; x0 = e.clientX; moveu = 0; el.style.cursor = 'grabbing'; try { el.setPointerCapture(e.pointerId); } catch (x) {} });
    el.addEventListener('pointermove', (e) => { if (!arrastando) return; const d = e.clientX - x0; x0 = e.clientX; moveu += Math.abs(d); arrasto += d * 0.012; });
    const solta = () => { if (!arrastando) return; arrastando = false; el.style.cursor = 'grab'; if (moveu < 6 && giro < 0) giro = 0; };
    el.addEventListener('pointerup', solta); el.addEventListener('pointercancel', solta);

    const quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now(); let vivo = true, ult = t0;
    const eob = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
    function quadro(agora) {
      if (!vivo) return;
      const t = (agora - t0) / 1000, dt = Math.min(0.05, (agora - ult) / 1000); ult = agora;
      /* entrada: sobe do chão com mola */
      const e = quieto ? 1 : Math.min(1, t / 1.1), ent = eob(e);
      let y = (1 - ent) * -2.4, s = 0.6 + 0.4 * ent, rx = 0, rz = 0, ry = 0;
      if (!quieto && e >= 1) {
        const ti = t - 1.1;
        y += Math.sin(ti * 2.6) * 0.025;                       // respira
        ry = Math.sin(ti * 0.55) * 0.38;                       // olha para os lados
        rz = Math.sin(ti * 1.3) * 0.02;
        const c = ti % 5.2;                                    // continência a cada ciclo
        if (c > 4.4) { const k = Math.sin((c - 4.4) / 0.8 * Math.PI); rx = -0.09 * k; y += 0.06 * k; s *= 1 + 0.03 * k; }
      }
      if (giro >= 0) { giro += dt / 0.9; const k = Math.min(1, giro); ry += Math.PI * 2 * (1 - Math.pow(1 - k, 3)); y += Math.sin(k * Math.PI) * 0.35; if (k >= 1) giro = -1; }
      if (!arrastando) arrasto *= Math.pow(0.04, dt);           // volta devagar para a frente
      pivo.position.y = y; pivo.scale.setScalar(s); pivo.rotation.set(rx, ry + arrasto, rz);
      sombra.material.opacity = 0.35 + 0.65 * ent - Math.max(0, y) * 1.2; sombra.scale.setScalar(1 - Math.max(0, y) * 0.6);
      const w = largura(), h = altura();
      if (el.width !== Math.round(w * r.getPixelRatio()) || el.height !== Math.round(h * r.getPixelRatio())) { r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
      r.render(cena, cam);
      requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
    return { canvas: el, parar() { vivo = false; try { r.dispose(); r.forceContextLoss(); } catch (x) {} el.remove(); } };
  });
}
window.STMascote3D = { montar, carregar, temWebGL };
window.dispatchEvent(new Event('stmascote3d'));
