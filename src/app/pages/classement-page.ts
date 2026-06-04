import { Component, signal, computed } from '@angular/core';

interface Entry { rank: number; title: string; year: string | number; score: number; category: string; emoji: string; }

@Component({
  selector: 'app-classement-page',
  imports: [],
  templateUrl: './classement-page.html',
  styleUrl: './classement-page.scss',
})
export class ClassementPage {
  activeFilter = signal('Tout');
  filters = ['Tout', 'Marvel', 'James Bond', 'Anime', 'Séries'];

  all: Entry[] = [
    // Marvel
    { rank: 1,  title: 'Avengers: Endgame',          year: 2019, score: 10,  category: 'Marvel',     emoji: '🔥' },
    { rank: 2,  title: 'Avengers: Infinity War',      year: 2018, score: 9.5, category: 'Marvel',     emoji: '⚡' },
    { rank: 3,  title: 'Spider-Man: No Way Home',     year: 2021, score: 9,   category: 'Marvel',     emoji: '🕷️' },
    { rank: 4,  title: 'Avengers (2012)',              year: 2012, score: 8.5, category: 'Marvel',     emoji: '🛡️' },
    { rank: 5,  title: 'Thor: Ragnarok',               year: 2017, score: 8.5, category: 'Marvel',     emoji: '⚡' },
    { rank: 6,  title: 'Iron Man',                     year: 2008, score: 9,   category: 'Marvel',     emoji: '🤖' },
    { rank: 7,  title: 'Captain America: Civil War',  year: 2016, score: 8,   category: 'Marvel',     emoji: '🇺🇸' },
    { rank: 8,  title: 'Guardians of the Galaxy',     year: 2014, score: 8,   category: 'Marvel',     emoji: '🌌' },
    // James Bond
    { rank: 1,  title: 'Casino Royale',               year: 2006, score: 9.5, category: 'James Bond', emoji: '🃏' },
    { rank: 2,  title: 'Skyfall',                     year: 2012, score: 9,   category: 'James Bond', emoji: '🔫' },
    { rank: 3,  title: 'GoldenEye',                   year: 1995, score: 8.5, category: 'James Bond', emoji: '🏅' },
    { rank: 4,  title: 'No Time to Die',              year: 2021, score: 8,   category: 'James Bond', emoji: '💣' },
    { rank: 5,  title: 'Goldfinger',                  year: 1964, score: 8,   category: 'James Bond', emoji: '🥇' },
    { rank: 6,  title: 'Spectre',                     year: 2015, score: 7,   category: 'James Bond', emoji: '🕵️' },
    { rank: 7,  title: 'Quantum of Solace',           year: 2008, score: 6,   category: 'James Bond', emoji: '😐' },
    // Anime
    { rank: 1,  title: 'Fullmetal Alchemist: Brotherhood', year: 2009, score: 10,  category: 'Anime', emoji: '⚗️' },
    { rank: 2,  title: 'Attack on Titan',             year: 2013, score: 9.5, category: 'Anime',      emoji: '⚔️' },
    { rank: 3,  title: 'Death Note',                  year: 2006, score: 9.5, category: 'Anime',      emoji: '📓' },
    { rank: 4,  title: 'Demon Slayer',                year: 2019, score: 9,   category: 'Anime',      emoji: '🌊' },
    { rank: 5,  title: 'Dragon Ball Z',               year: 1989, score: 8.5, category: 'Anime',      emoji: '💥' },
    { rank: 6,  title: 'Naruto',                      year: 2002, score: 8,   category: 'Anime',      emoji: '🍃' },
    { rank: 7,  title: 'My Hero Academia',            year: 2016, score: 8,   category: 'Anime',      emoji: '🦸' },
    { rank: 8,  title: 'One Piece',                   year: 1999, score: 7.5, category: 'Anime',      emoji: '🏴‍☠️' },
    // Séries
    { rank: 1,  title: 'Breaking Bad',                year: 2008, score: 10,  category: 'Séries',     emoji: '🧪' },
    { rank: 2,  title: 'The Boys',                    year: 2019, score: 9,   category: 'Séries',     emoji: '💪' },
    { rank: 3,  title: 'Game of Thrones',             year: 2011, score: 8.5, category: 'Séries',     emoji: '🐉' },
    { rank: 4,  title: 'Stranger Things',             year: 2016, score: 8.5, category: 'Séries',     emoji: '🔦' },
    { rank: 5,  title: 'Prison Break',                year: 2005, score: 8,   category: 'Séries',     emoji: '🔓' },
    { rank: 6,  title: 'Squid Game',                  year: 2021, score: 8,   category: 'Séries',     emoji: '🦑' },
    { rank: 7,  title: 'The Witcher',                 year: 2019, score: 7.5, category: 'Séries',     emoji: '🗡️' },
    { rank: 8,  title: 'Arcane',                      year: 2021, score: 9.5, category: 'Séries',     emoji: '✨' },
  ];

  filtered = computed(() => {
    const list = this.activeFilter() === 'Tout'
      ? [...this.all]
      : this.all.filter(e => e.category === this.activeFilter());
    return list.sort((a, b) => b.score - a.score);
  });

  setFilter(f: string) { this.activeFilter.set(f); }

  tierLabel(score: number): string {
    if (score >= 9.5) return 'S';
    if (score >= 8.5) return 'A';
    if (score >= 7)   return 'B';
    return 'C';
  }

  tierClass(score: number): string {
    if (score >= 9.5) return 'tier-s';
    if (score >= 8.5) return 'tier-a';
    if (score >= 7)   return 'tier-b';
    return 'tier-c';
  }
}
