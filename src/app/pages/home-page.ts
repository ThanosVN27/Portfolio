import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hero } from '../components/hero/hero';

@Component({
  selector: 'app-home-page',
  imports: [Hero, RouterLink],
  template: `
    <app-hero />
    <section class="teaser">
      <div class="container">
        <div class="teaser-grid">
          <a routerLink="/about" class="teaser-card glass">
            <span class="teaser-icon">👤</span>
            <h3>À propos</h3>
            <p>Mon parcours, ma formation et mes compétences</p>
            <span class="teaser-arrow">→</span>
          </a>
          <a routerLink="/projets" class="teaser-card glass">
            <span class="teaser-icon">🚀</span>
            <h3>Projets</h3>
            <p>Mes réalisations académiques et personnelles</p>
            <span class="teaser-arrow">→</span>
          </a>
          <a routerLink="/contact" class="teaser-card glass">
            <span class="teaser-icon">✉</span>
            <h3>Contact</h3>
            <p>Discutons d'une opportunité ou d'un projet</p>
            <span class="teaser-arrow">→</span>
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .teaser {
      padding: 80px 0;
      background: linear-gradient(180deg, #0c0d20 0%, #0f1030 100%);
    }
    .teaser-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    .teaser-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 32px;
      text-decoration: none;
      color: var(--text);
      transition: var(--transition);
      position: relative;
      overflow: hidden;
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--gradient);
        opacity: 0;
        transition: var(--transition);
      }
      &:hover {
        transform: translateY(-6px);
        border-color: var(--accent);
        &::before { opacity: 0.04; }
        .teaser-arrow { transform: translateX(6px); color: var(--accent); }
      }
    }
    .teaser-icon { font-size: 2rem; }
    h3 { font-size: 1.2rem; font-weight: 700; }
    p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; flex: 1; }
    .teaser-arrow { font-size: 1.2rem; transition: var(--transition); color: var(--text-muted); align-self: flex-end; }
    @media (max-width: 768px) { .teaser-grid { grid-template-columns: 1fr; } }
  `]
})
export class HomePage {}
