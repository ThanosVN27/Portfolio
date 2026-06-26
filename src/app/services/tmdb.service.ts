import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface UpcomingMovie {
  id: number;
  title: string;
  poster: string;      // URL complète du poster (ou '' si absent)
  releaseDate: string; // date ISO yyyy-mm-dd
}

/**
 * Accès à l'API TMDB pour les sorties cinéma à venir.
 * Nécessite une clé API gratuite (https://www.themoviedb.org/settings/api)
 * renseignée dans environment.tmdbApiKey. Sans clé, le service reste inactif.
 */
@Injectable({ providedIn: 'root' })
export class TmdbService {
  private readonly key: string = (environment as { tmdbApiKey?: string }).tmdbApiKey ?? '';
  private readonly img = 'https://image.tmdb.org/t/p/w300';

  /** Vrai si une clé TMDB est configurée. */
  get hasKey(): boolean {
    return this.key.trim().length > 0;
  }

  /**
   * Récupère les films qui sortent prochainement au cinéma.
   * @param region code pays ISO (FR par défaut) — influe sur les dates de sortie.
   */
  async getUpcoming(region = 'FR'): Promise<UpcomingMovie[]> {
    if (!this.hasKey) return [];

    const url = `https://api.themoviedb.org/3/movie/upcoming`
      + `?language=fr-FR&region=${region}&page=1&api_key=${this.key}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB ${res.status}`);

    const data = await res.json();
    const today = new Date().toISOString().slice(0, 10);

    return (data.results as Array<Record<string, unknown>> ?? [])
      .filter(m => !!m['poster_path'] && String(m['release_date'] ?? '') >= today)
      .sort((a, b) => String(a['release_date']).localeCompare(String(b['release_date'])))
      .slice(0, 20)
      .map(m => ({
        id: m['id'] as number,
        title: (m['title'] as string) ?? (m['original_title'] as string) ?? '—',
        poster: m['poster_path'] ? `${this.img}${m['poster_path']}` : '',
        releaseDate: (m['release_date'] as string) ?? '',
      }));
  }

  /** Bande-annonce d'un film par son id TMDB (utilisé par les sorties à venir). */
  async getTrailerKey(movieId: number): Promise<string | null> {
    return this.getTrailerKeyFor('movie', movieId);
  }

  /**
   * Bande-annonce d'un titre du catalogue (film OU série) par recherche.
   * Matching par titre exact puis par année pour viser la bonne fiche.
   */
  async getTrailerByTitle(title: string, year?: number, preferTv?: boolean): Promise<string | null> {
    if (!this.hasKey) return null;

    // Nettoie les suffixes de saison/édition entre parenthèses (« (S1) », « (2009) »…)
    const cleanTitle = title.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

    const url = `https://api.themoviedb.org/3/search/multi`
      + `?language=fr-FR&include_adult=false&query=${encodeURIComponent(cleanTitle)}&api_key=${this.key}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const cands = (data.results as Array<Record<string, unknown>> ?? [])
      .filter(r => (r['media_type'] === 'movie' || r['media_type'] === 'tv') && r['id']);
    if (!cands.length) return null;

    const norm = (s: string) => (s || '').toLowerCase().normalize('NFD')
      .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
    const tNorm = norm(cleanTitle);
    const yearOf = (r: Record<string, unknown>) =>
      parseInt(String(r['release_date'] ?? r['first_air_date'] ?? '').slice(0, 4)) || 0;

    // Score = pertinence TMDB (ordre) ajustée par titre exact / contenu / année / type attendu
    const scored = cands.map((r, i) => {
      const n = norm(String(r['title'] ?? r['name']));
      let s = -i;
      if (n === tNorm) s += 100;
      else if (tNorm.length >= 4 && n.includes(tNorm)) s += 55;
      if (year && Math.abs(yearOf(r) - year) <= 1) s += 50;
      if (preferTv !== undefined && ((preferTv && r['media_type'] === 'tv') || (!preferTv && r['media_type'] === 'movie'))) s += 40;
      return { r, s, v: Number(r['vote_count']) || 0 };
    });
    scored.sort((a, b) => (b.s - a.s) || (b.v - a.v));

    // Parcourt les meilleurs candidats jusqu'à en trouver un avec une bande-annonce
    for (const { r } of scored.slice(0, 5)) {
      const key = await this.getTrailerKeyFor(r['media_type'] as string, r['id'] as number);
      if (key) return key;
    }
    return null;
  }

  /** Meilleure bande-annonce YouTube pour un média donné (FR puis EN, trailer officiel prioritaire). */
  private async getTrailerKeyFor(mediaType: string, id: number): Promise<string | null> {
    if (!this.hasKey) return null;

    for (const lang of ['fr-FR', 'en-US']) {
      const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}/videos`
        + `?language=${lang}&api_key=${this.key}`);
      if (!res.ok) continue;

      const vids = ((await res.json()).results as Array<Record<string, unknown>> ?? [])
        .filter(v => v['site'] === 'YouTube' && v['key']);

      const pick =
        vids.find(v => v['type'] === 'Trailer' && v['official'] === true) ??
        vids.find(v => v['type'] === 'Trailer') ??
        vids.find(v => v['type'] === 'Teaser') ??
        vids[0];

      if (pick) return pick['key'] as string;
    }
    return null;
  }
}
