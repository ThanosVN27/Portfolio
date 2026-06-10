import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <div class="nf-page">

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

    /* Grid */
    .nf-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(0,212,255,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,212,255,0.035) 1px, transparent 1px);
      background-size: 64px 64px;
    }

    /* Scanlines */
    .nf-scan {
      position: absolute; inset: 0; pointer-events: none;
      background: repeating-linear-gradient(
        0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px
      );
    }

    .nf-content {
      position: relative; z-index: 2; text-align: center; padding: 24px;
    }

    .nf-tag-row {
      display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 40px;
    }
    .nf-label {
      font-family: 'Courier New', monospace; font-size: 0.6rem; letter-spacing: 0.2em;
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
      font-family: 'Courier New', monospace; font-size: 0.7rem;
      color: rgba(0,212,255,0.4); letter-spacing: 0.12em; margin-bottom: 6px;
      &.dim { color: rgba(255,255,255,0.2); margin-bottom: 40px; }
    }

    .nf-btn {
      display: inline-flex; align-items: center; gap: 12px;
      padding: 14px 36px; border-radius: 8px;
      background: rgba(0,212,255,0.07); border: 1px solid rgba(0,212,255,0.28);
      color: #00d4ff; text-decoration: none;
      font-family: 'Courier New', monospace; font-size: 0.75rem; letter-spacing: 0.14em;
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
export class NotFoundPage {}
