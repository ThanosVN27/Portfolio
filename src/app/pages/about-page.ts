import { Component, OnInit, ElementRef, QueryList, ViewChildren, signal } from '@angular/core';

interface TimelineItem { year: string; title: string; school: string; current: boolean; }
interface SkillBar { name: string; percent: number; color: string; }
interface SkillGroup { title: string; skills: SkillBar[]; }

@Component({
  selector: 'app-about-page',
  imports: [],
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss',
})
export class AboutPage implements OnInit {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;

  barsVisible = signal(false);

  timeline: TimelineItem[] = [
    { year: '2025 – 2026', title: 'BUT Informatique — 2e année', school: 'IUT Robert Schumann, Illkirch', current: true },
    { year: '2023 – 2025', title: 'BUT Informatique — 1re année', school: 'IUT Robert Schumann, Illkirch', current: false },
    { year: '2023', title: 'Baccalauréat STI2D — Option SIN', school: 'Lycée Marc Bloch, Strasbourg', current: false },
  ];

  skillGroups: SkillGroup[] = [
    {
      title: 'Langages',
      skills: [
        { name: 'C', percent: 80, color: '#7c6fff' },
        { name: 'Java', percent: 75, color: '#7c6fff' },
        { name: 'Python', percent: 65, color: '#7c6fff' },
        { name: 'C#', percent: 60, color: '#7c6fff' },
        { name: 'SQL / PL-SQL', percent: 65, color: '#7c6fff' },
        { name: 'Assembleur MIPS32', percent: 45, color: '#7c6fff' },
      ],
    },
    {
      title: 'Web & Outils',
      skills: [
        { name: 'Git / GitHub', percent: 80, color: '#00d4ff' },
        { name: 'HTML / CSS', percent: 75, color: '#00d4ff' },
        { name: 'Node.js / React', percent: 55, color: '#00d4ff' },
        { name: 'PHP', percent: 50, color: '#00d4ff' },
        { name: 'BASH / Admin Système', percent: 60, color: '#00d4ff' },
        { name: 'MySQL', percent: 65, color: '#00d4ff' },
      ],
    },
  ];

  languages = [
    { name: 'Vietnamien', level: 'Langue maternelle', percent: 100, flag: '🇻🇳' },
    { name: 'Français', level: 'Courant', percent: 95, flag: '🇫🇷' },
    { name: 'Anglais', level: 'Niveau B1', percent: 55, flag: '🇬🇧' },
  ];

  ngOnInit() {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    const barsObserver = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { this.barsVisible.set(true); barsObserver.disconnect(); }
      }),
      { threshold: 0.3 }
    );
    setTimeout(() => {
      this.revealEls.forEach(el => observer.observe(el.nativeElement));
      const skillsSection = document.querySelector('.skills-section');
      if (skillsSection) barsObserver.observe(skillsSection);
    });
  }
}
