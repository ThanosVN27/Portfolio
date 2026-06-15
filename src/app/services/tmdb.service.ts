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
}
