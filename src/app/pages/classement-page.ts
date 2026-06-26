import { Component, signal, computed, OnInit, AfterViewInit, OnDestroy, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ClassementService, Entry } from '../services/classement.service';
import { TmdbService, UpcomingMovie } from '../services/tmdb.service';
import { CATALOGUE } from '../data/catalogue-data';
import * as THREE from 'three';


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
  sortMode     = signal<'score' | 'year' | 'title'>('score');
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

  private defaults: Entry[] = CATALOGUE;

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

  /** Ouvre la bande-annonce d'une entrée du catalogue (recherche par titre). */
  async openTrailerForEntry(entry: Entry) {
    if (!this.tmdb.hasKey) return;
    this.trailerTitle.set(entry.title);
    this.trailerKey.set(null);
    this.trailerError.set(false);
    this.trailerLoading.set(true);
    this.showTrailer.set(true);
    try {
      const preferTv = (entry.category === 'Anime' || entry.category === 'Séries') ? true : undefined;
      const key = await this.tmdb.getTrailerByTitle(entry.title, entry.year, preferTv);
      if (key) this.trailerKey.set(key);
      else this.trailerError.set(true);
    } catch {
      this.trailerError.set(true);
    } finally {
      this.trailerLoading.set(false);
    }
  }

  /** Pioche une entrée au hasard (selon le filtre courant) et lance sa bande-annonce. */
  randomSurprise() {
    const list = this.filtered();
    if (!list.length) return;
    this.openTrailerForEntry(list[Math.floor(Math.random() * list.length)]);
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
    const mode = this.sortMode();
    let list = f === 'Tout' ? [...this.entries()] : this.entries().filter(e => e.category === f);
    if (q) list = list.filter(e => e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    return list.sort((a, b) => {
      if (mode === 'year')  return b.year - a.year;
      if (mode === 'title') return a.title.localeCompare(b.title, 'fr');
      return b.score - a.score;
    });
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
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
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
