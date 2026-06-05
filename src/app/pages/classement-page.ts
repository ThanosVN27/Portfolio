import { Component, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Entry {
  id: string; title: string; year: number;
  score: number; category: string; emoji: string;
}

@Component({
  selector: 'app-classement-page',
  imports: [FormsModule],
  templateUrl: './classement-page.html',
  styleUrl: './classement-page.scss',
})
export class ClassementPage implements OnInit {
  private readonly STORAGE_KEY = 'portfolio-classement-v1';

  activeFilter = signal('Tout');
  showModal = signal(false);
  filters = ['Tout', 'Marvel', 'James Bond', 'Anime', 'Séries'];
  categories = ['Marvel', 'James Bond', 'Anime', 'Séries'];

  entries = signal<Entry[]>([]);

  newEntry = { title: '', year: new Date().getFullYear(), score: 8, category: 'Anime', emoji: '🎬' };

  private defaults: Entry[] = [
    { id: 'd1',  title: 'Avengers: Endgame',               year: 2019, score: 10,  category: 'Marvel',     emoji: '🔥' },
    { id: 'd2',  title: 'Avengers: Infinity War',           year: 2018, score: 9.5, category: 'Marvel',     emoji: '⚡' },
    { id: 'd3',  title: 'Spider-Man: No Way Home',          year: 2021, score: 9,   category: 'Marvel',     emoji: '🕷️' },
    { id: 'd4',  title: 'Iron Man',                         year: 2008, score: 9,   category: 'Marvel',     emoji: '🤖' },
    { id: 'd5',  title: 'Thor: Ragnarok',                   year: 2017, score: 8.5, category: 'Marvel',     emoji: '⚡' },
    { id: 'd6',  title: 'Avengers (2012)',                  year: 2012, score: 8.5, category: 'Marvel',     emoji: '🛡️' },
    { id: 'd7',  title: 'Captain America: Civil War',       year: 2016, score: 8,   category: 'Marvel',     emoji: '🇺🇸' },
    { id: 'd8',  title: 'Guardians of the Galaxy',          year: 2014, score: 8,   category: 'Marvel',     emoji: '🌌' },
    { id: 'd9',  title: 'Casino Royale',                    year: 2006, score: 9.5, category: 'James Bond', emoji: '🃏' },
    { id: 'd10', title: 'Skyfall',                          year: 2012, score: 9,   category: 'James Bond', emoji: '🔫' },
    { id: 'd11', title: 'GoldenEye',                        year: 1995, score: 8.5, category: 'James Bond', emoji: '🏅' },
    { id: 'd12', title: 'No Time to Die',                   year: 2021, score: 8,   category: 'James Bond', emoji: '💣' },
    { id: 'd13', title: 'Goldfinger',                       year: 1964, score: 8,   category: 'James Bond', emoji: '🥇' },
    { id: 'd14', title: 'Spectre',                          year: 2015, score: 7,   category: 'James Bond', emoji: '🕵️' },
    { id: 'd15', title: 'Quantum of Solace',                year: 2008, score: 6,   category: 'James Bond', emoji: '😐' },
    { id: 'd16', title: 'Fullmetal Alchemist: Brotherhood', year: 2009, score: 10,  category: 'Anime',      emoji: '⚗️' },
    { id: 'd17', title: 'Attack on Titan',                  year: 2013, score: 9.5, category: 'Anime',      emoji: '⚔️' },
    { id: 'd18', title: 'Death Note',                       year: 2006, score: 9.5, category: 'Anime',      emoji: '📓' },
    { id: 'd19', title: 'Demon Slayer',                     year: 2019, score: 9,   category: 'Anime',      emoji: '🌊' },
    { id: 'd20', title: 'Dragon Ball Z',                    year: 1989, score: 8.5, category: 'Anime',      emoji: '💥' },
    { id: 'd21', title: 'Naruto',                           year: 2002, score: 8,   category: 'Anime',      emoji: '🍃' },
    { id: 'd22', title: 'My Hero Academia',                 year: 2016, score: 8,   category: 'Anime',      emoji: '🦸' },
    { id: 'd23', title: 'One Piece',                        year: 1999, score: 7.5, category: 'Anime',      emoji: '🏴‍☠️' },
    { id: 'd24', title: 'Breaking Bad',                     year: 2008, score: 10,  category: 'Séries',     emoji: '🧪' },
    { id: 'd25', title: 'Arcane',                           year: 2021, score: 9.5, category: 'Séries',     emoji: '✨' },
    { id: 'd26', title: 'The Boys',                         year: 2019, score: 9,   category: 'Séries',     emoji: '💪' },
    { id: 'd27', title: 'Game of Thrones',                  year: 2011, score: 8.5, category: 'Séries',     emoji: '🐉' },
    { id: 'd28', title: 'Stranger Things',                  year: 2016, score: 8.5, category: 'Séries',     emoji: '🔦' },
    { id: 'd29', title: 'Prison Break',                     year: 2005, score: 8,   category: 'Séries',     emoji: '🔓' },
    { id: 'd30', title: 'Squid Game',                       year: 2021, score: 8,   category: 'Séries',     emoji: '🦑' },
    { id: 'd31', title: 'The Witcher',                      year: 2019, score: 7.5, category: 'Séries',     emoji: '🗡️' },
  ];

  ngOnInit() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    this.entries.set(saved ? JSON.parse(saved) : this.defaults);
  }

  filtered = computed(() => {
    const f = this.activeFilter();
    const list = f === 'Tout' ? [...this.entries()] : this.entries().filter(e => e.category === f);
    return list.sort((a, b) => b.score - a.score);
  });

  setFilter(f: string) { this.activeFilter.set(f); }
  openModal() { this.showModal.set(true); }
  closeModal() { this.showModal.set(false); this.resetForm(); }

  addEntry() {
    if (!this.newEntry.title.trim()) return;
    this.entries.update(list => [...list, { ...this.newEntry, id: Date.now().toString() }]);
    this.save();
    this.closeModal();
  }

  removeEntry(id: string) {
    this.entries.update(list => list.filter(e => e.id !== id));
    this.save();
  }

  resetAll() {
    if (confirm('Réinitialiser toutes les entrées ?')) {
      this.entries.set(this.defaults);
      this.save();
    }
  }

  private save() { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries())); }
  private resetForm() { this.newEntry = { title: '', year: new Date().getFullYear(), score: 8, category: 'Anime', emoji: '🎬' }; }

  tierLabel(score: number) {
    if (score >= 9.5) return 'S'; if (score >= 8.5) return 'A'; if (score >= 7) return 'B'; return 'C';
  }
  tierClass(score: number) {
    if (score >= 9.5) return 'tier-s'; if (score >= 8.5) return 'tier-a'; if (score >= 7) return 'tier-b'; return 'tier-c';
  }
}
