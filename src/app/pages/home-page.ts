import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, ViewChildren, QueryList, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hero } from '../components/hero/hero';
import * as THREE from 'three';

@Component({
  selector: 'app-home-page',
  imports: [Hero, RouterLink],
  template: `
    <app-hero />

    <!-- ── Stats ticker ── -->
    <section class="stats-section" #statsSection>
      <div class="container">
        <div class="stats-row">
          <div class="stat-item">
            <span class="si-n cyan">{{ c1() }}+</span>
            <span class="si-l">Projets réalisés</span>
          </div>
          <div class="si-div"></div>
          <div class="stat-item">
            <span class="si-n">{{ c2() }}+</span>
            <span class="si-l">Technologies</span>
          </div>
          <div class="si-div"></div>
          <div class="stat-item">
            <span class="si-n purple">{{ c3() }}</span>
            <span class="si-l">Années d'études</span>
          </div>
          <div class="si-div"></div>
          <div class="stat-item">
            <span class="si-n">∞</span>
            <span class="si-l">Curiosité</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Navigation cards ── -->
    <section class="nav-section reveal" #reveal>
      <canvas #navOrb class="nav-orb-canvas" aria-hidden="true"></canvas>
      <div class="container">
        <div class="nav-header">
          <span class="nav-tag">// NAVIGATION PRINCIPALE</span>
          <div class="nav-line"></div>
        </div>
        <div class="nav-grid">

          <a routerLink="/about" class="nav-card glass">
            <div class="nc-num">01</div>
            <div class="nc-icon">◈</div>
            <h3>À propos</h3>
            <p>Mon parcours, ma formation et mes objectifs professionnels</p>
            <div class="nc-footer">
              <span class="nc-tag">PROFIL</span>
              <span class="nc-arrow">→</span>
            </div>
          </a>

          <a routerLink="/competences" class="nav-card glass">
            <div class="nc-num">02</div>
            <div class="nc-icon">◆</div>
            <h3>Compétences</h3>
            <p>Stack technique, langages et outils maîtrisés</p>
            <div class="nc-footer">
              <span class="nc-tag">STACK</span>
              <span class="nc-arrow">→</span>
            </div>
          </a>

          <a routerLink="/projets" class="nav-card glass featured">
            <div class="nc-num">03</div>
            <div class="nc-icon">⬡</div>
            <h3>Projets</h3>
            <p>Mes réalisations académiques et personnelles en détail</p>
            <div class="nc-footer">
              <span class="nc-tag">LAB</span>
              <span class="nc-arrow">→</span>
            </div>
          </a>

          <a routerLink="/contact" class="nav-card glass">
            <div class="nc-num">04</div>
            <div class="nc-icon">◇</div>
            <h3>Contact</h3>
            <p>Discutons d'une opportunité ou d'un projet ensemble</p>
            <div class="nc-footer">
              <span class="nc-tag">COMM</span>
              <span class="nc-arrow">→</span>
            </div>
          </a>

        </div>
      </div>
    </section>
  `,
  styles: [`
    /* ── Stats section ───────────────────────────── */
    .stats-section {
      background: rgba(4,9,18,0.95);
      border-top: 1px solid rgba(0,212,255,0.1);
      border-bottom: 1px solid rgba(0,212,255,0.07);
      padding: 0;
      &::before { display: none; }
    }

    .stats-row {
      display: flex; align-items: center; justify-content: center;
      gap: 0; padding: 28px 0;
    }

    .stat-item {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      flex: 1; max-width: 200px; padding: 8px 24px;
    }

    .si-n {
      font-size: 2.7rem; font-weight: 800; line-height: 1; color: #fff;
      letter-spacing: -0.02em;
      &.cyan   { color: #00d4ff; text-shadow: 0 0 28px rgba(0,212,255,0.5); }
      &.purple { color: #a78bfa; text-shadow: 0 0 28px rgba(167,139,250,0.45); }
    }

    .si-l {
      font-family: 'Fira Code', monospace; font-size: 0.6rem;
      color: rgba(0,212,255,0.65); letter-spacing: 0.14em; text-transform: uppercase;
    }

    .si-div {
      width: 1px; height: 40px; flex-shrink: 0;
      background: linear-gradient(180deg, transparent, rgba(0,212,255,0.2), transparent);
    }

    /* ── Nav orb canvas ──────────────────────────── */
    .nav-orb-canvas {
      position: absolute; right: 5%; top: 50%; transform: translateY(-50%);
      width: 220px; height: 220px; pointer-events: none; opacity: 0.5; z-index: 0;
      @media (max-width: 1100px) { width: 150px; height: 150px; opacity: 0.28; right: 2%; }
      @media (max-width: 768px)  { display: none; }
    }

    /* ── Nav section ─────────────────────────────── */
    .nav-section {
      padding: 72px 0 100px;
      background: linear-gradient(180deg, #040912 0%, #060c1c 100%);
      position: relative;
      &::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent);
      }
    }

    .nav-header {
      display: flex; align-items: center; gap: 20px; margin-bottom: 36px;
    }

    .nav-tag {
      font-family: 'Fira Code', monospace; font-size: 0.6rem;
      letter-spacing: 0.18em; color: rgba(0,212,255,0.65); white-space: nowrap;
    }

    .nav-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(0,212,255,0.18), transparent); }

    /* ── Nav cards ───────────────────────────────── */
    .nav-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px;
    }

    .nav-card {
      display: flex; flex-direction: column; gap: 10px;
      padding: 26px 22px; text-decoration: none; color: var(--text);
      transition: all 0.25s ease;
      border: 1px solid rgba(0,212,255,0.1); border-radius: 14px;
      background: rgba(4,12,28,0.7); backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px); position: relative; overflow: hidden;

      &::before {
        content: ''; position: absolute; top: 0; left: 20%; right: 20%; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent);
      }

      /* Hover fill sweep */
      &::after {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(135deg, rgba(0,212,255,0.04) 0%, transparent 70%);
        opacity: 0; transition: opacity 0.25s ease;
      }

      &:hover {
        border-color: rgba(0,212,255,0.3); transform: translateY(-6px);
        box-shadow: 0 16px 48px rgba(0,0,0,0.45), 0 0 24px rgba(0,212,255,0.07);
        &::after { opacity: 1; }
        .nc-arrow { transform: translateX(6px); color: #00d4ff; }
        .nc-icon  { color: #00d4ff; text-shadow: 0 0 14px rgba(0,212,255,0.5); }
      }

      &.featured {
        border-color: rgba(0,212,255,0.2); background: rgba(0,212,255,0.04);
        &::before { background: linear-gradient(90deg, transparent, rgba(0,212,255,0.55), transparent); }
        h3 { color: #00d4ff; }
      }
    }

    .nc-num {
      font-family: 'Fira Code', monospace; font-size: 0.52rem;
      color: rgba(0,212,255,0.5); letter-spacing: 0.12em;
    }

    .nc-icon {
      font-size: 1.3rem; color: rgba(0,212,255,0.45);
      transition: all 0.22s; line-height: 1;
    }

    h3 { font-size: 1.08rem; font-weight: 700; margin: 4px 0 0; }
    p  { color: rgba(255,255,255,0.62); font-size: 0.9rem; line-height: 1.7; flex: 1; }

    .nc-footer {
      display: flex; align-items: center; justify-content: space-between; margin-top: 4px;
    }

    .nc-tag {
      font-family: 'Fira Code', monospace; font-size: 0.52rem;
      color: rgba(0,212,255,0.5); letter-spacing: 0.14em;
      border: 1px solid rgba(0,212,255,0.2); border-radius: 3px; padding: 2px 8px;
    }

    .nc-arrow {
      font-size: 1rem; transition: all 0.22s;
      color: rgba(255,255,255,0.42);
    }

    @media (max-width: 900px) { .nav-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 560px) { .nav-grid { grid-template-columns: 1fr; } .stats-row { flex-wrap: wrap; gap: 8px; } .si-div { display: none; } }
  `]
})
export class HomePage implements AfterViewInit, OnDestroy {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;
  @ViewChild('statsSection') statsSectionRef!: ElementRef;
  @ViewChild('navOrb') navOrbRef!: ElementRef<HTMLCanvasElement>;

