import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { LoadingScreen } from './components/loading-screen/loading-screen';
import { trigger, transition, style, animate, query, group } from '@angular/animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, LoadingScreen],
  animations: [
    trigger('routeAnim', [
      transition('* <=> *', [
        group([
          // Outgoing — hologram dematerializes: brightens, blurs, floats upward
          query(':leave', [
            style({ position: 'absolute', top: 0, left: 0, width: '100%' }),
            animate('230ms cubic-bezier(0.4,0,1,1)', style({
              opacity: 0,
              filter: 'blur(7px) brightness(1.55) saturate(1.7)',
              transform: 'scale(1.012) translateY(-10px)',
            }))
          ], { optional: true }),
          // Incoming — hologram materializes: dark blur focuses and rises
          query(':enter', [
            style({
              opacity: 0,
              filter: 'blur(14px) brightness(0.25) saturate(2.2)',
              transform: 'translateY(24px) scale(0.975)',
            }),
            animate('520ms 190ms cubic-bezier(0.4,0,0.2,1)', style({
              opacity: 1,
              filter: 'blur(0px) brightness(1) saturate(1)',
              transform: 'translateY(0) scale(1)',
            }))
          ], { optional: true }),
        ])
      ])
    ])
  ],
  template: `
    <app-loading-screen />
    <div class="scan-overlay" [class.active]="scanning"></div>
    <app-navbar />
    <main [@routeAnim]="getState(outlet)">
      <router-outlet #outlet="outlet" />
    </main>
    <app-footer />
  `,
  styles: [`
    main { position: relative; overflow: hidden; min-height: 100vh; }
    main > * { width: 100%; }

    /* Holographic scan overlay — appears on every route change */
    .scan-overlay {
      position: fixed; inset: 0; pointer-events: none; z-index: 9998;
      opacity: 0; transition: opacity 0.08s ease;
      background: rgba(0,212,255,0.013);
    }
    .scan-overlay.active { opacity: 1; }

    /* Scan beam sweeping top → bottom */
    .scan-overlay::before {
      content: ''; position: absolute; left: 0; right: 0; top: -3px; height: 2px;
      background: linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.55) 18%, rgba(200,240,255,0.95) 50%, rgba(0,212,255,0.55) 82%, transparent 100%);
      box-shadow: 0 0 22px rgba(0,212,255,0.85), 0 0 48px rgba(0,212,255,0.4), 0 0 2px #fff;
    }
    .scan-overlay.active::before { animation: scanDown 0.60s cubic-bezier(0.4,0,0.6,1) forwards; }

    /* Dark vignette overlay during transition */
    .scan-overlay::after {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 46%, transparent 50%, rgba(0,0,15,0.38) 100%);
      opacity: 0; transition: opacity 0.14s ease;
    }
    .scan-overlay.active::after { opacity: 1; }

    @keyframes scanDown {
      0%   { top: -3px;  opacity: 1; }
      75%  { opacity: 0.65; }
      100% { top: 100vh; opacity: 0; }
    }
  `]
})
export class App {
  scanning = false;
  private router = inject(Router);

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) this.scanning = true;
      if (event instanceof NavigationEnd) setTimeout(() => this.scanning = false, 560);
    });
  }

  getState(outlet: RouterOutlet) {
    return outlet.isActivated ? outlet.activatedRoute.snapshot.data['anim'] : '';
  }
}
