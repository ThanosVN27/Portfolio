import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class JarvisSoundService {
  private ctx?: AudioContext;
  private enabled = true;

  private getCtx(): AudioContext | null {
    try {
      if (!this.ctx) this.ctx = new AudioContext();
      return this.ctx;
    } catch { return null; }
  }

  private tone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine', delay = 0) {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime  + delay + dur + 0.01);
    } catch {}
  }

  hover() {
    this.tone(1800, 0.055, 0.022, 'sine');
  }

  click() {
    this.tone(900,  0.07,  0.07, 'square');
    this.tone(1800, 0.055, 0.035, 'sine', 0.04);
  }

  keypress() {
    this.tone(1400, 0.025, 0.018, 'square');
  }

  boot() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  consoleOpen() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    [0, 0.06, 0.12].forEach((delay, i) => {
      try {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 500 + i * 250;
        gain.gain.setValueAtTime(0.065, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.14);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime  + delay + 0.16);
      } catch {}
    });
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isEnabled(): boolean { return this.enabled; }
}