  private navRenderer?: THREE.WebGLRenderer;
  private navAnimId!: number;

  c1 = signal(0);
  c2 = signal(0);
  c3 = signal(0);

  private animateCount(setter: (v: number) => void, target: number) {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1400, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setter(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.navAnimId);
    this.navRenderer?.dispose();
  }

  private initNavOrb() {
    const canvas = this.navOrbRef.nativeElement;
    const S = 220;
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    camera.position.z = 3.8;

    this.navRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.navRenderer.setSize(S, S);
    this.navRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Core: torus knot (purple/cyan)
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.75, 0.22, 80, 12, 3, 5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#7c6fff'), wireframe: true })
    );
    scene.add(knot);

    // Outer ring
    const ring = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.TorusGeometry(1.3, 0.025, 6, 48)),
      new THREE.LineBasicMaterial({ color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.4 })
    );
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    // Particles
    const pCount = 80;
    const pPos   = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r  = 1.6 + Math.random() * 0.5;
      pPos[i*3]   = r * Math.sin(ph) * Math.cos(th);
      pPos[i*3+1] = r * Math.cos(ph);
      pPos[i*3+2] = r * Math.sin(ph) * Math.sin(th);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.045, color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.6 })));

    const animate = () => {
      this.navAnimId = requestAnimationFrame(animate);
      knot.rotation.y += 0.007;
      knot.rotation.x += 0.003;
      ring.rotation.z += 0.005;
      this.navRenderer!.render(scene, camera);
    };
    animate();
  }

  ngAfterViewInit() {
    if (window.innerWidth >= 768) this.initNavOrb();
    const revealObs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    this.revealEls.forEach(el => revealObs.observe(el.nativeElement));

    const statsObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        this.animateCount(v => this.c1.set(v), 10);
        this.animateCount(v => this.c2.set(v), 15);
        this.animateCount(v => this.c3.set(v), 3);
        statsObs.disconnect();
      }
    }, { threshold: 0.5 });
    statsObs.observe(this.statsSectionRef.nativeElement);
  }
}
