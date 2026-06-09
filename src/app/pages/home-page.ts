import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hero } from '../components/hero/hero';

@Component({
  selector: 'app-home-page',
  imports: [Hero, RouterLink],
  template: `
    <app-hero />

    <section class="nav-section">
      <div class="container">
        <div class="nav-header">
          <span class="nav-tag">// NAVIGATION PRINCIPALE</span>
          <div class="nav-line"></div>
        </div>
        <div class="nav-grid">
          <a routerLink="/about" class="nav-card glass">
            <div class="nc-top">
              <span class="nc-num">01</span>
              <span class="nc-icon">◈</span>
            </div>
            <h3>À propos</h3>
            <p>Mon parcours, ma formation et mes objectifs</p>
            <div class="nc-bottom">
              <span class="nc-arrow">→</span>
              <span class="nc-tag">PROFIL</span>
            </div>
          </a>

          <a routerLink="/competences" class="nav-card glass">
            <div class="nc-top">
              <span class="nc-num">02</span>
              <span class="nc-icon">◆</span>
            </div>
            <h3>Compétences</h3>
            <p>Stack technique, langages et outils maîtrisés</p>
            <div class="nc-bottom">
              <span class="nc-arrow">→</span>
              <span class="nc-tag">STACK</span>
            </div>
          </a>

          <a routerLink="/projets" class="nav-card glass featured">
            <div class="nc-top">
              <span class="nc-num">03</span>
              <span class="nc-icon">⬡</span>
            </div>
            <h3>Projets</h3>
            <p>Mes réalisations académiques et personnelles</p>
            <div class="nc-bottom">
              <span class="nc-arrow">→</span>
              <span class="nc-tag">LAB</span>
            </div>
          </a>

          <a routerLink="/contact" class="nav-card glass">
            <div class="nc-top">
              <span class="nc-num">04</span>
              <span class="nc-icon">◇</span>
            </div>
            <h3>Contact</h3>
            <p>Discutons d'une opportunité ou d'un projet</p>
            <div class="nc-bottom">
              <span class="nc-arrow">→</span>
              <span class="nc-tag">COMM</span>
            </div>
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .nav-section {
      padding: 80px 0 100px;
      background: linear-gradient(180deg, #040912 0%, #060c1c 100%);
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(0,212,255,0.25), transparent);
      }
    }

    .nav-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 40px;
    }

    .nav-tag {
      font-family: 'Courier New', monospace;
      font-size: 0.62rem;
      letter-spacing: 0.18em;
      color: rgba(0,212,255,0.4);
      white-space: nowrap;
    }

    .nav-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, rgba(0,212,255,0.2), transparent);
    }

    .nav-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .nav-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 26px;
      text-decoration: none;
      color: var(--text);
      transition: all 0.25s ease;
      border: 1px solid rgba(0,212,255,0.1);
      border-radius: 14px;
      background: rgba(4,12,28,0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0; left: 20%; right: 20%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent);
      }

      &.featured {
        border-color: rgba(0,212,255,0.2);
        background: rgba(0,212,255,0.04);

        &::before { background: linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent); }

        h3 { color: #00d4ff; }
      }

      &:hover {
        border-color: rgba(0,212,255,0.35);
        transform: translateY(-5px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(0,212,255,0.08);

        .nc-arrow { transform: translateX(5px); color: #00d4ff; }
        .nc-icon  { color: #00d4ff; }
      }
    }

    .nc-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nc-num {
      font-family: 'Courier New', monospace;
      font-size: 0.6rem;
      color: rgba(0,212,255,0.3);
      letter-spacing: 0.1em;
    }

    .nc-icon {
      font-size: 1.1rem;
      color: rgba(0,212,255,0.5);
      transition: all 0.22s;
    }

    h3 { font-size: 1rem; font-weight: 700; margin: 0; }
    p  { color: rgba(255,255,255,0.4); font-size: 0.82rem; line-height: 1.55; flex: 1; margin: 0; }

    .nc-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6px;
    }

    .nc-arrow {
      font-size: 1rem;
      transition: all 0.22s;
      color: rgba(255,255,255,0.3);
    }

    .nc-tag {
      font-family: 'Courier New', monospace;
      font-size: 0.55rem;
      color: rgba(0,212,255,0.25);
      letter-spacing: 0.14em;
      border: 1px solid rgba(0,212,255,0.12);
      border-radius: 3px;
      padding: 2px 8px;
    }

    @media (max-width: 900px) { .nav-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 560px) { .nav-grid { grid-template-columns: 1fr; } }
  `]
})
export class HomePage {}
