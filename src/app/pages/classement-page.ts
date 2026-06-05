import { Component, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Entry {
  id: string; title: string; year: number;
  score: number; category: string; emoji: string; poster: string;
}

const T = 'https://image.tmdb.org/t/p/w300';

@Component({
  selector: 'app-classement-page',
  imports: [FormsModule],
  templateUrl: './classement-page.html',
  styleUrl: './classement-page.scss',
})
export class ClassementPage implements OnInit {
  private readonly STORAGE_KEY = 'portfolio-classement-v7';

  activeFilter = signal('Tout');
  showModal = signal(false);
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  filters = ['Tout', 'Marvel', 'DC', 'Anime', 'Séries'];
  categories = ['Marvel', 'DC', 'Anime', 'Séries'];

  entries = signal<Entry[]>([]);
  newEntry = { title: '', year: new Date().getFullYear(), score: 8, category: 'Anime', emoji: '🎬', poster: '' };

  private defaults: Entry[] = [
    { id: 'd1',  title: 'Avengers: Endgame',               year: 2019, score: 10,  category: 'Marvel', emoji: '🔥', poster: `${T}/or06FN3Dka5tukK1e9sl16pB3iy.jpg` },
    { id: 'd2',  title: 'Avengers: Infinity War',           year: 2018, score: 9.5, category: 'Marvel', emoji: '⚡', poster: `${T}/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg` },
    { id: 'd3',  title: 'Spider-Man: No Way Home',          year: 2021, score: 9,   category: 'Marvel', emoji: '🕷️', poster: `${T}/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg` },
    { id: 'd4',  title: 'Iron Man',                         year: 2008, score: 9,   category: 'Marvel', emoji: '🤖', poster: `${T}/kNKUCNLu1lZDGAHOBEHxR6psYHx.jpg` },
    { id: 'd5',  title: 'Thor: Ragnarok',                   year: 2017, score: 8.5, category: 'Marvel', emoji: '⚡', poster: `${T}/rzRwTcFvttcN1ZpX2xv4j3tSdJu.jpg` },
    { id: 'd6',  title: 'Avengers (2012)',                  year: 2012, score: 8.5, category: 'Marvel', emoji: '🛡️', poster: `${T}/ylsAO88v2tF0iXRFojPa0UaAJf1.jpg` },
    { id: 'd7',  title: 'Captain America: Civil War',       year: 2016, score: 8,   category: 'Marvel', emoji: '🇺🇸', poster: `${T}/i2nc9IAP1xRWoa3MgeR7ldsshkV.jpg` },
    { id: 'd8',  title: 'Guardians of the Galaxy',          year: 2014, score: 8,   category: 'Marvel', emoji: '🌌', poster: `${T}/9a6fGeSV5kffyNPPMWCPhLOhLdJ.jpg` },
    { id: 'd9',  title: 'The Dark Knight',                  year: 2008, score: 10,  category: 'DC',     emoji: '🦇', poster: `${T}/qJ2tW6WMUDux911r6m7haRef0WH.jpg` },
    { id: 'd10', title: 'Joker',                            year: 2019, score: 9.5, category: 'DC',     emoji: '🃏', poster: `${T}/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg` },
    { id: 'd11', title: 'The Batman',                       year: 2022, score: 9,   category: 'DC',     emoji: '🦇', poster: `${T}/74xTEgt7R36Fpooo50r9T25onhq.jpg` },
    { id: 'd12', title: 'Man of Steel',                     year: 2013, score: 8,   category: 'DC',     emoji: '🦸', poster: `${T}/sE71EBrRMfW0NKMHlXPO55Km88X.jpg` },
    { id: 'd13', title: 'Shazam!',                          year: 2019, score: 7.5, category: 'DC',     emoji: '⚡', poster: '' },
    { id: 'd14', title: 'Aquaman',                          year: 2018, score: 7,   category: 'DC',     emoji: '🌊', poster: `${T}/ghbBIweVDjTyx983GQmnCPGlE3U.jpg` },
    { id: 'd15', title: 'Batman v Superman',                year: 2016, score: 7,   category: 'DC',     emoji: '⚔️', poster: `${T}/krEWtXK2K7dg5RyMlx9f5WnI1xd.jpg` },
    { id: 'd16', title: 'Fullmetal Alchemist: Brotherhood', year: 2009, score: 10,  category: 'Anime',  emoji: '⚗️', poster: `${T}/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg` },
    { id: 'd17', title: 'Attack on Titan',                  year: 2013, score: 9.5, category: 'Anime',  emoji: '⚔️', poster: `${T}/cEnxvrGIGwLz7ZfCx3g8oULJxrr.jpg` },
    { id: 'd18', title: 'Death Note',                       year: 2006, score: 9.5, category: 'Anime',  emoji: '📓', poster: `${T}/tCZFfYTIwrR7n94J6G14Y4hAFU6.jpg` },
    { id: 'd19', title: 'Demon Slayer',                     year: 2019, score: 9,   category: 'Anime',  emoji: '🌊', poster: `${T}/4RuJf3ufe8DgQVycdyMZrJHGK1s.jpg` },
    { id: 'd20', title: 'Dragon Ball Z',                    year: 1989, score: 8.5, category: 'Anime',  emoji: '💥', poster: `${T}/qNmSRIUsnRsDgm6Lqmc9F9Ye7Jb.jpg` },
    { id: 'd21', title: 'Naruto',                           year: 2002, score: 8,   category: 'Anime',  emoji: '🍃', poster: `${T}/mLoI2Zto2JYUvSB8PpqvZIV7vWj.jpg` },
    { id: 'd22', title: 'My Hero Academia',                 year: 2016, score: 8,   category: 'Anime',  emoji: '🦸', poster: `${T}/phuYuzqWW9ru8EA3HVjE9W2Rr3M.jpg` },
    { id: 'd23', title: 'One Piece',                        year: 1999, score: 7.5, category: 'Anime',  emoji: '🏴‍☠️', poster: `${T}/l8wKSRdH0QPX8vvslKNbmrVBNk2.jpg` },
    { id: 'd24', title: 'Breaking Bad',                     year: 2008, score: 10,  category: 'Séries', emoji: '🧪', poster: `${T}/ggFHVNu6YYI5L9pCfOacjizRGt.jpg` },
    { id: 'd25', title: 'Arcane',                           year: 2021, score: 9.5, category: 'Séries', emoji: '✨', poster: `${T}/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg` },
    { id: 'd26', title: 'The Boys',                         year: 2019, score: 9,   category: 'Séries', emoji: '💪', poster: `${T}/stTEycfG9928HYGEISBFaG1ngjM.jpg` },
    { id: 'd27', title: 'Game of Thrones',                  year: 2011, score: 8.5, category: 'Séries', emoji: '🐉', poster: `${T}/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg` },
    { id: 'd28', title: 'Stranger Things',                  year: 2016, score: 8.5, category: 'Séries', emoji: '🔦', poster: `${T}/49WJfeN0moxb9IPfGn8AIqMGskD.jpg` },
    { id: 'd29', title: 'Prison Break',                     year: 2005, score: 8,   category: 'Séries', emoji: '🔓', poster: `${T}/bCFZhGJLYxmEac4viu6orDeOXYJ.jpg` },
    { id: 'd30', title: 'Squid Game',                       year: 2021, score: 8,   category: 'Séries', emoji: '🦑', poster: `${T}/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg` },
    { id: 'd31', title: 'The Witcher',                      year: 2019, score: 7.5, category: 'Séries', emoji: '🗡️', poster: `${T}/7vjaCdMw15FEbXyLQTVa04URsPm.jpg` },
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

  stats = computed(() => {
    const list = this.filtered();
    const avg = list.length ? (list.reduce((s, e) => s + e.score, 0) / list.length).toFixed(1) : '—';
    const s = list.filter(e => e.score >= 9.5).length;
    const a = list.filter(e => e.score >= 8.5 && e.score < 9.5).length;
    const b = list.filter(e => e.score >= 7 && e.score < 8.5).length;
    const c = list.filter(e => e.score < 7).length;
    return { total: list.length, avg, s, a, b, c };
  });

  catColor(cat: string): string {
    const map: Record<string, string> = { Marvel: '#e23636', DC: '#1a73e8', Anime: '#9b59b6', 'Séries': '#27ae60' };
    return map[cat] ?? 'var(--accent)';
  }

  setFilter(f: string) { this.activeFilter.set(f); }

  openAdd() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.resetForm();
    this.showModal.set(true);
  }

  openEdit(entry: Entry) {
    this.isEditing.set(true);
    this.editingId.set(entry.id);
    this.newEntry = { title: entry.title, year: entry.year, score: entry.score, category: entry.category, emoji: entry.emoji, poster: entry.poster };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.resetForm(); }

  submitForm() {
    if (!this.newEntry.title.trim()) return;
    if (this.isEditing()) {
      this.entries.update(list => list.map(e => e.id === this.editingId() ? { ...this.newEntry, id: e.id } : e));
    } else {
      this.entries.update(list => [...list, { ...this.newEntry, id: Date.now().toString() }]);
    }
    this.save();
    this.closeModal();
  }

  removeEntry(id: string) {
    this.entries.update(list => list.filter(e => e.id !== id));
    this.save();
  }

  resetAll() {
    if (confirm('Réinitialiser toutes les entrées ?')) { this.entries.set(this.defaults); this.save(); }
  }

  onImgError(e: Event) { (e.target as HTMLElement).style.display = 'none'; }

  private save() { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries())); }
  private resetForm() { this.newEntry = { title: '', year: new Date().getFullYear(), score: 8, category: 'Anime', emoji: '🎬', poster: '' }; }

  tierLabel(s: number) { if (s >= 9.5) return 'S'; if (s >= 8.5) return 'A'; if (s >= 7) return 'B'; return 'C'; }
  tierClass(s: number) { if (s >= 9.5) return 'tier-s'; if (s >= 8.5) return 'tier-a'; if (s >= 7) return 'tier-b'; return 'tier-c'; }
}
