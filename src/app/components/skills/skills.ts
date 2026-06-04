import { Component, OnInit, ElementRef, QueryList, ViewChildren } from '@angular/core';

interface SkillCategory {
  icon: string;
  title: string;
  tags: string[];
}

@Component({
  selector: 'app-skills',
  imports: [],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
})
export class Skills implements OnInit {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;

  categories: SkillCategory[] = [
    { icon: '</>', title: 'Langages', tags: ['Python', 'Java', 'C', 'C#', 'SQL', 'Assembleur', 'MIPS32'] },
    { icon: '🌐', title: 'Développement Web', tags: ['HTML / CSS', 'PHP', 'Node.js', 'React'] },
    { icon: '🗄', title: 'Bases de données', tags: ['MySQL', 'PL/SQL'] },
    { icon: '⚙', title: 'Systèmes & Outils', tags: ['BASH', 'Administration Système', 'Git / GitHub'] },
    { icon: '🧠', title: 'Soft skills', tags: ['Travail d\'équipe', 'Curiosité', 'Adaptabilité', 'Rigueur'] },
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
