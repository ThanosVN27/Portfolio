import { Component, OnInit, ElementRef, QueryList, ViewChildren } from '@angular/core';

interface TimelineItem { year: string; title: string; school: string; current: boolean; }

@Component({
  selector: 'app-about-page',
  imports: [],
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss',
})
export class AboutPage implements OnInit {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;

  timeline: TimelineItem[] = [
    { year: '2025 – 2026', title: 'BUT Informatique — 2e année', school: 'IUT Robert Schumann, Illkirch', current: true },
    { year: '2023 – 2025', title: 'BUT Informatique — 1re année', school: 'IUT Robert Schumann, Illkirch', current: false },
    { year: '2023', title: 'Baccalauréat STI2D — Option SIN', school: 'Lycée Marc Bloch, Strasbourg', current: false },
  ];

  ngOnInit() {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    setTimeout(() => this.revealEls.forEach(el => observer.observe(el.nativeElement)));
  }
}
