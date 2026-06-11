import { Component, inject, signal, HostListener, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { LoadingScreen } from './components/loading-screen/loading-screen';
import { trigger, transition, query, group, animate, keyframes, style } from '@angular/animations';
import * as THREE from 'three';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, LoadingScreen],
  animations: [
    trigger('routeAnim', [
      transition('* <=> *', [
        group([

          /* ── Outgoing: glitch surge + scanline collapse ── */
          query(':leave', [
            style({ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 1 }),
            animate('300ms cubic-bezier(0.55,0,1,0.45)', keyframes([
              style({ opacity: 1,    filter: 'blur(0)    brightness(1)    hue-rotate(0deg)',     transform: 'scale(1)      skewX(0deg)',    clipPath: 'inset(0% 0 0% 0)',       offset: 0    }),
              style({ opacity: 0.82, filter: 'blur(1px)  brightness(2.2)  hue-rotate(-20deg)',   transform: 'scale(1.005)  skewX(-0.7deg)', clipPath: 'inset(6% 0 6% 0)',       offset: 0.22 }),
              style({ opacity: 0.52, filter: 'blur(5px)  brightness(4)    hue-rotate(28deg)',    transform: 'scale(1.012)  skewX(1deg)',    clipPath: 'inset(26% 0 26% 0)',     offset: 0.58 }),
              style({ opacity: 0.18, filter: 'blur(14px) brightness(7)    saturate(4)',           transform: 'scale(1.018)  skewX(-0.4deg)', clipPath: 'inset(45% 0 45% 0)',     offset: 0.84 }),
              style({ opacity: 0,    filter: 'blur(24px) brightness(10)   saturate(6)',           transform: 'scale(1.022)',                  clipPath: 'inset(49.8% 0 49.8% 0)', offset: 1    }),
            ]))
          ], { optional: true }),

          /* ── Incoming: arc-reactor radial expansion from center ── */
          query(':enter', [
            style({ opacity: 0, filter: 'blur(24px) brightness(6) saturate(5)', clipPath: 'circle(0% at 50% 50%)', transform: 'scale(1.06)' }),
            animate('780ms 80ms cubic-bezier(0.16,1,0.3,1)', keyframes([
              style({ opacity: 0,    filter: 'blur(24px) brightness(7)    saturate(5)',   clipPath: 'circle(0% at 50% 50%)',    transform: 'scale(1.06)',  offset: 0    }),
              style({ opacity: 0.18, filter: 'blur(20px) brightness(5.5)  saturate(4)',   clipPath: 'circle(6% at 50% 50%)',    transform: 'scale(1.04)',  offset: 0.12 }),
              style({ opacity: 0.45, filter: 'blur(12px) brightness(3.5)  saturate(2.8)', clipPath: 'circle(24% at 50% 50%)',   transform: 'scale(1.022)', offset: 0.35 }),
              style({ opacity: 0.72, filter: 'blur(5px)  brightness(2)    saturate(1.8)', clipPath: 'circle(55% at 50% 50%)',   transform: 'scale(1.01)',  offset: 0.60 }),
              style({ opacity: 0.92, filter: 'blur(1.5px) brightness(1.2) saturate(1.2)', clipPath: 'circle(85% at 50% 50%)',   transform: 'scale(1.003)', offset: 0.82 }),
              style({ opacity: 1,    filter: 'blur(0)    brightness(1)    saturate(1)',   clipPath: 'circle(150% at 50% 50%)',  transform: 'scale(1)',     offset: 1    }),
            ]))
          ], { optional: true }),

        ])
      ])
    ])
  ],
  template: `
    <app-loading-screen />

    <!-- Ambient Three.js particle field (behind everything) -->
    <canvas #ambientBg class="ambient-bg" aria-hidden="true"></canvas>

    <!-- Scroll progress bar -->
    <div class="scroll-bar" [style.width.%]="scrollProgress()"></div>

    <!-- Custom JARVIS cursor (desktop only) -->
    <div class="cursor-dot" #cursorDot></div>
    <div class="cursor-ring" #cursorRing></div>

    <!-- Back to top -->
    @if (showBackTop()) {
      <button class="back-top-btn" (click)="scrollToTop()" title="Retour en haut" aria-label="Retour en haut">↑</button>
    }

    <!-- Permanent ambient HUD overlay -->
    <div class="ambient-hud" aria-hidden="true">
      <div class="ah-corner ah-tl"></div>
      <div class="ah-corner ah-tr"></div>
      <div class="ah-corner ah-bl"></div>
      <div class="ah-corner ah-br"></div>
    </div>

    <!-- Holographic scan overlay (on route change) -->
    <div class="scan-overlay" [class.active]="scanning" aria-hidden="true">
      <div class="scan-hex"></div>
      <div class="scan-beam b1"></div>
      <div class="scan-beam b2"></div>
      <div class="scan-beam b3"></div>
      <div class="scan-ring r1"></div>
      <div class="scan-ring r2"></div>
      <div class="scan-ring r3"></div>
    </div>

    <app-navbar />
    <main [@routeAnim]="getState(outlet)">
      <router-outlet #outlet="outlet" />
    </main>
    <app-footer />
  `,
  styles: [`
    main { position: relative; overflow: hidden; min-height: 100vh; }
    main > * { width: 100%; }

    /* ── Custom cursor (fine pointer / desktop only) ── */
    @media (pointer: fine) {
      :host ::ng-deep * { cursor: none !important; }
    }
    .cursor-dot {
      position: fixed; z-index: 99999; pointer-events: none;
      width: 6px; height: 6px; border-radius: 50%;
      background: #00d4ff; box-shadow: 0 0 8px rgba(0,212,255,0.9);
      transform: translate(-50%, -50%);
      transition: opacity 0.2s;
    }
    .cursor-ring {
      position: fixed; z-index: 99998; pointer-events: none;
      width: 26px; height: 26px; border-radius: 50%;
      border: 1px solid rgba(0,212,255,0.45);
      transform: translate(-50%, -50%);
      transition: left 0.08s ease-out, top 0.08s ease-out, width 0.2s, height 0.2s, border-color 0.2s;
    }
    @media (pointer: coarse) {
      .cursor-dot, .cursor-ring { display: none; }
    }

    /* ── Back to top ── */
    .back-top-btn {
      position: fixed; bottom: 28px; right: 28px; z-index: 9000;
      width: 42px; height: 42px; border-radius: 8px;
      background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.3);
      color: #00d4ff; font-size: 1.1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.22s; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      animation: bttFadeIn 0.22s ease;
      &:hover { background: rgba(0,212,255,0.18); border-color: rgba(0,212,255,0.65); box-shadow: 0 0 22px rgba(0,212,255,0.22); transform: translateY(-4px); }
    }
    @keyframes bttFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* ── Scroll progress bar ── */
    .scroll-bar {
      position: fixed; top: 0; left: 0; z-index: 9995;
      height: 2px; pointer-events: none;
      background: linear-gradient(90deg, #7c6fff 0%, #00d4ff 55%, #a78bfa 100%);
      box-shadow: 0 0 10px rgba(0,212,255,0.7), 0 0 20px rgba(0,212,255,0.35);
      transition: width 0.08s linear;
    }

    /* ── Ambient HUD — always present, very subtle ── */
    .ambient-hud {
      position: fixed; inset: 0; pointer-events: none; z-index: 50;
    }

    /* Scanlines */
    .ambient-hud::before {
      content: ''; position: absolute; inset: 0;
      background: repeating-linear-gradient(
        0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px
      );
    }

    /* Very subtle cyan vignette border */
    .ambient-hud::after {
      content: ''; position: absolute; inset: 0;
      box-shadow: inset 0 0 120px rgba(0,212,255,0.03), inset 0 0 40px rgba(0,0,0,0.12);
    }

    /* Viewport corner brackets */
    .ah-corner {
      position: absolute; width: 22px; height: 22px;
      opacity: 0.55; animation: cornerFade 3s ease forwards;
    }
    .ah-tl { top: 14px;    left: 14px;    border-top:    1px solid rgba(0,212,255,0.55); border-left:   1px solid rgba(0,212,255,0.55); }
    .ah-tr { top: 14px;    right: 14px;   border-top:    1px solid rgba(0,212,255,0.55); border-right:  1px solid rgba(0,212,255,0.55); }
    .ah-bl { bottom: 14px; left: 14px;    border-bottom: 1px solid rgba(0,212,255,0.55); border-left:   1px solid rgba(0,212,255,0.55); }
    .ah-br { bottom: 14px; right: 14px;   border-bottom: 1px solid rgba(0,212,255,0.55); border-right:  1px solid rgba(0,212,255,0.55); }
    @keyframes cornerFade { from { opacity: 0; } to { opacity: 0.55; } }

    /* ── Scan overlay — on route change ── */
    .scan-overlay {
      position: fixed; inset: 0; pointer-events: none; z-index: 9998;
      opacity: 0; transition: opacity 0.05s ease;
      background: rgba(0,212,255,0.012);
    }
    .scan-overlay.active { opacity: 1; }

    /* Radial flash at transition peak */
    .scan-overlay::before {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.14) 0%, rgba(0,212,255,0.1) 25%, transparent 65%);
      opacity: 0;
    }
    .scan-overlay.active::before { animation: flashPulse 0.86s ease forwards; }

    .scan-overlay::after {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 46%, transparent 40%, rgba(0,0,15,0.55) 100%);
      opacity: 0; transition: opacity 0.1s;
    }
    .scan-overlay.active::after { opacity: 1; }

    /* Hex grid flash */
    .scan-hex {
      position: absolute; inset: 0; opacity: 0; pointer-events: none;
      background-image:
        repeating-linear-gradient(0deg,   transparent, transparent 23px, rgba(0,212,255,0.05) 23px, rgba(0,212,255,0.05) 24px),
        repeating-linear-gradient(60deg,  transparent, transparent 23px, rgba(0,212,255,0.05) 23px, rgba(0,212,255,0.05) 24px),
        repeating-linear-gradient(120deg, transparent, transparent 23px, rgba(0,212,255,0.05) 23px, rgba(0,212,255,0.05) 24px);
    }
    .scan-overlay.active .scan-hex { animation: hexFlash 0.82s ease forwards; }
    @keyframes hexFlash {
      0%   { opacity: 0; }
      18%  { opacity: 1; }
      55%  { opacity: 0.45; }
      100% { opacity: 0; }
    }

    /* Scan beams */
    .scan-beam {
      position: absolute; left: 0; right: 0;
      background: linear-gradient(90deg,
        transparent 0%, rgba(0,212,255,0.25) 8%,
        rgba(160,240,255,0.95) 38%, rgba(255,255,255,1) 50%,
        rgba(160,240,255,0.95) 62%, rgba(0,212,255,0.25) 92%,
        transparent 100%
      );
      box-shadow: 0 0 10px rgba(255,255,255,0.95), 0 0 28px rgba(0,212,255,1), 0 0 70px rgba(0,212,255,0.55), 0 0 140px rgba(0,212,255,0.22);
    }
    .b1 { top: -3px; height: 2px; }
    .b2 { top: -3px; height: 1px; opacity: 0.2; filter: blur(1px); }
    .b3 { top: -3px; height: 1px; opacity: 0.35; filter: hue-rotate(200deg); }
    .scan-overlay.active .b1 { animation: scanDown  0.70s cubic-bezier(0.38,0,0.68,1) forwards; }
    .scan-overlay.active .b2 { animation: scanDown2 0.70s cubic-bezier(0.38,0,0.68,1) 0.10s forwards; }
    .scan-overlay.active .b3 { animation: scanDown3 0.44s cubic-bezier(0.42,0,1,0.65) 0.04s forwards; }

    @keyframes scanDown  { 0% { top:-3px; opacity:1; } 15% { opacity:1; } 80% { opacity:0.7; } 100% { top:100vh; opacity:0; } }
    @keyframes scanDown2 { 0% { top:-3px; opacity:0.25; } 100% { top:100vh; opacity:0; } }
    @keyframes scanDown3 { 0% { top:-3px; opacity:0.45; } 100% { top:65vh;  opacity:0; } }

    /* Arc-reactor rings — expand from center */
    .scan-ring {
      position: absolute; border-radius: 50%; pointer-events: none;
      top: 50%; left: 50%; width: 0; height: 0;
      transform: translate(-50%, -50%); opacity: 0;
    }
    .r1 { border: 1.5px solid rgba(0,212,255,0.92); box-shadow: 0 0 18px rgba(0,212,255,0.8), 0 0 50px rgba(0,212,255,0.35); }
    .r2 { border: 1px   solid rgba(160,240,255,0.65); box-shadow: 0 0 12px rgba(0,212,255,0.5); }
    .r3 { border: 1px   solid rgba(255,255,255,0.38); }
    .scan-overlay.active .r1 { animation: ringPulse 0.75s cubic-bezier(0.1,0.8,0.35,1) 0.03s forwards; }
    .scan-overlay.active .r2 { animation: ringPulse 0.75s cubic-bezier(0.1,0.8,0.35,1) 0.11s forwards; }
    .scan-overlay.active .r3 { animation: ringPulse 0.75s cubic-bezier(0.1,0.8,0.35,1) 0.20s forwards; }

    @keyframes ringPulse {
      0%   { width:0;       height:0;       opacity:0.95; transform:translate(-50%,-50%); }
      55%  { opacity:0.4; }
      100% { width:200vmax; height:200vmax; opacity:0;    transform:translate(-50%,-50%); }
    }

    @keyframes flashPulse {
      0%   { opacity: 0; }
      14%  { opacity: 1; }
      38%  { opacity: 0.7; }
      68%  { opacity: 0.3; }
      100% { opacity: 0; }
    }

    /* ── Ambient Three.js background ── */
    .ambient-bg {
      position: fixed; inset: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 1; opacity: 0.13;
    }
  `]
})
export class App implements AfterViewInit, OnDestroy {
  scanning     = false;
  scrollProgress = signal(0);
  showBackTop    = signal(false);

