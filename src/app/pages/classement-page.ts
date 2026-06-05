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
  private readonly STORAGE_KEY = 'portfolio-classement-v9';

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
    { id: 'd13', title: 'Shazam!',                          year: 2019, score: 7.5, category: 'DC',     emoji: '⚡', poster: `${T}/lhQbFsO6rFoUo3kv5X61G6koiR1.jpg` },
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
    // Marvel — Phase 1 (manquants)
    { id: 'd32', title: 'The Incredible Hulk',                          year: 2008, score: 7,   category: 'Marvel', emoji: '💚', poster: `${T}/gKzYx79y0AQTL4UAk1cBQJ3nvrm.jpg` },
    { id: 'd33', title: 'Iron Man 2',                                    year: 2010, score: 7.5, category: 'Marvel', emoji: '🤖', poster: `${T}/6WBeq4tVGHEPVfkdcE6XS8Lgj9L.jpg` },
    { id: 'd34', title: 'Thor',                                          year: 2011, score: 7.5, category: 'Marvel', emoji: '⚡', poster: `${T}/prSfAi1xGrhLQNxVSUFh61Dwd3O.jpg` },
    { id: 'd35', title: 'Captain America: The First Avenger',            year: 2011, score: 8,   category: 'Marvel', emoji: '🛡️', poster: `${T}/vSNxAJTerdIFJpvAFeitNQHWR0U.jpg` },
    // Marvel — Phase 2 (manquants)
    { id: 'd36', title: 'Iron Man 3',                                    year: 2013, score: 7,   category: 'Marvel', emoji: '🤖', poster: `${T}/qhPtAc1TKbMPqNvcdXSOn9Bn7hZ.jpg` },
    { id: 'd37', title: 'Thor: The Dark World',                          year: 2013, score: 6.5, category: 'Marvel', emoji: '⚡', poster: `${T}/ByDf0zjLSumz1MP3B0LMEJ8RDTG.jpg` },
    { id: 'd38', title: 'Captain America: The Winter Soldier',           year: 2014, score: 9,   category: 'Marvel', emoji: '🛡️', poster: `${T}/5TQ6YDmymBpnF005OyoB7ohZps9.jpg` },
    { id: 'd39', title: 'Avengers: Age of Ultron',                       year: 2015, score: 8,   category: 'Marvel', emoji: '🤖', poster: `${T}/4ssDuvEDkSArWEdyBl2X5EHvYKU.jpg` },
    { id: 'd40', title: 'Ant-Man',                                       year: 2015, score: 8,   category: 'Marvel', emoji: '🐜', poster: `${T}/AkJQpZp9WoNdj7pLYSj1L0RcMMN.jpg` },
    // Marvel — Phase 3 (manquants)
    { id: 'd41', title: 'Doctor Strange',                                year: 2016, score: 8.5, category: 'Marvel', emoji: '🔮', poster: `${T}/uGBVl3bFEA7td2nkQcduAbs4JLQ.jpg` },
    { id: 'd42', title: 'Guardians of the Galaxy Vol. 2',                year: 2017, score: 8,   category: 'Marvel', emoji: '🌌', poster: `${T}/y4MBh0EjBlMuOzv9axM4j4yRops.jpg` },
    { id: 'd43', title: 'Spider-Man: Homecoming',                        year: 2017, score: 8,   category: 'Marvel', emoji: '🕷️', poster: `${T}/c24sv2weTHPsmDa7jEMN0kPaKNe.jpg` },
    { id: 'd44', title: 'Black Panther',                                 year: 2018, score: 8.5, category: 'Marvel', emoji: '🐾', poster: `${T}/uxzzxijgPIY7slzFvMotPv8wjKA.jpg` },
    { id: 'd45', title: 'Ant-Man and the Wasp',                          year: 2018, score: 7.5, category: 'Marvel', emoji: '🐜', poster: `${T}/syFHy6UW3r13tB8vhPtG2OJeT3Y.jpg` },
    { id: 'd46', title: 'Captain Marvel',                                year: 2019, score: 7,   category: 'Marvel', emoji: '⭐', poster: `${T}/AtsgWhDnHTq68L0lLsUrCnM7TjG.jpg` },
    { id: 'd47', title: 'Spider-Man: Far From Home',                     year: 2019, score: 7.5, category: 'Marvel', emoji: '🕷️', poster: `${T}/lcq8dVxeeOqHvvgcte707K0KjA3.jpg` },
    // Marvel — Phase 4 (manquants)
    { id: 'd48', title: 'Black Widow',                                   year: 2021, score: 7.5, category: 'Marvel', emoji: '🕷️', poster: `${T}/qAZ0pzat24kLdO3tRB8Bm0VxRDd.jpg` },
    { id: 'd49', title: 'Shang-Chi and the Legend of the Ten Rings',     year: 2021, score: 8,   category: 'Marvel', emoji: '🥊', poster: `${T}/1BIoJGKbXjdFDAqUEiA2VHqkK1Z.jpg` },
    { id: 'd50', title: 'Eternals',                                      year: 2021, score: 7,   category: 'Marvel', emoji: '✨', poster: `${T}/6TPZSJ06OEXeelx1U1VIAt0j9Ry.jpg` },
    { id: 'd51', title: 'Doctor Strange in the Multiverse of Madness',   year: 2022, score: 7.5, category: 'Marvel', emoji: '🔮', poster: `${T}/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg` },
    { id: 'd52', title: 'Thor: Love and Thunder',                        year: 2022, score: 6.5, category: 'Marvel', emoji: '⚡', poster: `${T}/pIkRyD18kl4FhoCNQuWxWu5cBLM.jpg` },
    { id: 'd53', title: 'Black Panther: Wakanda Forever',                year: 2022, score: 7.5, category: 'Marvel', emoji: '🐾', poster: `${T}/sv1xJUazXoQuIDTqnKPWJPMSj8M.jpg` },
    // Marvel — Phase 5 (manquants)
    { id: 'd54', title: 'Ant-Man and the Wasp: Quantumania',             year: 2023, score: 6,   category: 'Marvel', emoji: '🐜', poster: `${T}/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg` },
    { id: 'd55', title: 'Guardians of the Galaxy Vol. 3',                year: 2023, score: 9,   category: 'Marvel', emoji: '🌌', poster: `${T}/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg` },
    { id: 'd56', title: 'The Marvels',                                   year: 2023, score: 6.5, category: 'Marvel', emoji: '⭐', poster: `${T}/Ag3D9qXjhJ2FUkrlJ0Cv1pgxqYQ.jpg` },
    { id: 'd57', title: 'Deadpool & Wolverine',                          year: 2024, score: 8.5, category: 'Marvel', emoji: '💥', poster: `${T}/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg` },
    // Marvel — Phase 6
    { id: 'd58', title: 'Captain America: Brave New World',              year: 2025, score: 7,   category: 'Marvel', emoji: '🛡️', poster: `${T}/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg` },
    { id: 'd59', title: 'Thunderbolts*',                                 year: 2025, score: 7.5, category: 'Marvel', emoji: '⚡', poster: `${T}/m7pl7JGeBH8VKflOEAj1KcD0Rsh.jpg` },
    // Anime — nouveaux
    { id: 'd60', title: 'Solo Leveling',                                 year: 2024, score: 9.5, category: 'Anime',  emoji: '⚔️', poster: `${T}/oMBIEMPzFNimaSMJHFbJWJw8sSo.jpg` },
    { id: 'd61', title: 'Solo Leveling: Arise from the Shadow',          year: 2025, score: 9,   category: 'Anime',  emoji: '⚔️', poster: `` },
    { id: 'd62', title: 'Pokémon',                                       year: 1997, score: 8.5, category: 'Anime',  emoji: '⚡', poster: `${T}/rDsAECsEeNJBovmm17VBW6jKLnU.jpg` },
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
