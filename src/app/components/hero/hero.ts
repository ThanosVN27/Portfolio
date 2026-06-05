import { Component, OnDestroy, AfterViewInit, signal } from '@angular/core';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements AfterViewInit, OnDestroy {
  typedText = signal('');
  private texts = ['Développeur Logiciel', 'Étudiant BUT Informatique', 'Fan de Jeux Vidéo'];
  private textIndex = 0;
  private charIndex = 0;
  private isDeleting = false;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit() { this.typeNext(); }

  ngOnDestroy() { if (this.typingTimer) clearTimeout(this.typingTimer); }

  private typeNext() {
    const current = this.texts[this.textIndex];
    if (this.isDeleting) {
      this.typedText.set(current.substring(0, this.charIndex - 1));
      this.charIndex--;
    } else {
      this.typedText.set(current.substring(0, this.charIndex + 1));
      this.charIndex++;
    }
    let delay = this.isDeleting ? 50 : 100;
    if (!this.isDeleting && this.charIndex === current.length) {
      delay = 1800; this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.textIndex = (this.textIndex + 1) % this.texts.length;
      delay = 300;
    }
    this.typingTimer = setTimeout(() => this.typeNext(), delay);
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
