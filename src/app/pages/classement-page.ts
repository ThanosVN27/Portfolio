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
  private readonly STORAGE_KEY = 'portfolio-classement-v3';

  activeFilter = signal('Tout');
  showModal = signal(false);
  filters = ['Tout', 'Marvel', 'DC', 'Anime', 'Séries'];
  categories = ['Marvel', 'DC', 'Anime', 'Séries'];

  entries = signal<Entry[]>([]);
  newEntry = { title: '', year: new Date().getFullYear(), score: 8, category: 'Anime', emoji: '🎬', poster: '' };

  private defaults: Entry[] = [
    // Marvel
    { id: 'd1',  title: 'Avengers: Endgame',               year: 2019, score: 10,  category: 'Marvel', emoji: '🔥', poster: `${T}/or06FN3Dka5tukK1e9sl16pB3iy.jpg` },
    { id: 'd2',  title: 'Avengers: Infinity War',           year: 2018, score: 9.5, category: 'Marvel', emoji: '⚡', poster: `${T}/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg` },
    { id: 'd3',  title: 'Spider-Man: No Way Home',          year: 2021, score: 9,   category: 'Marvel', emoji: '🕷️', poster: `${T}/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg` },
    { id: 'd4',  title: 'Iron Man',                         year: 2008, score: 9,   category: 'Marvel', emoji: '🤖', poster: `${T}/78lPtwv72eTNqFW9COBM8s6hD1L.jpg` },
    { id: 'd5',  title: 'Thor: Ragnarok',                   year: 2017, score: 8.5, category: 'Marvel', emoji: '⚡', poster: `${T}/rzRwTcFvttcN1ZpX2xv4j3tSdJu.jpg` },
    { id: 'd6',  title: 'Avengers (2012)',                  year: 2012, score: 8.5, category: 'Marvel', emoji: '🛡️', poster: `${T}/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg` },
    { id: 'd7',  title: 'Captain America: Civil War',       year: 2016, score: 8,   category: 'Marvel', emoji: '🇺🇸', poster: `${T}/m3wpALmBFEWq8VVBpuQXzLV4ZHZ.jpg` },
    { id: 'd8',  title: 'Guardians of the Galaxy',          year: 2014, score: 8,   category: 'Marvel', emoji: '🌌', poster: `${T}/r7vmZjiyZw9rpJMQJdXpjgivebgG.jpg` },
    // DC
    { id: 'd9',  title: 'The Dark Knight',                  year: 2008, score: 10,  category: 'DC',     emoji: '🦇', poster: `${T}/qJ2tW6WMUDux911r6m7haRef0WH.jpg` },
    { id: 'd10', title: 'Joker',                            year: 2019, score: 9.5, category: 'DC',     emoji: '🃏', poster: `${T}/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg` },
    { id: 'd11', title: 'The Batman',                       year: 2022, score: 9,   category: 'DC',     emoji: '🦇', poster: `${T}/74xTEgt7R36Fpooo50r9T25onhq.jpg` },
    { id: 'd12', title: 'Man of Steel',                     year: 2013, score: 8,   category: 'DC',     emoji: '🦸', poster: `${T}/4RgHEOzfsNLnxr5fLJzUEhxGPBt.jpg` },
    { id: 'd13', title: 'Shazam!',                          year: 2019, score: 7.5, category: 'DC',     emoji: '⚡', poster: `${T}/xnopMqPK3PH6YGkHMDIh3VnBg00.jpg` },
    { id: 'd14', title: 'Aquaman',                          year: 2018, score: 7,   category: 'DC',     emoji: '🌊', poster: `${T}/5Kg76ldv7VxeX9YlcQXiowHgdX6.jpg` },
    { id: 'd15', title: 'Batman v Superman',                year: 2016, score: 7,   category: 'DC',     emoji: '⚔️', poster: `${T}/5UsK3grJvtQrtzEgqNlDljJW96w.jpg` },
    // Anime
    { id: 'd16', title: 'Fullmetal Alchemist: Brotherhood', year: 2009, score: 10,  category: 'Anime',  emoji: '⚗️', poster: `${T}/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg` },
    { id: 'd17', title: 'Attack on Titan',                  year: 2013, score: 9.5, category: 'Anime',  emoji: '⚔️', poster: `${T}/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg` },
    { id: 'd18', title: 'Death Note',                       year: 2006, score: 9.5, category: 'Anime',  emoji: '📓', poster: `${T}/g3Gd6eGAHvNLIKHxbqQJnEiMEZW.jpg` },
    { id: 'd19', title: 'Demon Slayer',                     year: 2019, score: 9,   category: 'Anime',  emoji: '🌊', poster: `${T}/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg` },
    { id: 'd20', title: 'Dragon Ball Z',                    year: 1989, score: 8.5, category: 'Anime',  emoji: '💥', poster: `${T}/lS5bQUOFKIBhFOmm7hpXnIb7kMr.jpg` },
    { id: 'd21', title: 'Naruto',                           year: 2002, score: 8,   category: 'Anime',  emoji: '🍃', poster: `${T}/xppeysfvDKVx775MFuH8Z9Ex9BN.jpg` },
    { id: 'd22', title: 'My Hero Academia',                 year: 2016, score: 8,   category: 'Anime',  emoji: '🦸', poster: `${T}/mAJ84W6I8I272Da87qplS2Dp9ST.jpg` },
    { id: 'd23', title: 'One Piece',                        year: 1999, score: 7.5, category: 'Anime',  emoji: '🏴‍☠️', poster: `${T}/e3p2OQMMBBmDPcKNqUbQHR3LMTG.jpg` },
    // Séries
    { id: 'd24', title: 'Breaking Bad',                     year: 2008, score: 10,  category: 'Séries', emoji: '🧪', poster: `${T}/ggFHVNu6YYI5L9pCfOacjizRGt.jpg` },
    { id: 'd25', title: 'Arcane',                           year: 2021, score: 9.5, category: 'Séries', emoji: '✨', poster: `${T}/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg` },
    { id: 'd26', title: 'The Boys',                         year: 2019, score: 9,   category: 'Séries', emoji: '💪', poster: `${T}/stTEycfG9928HYGEISBFaG1ngjM.jpg` },
    { id: 'd27', title: 'Game of Thrones',                  year: 2011, score: 8.5, category: 'Séries', emoji: '🐉', poster: `${T}/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg` },
    { id: 'd28', title: 'Stranger Things',                  year: 2016, score: 8.5, category: 'Séries', emoji: '🔦', poster: `${T}/49WJfeN0moxb9IPfGn8AIqMGskD.jpg` },
    { id: 'd29', title: 'Prison Break',                     year: 2005, score: 8,   category: 'Séries', emoji: '🔓', poster: `${T}/o9P0bpzPsGPkWbqBgZELJqxFt8k.jpg` },
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
    if (confirm('Réinitialiser toutes les entrées ?')) { this.entries.set(this.defaults); this.save(); }
  }

  onImgError(e: Event) { (e.target as HTMLElement).style.display = 'none'; }

  private save() { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries())); }
  private resetForm() { this.newEntry = { title: '', year: new Date().getFullYear(), score: 8, category: 'Anime', emoji: '🎬', poster: '' }; }

  tierLabel(s: number) { if (s >= 9.5) return 'S'; if (s >= 8.5) return 'A'; if (s >= 7) return 'B'; return 'C'; }
  tierClass(s: number) { if (s >= 9.5) return 'tier-s'; if (s >= 8.5) return 'tier-a'; if (s >= 7) return 'tier-b'; return 'tier-c'; }
}
