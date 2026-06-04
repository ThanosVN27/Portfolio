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
    { icon: '</>', title: 'Frontend', tags: ['HTML / CSS', 'JavaScript', 'React', 'Angular', 'TypeScript'] },
    { icon: '⚙', title: 'Backend', tags: ['Python', 'Node.js', 'SQL', 'REST API'] },
    { icon: '🌐', title: 'Outils', tags: ['Git / GitHub', 'Docker', 'Linux', 'VS Code'] },
    { icon: '🧠', title: 'Soft skills', tags: ['Travail d\'équipe', 'Curiosité', 'Adaptabilité', 'Autonomie'] },
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
