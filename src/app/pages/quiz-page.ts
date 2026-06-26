import { Component, signal, computed, OnDestroy } from '@angular/core';
import { CATALOGUE } from '../data/catalogue-data';
import { Entry } from '../services/classement.service';

interface Question { answer: Entry; options: Entry[]; }

@Component({
  selector: 'app-quiz-page',
  templateUrl: './quiz-page.html',
  styleUrl: './quiz-page.scss',
})
export class QuizPage implements OnDestroy {
  readonly cats = ['Tout', 'Marvel', 'DC', 'Star Wars', 'Anime', 'Séries', 'Films'];
  readonly totalCatalogue = CATALOGUE.length;
  private readonly QUESTION_TIME = 15;       // secondes par question
  private readonly MAX_QUESTIONS = 10;

  state    = signal<'start' | 'playing' | 'done'>('start');
  category = signal('Tout');
  total    = signal(this.MAX_QUESTIONS);
  qIndex   = signal(0);
  score    = signal(0);
  streak   = signal(0);
  bestStreak = signal(0);
  best     = signal(0);
  question = signal<Question | null>(null);
  selectedId = signal<string | null>(null);
  revealed = signal(false);
  timeLeft = signal(this.QUESTION_TIME);

  private bestTick = signal(0);              // force le recalcul du record affiché
  private timer?: ReturnType<typeof setInterval>;
  private pool: Entry[] = [];
  private usedIds = new Set<string>();

  /** Record et nombre de questions pour la catégorie sélectionnée (écran d'accueil). */
  selBest  = computed(() => { this.bestTick(); return this.loadBest(this.category()); });
  selCount = computed(() => Math.min(this.MAX_QUESTIONS, this.catCount(this.category())));
  isCorrect = computed(() => this.revealed() && this.selectedId() === this.question()?.answer.id);

  catCount(cat: string): number {
    return cat === 'Tout' ? CATALOGUE.length : CATALOGUE.filter(e => e.category === cat).length;
  }

  start(cat: string) {
    this.category.set(cat);
    this.pool = cat === 'Tout' ? [...CATALOGUE] : CATALOGUE.filter(e => e.category === cat);
    this.total.set(Math.min(this.MAX_QUESTIONS, this.pool.length));
    this.qIndex.set(0); this.score.set(0); this.streak.set(0); this.bestStreak.set(0);
    this.best.set(this.loadBest(cat));
    this.usedIds.clear();
    this.state.set('playing');
    this.nextQuestion();
  }

  private nextQuestion() {
    this.selectedId.set(null);
    this.revealed.set(false);
    const avail = this.pool.filter(e => !this.usedIds.has(e.id));
    const answer = this.rand(avail.length ? avail : this.pool);
    this.usedIds.add(answer.id);

    // Distracteurs : de préférence dans la même catégorie (plus difficile)
    const sameCat = this.pool.filter(e => e.category === answer.category && e.id !== answer.id);
    const dPool = sameCat.length >= 3 ? sameCat : this.pool.filter(e => e.id !== answer.id);
    const distractors = this.shuffle(dPool).slice(0, 3);

    this.question.set({ answer, options: this.shuffle([answer, ...distractors]) });
    this.startTimer();
  }

  answer(opt: Entry) {
    if (this.revealed()) return;
    this.stopTimer();
    this.selectedId.set(opt.id);
    this.revealed.set(true);
    if (opt.id === this.question()!.answer.id) {
      this.score.update(s => s + 1);
      this.streak.update(s => s + 1);
      this.bestStreak.update(b => Math.max(b, this.streak()));
    } else {
      this.streak.set(0);
    }
  }

  next() {
    if (this.qIndex() + 1 >= this.total()) { this.finish(); return; }
    this.qIndex.update(i => i + 1);
    this.nextQuestion();
  }

  restart() { this.start(this.category()); }
  toStart() { this.stopTimer(); this.state.set('start'); }

  /** Classe d'état d'une option après révélation (correct / wrong / dim). */
  optState(opt: Entry): string {
    if (!this.revealed()) return '';
    if (opt.id === this.question()!.answer.id) return 'correct';
    if (opt.id === this.selectedId()) return 'wrong';
    return 'dim';
  }

  resultMsg(): string {
    const p = this.total() ? this.score() / this.total() : 0;
    if (p === 1)    return 'Parfait. Cinéphile ultime. 🏆';
    if (p >= 0.8)   return 'Excellent ! Vrai connaisseur. 🍿';
    if (p >= 0.5)   return 'Pas mal du tout. 🎬';
    if (p >= 0.3)   return 'Peut mieux faire… 📼';
    return "Aïe. Une soirée ciné s'impose. 😅";
  }

  onImgError(e: Event) { (e.target as HTMLElement).style.visibility = 'hidden'; }

  ngOnDestroy() { this.stopTimer(); }

  // ── Internes ──────────────────────────────────────────────
  private finish() {
    this.stopTimer();
    if (this.score() > this.best()) {
      this.best.set(this.score());
      this.saveBest(this.category(), this.score());
      this.bestTick.update(v => v + 1);
    }
    this.state.set('done');
  }

  private startTimer() {
    this.stopTimer();
    this.timeLeft.set(this.QUESTION_TIME);
    this.timer = setInterval(() => {
      this.timeLeft.update(t => Math.max(0, +(t - 0.1).toFixed(1)));
      if (this.timeLeft() <= 0) this.timeUp();
    }, 100);
  }

  private stopTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = undefined; }
  }

  private timeUp() {
    if (this.revealed()) return;
    this.stopTimer();
    this.revealed.set(true);
    this.streak.set(0); // temps écoulé = raté
  }

  private rand<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

  private shuffle<T>(a: T[]): T[] {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }

  private loadBest(cat: string): number {
    return Number(localStorage.getItem('portfolio-quiz-best-' + cat) || 0);
  }

  private saveBest(cat: string, v: number) {
    localStorage.setItem('portfolio-quiz-best-' + cat, String(v));
  }
}
