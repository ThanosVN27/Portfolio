import { Component, signal, inject, HostListener, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { JarvisSoundService } from '../../services/jarvis-sound.service';

interface Line { type: 'input' | 'output' | 'error' | 'info' | 'success'; text: string; }

@Component({
  selector: 'app-jarvis-console',
  standalone: true,
  template: `
    @if (open()) {
      <div class="jc-backdrop" (click)="close()"></div>
      <div class="jc-panel">
        <div class="jc-header">
          <span class="jc-title">// JARVIS TERMINAL</span>
          <div class="jc-header-right">
            <span class="jc-status">● EN LIGNE</span>
            <span class="jc-esc">ESC</span>
          </div>
        </div>
        <div class="jc-log" #logEl>
          @for (line of lines(); track $index) {
            <div class="jc-line jc-{{ line.type }}">
              @if (line.type === 'input') { <span class="jc-prompt">❯</span> }
              @if (line.type !== 'input') { <span class="jc-prefix">{{ prefix(line.type) }}</span> }
              <span>{{ line.text }}</span>
            </div>
          }
        </div>
        <div class="jc-input-row">
          <span class="jc-prompt">❯</span>
          <input #inputEl class="jc-input"
            (input)="onInput($event)"
            (keydown)="onKey($event)"
            placeholder="Tape une commande... (help)"
            autocomplete="off" spellcheck="false" />
        </div>
      </div>
    }
  `,
  styles: [`
    .jc-backdrop {
      position: fixed; inset: 0; z-index: 99990;
      background: rgba(0,2,14,0.6); backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      animation: jcFade 0.16s ease;
    }
    .jc-panel {
      position: fixed; top: 0; left: 50%; transform: translateX(-50%);
      width: min(760px, 96vw); z-index: 99991;
      background: rgba(3,8,22,0.98);
      border: 1px solid rgba(0,212,255,0.3);
      border-top: 2px solid rgba(0,212,255,0.7);
      border-radius: 0 0 14px 14px;
      box-shadow: 0 0 0 1px rgba(0,212,255,0.06), 0 28px 90px rgba(0,0,0,0.85), 0 0 80px rgba(0,212,255,0.06);
      animation: jcSlide 0.2s cubic-bezier(0.16,1,0.3,1);
      overflow: hidden;
    }
    @keyframes jcFade  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes jcSlide { from { transform: translateX(-50%) translateY(-100%); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }

    .jc-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 20px; border-bottom: 1px solid rgba(0,212,255,0.1);
      background: rgba(0,212,255,0.035);
    }
    .jc-title  { font-family: 'Courier New', monospace; font-size: 0.58rem; letter-spacing: 0.2em; color: rgba(0,212,255,0.85); }
    .jc-header-right { display: flex; align-items: center; gap: 14px; }
    .jc-status { font-family: 'Courier New', monospace; font-size: 0.5rem; letter-spacing: 0.1em; color: rgba(74,222,128,0.8); animation: blink 2.2s ease-in-out infinite; }
    .jc-esc    { font-family: 'Courier New', monospace; font-size: 0.5rem; color: rgba(255,255,255,0.25); padding: 2px 6px; border: 1px solid rgba(255,255,255,0.12); border-radius: 3px; }
    @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

    .jc-log {
      padding: 14px 20px; max-height: 280px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 4px;
      scrollbar-width: thin; scrollbar-color: rgba(0,212,255,0.2) transparent;
    }
    .jc-line {
      font-family: 'Courier New', monospace; font-size: 0.74rem;
      line-height: 1.55; display: flex; gap: 8px; align-items: flex-start;
    }
    .jc-input   { color: rgba(255,255,255,0.9); }
    .jc-output  { color: rgba(0,212,255,0.82); }
    .jc-info    { color: rgba(160,200,255,0.65); }
    .jc-success { color: rgba(74,222,128,0.88); }
    .jc-error   { color: rgba(255,100,100,0.88); }
    .jc-prompt  { color: rgba(0,212,255,0.65); flex-shrink: 0; min-width: 14px; }
    .jc-prefix  { color: rgba(0,212,255,0.35); flex-shrink: 0; min-width: 14px; }

    .jc-input-row {
      display: flex; align-items: center; gap: 10px;
      padding: 13px 20px; border-top: 1px solid rgba(0,212,255,0.1);
      background: rgba(0,212,255,0.015);
    }
    .jc-input {
      flex: 1; background: none; border: none; outline: none;
      font-family: 'Courier New', monospace; font-size: 0.8rem;
      color: rgba(255,255,255,0.92); caret-color: #00d4ff;
      &::placeholder { color: rgba(255,255,255,0.18); }
    }
  `]
})
export class JarvisConsole implements AfterViewChecked {
  open  = signal(false);
  lines = signal<Line[]>([
    { type: 'info', text: 'JARVIS TERMINAL v2.0 — Système initialisé.' },
    { type: 'info', text: '"help" pour la liste des commandes disponibles.' },
  ]);

  private history: string[] = [];
  private histIdx = -1;
  private router  = inject(Router);
  private sound   = inject(JarvisSoundService);

  @ViewChild('inputEl') private inputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('logEl')   private logEl!:   ElementRef<HTMLDivElement>;

  @HostListener('window:keydown', ['$event'])
  onGlobalKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); this.toggle(); }
    if (this.open() && e.key === 'Escape') this.close();
  }

  ngAfterViewChecked() {
    if (this.logEl) this.logEl.nativeElement.scrollTop = this.logEl.nativeElement.scrollHeight;
  }

  prefix(type: Line['type']): string {
    return { output: '│', info: '·', success: '✓', error: '✗', input: '' }[type] ?? '·';
  }

  toggle() {
    if (this.open()) { this.close(); } else {
      this.sound.consoleOpen();
      this.open.set(true);
      setTimeout(() => this.inputEl?.nativeElement.focus(), 70);
    }
  }

  close() { this.open.set(false); }

  onInput(e: Event) {
    this.sound.keypress();
    void e;
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter')     { this.submit(); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); this.nav(1); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); this.nav(-1); return; }
  }

  private nav(dir: number) {
    this.histIdx = Math.max(-1, Math.min(this.history.length - 1, this.histIdx + dir));
    const val = this.histIdx >= 0 ? this.history[this.histIdx] : '';
    setTimeout(() => {
      if (this.inputEl) { this.inputEl.nativeElement.value = val; this.inputEl.nativeElement.setSelectionRange(val.length, val.length); }
    });
  }

  private submit() {
    const cmd = this.inputEl?.nativeElement.value.trim() ?? '';
    if (!cmd) return;
    this.history.unshift(cmd);
    this.histIdx = -1;
    if (this.inputEl) this.inputEl.nativeElement.value = '';
    this.add('input', cmd);
    this.process(cmd.toLowerCase().trim());
  }

  private add(type: Line['type'], text: string) {
    this.lines.update(l => [...l, { type, text }]);
  }

  private process(raw: string) {
    const parts = raw.split(/\s+/);
    const cmd   = parts[0];
    const arg   = parts[1] ?? '';

    switch (cmd) {
      case 'help':
        ['scan        — scanner les systèmes', 'whoami      — identité utilisateur', 'goto [page] — home · about · projets · competences · films · contact', 'sound on|off — activer/couper les sons', 'clear       — vider le terminal', 'sudo        — 🤖'].forEach(l => this.add('output', l));
        break;

      case 'scan':
        this.add('info', 'Scan en cours...');
        setTimeout(() => this.add('output', '> CPU   : JARVIS_CORE — nominal'), 180);
        setTimeout(() => this.add('output', `> RAM   : ${(Math.random()*4+4).toFixed(1)} GB actifs`), 380);
        setTimeout(() => this.add('output', `> NET   : ${Math.round(Math.random()*20+30)}ms latence`), 580);
        setTimeout(() => this.add('output', `> STACK : Angular · Three.js · TypeScript`), 780);
        setTimeout(() => this.add('success', '✓ Tous les systèmes sont opérationnels.'), 1000);
        break;

      case 'whoami':
        this.add('output', 'Utilisateur  : Le Thanh Long');
        this.add('output', 'Rôle         : Développeur — BUT Informatique');
        this.add('output', 'Localisation : Strasbourg, France');
        this.add('output', 'Stack        : Angular · Java · Python · C');
        this.add('success', 'Statut       : EN LIGNE');
        break;

      case 'goto': {
        const map: Record<string, string> = { home: '/', about: '/about', projets: '/projets', competences: '/competences', films: '/films', contact: '/contact' };
        const dest = map[arg];
        if (dest) { this.add('success', `Navigation → /${arg}`); setTimeout(() => { this.close(); this.router.navigate([dest]); }, 280); }
        else this.add('error', `Page inconnue : "${arg}". Options : ${Object.keys(map).join(' · ')}`);
        break;
      }

      case 'sound':
        if (arg === 'off') { if (this.sound.isEnabled()) this.sound.toggle(); this.add('info', 'Sons désactivés.'); }
        else if (arg === 'on') { if (!this.sound.isEnabled()) this.sound.toggle(); this.add('success', 'Sons activés.'); }
        else this.add('error', 'Usage : sound on  |  sound off');
        break;

      case 'clear':
        this.lines.set([]);
        break;

      case 'sudo':
        this.add('error', 'Accès refusé — niveau d\'habilitation insuffisant.');
        setTimeout(() => this.add('info', '... mais j\'aime ton style. 🤖'), 700);
        break;

      default:
        this.add('error', `Commande inconnue : "${cmd}". Tape "help".`);
    }
  }
}
