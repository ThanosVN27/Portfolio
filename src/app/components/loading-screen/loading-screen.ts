import { Component, OnInit, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [],
  templateUrl: './loading-screen.html',
  styleUrl: './loading-screen.scss'
})
export class LoadingScreen implements OnInit, OnDestroy {
  show    = signal(true);
  mounted = signal(true);
  progress   = signal(0);
  bootLines  = signal<string[]>([]);
  cpuVal     = signal(72);
  memVal     = signal(1024);
  coreStatus = signal('INITIALIZING');

  private timers:    ReturnType<typeof setTimeout>[]  = [];
  private intervals: ReturnType<typeof setInterval>[] = [];

  private readonly bootSequence = [
    'JARVIS v7.1.4 — Démarrage du système...',
    'Modules Three.js        : OK',
    'Firebase connexion      : ÉTABLIE',
    'Données portfolio       : CHARGÉES',
    'Animations 3D           : PRÊTES',
    'Tous les systèmes opérationnels.',
    'BIENVENUE.',
  ];

  ngOnInit() {
    // Only show once per browser session
    if (sessionStorage.getItem('jarvis-loaded')) {
      this.mounted.set(false);
      return;
    }
    sessionStorage.setItem('jarvis-loaded', '1');

    // Randomised CPU / MEM readings
    this.intervals.push(setInterval(() => {
      this.cpuVal.set(Math.floor(Math.random() * 25 + 65));
      this.memVal.set(Math.floor(Math.random() * 150 + 900));
    }, 180));

    // Progress bar
    let prog = 0;
    this.intervals.push(setInterval(() => {
      prog = Math.min(prog + 1.8, 100);
      this.progress.set(Math.floor(prog));
    }, 55));

    // Boot sequence lines
    this.bootSequence.forEach((line, i) => {
      this.timers.push(setTimeout(() => {
        this.bootLines.update(l => [...l, line]);
        if (i === 4) this.coreStatus.set('ANALYSING');
        if (i === 5) this.coreStatus.set('ONLINE');
      }, 350 + i * 430));
    });

    // Fade out then unmount
    this.timers.push(setTimeout(() => {
      this.show.set(false);
      this.timers.push(setTimeout(() => this.mounted.set(false), 750));
    }, 4200));
  }

  ngOnDestroy() {
    this.timers.forEach(clearTimeout);
    this.intervals.forEach(clearInterval);
  }
}
