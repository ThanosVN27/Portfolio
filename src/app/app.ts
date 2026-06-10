import { Component, inject, signal, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { LoadingScreen } from './components/loading-screen/loading-screen';
import { trigger, transition, query, group, animate, keyframes, style } from '@angular/animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, LoadingScreen],
  animations: [
    trigger('routeAnim', [
      transition('* <=> *', [
        group([

          /* ── Outgoing page — hologram dematerializes with glitch ── */
          query(':leave', [
            style({ position: 'absolute', top: 0, left: 0, width: '100%' }),
            animate('280ms cubic-bezier(0.4,0,1,1)', keyframes([
              style({ opacity: 1,   filter: 'blur(0px)  brightness(1.0)',                   transform: 'scale(1)     translateY(0px)  translateX(0)',   offset: 0    }),
              style({ opacity: 0.8, filter: 'blur(2px)  brightness(1.6) hue-rotate(18deg)', transform: 'scale(1.006) translateY(-3px) translateX(-4px)', offset: 0.2  }),
              style({ opacity: 0.5, filter: 'blur(5px)  brightness(1.9) hue-rotate(-8deg)', transform: 'scale(1.01)  translateY(-6px) translateX(3px)',  offset: 0.55 }),
              style({ opacity: 0,   filter: 'blur(12px) brightness(2.2) saturate(1.8)',     transform: 'scale(1.018) translateY(-14px)',                  offset: 1    }),
            ]))
          ], { optional: true }),

          /* ── Incoming page — hologram materializes ── */
          query(':enter', [
            style({ opacity: 0, filter: 'blur(18px) brightness(0.15) saturate(2.5)', transform: 'translateY(28px) scale(0.972)' }),
            animate('560ms 220ms cubic-bezier(0.4,0,0.2,1)', keyframes([
              style({ opacity: 0,    filter: 'blur(18px) brightness(0.15) saturate(2.5)', transform: 'translateY(28px) scale(0.972)', offset: 0    }),
              style({ opacity: 0.35, filter: 'blur(9px)  brightness(0.45) saturate(2)',   transform: 'translateY(16px) scale(0.984)', offset: 0.35 }),
              style({ opacity: 0.7,  filter: 'blur(4px)  brightness(0.78) saturate(1.4)', transform: 'translateY(7px)  scale(0.993)', offset: 0.68 }),
              style({ opacity: 1,    filter: 'blur(0px)  brightness(1)    saturate(1)',   transform: 'translateY(0)   scale(1)',      offset: 1    }),
            ]))
          ], { optional: true }),

        ])
      ])
    ])
  ],
  template: `
    <app-loading-screen />

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
      <div class="scan-beam b1"></div>
      <div class="scan-beam b2"></div>
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
      opacity: 0; transition: opacity 0.07s ease;
      background: rgba(0,212,255,0.014);
    }
    .scan-overlay.active { opacity: 1; }
    .scan-overlay::after {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 46%, transparent 48%, rgba(0,0,15,0.45) 100%);
      opacity: 0; transition: opacity 0.14s;
    }
    .scan-overlay.active::after { opacity: 1; }

    /* Scan beams — two lines for double-sweep effect */
    .scan-beam {
      position: absolute; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg,
        transparent 0%, rgba(0,212,255,0.45) 15%,
        rgba(210,245,255,0.95) 50%,
        rgba(0,212,255,0.45) 85%, transparent 100%
      );
      box-shadow: 0 0 22px rgba(0,212,255,0.9), 0 0 50px rgba(0,212,255,0.45), 0 0 3px #fff;
    }
    .b1 { top: -3px; }
    .b2 { top: -3px; opacity: 0.35; }
    .scan-overlay.active .b1 { animation: scanDown  0.58s cubic-bezier(0.4,0,0.6,1) forwards; }
    .scan-overlay.active .b2 { animation: scanDown2 0.58s cubic-bezier(0.4,0,0.6,1) 0.1s forwards; }

    @keyframes scanDown {
      0%   { top: -3px;  opacity: 1; }
      80%  { opacity: 0.7; }
      100% { top: 100vh; opacity: 0; }
    }
    @keyframes scanDown2 {
      0%   { top: -3px;  opacity: 0.4; }
      100% { top: 100vh; opacity: 0; }
    }
  `]
})
export class App implements AfterViewInit {
  scanning     = false;
  scrollProgress = signal(0);
  showBackTop    = signal(false);

  @ViewChild('cursorDot')  private cursorDotRef!:  ElementRef<HTMLElement>;
  @ViewChild('cursorRing') private cursorRingRef!: ElementRef<HTMLElement>;

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

  ngAfterViewInit() {}

  scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) this.scanning = true;
      if (event instanceof NavigationEnd)   setTimeout(() => this.scanning = false, 580);
    });
  }

  getState(outlet: RouterOutlet) {
    return outlet.isActivated ? outlet.activatedRoute.snapshot.data['anim'] : '';
  }
}