  @ViewChild('cursorDot')   private cursorDotRef!:   ElementRef<HTMLElement>;
  @ViewChild('cursorRing')  private cursorRingRef!:  ElementRef<HTMLElement>;
  @ViewChild('ambientBg')   private ambientBgRef!:   ElementRef<HTMLCanvasElement>;

  private ambientRenderer?: THREE.WebGLRenderer;
  private ambientAnimId!:   number;

  private router = inject(Router);

  @HostListener('window:scroll')
  onScroll() {
    const doc = document.documentElement;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    this.scrollProgress.set(scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0);
    this.showBackTop.set(window.scrollY > 320);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    const d = this.cursorDotRef?.nativeElement;
    const r = this.cursorRingRef?.nativeElement;
    if (d) { d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; }
    if (r) { r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; }
  }

  ngAfterViewInit() {
    if (window.innerWidth >= 768) this.initAmbient();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.ambientAnimId);
    this.ambientRenderer?.dispose();
  }

  private initAmbient() {
    const canvas = this.ambientBgRef.nativeElement;
    const W = window.innerWidth;
    const H = window.innerHeight;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
    camera.position.z = 5;

    this.ambientRenderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    this.ambientRenderer.setSize(W, H);
    this.ambientRenderer.setPixelRatio(1);

    // ── Drifting particle field ──────────────────────
    const pCount = 200;
    const pPos   = new Float32Array(pCount * 3);
    const pCol   = new Float32Array(pCount * 3);
    const pVel   = new Float32Array(pCount * 3);
    const cyan   = new THREE.Color('#00d4ff');
    const purple = new THREE.Color('#a78bfa');
    const white  = new THREE.Color('#ffffff');
    for (let i = 0; i < pCount; i++) {
      pPos[i*3]   = (Math.random() - 0.5) * 22;
      pPos[i*3+1] = (Math.random() - 0.5) * 14;
      pPos[i*3+2] = (Math.random() - 0.5) * 8;
      pVel[i*3]   = (Math.random() - 0.5) * 0.004;
      pVel[i*3+1] = (Math.random() - 0.5) * 0.003;
      pVel[i*3+2] = 0;
      const pick = Math.random();
      const c    = pick < 0.5 ? cyan : pick < 0.75 ? purple : white;
      pCol[i*3] = c.r; pCol[i*3+1] = c.g; pCol[i*3+2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
    const particles = new THREE.Points(pGeo,
      new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0.7 })
    );
    scene.add(particles);

    // ── Distant wireframe shapes ─────────────────────
    const makeWireShape = (geo: THREE.BufferGeometry, color: string, x: number, y: number, z: number) => {
      const wire = new THREE.WireframeGeometry(geo);
      const mesh = new THREE.LineSegments(wire,
        new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.12 })
      );
      mesh.position.set(x, y, z);
      return mesh;
    };

    const shape1 = makeWireShape(new THREE.IcosahedronGeometry(2.2, 1), '#00d4ff', -4,  1, -6);
    const shape2 = makeWireShape(new THREE.OctahedronGeometry(1.6, 0),  '#a78bfa',  4, -1, -8);
    const shape3 = makeWireShape(new THREE.TetrahedronGeometry(1.2, 0), '#00d4ff',  0,  2.5, -10);
    scene.add(shape1, shape2, shape3);

    const posAttr = pGeo.attributes['position'] as THREE.BufferAttribute;
    const animate = () => {
      this.ambientAnimId = requestAnimationFrame(animate);
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < pCount; i++) {
        arr[i*3]   += pVel[i*3];
        arr[i*3+1] += pVel[i*3+1];
        if (arr[i*3]   >  11) arr[i*3]   = -11;
        if (arr[i*3]   < -11) arr[i*3]   =  11;
        if (arr[i*3+1] >   7) arr[i*3+1] =  -7;
        if (arr[i*3+1] <  -7) arr[i*3+1] =   7;
      }
      posAttr.needsUpdate = true;
      shape1.rotation.y += 0.0006;
      shape1.rotation.x += 0.0003;
      shape2.rotation.y -= 0.0008;
      shape2.rotation.z += 0.0004;
      shape3.rotation.x += 0.0005;
      shape3.rotation.y += 0.0007;
      this.ambientRenderer!.render(scene, camera);
    };
    animate();
  }

  scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.scanning = true;
        window.scrollTo(0, 0);
      }
      if (event instanceof NavigationEnd) setTimeout(() => this.scanning = false, 920);
    });
  }

  getState(outlet: RouterOutlet) {
    return outlet.isActivated ? outlet.activatedRoute.snapshot.data['anim'] : '';
  }
}
