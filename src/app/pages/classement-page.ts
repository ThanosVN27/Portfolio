import { Component, signal, computed, OnInit, AfterViewInit, OnDestroy, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ClassementService, Entry } from '../services/classement.service';
import { TmdbService, UpcomingMovie } from '../services/tmdb.service';
import * as THREE from 'three';

const T = 'https://image.tmdb.org/t/p/w300';

@Component({
  selector: 'app-classement-page',
  imports: [FormsModule],
  templateUrl: './classement-page.html',
  styleUrl: './classement-page.scss',
})
export class ClassementPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('filmCanvas') filmRef!: ElementRef<HTMLCanvasElement>;
  private filmRenderer?: THREE.WebGLRenderer;
  private filmAnimId!: number;
  private readonly STORAGE_KEY = 'portfolio-classement-v18';
  private svc = inject(ClassementService);
  private tmdb = inject(TmdbService);
  private sanitizer = inject(DomSanitizer);

  // ── Sorties ciné à venir (flux TMDB, auto-refresh) ──
  upcoming    = signal<UpcomingMovie[]>([]);
  upLoading   = signal(false);
  upError     = signal(false);
  private upcomingTimer?: ReturnType<typeof setInterval>;
  private readonly REFRESH_MS = 60 * 60 * 1000; // rafraîchit toutes les heures

  // ── Modale bande-annonce ──
  showTrailer    = signal(false);
  trailerTitle   = signal('');
  trailerLoading = signal(false);
  trailerError   = signal(false);
  private trailerKey = signal<string | null>(null);
  trailerEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const k = this.trailerKey();
    return k
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${k}?autoplay=1&rel=0`)
      : null;
  });

  activeFilter = signal('Tout');
  searchQuery  = signal('');
  showModal    = signal(false);
  isEditing    = signal(false);
  editingId    = signal<string | null>(null);

  adminMode    = signal(false);
  showPinModal = signal(false);
  pinInput     = '';
  pinError     = false;
  syncing      = signal(false);
  syncOk       = signal(false);

  filters    = ['Tout', 'Marvel', 'DC', 'Star Wars', 'Anime', 'Séries', 'Films'];
  categories = ['Marvel', 'DC', 'Star Wars', 'Anime', 'Séries', 'Films'];

  entries  = signal<Entry[]>([]);
  newEntry = { title: '', year: new Date().getFullYear(), score: 8, category: 'Films', emoji: '🎬', poster: '' };

  private defaults: Entry[] = [
    // ── Marvel Classics ──────────────────────────────────────────────────────
    { id: 'd1',   title: 'Avengers: Endgame',                              year: 2019, score: 10,  category: 'Marvel',    emoji: '🔥', poster: `${T}/or06FN3Dka5tukK1e9sl16pB3iy.jpg` },
    { id: 'd2',   title: 'Avengers: Infinity War',                         year: 2018, score: 9.5, category: 'Marvel',    emoji: '⚡', poster: `${T}/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg` },
    { id: 'd3',   title: 'Spider-Man: No Way Home',                        year: 2021, score: 9,   category: 'Marvel',    emoji: '🕷️', poster: `${T}/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg` },
    { id: 'd4',   title: 'Iron Man',                                        year: 2008, score: 9,   category: 'Marvel',    emoji: '🤖', poster: `${T}/kNKUCNLu1lZDGAHOBEHxR6psYHx.jpg` },
    { id: 'd5',   title: 'Thor: Ragnarok',                                  year: 2017, score: 8.5, category: 'Marvel',    emoji: '⚡', poster: `${T}/rzRwTcFvttcN1ZpX2xv4j3tSdJu.jpg` },
    { id: 'd6',   title: 'Avengers (2012)',                                 year: 2012, score: 8.5, category: 'Marvel',    emoji: '🛡️', poster: `${T}/ylsAO88v2tF0iXRFojPa0UaAJf1.jpg` },
    { id: 'd7',   title: 'Captain America: Civil War',                      year: 2016, score: 8,   category: 'Marvel',    emoji: '🇺🇸', poster: `${T}/i2nc9IAP1xRWoa3MgeR7ldsshkV.jpg` },
    { id: 'd8',   title: 'Guardians of the Galaxy',                         year: 2014, score: 8,   category: 'Marvel',    emoji: '🌌', poster: `${T}/9a6fGeSV5kffyNPPMWCPhLOhLdJ.jpg` },
    // ── DC Classics ───────────────────────────────────────────────────────────
    { id: 'd9',   title: 'The Dark Knight',                                 year: 2008, score: 10,  category: 'DC',        emoji: '🦇', poster: `${T}/qJ2tW6WMUDux911r6m7haRef0WH.jpg` },
    { id: 'd10',  title: 'Joker',                                           year: 2019, score: 9.5, category: 'DC',        emoji: '🃏', poster: `${T}/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg` },
    { id: 'd11',  title: 'The Batman',                                      year: 2022, score: 9,   category: 'DC',        emoji: '🦇', poster: `${T}/74xTEgt7R36Fpooo50r9T25onhq.jpg` },
    { id: 'd12',  title: 'Man of Steel',                                    year: 2013, score: 8,   category: 'DC',        emoji: '🦸', poster: `${T}/cB46TSg3kGjq2eVy5kVUhlpUa1H.jpg` },
    { id: 'd13',  title: 'Shazam!',                                         year: 2019, score: 7.5, category: 'DC',        emoji: '⚡', poster: `${T}/lhQbFsO6rFoUo3kv5X61G6koiR1.jpg` },
    { id: 'd14',  title: 'Aquaman',                                         year: 2018, score: 7,   category: 'DC',        emoji: '🌊', poster: `${T}/ghbBIweVDjTyx983GQmnCPGlE3U.jpg` },
    { id: 'd15',  title: 'Batman v Superman',                               year: 2016, score: 7,   category: 'DC',        emoji: '⚔️', poster: `${T}/krEWtXK2K7dg5RyMlx9f5WnI1xd.jpg` },
    // ── Anime ─────────────────────────────────────────────────────────────────
    { id: 'd16',  title: 'Fullmetal Alchemist: Brotherhood',                year: 2009, score: 10,  category: 'Anime',     emoji: '⚗️', poster: `${T}/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg` },
    { id: 'd17',  title: 'Attack on Titan (S1)',                             year: 2013, score: 9.5, category: 'Anime',     emoji: '⚔️', poster: `${T}/3Npd9yTdy76kHzoFpL0SOIxE6Uv.jpg` },
    { id: 'd18',  title: 'Death Note',                                      year: 2006, score: 9.5, category: 'Anime',     emoji: '📓', poster: `${T}/tCZFfYTIwrR7n94J6G14Y4hAFU6.jpg` },
    { id: 'd19',  title: 'Demon Slayer (S1)',                                year: 2019, score: 9,   category: 'Anime',     emoji: '🌊', poster: `${T}/bV0ZCL0IqrTQKClu6EtXlZaJevD.jpg` },
    { id: 'd20',  title: 'Dragon Ball Z',                                   year: 1989, score: 8.5, category: 'Anime',     emoji: '💥', poster: `${T}/qNmSRIUsnRsDgm6Lqmc9F9Ye7Jb.jpg` },
    { id: 'd21',  title: 'Naruto',                                          year: 2002, score: 8,   category: 'Anime',     emoji: '🍃', poster: `${T}/xppeysfvDKVx775MFuH8Z9BlpMk.jpg` },
    { id: 'd22',  title: 'My Hero Academia (S1)',                            year: 2016, score: 8,   category: 'Anime',     emoji: '🦸', poster: `${T}/1u4HqgEKOmjXM8ENGtlrF4yXIwp.jpg` },
    { id: 'd23',  title: 'One Piece',                                       year: 1999, score: 7.5, category: 'Anime',     emoji: '🏴‍☠️', poster: `${T}/l8wKSRdH0QPX8vvslKNbmrVBNk2.jpg` },
    // ── Séries ────────────────────────────────────────────────────────────────
    { id: 'd24',  title: 'Breaking Bad',                                    year: 2008, score: 10,  category: 'Séries',    emoji: '🧪', poster: `${T}/ggFHVNu6YYI5L9pCfOacjizRGt.jpg` },
    { id: 'd25',  title: 'Arcane',                                          year: 2021, score: 9.5, category: 'Séries',    emoji: '✨', poster: `${T}/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg` },
    { id: 'd26',  title: 'The Boys',                                        year: 2019, score: 9,   category: 'Séries',    emoji: '💪', poster: `${T}/stTEycfG9928HYGEISBFaG1ngjM.jpg` },
    { id: 'd27',  title: 'Game of Thrones',                                 year: 2011, score: 8.5, category: 'Séries',    emoji: '🐉', poster: `${T}/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg` },
    { id: 'd28',  title: 'Stranger Things',                                 year: 2016, score: 8.5, category: 'Séries',    emoji: '🔦', poster: `${T}/49WJfeN0moxb9IPfGn8AIqMGskD.jpg` },
    { id: 'd29',  title: 'Prison Break',                                    year: 2005, score: 8,   category: 'Séries',    emoji: '🔓', poster: `${T}/bCFZhGJLYxmEac4viu6orDeOXYJ.jpg` },
    { id: 'd30',  title: 'Squid Game',                                      year: 2021, score: 8,   category: 'Séries',    emoji: '🦑', poster: `${T}/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg` },
    { id: 'd31',  title: 'The Witcher',                                     year: 2019, score: 7.5, category: 'Séries',    emoji: '🗡️', poster: `${T}/7vjaCdMw15FEbXyLQTVa04URsPm.jpg` },
    // ── Marvel Phase 1 ────────────────────────────────────────────────────────
    { id: 'd32',  title: 'The Incredible Hulk',                             year: 2008, score: 7,   category: 'Marvel',    emoji: '💚', poster: `${T}/gKzYx79y0AQTL4UAk1cBQJ3nvrm.jpg` },
    { id: 'd33',  title: 'Iron Man 2',                                      year: 2010, score: 7.5, category: 'Marvel',    emoji: '🤖', poster: `${T}/6WBeq4fCfn7AN0o21W9qNcRF2l9.jpg` },
    { id: 'd34',  title: 'Thor',                                            year: 2011, score: 7.5, category: 'Marvel',    emoji: '⚡', poster: `${T}/prSfAi1xGrhLQNxVSUFh61xQ4Qy.jpg` },
    { id: 'd35',  title: 'Captain America: The First Avenger',              year: 2011, score: 8,   category: 'Marvel',    emoji: '🛡️', poster: `${T}/vSNxAJTlD0r02V9sPYpOjqDZXUK.jpg` },
    // ── Marvel Phase 2 ────────────────────────────────────────────────────────
    { id: 'd36',  title: 'Iron Man 3',                                      year: 2013, score: 7,   category: 'Marvel',    emoji: '🤖', poster: `${T}/qhPtAc1TKbMPqNvcdXSOn9Bn7hZ.jpg` },
    { id: 'd37',  title: 'Thor: The Dark World',                            year: 2013, score: 6.5, category: 'Marvel',    emoji: '⚡', poster: `${T}/wp6OxE4poJ4G7c0U2ZIXasTSMR7.jpg` },
    { id: 'd38',  title: 'Captain America: The Winter Soldier',             year: 2014, score: 9,   category: 'Marvel',    emoji: '🛡️', poster: `${T}/tVFRpFw3xTedgPGqxW0AOI8Qhh0.jpg` },
    { id: 'd39',  title: 'Avengers: Age of Ultron',                         year: 2015, score: 8,   category: 'Marvel',    emoji: '🤖', poster: `${T}/4ssDuvEDkSArWEdyBl2X5EHvYKU.jpg` },
    { id: 'd40',  title: 'Ant-Man',                                         year: 2015, score: 8,   category: 'Marvel',    emoji: '🐜', poster: `${T}/rQRnQfUl3kfp78nCWq8Ks04vnq1.jpg` },
    // ── Marvel Phase 3 ────────────────────────────────────────────────────────
    { id: 'd41',  title: 'Doctor Strange',                                  year: 2016, score: 8.5, category: 'Marvel',    emoji: '🔮', poster: `${T}/xf8PbyQcR5ucXErmZNzdKR0s8ya.jpg` },
    { id: 'd42',  title: 'Guardians of the Galaxy Vol. 2',                  year: 2017, score: 8,   category: 'Marvel',    emoji: '🌌', poster: `${T}/y4MBh0EjBlMuOzv9axM4qJlmhzz.jpg` },
    { id: 'd43',  title: 'Spider-Man: Homecoming',                          year: 2017, score: 8,   category: 'Marvel',    emoji: '🕷️', poster: `${T}/c24sv2weTHPsmDa7jEMN0m2P3RT.jpg` },
    { id: 'd44',  title: 'Black Panther',                                   year: 2018, score: 8.5, category: 'Marvel',    emoji: '🐾', poster: `${T}/uxzzxijgPIY7slzFvMotPv8wjKA.jpg` },
    { id: 'd45',  title: 'Ant-Man and the Wasp',                            year: 2018, score: 7.5, category: 'Marvel',    emoji: '🐜', poster: `${T}/cFQEO687n1K6umXbInzocxcnAQz.jpg` },
    { id: 'd46',  title: 'Captain Marvel',                                  year: 2019, score: 7,   category: 'Marvel',    emoji: '⭐', poster: `${T}/AtsgWhDnHTq68L0lLsUrCnM7TjG.jpg` },
    { id: 'd47',  title: 'Spider-Man: Far From Home',                       year: 2019, score: 7.5, category: 'Marvel',    emoji: '🕷️', poster: `${T}/4q2NNj4S5dG2RLF9CpXsej7yXl.jpg` },
    // ── Marvel Phase 4 ────────────────────────────────────────────────────────
    { id: 'd48',  title: 'Black Widow',                                     year: 2021, score: 7.5, category: 'Marvel',    emoji: '🕷️', poster: `${T}/qAZ0pzat24kLdO3o8ejmbLxyOac.jpg` },
    { id: 'd49',  title: 'Shang-Chi and the Legend of the Ten Rings',       year: 2021, score: 8,   category: 'Marvel',    emoji: '🥊', poster: `${T}/9f2Q0U3IOsLgrI2HkvldwSABZy5.jpg` },
    { id: 'd50',  title: 'Eternals',                                        year: 2021, score: 7,   category: 'Marvel',    emoji: '✨', poster: `${T}/lFByFSLV5WDJEv3KabbdAF959F2.jpg` },
    { id: 'd51',  title: 'Doctor Strange in the Multiverse of Madness',     year: 2022, score: 7.5, category: 'Marvel',    emoji: '🔮', poster: `${T}/ddJcSKbcp4rKZTmuyWaMhuwcfMz.jpg` },
    { id: 'd52',  title: 'Thor: Love and Thunder',                          year: 2022, score: 6.5, category: 'Marvel',    emoji: '⚡', poster: `${T}/pIkRyD18kl4FhoCNQuWxWu5cBLM.jpg` },
    { id: 'd53',  title: 'Black Panther: Wakanda Forever',                  year: 2022, score: 7.5, category: 'Marvel',    emoji: '🐾', poster: `${T}/sv1xJUazXeYqALzczSZ3O6nkH75.jpg` },
    // ── Marvel Phase 5 ────────────────────────────────────────────────────────
    { id: 'd54',  title: 'Ant-Man and the Wasp: Quantumania',               year: 2023, score: 6,   category: 'Marvel',    emoji: '🐜', poster: `${T}/qnqGbB22YJ7dSs4o6M7exTpNxPz.jpg` },
    { id: 'd55',  title: 'Guardians of the Galaxy Vol. 3',                  year: 2023, score: 9,   category: 'Marvel',    emoji: '🌌', poster: `${T}/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg` },
    { id: 'd56',  title: 'The Marvels',                                     year: 2023, score: 6.5, category: 'Marvel',    emoji: '⭐', poster: `${T}/9GBhzXMFjgcZ3FdR9w3bUMMTps5.jpg` },
    { id: 'd57',  title: 'Deadpool & Wolverine',                            year: 2024, score: 8.5, category: 'Marvel',    emoji: '💥', poster: `${T}/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg` },
    // ── Marvel Phase 6 ────────────────────────────────────────────────────────
    { id: 'd58',  title: 'Captain America: Brave New World',                year: 2025, score: 7,   category: 'Marvel',    emoji: '🛡️', poster: `${T}/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg` },
    { id: 'd59',  title: 'Thunderbolts*',                                   year: 2025, score: 7.5, category: 'Marvel',    emoji: '⚡', poster: `${T}/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg` },
    // ── Anime nouveaux ────────────────────────────────────────────────────────
    { id: 'd60',  title: 'Solo Leveling',                                   year: 2024, score: 9.5, category: 'Anime',     emoji: '⚔️', poster: `${T}/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg` },
    { id: 'd61',  title: 'Solo Leveling: Arise from the Shadow',            year: 2025, score: 9,   category: 'Anime',     emoji: '⚔️', poster: `${T}/a7i9OdTUo9jZ1XoraCRIQNJ6ACX.jpg` },
    { id: 'd62',  title: 'Pokémon',                                         year: 1997, score: 8.5, category: 'Anime',     emoji: '⚡', poster: `${T}/lP4zwr0F7hWTbAFltfoFTc2AxRG.jpg` },
    // ── Star Wars ─────────────────────────────────────────────────────────────
    { id: 'd63',  title: 'Star Wars: A New Hope',                           year: 1977, score: 9.5, category: 'Star Wars', emoji: '⭐', poster: `${T}/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg` },
    { id: 'd64',  title: 'The Empire Strikes Back',                         year: 1980, score: 10,  category: 'Star Wars', emoji: '🌌', poster: `${T}/nNAeTmF4CtdSgMDplXTDPOpYzsX.jpg` },
    { id: 'd65',  title: 'Return of the Jedi',                              year: 1983, score: 9,   category: 'Star Wars', emoji: '⭐', poster: `${T}/jQYlydvHm3kUix1f8prMucrplhm.jpg` },
    { id: 'd66',  title: 'The Phantom Menace',                              year: 1999, score: 7,   category: 'Star Wars', emoji: '⚡', poster: `${T}/6wkfovpn7Eq8dYNKaG5PY3q2oq6.jpg` },
    { id: 'd67',  title: 'Attack of the Clones',                            year: 2002, score: 6.5, category: 'Star Wars', emoji: '⚡', poster: `${T}/oZNPzxqM2s5DyVWab09NTQScDQt.jpg` },
    { id: 'd68',  title: 'Revenge of the Sith',                             year: 2005, score: 8.5, category: 'Star Wars', emoji: '🔥', poster: `${T}/xfSAoBEm9MNBjmlNcDYLvLSMlnq.jpg` },
    { id: 'd69',  title: 'The Force Awakens',                               year: 2015, score: 8.5, category: 'Star Wars', emoji: '⭐', poster: `${T}/wqnLdwVXoBjKibFRR5U3y0aDUhs.jpg` },
    { id: 'd70',  title: 'The Last Jedi',                                   year: 2017, score: 7,   category: 'Star Wars', emoji: '⭐', poster: `${T}/ySaaKHOLAQU5HoZqWmzDIj1VvZ1.jpg` },
    { id: 'd71',  title: 'The Rise of Skywalker',                           year: 2019, score: 7,   category: 'Star Wars', emoji: '⭐', poster: `${T}/db32LaOibwEliAmSL2jjDF6oDdj.jpg` },
    { id: 'd72',  title: 'Rogue One: A Star Wars Story',                    year: 2016, score: 9,   category: 'Star Wars', emoji: '🔫', poster: `${T}/i0yw1mFbB7sNGHCs7EXZPzFkdA1.jpg` },
    { id: 'd73',  title: 'Solo: A Star Wars Story',                         year: 2018, score: 7.5, category: 'Star Wars', emoji: '🚀', poster: `${T}/4oD6VEccFkorEBTEDXtpLAaz0Rl.jpg` },
    // ── DC supplémentaires ────────────────────────────────────────────────────
    { id: 'd74',  title: 'Wonder Woman',                                    year: 2017, score: 8,   category: 'DC',        emoji: '👑', poster: `${T}/v4ncgZjG2Zu8ZW5al1vIZTsSjqX.jpg` },
    { id: 'd75',  title: 'Wonder Woman 1984',                               year: 2020, score: 6,   category: 'DC',        emoji: '👑', poster: `${T}/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg` },
    { id: 'd76',  title: 'Suicide Squad',                                   year: 2016, score: 6.5, category: 'DC',        emoji: '💀', poster: `${T}/sk3FZgh3sRrmr8vyhaitNobMcfh.jpg` },
    { id: 'd77',  title: 'The Suicide Squad',                               year: 2021, score: 7.5, category: 'DC',        emoji: '💀', poster: `${T}/q61qEyssk2ku3okWICKArlAdhBn.jpg` },
    { id: 'd78',  title: 'Birds of Prey',                                   year: 2020, score: 7,   category: 'DC',        emoji: '🦅', poster: `${T}/h4VB6m0RwcicVEZvzftYZyKXs6K.jpg` },
    { id: 'd79',  title: 'Justice League',                                  year: 2017, score: 7,   category: 'DC',        emoji: '⚡', poster: `${T}/eifGNCSDuxJeS1loAXil5bIGgvC.jpg` },
    { id: 'd80',  title: "Zack Snyder's Justice League",                    year: 2021, score: 8,   category: 'DC',        emoji: '⚡', poster: `${T}/tnAuB8q5vv7Ax9UAEje5Xi4BXik.jpg` },
    { id: 'd81',  title: 'Black Adam',                                      year: 2022, score: 6.5, category: 'DC',        emoji: '⚡', poster: `${T}/rCtreCr4xiYEWDQTebybolIh6Xe.jpg` },
    { id: 'd82',  title: 'The Flash',                                       year: 2023, score: 6.5, category: 'DC',        emoji: '⚡', poster: `${T}/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg` },
    { id: 'd83',  title: 'Blue Beetle',                                     year: 2023, score: 7,   category: 'DC',        emoji: '🐛', poster: `${T}/mXLOHHc1Zeuwsl4xYKjKh2280oL.jpg` },
    { id: 'd84',  title: 'Joker: Folie à Deux',                             year: 2024, score: 6,   category: 'DC',        emoji: '🃏', poster: `${T}/aciP8Km0waTLXEYf5ybFK5CSUxl.jpg` },
    // ── Lord of the Rings ─────────────────────────────────────────────────────
    { id: 'd85',  title: 'The Fellowship of the Ring',                      year: 2001, score: 9.5, category: 'Films',     emoji: '💍', poster: `${T}/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg` },
    { id: 'd86',  title: 'The Two Towers',                                  year: 2002, score: 9.5, category: 'Films',     emoji: '⚔️', poster: `${T}/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg` },
    { id: 'd87',  title: 'The Return of the King',                          year: 2003, score: 10,  category: 'Films',     emoji: '👑', poster: `${T}/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg` },
    // ── Interstellar ──────────────────────────────────────────────────────────
    { id: 'd88',  title: 'Interstellar',                                    year: 2014, score: 9.5, category: 'Films',     emoji: '🚀', poster: `${T}/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg` },
    // ── House of the Dragon ───────────────────────────────────────────────────
    { id: 'd89',  title: 'House of the Dragon',                             year: 2022, score: 8.5, category: 'Séries',    emoji: '🐉', poster: `${T}/7V0Ebks0GgpKvQ7QbLAIdX5dos4.jpg` },
    // ── Fast & Furious ────────────────────────────────────────────────────────
    { id: 'd90',  title: 'The Fast and the Furious',                        year: 2001, score: 8,   category: 'Films',     emoji: '🚗', poster: `${T}/gqY0ITBgT7A82poL9jv851qdnIb.jpg` },
    { id: 'd91',  title: '2 Fast 2 Furious',                                year: 2003, score: 7,   category: 'Films',     emoji: '🚗', poster: `${T}/6nDZExrDKIXvSAghsFKVFRVJuSf.jpg` },
    { id: 'd92',  title: 'The Fast and the Furious: Tokyo Drift',           year: 2006, score: 7,   category: 'Films',     emoji: '🚗', poster: `${T}/46xqGOwHbh2TH2avWSw3SMXph4E.jpg` },
    { id: 'd93',  title: 'Fast & Furious',                                  year: 2009, score: 7.5, category: 'Films',     emoji: '🚗', poster: `${T}/lUtVoRukW7WNtUySwd8hWlByBds.jpg` },
    { id: 'd94',  title: 'Fast Five',                                       year: 2011, score: 8.5, category: 'Films',     emoji: '💨', poster: `${T}/vDztZS30sheoqnJnKyO4QMnf3f8.jpg` },
    { id: 'd95',  title: 'Fast & Furious 6',                                year: 2013, score: 7.5, category: 'Films',     emoji: '🚗', poster: `${T}/3EXOOkhSmJQ9DisNmIjZ8Xi633I.jpg` },
    { id: 'd96',  title: 'Furious 7',                                       year: 2015, score: 8,   category: 'Films',     emoji: '🚗', poster: `${T}/ktofZ9Htrjiy0P6LEowsDaxd3Ri.jpg` },
    { id: 'd97',  title: 'The Fate of the Furious',                         year: 2017, score: 7,   category: 'Films',     emoji: '🚗', poster: `${T}/dImWM7GJqryWJO9LHa3XQ8DD5NH.jpg` },
    { id: 'd98',  title: 'Hobbs & Shaw',                                    year: 2019, score: 7,   category: 'Films',     emoji: '🚗', poster: `${T}/qRyy2UmjC5ur9bDi3kpNNRCc5nc.jpg` },
    { id: 'd99',  title: 'F9',                                              year: 2021, score: 6.5, category: 'Films',     emoji: '🚗', poster: `${T}/deEmLILTPejEb6OGsXRJ5MCvyDW.jpg` },
    { id: 'd100', title: 'Fast X',                                          year: 2023, score: 7,   category: 'Films',     emoji: '🚗', poster: `${T}/fiVW06jE7z9YnO4trhaMEdclSiC.jpg` },
    // ── Avatar ────────────────────────────────────────────────────────────────
    { id: 'd101', title: 'Avatar',                                          year: 2009, score: 8.5, category: 'Films',     emoji: '🌿', poster: `${T}/gKY6q7SjCkAU6FqvqWybDYgUKIF.jpg` },
    { id: 'd102', title: 'Avatar: The Way of Water',                        year: 2022, score: 8,   category: 'Films',     emoji: '🌊', poster: `${T}/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg` },
    { id: 'd103', title: 'Avatar: Fire and Ash',                            year: 2024, score: 8,   category: 'Films',     emoji: '🔥', poster: `${T}/aabwWZWx6z1aYP4PX2ADvbDKktd.jpg` },
    // ── Anime supplémentaires ────────────────────────────────────────────────
    { id: 'd106', title: 'Hunter x Hunter',                                 year: 2011, score: 9.5, category: 'Anime',     emoji: '🎯', poster: `${T}/i2EEr2uBvRlAwJ8d8zTG2Y19mIa.jpg` },
    { id: 'd107', title: 'Fairy Tail (S1)',                                  year: 2009, score: 8.5, category: 'Anime',     emoji: '✨', poster: `${T}/zo3BM6NB19sLfZ5INYa0TO9Tu4G.jpg` },
    { id: 'd108', title: 'One Punch Man (S1)',                               year: 2015, score: 9,   category: 'Anime',     emoji: '👊', poster: `${T}/gJVaexo0CToX08AW9prtJJtVgHJ.jpg` },
    { id: 'd109', title: 'Frieren: Beyond Journey\'s End',                  year: 2023, score: 9.5, category: 'Anime',     emoji: '🧝', poster: `${T}/dqZENchTd7lp5zht7BdlqM7RBhD.jpg` },
    { id: 'd110', title: 'JoJo\'s Bizarre Adventure: Phantom Blood',         year: 2012, score: 9,   category: 'Anime',     emoji: '💪', poster: `${T}/co0K9FS9rQPxPoKADs4nuGckk3A.jpg` },
    { id: 'd111', title: 'Jujutsu Kaisen (S1)',                              year: 2020, score: 9,   category: 'Anime',     emoji: '🔮', poster: `${T}/fHQ2XHRdRix0rkDCShmGQ8c6d03.jpg` },
    { id: 'd112', title: 'That Time I Got Reincarnated as a Slime',         year: 2018, score: 8.5, category: 'Anime',     emoji: '🫧', poster: `${T}/pzujcdPAoH361NObVrtbA7zACE7.jpg` },
    { id: 'd113', title: 'Mushoku Tensei: Jobless Reincarnation',           year: 2021, score: 8.5, category: 'Anime',     emoji: '📖', poster: `${T}/gLKOYIMyKlUHW0SVdskhgf9C0yy.jpg` },
    { id: 'd114', title: 'Inazuma Eleven',                                  year: 2008, score: 8,   category: 'Anime',     emoji: '⚽', poster: `${T}/9kQWvBMPWz1gykKLXuX6JBjC9uQ.jpg` },
    // ── Dune ─────────────────────────────────────────────────────────────────
    { id: 'd104', title: 'Dune: Part One',                                  year: 2021, score: 9,   category: 'Films',     emoji: '🏜️', poster: `${T}/gDzOcq0pfeCeqMBwKIJlSmQpjkZ.jpg` },
    { id: 'd105', title: 'Dune: Part Two',                                  year: 2024, score: 9.5, category: 'Films',     emoji: '🏜️', poster: `${T}/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg` },
    // ── Attack on Titan — saisons ─────────────────────────────────────────────
    { id: 'd115', title: 'Attack on Titan (S2)',                             year: 2017, score: 9.5, category: 'Anime',     emoji: '⚔️', poster: `${T}/2fhK0wbFixskgRyuq6YvaMn75et.jpg` },
    { id: 'd116', title: 'Attack on Titan (S3)',                             year: 2018, score: 9,   category: 'Anime',     emoji: '⚔️', poster: `${T}/ynow2o9v0G341PLv1chCRDufCgc.jpg` },
    { id: 'd117', title: 'Attack on Titan: Final Season',                    year: 2020, score: 9.5, category: 'Anime',     emoji: '⚔️', poster: `${T}/sfbSjGlLHsvFQrMUSNR9RrwZgV1.jpg` },
    // ── Demon Slayer — saisons ────────────────────────────────────────────────
    { id: 'd118', title: 'Demon Slayer: Entertainment District (S2)',        year: 2021, score: 9,   category: 'Anime',     emoji: '🌊', poster: `${T}/pLGjaDyg2LeA2d9KZxBZCiiqC2B.jpg` },
    { id: 'd119', title: 'Demon Slayer: Swordsmith Village (S3)',            year: 2023, score: 8.5, category: 'Anime',     emoji: '🌊', poster: `${T}/gbmhcOtre5SeBgwR9gvTpUra5kZ.jpg` },
    { id: 'd120', title: 'Demon Slayer: Hashira Training (S4)',              year: 2024, score: 8.5, category: 'Anime',     emoji: '🌊', poster: `${T}/6gD7G8HQay1X8mHiFVttWJ3czYb.jpg` },
    // ── Naruto Shippuden ──────────────────────────────────────────────────────
    { id: 'd121', title: 'Naruto Shippuden',                                 year: 2007, score: 8.5, category: 'Anime',     emoji: '🍃', poster: `${T}/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg` },
    // ── My Hero Academia — saisons ────────────────────────────────────────────
    { id: 'd122', title: 'My Hero Academia (S2)',                            year: 2017, score: 8,   category: 'Anime',     emoji: '🦸', poster: `${T}/bDCGl91IP8WQdQC2XabG18849aU.jpg` },
    { id: 'd123', title: 'My Hero Academia (S3)',                            year: 2018, score: 8,   category: 'Anime',     emoji: '🦸', poster: `${T}/s6R41zHka1t98S8ymjBzHgFIMzf.jpg` },
    { id: 'd124', title: 'My Hero Academia (S4)',                            year: 2019, score: 7.5, category: 'Anime',     emoji: '🦸', poster: `${T}/zfIwUDWfKNsar4f8bWryVdBSg7z.jpg` },
    { id: 'd125', title: 'My Hero Academia (S5)',                            year: 2021, score: 7.5, category: 'Anime',     emoji: '🦸', poster: `${T}/mXdO03Ac00wNiVfmbF3CnEa0zpb.jpg` },
    { id: 'd126', title: 'My Hero Academia (S6)',                            year: 2022, score: 8.5, category: 'Anime',     emoji: '🦸', poster: `${T}/3yjbvxFZzbvGQxCE6P1UH39WANL.jpg` },
    { id: 'd127', title: 'My Hero Academia (S7)',                            year: 2024, score: 8,   category: 'Anime',     emoji: '🦸', poster: `${T}/1KmGAaxzl8y62HUJH1VgM5a5XyL.jpg` },
    // ── One Punch Man — saisons ───────────────────────────────────────────────
    { id: 'd128', title: 'One Punch Man (S2)',                               year: 2019, score: 7.5, category: 'Anime',     emoji: '👊', poster: `${T}/ipzxKsG4wjyb4gfheIyud9pNw2D.jpg` },
    // ── JoJo's Bizarre Adventure — parties ───────────────────────────────────
    { id: 'd129', title: 'JoJo\'s Bizarre Adventure: Stardust Crusaders',   year: 2014, score: 9,   category: 'Anime',     emoji: '💪', poster: `${T}/kX9noqY0YpOPKwXpRXYg1hEIqmM.jpg` },
    { id: 'd130', title: 'JoJo\'s Bizarre Adventure: Diamond is Unbreakable',year: 2016, score: 9,   category: 'Anime',     emoji: '💪', poster: `${T}/9X4iCnCBZ7Y1AXi4nm4RfMwLW4I.jpg` },
    { id: 'd131', title: 'JoJo\'s Bizarre Adventure: Golden Wind',           year: 2018, score: 9,   category: 'Anime',     emoji: '💪', poster: `${T}/cMFg7X0gSJjWajuj9DNL4UaUmcP.jpg` },
    { id: 'd132', title: 'JoJo\'s Bizarre Adventure: Stone Ocean',           year: 2021, score: 8.5, category: 'Anime',     emoji: '💪', poster: `${T}/pgfHO4mnozfDLYKjhgtaOZDq9Kc.jpg` },
    // ── Jujutsu Kaisen — saisons ──────────────────────────────────────────────
    { id: 'd133', title: 'Jujutsu Kaisen (S2)',                              year: 2023, score: 9.5, category: 'Anime',     emoji: '🔮', poster: `${T}/fHpKWq9ayzSk8nSwqRuaAUemRKh.jpg` },
    // ── Fairy Tail — Final Series ─────────────────────────────────────────────
    { id: 'd134', title: 'Fairy Tail: Final Series',                         year: 2018, score: 8,   category: 'Anime',     emoji: '✨', poster: `${T}/mZAHfUEhQuWebFqVyRdBw9Y5I0i.jpg` },
    // ── Films cultes (ajouts) ─────────────────────────────────────────────────
    { id: 'd135', title: 'Inception',                                       year: 2010, score: 9.5, category: 'Films',     emoji: '🌀', poster: `${T}/aej3LRUga5rhgkmRP6XMFw3ejbl.jpg` },
    { id: 'd136', title: 'The Matrix',                                      year: 1999, score: 9.5, category: 'Films',     emoji: '💊', poster: `${T}/pEoqbqtLc4CcwDUDqxmEDSWpWTZ.jpg` },
    { id: 'd137', title: 'Gladiator',                                       year: 2000, score: 9,   category: 'Films',     emoji: '⚔️', poster: `${T}/5gJOu3t2QrznuJqjCG7FQDMI76t.jpg` },
    { id: 'd138', title: 'Oppenheimer',                                     year: 2023, score: 9,   category: 'Films',     emoji: '💥', poster: `${T}/boAUuJBeID7VNp4L7LNMQs8mfQS.jpg` },
    { id: 'd139', title: 'Top Gun: Maverick',                               year: 2022, score: 8.5, category: 'Films',     emoji: '✈️', poster: `${T}/uuwi4wwG6HAHVqaEvJDx6gI773N.jpg` },
    { id: 'd140', title: 'John Wick',                                       year: 2014, score: 8.5, category: 'Films',     emoji: '🔫', poster: `${T}/7yCzmVL0BI1aSvzgN3jCtXLtyFR.jpg` },
    { id: 'd141', title: 'Spider-Man: Into the Spider-Verse',               year: 2018, score: 9,   category: 'Films',     emoji: '🕷️', poster: `${T}/7uPGS5CgvIjDcFUhw9HB9qYeDXf.jpg` },
    { id: 'd142', title: 'Spider-Man: Across the Spider-Verse',             year: 2023, score: 9,   category: 'Films',     emoji: '🕸️', poster: `${T}/hvfwCeSTgsExmz9l31dKkfR83DH.jpg` },
    // ── Séries (ajouts) ───────────────────────────────────────────────────────
    { id: 'd143', title: 'Peaky Blinders',                                  year: 2013, score: 9,   category: 'Séries',    emoji: '🎩', poster: `${T}/wfD5hDb61sS203D0te7JbIzeyQe.jpg` },
    { id: 'd144', title: 'The Last of Us',                                  year: 2023, score: 9,   category: 'Séries',    emoji: '🍄', poster: `${T}/4pMd9VAdqm96KA2W4X8yetgc7EF.jpg` },
    { id: 'd145', title: 'Wednesday',                                       year: 2022, score: 8,   category: 'Séries',    emoji: '🖤', poster: `${T}/1UzED7WZJgzEIeVz1xiuZ1529nb.jpg` },
    { id: 'd146', title: 'La Casa de Papel',                                year: 2017, score: 8.5, category: 'Séries',    emoji: '🎭', poster: `${T}/u5Ye3LqV5LqTGjLqtkTCkA4m63W.jpg` },
    { id: 'd147', title: 'Dark',                                            year: 2017, score: 9.5, category: 'Séries',    emoji: '🕳️', poster: `${T}/vbG0zu0lIVDZZaUVOZuBIE9kno3.jpg` },
    { id: 'd148', title: 'Chernobyl',                                       year: 2019, score: 9.5, category: 'Séries',    emoji: '☢️', poster: `${T}/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg` },
    { id: 'd149', title: 'Sherlock',                                        year: 2010, score: 9,   category: 'Séries',    emoji: '🔎', poster: `${T}/nBRtABdAHf4SWSAWHelXz0H6tY9.jpg` },
    { id: 'd150', title: 'Vikings',                                         year: 2013, score: 8.5, category: 'Séries',    emoji: '🪓', poster: `${T}/xmcOeS0BKCBg5MwM3dfMrSUqyNh.jpg` },
    // ── Anime (ajouts) ────────────────────────────────────────────────────────
    { id: 'd151', title: 'Chainsaw Man',                                    year: 2022, score: 9,   category: 'Anime',     emoji: '🪚', poster: `${T}/npdB6eFzizki0WaZ1OvKcJrWe97.jpg` },
    { id: 'd152', title: 'Spy x Family',                                    year: 2022, score: 8.5, category: 'Anime',     emoji: '🔫', poster: `${T}/7NAvPYPAu7MeHwP8E9sn81PqsRh.jpg` },
    { id: 'd153', title: 'Vinland Saga',                                    year: 2019, score: 9.5, category: 'Anime',     emoji: '⚔️', poster: `${T}/vUHlpA5c1NXkds59reY3HMb4Abs.jpg` },
    { id: 'd154', title: 'Tokyo Ghoul',                                     year: 2014, score: 8.5, category: 'Anime',     emoji: '👁️', poster: `${T}/eKxblpRtHiMHLW5sjq7ZLGsGBOh.jpg` },
    { id: 'd155', title: 'Steins;Gate',                                     year: 2011, score: 9.5, category: 'Anime',     emoji: '⏱️', poster: `${T}/bj9lZLRey7ZTWNbA9o3L0tW0HfW.jpg` },
    { id: 'd156', title: 'Re:Zero',                                         year: 2016, score: 9,   category: 'Anime',     emoji: '🔄', poster: `${T}/5MrRCj7z92YLWMXHeWKp19eJPYv.jpg` },
    { id: 'd157', title: 'Blue Lock',                                       year: 2022, score: 8.5, category: 'Anime',     emoji: '⚽', poster: `${T}/fcKH1NQzoTXiYO1OrhaFFwTKhBp.jpg` },
    { id: 'd158', title: 'Dr. Stone',                                       year: 2019, score: 8.5, category: 'Anime',     emoji: '🪨', poster: `${T}/xfpSBNhBdQyrN3dTigqRVrOvSh1.jpg` },
    // ── Films cultes (lot 2) ──────────────────────────────────────────────────
    { id: 'd159', title: 'The Godfather',                                   year: 1972, score: 10,  category: 'Films',     emoji: '🎩', poster: `${T}/k3uIbYtiuK8pwbCcbma29nTqmgG.jpg` },
    { id: 'd160', title: 'The Shawshank Redemption',                        year: 1994, score: 9.5, category: 'Films',     emoji: '⛓️', poster: `${T}/t30GjttOdb5At1sYy8b3TOwFgWV.jpg` },
    { id: 'd161', title: 'Pulp Fiction',                                    year: 1994, score: 9,   category: 'Films',     emoji: '🔫', poster: `${T}/4TBdF7nFw2aKNM0gPOlDNq3v3se.jpg` },
    { id: 'd162', title: 'Forrest Gump',                                    year: 1994, score: 9,   category: 'Films',     emoji: '🏃', poster: `${T}/zi6RNYK1vXjIvpSBgjatXRcFYh2.jpg` },
    { id: 'd163', title: 'Fight Club',                                      year: 1999, score: 9,   category: 'Films',     emoji: '🧼', poster: `${T}/t1i10ptOivG4hV7erkX3tmKpiqm.jpg` },
    { id: 'd164', title: 'Titanic',                                         year: 1997, score: 9,   category: 'Films',     emoji: '🚢', poster: `${T}/vpsvHLkoeKUjceIMeNSqCp3xEyY.jpg` },
    { id: 'd165', title: 'Parasite',                                        year: 2019, score: 9.5, category: 'Films',     emoji: '🪜', poster: `${T}/7hLSzZX2jROmEXz2aEoh6JKUFy2.jpg` },
    { id: 'd166', title: 'Whiplash',                                        year: 2014, score: 9,   category: 'Films',     emoji: '🥁', poster: `${T}/3XriEpTdnplQRzyphAC0cu3emns.jpg` },
    { id: 'd167', title: 'Mad Max: Fury Road',                              year: 2015, score: 8.5, category: 'Films',     emoji: '🏜️', poster: `${T}/oLy2V6AWSEfdPgKOtrSGnwB3Q2R.jpg` },
    { id: 'd168', title: 'Django Unchained',                                year: 2012, score: 9,   category: 'Films',     emoji: '🤠', poster: `${T}/vRXUnWrXUgXRoX0BaEcuNMfyeQt.jpg` },
    { id: 'd169', title: 'The Wolf of Wall Street',                         year: 2013, score: 8.5, category: 'Films',     emoji: '💰', poster: `${T}/dQIQZbJXn1pflQw3nwvXLJX0dHa.jpg` },
    { id: 'd170', title: 'Dunkirk',                                         year: 2017, score: 8.5, category: 'Films',     emoji: '🪖', poster: `${T}/1VOKlC35yrwVKlfBSN52NY4zoF2.jpg` },
    { id: 'd171', title: 'Tenet',                                           year: 2020, score: 8,   category: 'Films',     emoji: '⏳', poster: `${T}/72SOtZnFhCumLRZhoXlX8g2IkgF.jpg` },
    { id: 'd172', title: 'The Prestige',                                    year: 2006, score: 9,   category: 'Films',     emoji: '🪄', poster: `${T}/37Fr7lY4QBHsuxlLJIfTNxW6nGW.jpg` },
    { id: 'd173', title: 'Jurassic Park',                                   year: 1993, score: 9,   category: 'Films',     emoji: '🦖', poster: `${T}/i268GVIlp777W1Ykws5R3LYYLIw.jpg` },
    { id: 'd174', title: 'Back to the Future',                              year: 1985, score: 9,   category: 'Films',     emoji: '🚗', poster: `${T}/iCgFtDUZxN8iUzNBCisjUrBmg2q.jpg` },
    { id: 'd175', title: 'Blade Runner 2049',                               year: 2017, score: 8.5, category: 'Films',     emoji: '🤖', poster: `${T}/qWD9E0Wgn8w6nMMutCNFAUiSHrX.jpg` },
    { id: 'd176', title: 'The Hobbit: An Unexpected Journey',               year: 2012, score: 8,   category: 'Films',     emoji: '💍', poster: `${T}/mdy9mG31U7jSB8edfRELv53Yfjp.jpg` },
    // ── Séries (lot 2) ────────────────────────────────────────────────────────
    { id: 'd177', title: 'Better Call Saul',                               year: 2015, score: 9,   category: 'Séries',    emoji: '⚖️', poster: `${T}/7KyuCBjxsr4sNQga16DcN9ccEyf.jpg` },
    { id: 'd178', title: 'Loki',                                            year: 2021, score: 8.5, category: 'Séries',    emoji: '🐍', poster: `${T}/zNwEwSXojMrQapZHQx5fO8iph4R.jpg` },
    { id: 'd179', title: 'Westworld',                                       year: 2016, score: 8.5, category: 'Séries',    emoji: '🤠', poster: `${T}/iblRK215A0oz3ewTtIIXO9XcW1N.jpg` },
    { id: 'd180', title: 'The Office',                                      year: 2005, score: 9,   category: 'Séries',    emoji: '📎', poster: `${T}/2dApsoX4bd98szjrbj5i3syYOh2.jpg` },
    { id: 'd181', title: 'Friends',                                         year: 1994, score: 9,   category: 'Séries',    emoji: '☕', poster: `${T}/2koX1xLkpTQM4IZebYvKysFW1Nh.jpg` },
    { id: 'd182', title: 'Black Mirror',                                    year: 2011, score: 8.5, category: 'Séries',    emoji: '📺', poster: `${T}/9acfIYfBuB4GFVROipM9YrqxsXd.jpg` },
    { id: 'd183', title: 'Severance',                                       year: 2022, score: 9,   category: 'Séries',    emoji: '🧠', poster: `${T}/xmjW474DJ27bqTYNvS4MvraJgiQ.jpg` },
    { id: 'd184', title: 'Fargo',                                           year: 2014, score: 8.5, category: 'Séries',    emoji: '❄️', poster: `${T}/a3VW6khsyUVKrG0GBCWFG3NzWPX.jpg` },
    { id: 'd185', title: 'True Detective',                                  year: 2014, score: 8.5, category: 'Séries',    emoji: '🕵️', poster: `${T}/v1pOP44wChdvxoGhnjSmhnzyDje.jpg` },
    { id: 'd186', title: 'Brooklyn Nine-Nine',                             year: 2013, score: 8.5, category: 'Séries',    emoji: '🚓', poster: `${T}/A3SymGlOHefSKbz1bCOz56moupS.jpg` },
    { id: 'd187', title: 'Mr. Robot',                                       year: 2015, score: 8.5, category: 'Séries',    emoji: '💻', poster: `${T}/kv1nRqgebSsREnd7vdC2pSGjpLo.jpg` },
    // ── Star Wars (séries) ────────────────────────────────────────────────────
    { id: 'd188', title: 'The Mandalorian',                                year: 2019, score: 8.5, category: 'Star Wars', emoji: '🪖', poster: `${T}/s8lHYTNYM919rDFvMs33tOeMbYf.jpg` },
    { id: 'd189', title: 'Andor',                                           year: 2022, score: 9,   category: 'Star Wars', emoji: '🔫', poster: `${T}/uoopC4EHcTV7ISmwUBHINWQ5QOA.jpg` },
    // ── Anime (lot 2) ─────────────────────────────────────────────────────────
    { id: 'd190', title: 'Code Geass',                                      year: 2006, score: 9.5, category: 'Anime',     emoji: '♟️', poster: `${T}/x316WCogkeIwNY4JR8zTCHbI2nQ.jpg` },
    { id: 'd191', title: 'Cowboy Bebop',                                    year: 1998, score: 9,   category: 'Anime',     emoji: '🚀', poster: `${T}/xDiXDfZwC6XYC6fxHI1jl3A3Ill.jpg` },
    { id: 'd192', title: 'Mob Psycho 100',                                  year: 2016, score: 9,   category: 'Anime',     emoji: '💢', poster: `${T}/vR7hwaGQ0ySRoq1WobiNRaPs4WO.jpg` },
    { id: 'd193', title: 'Haikyu!!',                                        year: 2014, score: 9,   category: 'Anime',     emoji: '🏐', poster: `${T}/8WEr48swcqe89Zsy5sdrGCASlIg.jpg` },
    { id: 'd194', title: 'Black Clover',                                    year: 2017, score: 8,   category: 'Anime',     emoji: '🍀', poster: `${T}/kaMisKeOoTBPxPkbC3OW7Wgt6ON.jpg` },
    { id: 'd195', title: 'Dandadan',                                        year: 2024, score: 9,   category: 'Anime',     emoji: '👽', poster: `${T}/6qfZAOEUFIrbUH3JvePclx1nXzz.jpg` },
    { id: 'd196', title: 'Kaiju No. 8',                                     year: 2024, score: 8.5, category: 'Anime',     emoji: '👹', poster: `${T}/bJxGs0w5RAhaX4fIUQu511rvm0S.jpg` },
    { id: 'd197', title: 'The Apothecary Diaries',                          year: 2023, score: 9,   category: 'Anime',     emoji: '🌿', poster: `${T}/47pSay5Ao7SFeyQBZVkW5ifyhAZ.jpg` },
    { id: 'd198', title: 'Fire Force',                                      year: 2019, score: 8,   category: 'Anime',     emoji: '🔥', poster: `${T}/w39RbZShri0HsN1Vxm2vkNkC7Xo.jpg` },
    { id: 'd199', title: 'Sword Art Online',                               year: 2012, score: 8,   category: 'Anime',     emoji: '⚔️', poster: `${T}/pfypXhbWken5dBGbNqb9PAPyrAw.jpg` },
    { id: 'd200', title: 'Konosuba',                                        year: 2016, score: 8.5, category: 'Anime',     emoji: '💧', poster: `${T}/uTsj1GfOboLCAt1781wbifbXi2K.jpg` },
    { id: 'd201', title: 'Your Name',                                       year: 2016, score: 9.5, category: 'Anime',     emoji: '☄️', poster: `${T}/zyHjvVRgKOt9wgVx4ikp2kGArGF.jpg` },
    { id: 'd202', title: 'Demon Slayer: Mugen Train',                       year: 2020, score: 9,   category: 'Anime',     emoji: '🚂', poster: `${T}/t3BCcQNhUAP5l93TbOfp3Hk1v2S.jpg` },
    { id: 'd203', title: 'Bleach',                                          year: 2004, score: 8.5, category: 'Anime',     emoji: '⚔️', poster: `${T}/5iVUUnE2tgBPypACYNobCKHagfV.jpg` },
    // ── Marvel — séries ───────────────────────────────────────────────────────
    { id: 'd204', title: 'WandaVision',                                     year: 2021, score: 8.5, category: 'Marvel',    emoji: '📺', poster: `${T}/AXnCR7WE8BKlzsabQtUITySChn.jpg` },
    { id: 'd205', title: 'The Falcon and the Winter Soldier',              year: 2021, score: 7.5, category: 'Marvel',    emoji: '🦅', poster: `${T}/6NrUwEWDxZI2XffOnw3nuibukmX.jpg` },
    { id: 'd206', title: 'What If...?',                                     year: 2021, score: 7.5, category: 'Marvel',    emoji: '❓', poster: `${T}/mj98hl3XsRcxYdw99arNavsSBDP.jpg` },
    { id: 'd207', title: 'Hawkeye',                                         year: 2021, score: 7.5, category: 'Marvel',    emoji: '🏹', poster: `${T}/cybZ7FoeBoBJPieKvSp4wh2yCMR.jpg` },
    { id: 'd208', title: 'Moon Knight',                                     year: 2022, score: 8,   category: 'Marvel',    emoji: '🌙', poster: `${T}/xrkDlkL6u26DLeBw2Cao8pYtrYH.jpg` },
    { id: 'd209', title: 'Ms. Marvel',                                      year: 2022, score: 7,   category: 'Marvel',    emoji: '✨', poster: `${T}/3x1eRyuz2NOOSXODDcDl9EjGRQ.jpg` },
    { id: 'd210', title: 'She-Hulk: Attorney at Law',                       year: 2022, score: 6.5, category: 'Marvel',    emoji: '💚', poster: `${T}/poWy1hDzaIFv6UaYtFDNcNfiM2C.jpg` },
    { id: 'd211', title: 'Secret Invasion',                                 year: 2023, score: 6,   category: 'Marvel',    emoji: '👽', poster: `${T}/AbqvJTbFEOmL8vHk54lVolqQg8Y.jpg` },
    { id: 'd212', title: 'Echo',                                            year: 2024, score: 6.5, category: 'Marvel',    emoji: '🎯', poster: `${T}/vYAmCQ0ZbumwLJncUG8hPomb5R7.jpg` },
    { id: 'd213', title: 'Agatha All Along',                                year: 2024, score: 7.5, category: 'Marvel',    emoji: '🧙', poster: `${T}/mGsxKwXUjojitRv2E9qMTbxbBRd.jpg` },
    { id: 'd214', title: "X-Men '97",                                       year: 2024, score: 9,   category: 'Marvel',    emoji: '⚡', poster: `${T}/9Ycz7yYRf9V4jk3YXwcZhFtbNcF.jpg` },
    { id: 'd215', title: 'Daredevil: Born Again',                           year: 2025, score: 8.5, category: 'Marvel',    emoji: '😈', poster: `${T}/7UMmvMvhSw1jBgdz0NzLo9pa93g.jpg` },
    { id: 'd216', title: 'Ironheart',                                       year: 2025, score: 6.5, category: 'Marvel',    emoji: '🤖', poster: `${T}/dtpiECNwAeLnGJSU3HTWhcQGHk1.jpg` },
    { id: 'd217', title: 'Marvel Zombies',                                  year: 2025, score: 7,   category: 'Marvel',    emoji: '🧟', poster: `${T}/9CbKyXIbDKBSKKs7BOFnMiJxWal.jpg` },
    { id: 'd218', title: 'Agents of S.H.I.E.L.D.',                          year: 2013, score: 8,   category: 'Marvel',    emoji: '🛡️', poster: `${T}/j6pen1MBLKbBoXrzrHSxfsd0lrC.jpg` },
    { id: 'd219', title: 'Agent Carter',                                    year: 2015, score: 7.5, category: 'Marvel',    emoji: '🎩', poster: `${T}/fe79VYyLp5ZBstpJ4oukpuUT3B.jpg` },
    { id: 'd220', title: 'Daredevil',                                       year: 2015, score: 9,   category: 'Marvel',    emoji: '😈', poster: `${T}/jwhi2cBENpdMYJUkmVTJ6Fcrokf.jpg` },
    { id: 'd221', title: 'Jessica Jones',                                   year: 2015, score: 8,   category: 'Marvel',    emoji: '🔍', poster: `${T}/d8OS8nKmv45BjGXsWTOxRdiFm1X.jpg` },
    { id: 'd222', title: 'Luke Cage',                                       year: 2016, score: 7.5, category: 'Marvel',    emoji: '💪', poster: `${T}/whnbD6LEjHenvda3A2cV2Vky531.jpg` },
    { id: 'd223', title: 'Iron Fist',                                       year: 2017, score: 6.5, category: 'Marvel',    emoji: '👊', poster: `${T}/v6qcpqlpyRqZzmIehW3eOssTW5K.jpg` },
    { id: 'd224', title: 'The Punisher',                                    year: 2017, score: 8.5, category: 'Marvel',    emoji: '💀', poster: `${T}/74VbBYHmpjgeES1zkRo1DwHkWnE.jpg` },
    { id: 'd225', title: 'The Defenders',                                   year: 2017, score: 7,   category: 'Marvel',    emoji: '🛡️', poster: `${T}/k8UOUmPzCHrflLHxvNhogsJGo8D.jpg` },
    // ── DC — séries ───────────────────────────────────────────────────────────
    { id: 'd226', title: 'Peacemaker',                                      year: 2022, score: 9,   category: 'DC',        emoji: '🕊️', poster: `${T}/zS3B0E62iVX9cmiEkToD2JMrne0.jpg` },
    { id: 'd227', title: 'Titans',                                          year: 2018, score: 7.5, category: 'DC',        emoji: '⚡', poster: `${T}/8e6QiSexmYKaiHGPvbhaFMmQEhc.jpg` },
    { id: 'd228', title: 'Doom Patrol',                                     year: 2019, score: 8,   category: 'DC',        emoji: '🦸', poster: `${T}/muIcIHBEGXiSzz7RNGisnTR3xU4.jpg` },
    { id: 'd229', title: 'The Sandman',                                     year: 2022, score: 8,   category: 'DC',        emoji: '💤', poster: `${T}/iJGvK70qYSxrqaBDp8bF40YIg59.jpg` },
    { id: 'd230', title: 'Watchmen',                                        year: 2019, score: 8.5, category: 'DC',        emoji: '🕰️', poster: `${T}/m8rWq3j73ZGhDuSCZWMMoE9ePH1.jpg` },
    { id: 'd231', title: 'Gotham',                                          year: 2014, score: 8,   category: 'DC',        emoji: '🦇', poster: `${T}/qWZDd8X79Caky51mpS35xFtgE3p.jpg` },
    { id: 'd232', title: 'Arrow',                                           year: 2012, score: 8,   category: 'DC',        emoji: '🏹', poster: `${T}/4DVLTc7oVCzHOSmZzlDHefCKyqq.jpg` },
    { id: 'd233', title: 'The Flash',                                       year: 2014, score: 7.5, category: 'DC',        emoji: '⚡', poster: `${T}/Hrta0iq8KEQbdOpSnki2gUMowk.jpg` },
    { id: 'd234', title: 'Smallville',                                      year: 2001, score: 8,   category: 'DC',        emoji: '🌽', poster: `${T}/el4r3RABoLe5Hh6U2I3OybBjrme.jpg` },
    { id: 'd235', title: 'Superman & Lois',                                 year: 2021, score: 8,   category: 'DC',        emoji: '🦸', poster: `${T}/vlv1gn98GqMnKHLSh0dNciqGfBl.jpg` },
    { id: 'd236', title: 'Stargirl',                                        year: 2020, score: 7,   category: 'DC',        emoji: '⭐', poster: `${T}/JJxVsQPPiuLcArALotMHsCubeo.jpg` },
    { id: 'd237', title: 'Sweet Tooth',                                     year: 2021, score: 7.5, category: 'DC',        emoji: '🦌', poster: `${T}/rgMfhcrVZjuy5b7Pn0KzCRCEnMX.jpg` },
    { id: 'd238', title: 'Pennyworth',                                      year: 2019, score: 7,   category: 'DC',        emoji: '🎩', poster: `${T}/hBz89EHXocJcT0ltZpGEMKETF0L.jpg` },
    { id: 'd239', title: 'Creature Commandos',                             year: 2024, score: 7.5, category: 'DC',        emoji: '👹', poster: `${T}/bB3G6Ug1jfsOUptb0RJsqrgMVta.jpg` },
    { id: 'd240', title: 'Supergirl',                                       year: 2015, score: 7,   category: 'DC',        emoji: '🦸', poster: `${T}/cFO65xb0xiXKqk5BmgHawCXB1i0.jpg` },
    { id: 'd241', title: "DC's Legends of Tomorrow",                        year: 2016, score: 7,   category: 'DC',        emoji: '⏳', poster: `${T}/tAwfCIwA2BHR4H6j5hENvI3dbAl.jpg` },
    { id: 'd242', title: 'Batwoman',                                        year: 2019, score: 6,   category: 'DC',        emoji: '🦇', poster: `${T}/pBpxKiitMuYXvtsXNSzya8DKKzV.jpg` },
    { id: 'd243', title: 'Lucifer',                                         year: 2016, score: 8,   category: 'DC',        emoji: '😈', poster: `${T}/tU34L2zd8sWxypSxAwg01mksLdq.jpg` },
    { id: 'd244', title: 'Constantine',                                     year: 2014, score: 7,   category: 'DC',        emoji: '🔮', poster: `${T}/pPIyqVAyMQUmg0oaXh6nZoPG8Ev.jpg` },
    { id: 'd245', title: 'Harley Quinn',                                    year: 2019, score: 8.5, category: 'DC',        emoji: '🃏', poster: `${T}/9Dm1SEh8Wxt8LNNg02exHQ595zg.jpg` },
  ];

  async ngOnInit() {
    // Afficher immédiatement localStorage ou defaults — jamais de page vide
    const saved = localStorage.getItem(this.STORAGE_KEY);
    this.entries.set(saved ? JSON.parse(saved) : this.defaults);

    // Ensuite essayer Firebase en arrière-plan
    try {
      const remote = await this.svc.load();
      if (remote && remote.length > 0) {
        this.entries.set(remote);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(remote));
      }
    } catch { /* ignore */ }

    // Sorties ciné : chargement initial + rafraîchissement automatique
    this.loadUpcoming();
    this.upcomingTimer = setInterval(() => this.loadUpcoming(), this.REFRESH_MS);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  /** Recharge le flux des sorties ciné quand l'onglet redevient visible. */
  private onVisibility = () => {
    if (document.visibilityState === 'visible') this.loadUpcoming();
  };

  /** Charge les sorties ciné à venir depuis TMDB. */
  async loadUpcoming() {
    if (!this.tmdb.hasKey) return;       // pas de clé → section en mode configuration
    if (this.upLoading()) return;        // évite les appels concurrents
    this.upLoading.set(true);
    this.upError.set(false);
    try {
      this.upcoming.set(await this.tmdb.getUpcoming('FR'));
    } catch {
      this.upError.set(true);
    } finally {
      this.upLoading.set(false);
    }
  }

  get tmdbReady(): boolean { return this.tmdb.hasKey; }

  /** Formate une date ISO en français (ex: lun. 12 juin 2026). */
  formatDate(iso: string): string {
    if (!iso) return 'Date à confirmer';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return 'Date à confirmer';
    const s = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /** Compte à rebours lisible jusqu'à la sortie (J-3, DEMAIN, AUJOURD'HUI…). */
  countdown(iso: string): string {
    if (!iso) return '';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    const days = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (days <= 0) return "AUJOURD'HUI";
    if (days === 1) return 'DEMAIN';
    if (days < 7) return `J-${days}`;
    if (days < 31) return `${Math.round(days / 7)} SEM.`;
    return `${Math.round(days / 30)} MOIS`;
  }

  /** Ouvre la bande-annonce d'un film à venir dans une modale. */
  async openTrailer(m: UpcomingMovie) {
    this.trailerTitle.set(m.title);
    this.trailerKey.set(null);
    this.trailerError.set(false);
    this.trailerLoading.set(true);
    this.showTrailer.set(true);
    try {
      const key = await this.tmdb.getTrailerKey(m.id);
      if (key) this.trailerKey.set(key);
      else this.trailerError.set(true);
    } catch {
      this.trailerError.set(true);
    } finally {
      this.trailerLoading.set(false);
    }
  }

  closeTrailer() {
    this.showTrailer.set(false);
    this.trailerKey.set(null); // stoppe la lecture YouTube
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showTrailer()) this.closeTrailer();
  }

  filtered = computed(() => {
    const f = this.activeFilter();
    const q = this.searchQuery().toLowerCase().trim();
    let list = f === 'Tout' ? [...this.entries()] : this.entries().filter(e => e.category === f);
    if (q) list = list.filter(e => e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
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
    const map: Record<string, string> = {
      Marvel:       '#e23636',
      DC:           '#1a73e8',
      'Star Wars':  '#ffe81f',
      Anime:        '#9b59b6',
      'Séries':     '#27ae60',
      Films:        '#e67e22',
    };
    return map[cat] ?? 'var(--accent)';
  }

  setFilter(f: string) { this.activeFilter.set(f); }

  openPinModal()  { this.pinInput = ''; this.pinError = false; this.showPinModal.set(true); }
  closePinModal() { this.showPinModal.set(false); }

  submitPin() {
    if (this.svc.checkPin(this.pinInput)) {
      this.adminMode.set(true);
      this.showPinModal.set(false);
    } else {
      this.pinError = true;
    }
  }

  lockAdmin() { this.adminMode.set(false); }

  openAdd() {
    this.isEditing.set(false); this.editingId.set(null);
    this.resetForm(); this.showModal.set(true);
  }

  openEdit(entry: Entry) {
    this.isEditing.set(true); this.editingId.set(entry.id);
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
    this.closeModal();
    this.saveAll(); // en arrière-plan
  }

  async removeEntry(id: string) {
    this.entries.update(list => list.filter(e => e.id !== id));
    await this.saveAll();
  }

  async resetAll() {
    if (confirm('Réinitialiser toutes les entrées ?')) {
      this.entries.set(this.defaults);
      await this.saveAll();
    }
  }

  private async saveAll() {
    const list = this.entries();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    if (this.svc.isConfigured) {
      this.syncing.set(true);
      try {
        await this.svc.save(list);
        this.syncOk.set(true);
        setTimeout(() => this.syncOk.set(false), 2000);
      } finally {
        this.syncing.set(false);
      }
    }
  }

  onImgError(e: Event) { (e.target as HTMLElement).style.display = 'none'; }
  private resetForm() { this.newEntry = { title: '', year: new Date().getFullYear(), score: 8, category: 'Films', emoji: '🎬', poster: '' }; }
  tierLabel(s: number) { if (s >= 9.5) return 'S'; if (s >= 8.5) return 'A'; if (s >= 7) return 'B'; return 'C'; }
  tierClass(s: number) { if (s >= 9.5) return 'tier-s'; if (s >= 8.5) return 'tier-a'; if (s >= 7) return 'tier-b'; return 'tier-c'; }

  ngAfterViewInit() { this.initFilm(); }

  ngOnDestroy() {
    cancelAnimationFrame(this.filmAnimId);
    this.filmRenderer?.dispose();
    if (this.upcomingTimer) clearInterval(this.upcomingTimer);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  private initFilm() {
    const el = this.filmRef?.nativeElement;
    if (!el) return;
    const size = 200;
    const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.filmRenderer = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.z = 4.4;
    const clock = new THREE.Clock();

    // Film reel ring — gold/amber
    const reel = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.045, 8, 72),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc83c'), transparent: true, opacity: 0.75 })
    );
    scene.add(reel);

    // Inner aperture — octahedron wireframe, cyan (camera lens)
    const apertureGeo  = new THREE.OctahedronGeometry(0.58, 1);
    const apertureWire = new THREE.WireframeGeometry(apertureGeo);
    const aperture = new THREE.LineSegments(apertureWire, new THREE.LineBasicMaterial({
      color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.7,
    }));
    scene.add(aperture);

    // Outer orbit ring A — amber, tilted
    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.005, 6, 80),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff9a3c'), transparent: true, opacity: 0.3 })
    );
    ringA.rotation.x = Math.PI / 3.5;
    scene.add(ringA);

    // Outer orbit ring B — purple, different tilt
    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.004, 6, 80),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#7c6fff'), transparent: true, opacity: 0.22 })
    );
    ringB.rotation.x = Math.PI / 5;
    ringB.rotation.z = Math.PI / 3;
    scene.add(ringB);

    // Particle field — gold + cyan mix
    const pCount = 130;
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    const gold = new THREE.Color('#ffc83c');
    const cyan = new THREE.Color('#00d4ff');
    for (let i = 0; i < pCount; i++) {
      const r = 1.65 + Math.random() * 0.85;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
      const c = Math.random() > 0.55 ? gold : cyan;
      pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: 0.052, vertexColors: true, transparent: true, opacity: 0.7, sizeAttenuation: true,
    }));
    scene.add(particles);

    const animate = () => {
      this.filmAnimId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      reel.rotation.y += 0.007;
      reel.rotation.x = Math.sin(t * 0.35) * 0.18;
      (reel.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(t * 1.2) * 0.18;
      aperture.rotation.y -= 0.016;
      aperture.rotation.z += 0.008;
      (aperture.material as THREE.LineBasicMaterial).opacity = 0.5 + Math.sin(t * 1.6) * 0.22;
      ringA.rotation.z += 0.005;
      ringB.rotation.y -= 0.006;
      particles.rotation.y += 0.003;
      renderer.render(scene, camera);
    };
    animate();
  }
}
