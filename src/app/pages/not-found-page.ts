import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <div class="nf-page">

      <!-- Three.js broken field -->
      <canvas #nfCanvas class="nf-canvas" aria-hidden="true"></canvas>

      <!-- Grid background -->
      <div class="nf-grid" aria-hidden="true"></div>

      <!-- Scanlines -->
      <div class="nf-scan" aria-hidden="true"></div>

      <div class="nf-content">
        <div class="nf-tag-row">
          <span class="nf-label">// JARVIS OS</span>
          <div class="nf-tag-line"></div>
          <span class="nf-label">ERR::0x404</span>
        </div>

        <div class="nf-code">404</div>

        <h1 class="nf-title">SYSTÈME NON TROUVÉ</h1>

        <p class="nf-sub">La ressource demandée n'existe pas dans la base de données.</p>
        <p class="nf-sub dim">Retour au nœud principal recommandé.</p>

        <a routerLink="/" class="nf-btn">
          <span class="nf-btn-hex">⬡</span>
          Retour à l'accueil
          <span class="nf-btn-arrow">→</span>
        </a>
      </div>

    </div>
  `,
  styles: [`
    .nf-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #040912; position: relative; overflow: hidden;
    }

    .nf-canvas {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 1; opacity: 0.85;
    }

    /* Grid */
    .nf-grid {
      position: absolute; inset: 0; z-index: 2;
      background-image:
        linear-gradient(rgba(0,212,255,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,212,255,0.035) 1px, transparent 1px);
      background-size: 64px 64px;
    }

    /* Scanlines */
    .nf-scan {
      position: absolute; inset: 0; pointer-events: none; z-index: 2;
      background: repeating-linear-gradient(
        0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px
      );
    }

    .nf-content {
      position: relative; z-index: 3; text-align: center; padding: 24px;
    }

    .nf-tag-row {
      display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 40px;
    }
    .nf-label {
      font-family: 'Fira Code', monospace; font-size: 0.6rem; letter-spacing: 0.2em;
      color: rgba(0,212,255,0.35);
    }
    .nf-tag-line { width: 60px; height: 1px; background: rgba(0,212,255,0.18); }

    .nf-code {
      font-size: clamp(6rem, 15vw, 11rem); font-weight: 900; line-height: 1;
      color: transparent;
      -webkit-text-stroke: 1px rgba(0,212,255,0.18);
      letter-spacing: -0.04em; margin-bottom: 20px;
      animation: nfPulse 3s ease-in-out infinite;
    }
    @keyframes nfPulse {
      0%,100% { -webkit-text-stroke-color: rgba(0,212,255,0.18); }
      50%      { -webkit-text-stroke-color: rgba(0,212,255,0.42); }
    }

    .nf-title {
      font-size: clamp(1.4rem, 4vw, 2.4rem); font-weight: 900;
      letter-spacing: 0.12em; color: #fff; margin: 0 0 16px;
      text-transform: uppercase; animation: nfGlitch 5s infinite;
    }
    @keyframes nfGlitch {
      0%,88%,100% { text-shadow: none; transform: none; }
      90% { text-shadow: -3px 0 #00d4ff, 3px 0 #a78bfa; transform: skewX(-1deg); }
      92% { text-shadow: 3px 0 #00d4ff, -3px 0 #ff6b9d; transform: skewX(1deg); }
      94% { text-shadow: none; transform: none; }
    }

    .nf-sub {
      font-family: 'Fira Code', monospace; font-size: 0.7rem;
      color: rgba(0,212,255,0.4); letter-spacing: 0.12em; margin-bottom: 6px;
      &.dim { color: rgba(255,255,255,0.2); margin-bottom: 40px; }
    }

    .nf-btn {
      display: inline-flex; align-items: center; gap: 12px;
      padding: 14px 36px; border-radius: 8px;
      background: rgba(0,212,255,0.07); border: 1px solid rgba(0,212,255,0.28);
      color: #00d4ff; text-decoration: none;
      font-family: 'Fira Code', monospace; font-size: 0.75rem; letter-spacing: 0.14em;
      transition: all 0.22s; backdrop-filter: blur(12px);
      &:hover {
        background: rgba(0,212,255,0.15); border-color: rgba(0,212,255,0.6);
        box-shadow: 0 0 28px rgba(0,212,255,0.22); transform: translateY(-3px);
        .nf-btn-arrow { transform: translateX(5px); }
      }
    }
    .nf-btn-hex    { font-size: 1rem; color: rgba(0,212,255,0.6); }
    .nf-btn-arrow  { transition: transform 0.22s; }
  `]
})
export class NotFoundPage implements AfterViewInit, OnDestroy {
  @ViewChild('nfCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer?: THREE.WebGLRenderer;
  private animId!: number;
  private glitchTimeout!: ReturnType<typeof setTimeout>;
  private icoMesh!: THREE.LineSegments;
  private fragMeshes: THREE.LineSegments[] = [];
  private originalPositions!: Float32Array;

  ngAfterViewInit() {
    this.initScene();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animId);
    clearTimeout(this.glitchTimeout);
    this.renderer?.dispose();
  }

  private initScene() {
    const canvas = this.canvasRef.nativeElement;
    const W = canvas.offsetWidth  || window.innerWidth;
    const H = canvas.offsetHeight || window.innerHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── Central broken icosahedron ──────────────────
    const icoGeo  = new THREE.IcosahedronGeometry(1.5, 2);
    const icoWire = new THREE.WireframeGeometry(icoGeo);
    this.originalPositions = (icoWire.attributes['position'] as THREE.BufferAttribute).array.slice() as Float32Array;
    this.icoMesh = new THREE.LineSegments(icoWire,
      new THREE.LineBasicMaterial({ color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.45 })
    );
    scene.add(this.icoMesh);

    // ── Octahedron cage (red / error) ───────────────
    const octGeo  = new THREE.OctahedronGeometry(1.0, 0);
    const octWire = new THREE.WireframeGeometry(octGeo);
    const octMesh = new THREE.LineSegments(octWire,
      new THREE.LineBasicMaterial({ color: new THREE.Color('#ff3355'), transparent: true, opacity: 0.30 })
    );
    scene.add(octMesh);

    // ── Fragment shards ─────────────────────────────
    const fragColors = ['#ff3355', '#00d4ff', '#a78bfa', '#ff8c00'];
    for (let i = 0; i < 6; i++) {
      const geo  = new THREE.TetrahedronGeometry(0.18 + Math.random() * 0.22, 0);
      const wire = new THREE.WireframeGeometry(geo);
      const mesh = new THREE.LineSegments(wire,
        new THREE.LineBasicMaterial({
          color: new THREE.Color(fragColors[i % fragColors.length]),
          transparent: true, opacity: 0.55
        })
      );
      const angle = (i / 6) * Math.PI * 2;
      const r = 2.0 + Math.random() * 0.6;
      mesh.position.set(
        Math.cos(angle) * r,
        (Math.random() - 0.5) * 2.2,
        Math.sin(angle) * r * 0.5
      );
      mesh.userData['rotX'] = (Math.random() - 0.5) * 0.025;
      mesh.userData['rotY'] = (Math.random() - 0.5) * 0.025;
      this.fragMeshes.push(mesh);
      scene.add(mesh);
    }

    // ── Error particles ─────────────────────────────
    const pCount = 120;
    const pPos   = new Float32Array(pCount * 3);
    const pColors= new Float32Array(pCount * 3);
    const red    = new THREE.Color('#ff3355');
    const cyan   = new THREE.Color('#00d4ff');
    for (let i = 0; i < pCount; i++) {
      const r = 2.5 + Math.random() * 2.5;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pPos[i*3]   = r * Math.sin(ph) * Math.cos(th);
      pPos[i*3+1] = r * Math.cos(ph);
      pPos[i*3+2] = r * Math.sin(ph) * Math.sin(th) * 0.5;
      const c = Math.random() < 0.4 ? red : cyan;
      pColors[i*3] = c.r; pColors[i*3+1] = c.g; pColors[i*3+2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color',    new THREE.BufferAttribute(pColors, 3));
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true, opacity: 0.6 })));

    this.scheduleGlitch(this.icoMesh, this.originalPositions);

    // ── Animation loop ──────────────────────────────
    let t = 0;
    const animate = () => {
      this.animId = requestAnimationFrame(animate);
      t += 0.012;

      this.icoMesh.rotation.y += 0.004;
      this.icoMesh.rotation.x += 0.002;
      octMesh.rotation.y -= 0.007;
      octMesh.rotation.z += 0.003;

      this.fragMeshes.forEach(f => {
        f.rotation.x += f.userData['rotX'];
        f.rotation.y += f.userData['rotY'];
      });

      camera.position.x = Math.sin(t * 0.12) * 0.5;
      camera.position.y = Math.cos(t * 0.08) * 0.25;
      camera.lookAt(0, 0, 0);

      this.renderer!.render(scene, camera);
    };
    animate();
  }

  private scheduleGlitch(mesh: THREE.LineSegments, original: Float32Array) {
    const delay = 2500 + Math.random() * 3000;
    this.glitchTimeout = setTimeout(() => {
      const pos = mesh.geometry.attributes['position'] as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length; i++) {
        arr[i] = original[i] + (Math.random() - 0.5) * 0.6;
      }
      pos.needsUpdate = true;
      setTimeout(() => {
        for (let i = 0; i < arr.length; i++) arr[i] = original[i];
        pos.needsUpdate = true;
        this.scheduleGlitch(mesh, original);
      }, 120);
    }, delay);
  }
}
