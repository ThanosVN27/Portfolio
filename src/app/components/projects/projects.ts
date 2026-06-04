import { Component, OnInit, ElementRef, QueryList, ViewChildren } from '@angular/core';

interface Project {
  num: string;
  title: string;
  description: string;
  tags: string[];
  accentTag: string;
  github: string;
  demo: string;
}

@Component({
  selector: 'app-projects',
  imports: [],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects implements OnInit {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;

  projects: Project[] = [
    {
      num: '01',
      title: 'Nom du Projet',
      description: 'Description courte du projet. Ce que vous avez réalisé, le problème résolu, et les technologies utilisées.',
      tags: ['Node.js', 'MongoDB'],
      accentTag: 'React',
      github: '#',
      demo: '#',
    },
    {
      num: '02',
      title: 'Deuxième Projet',
      description: 'Description courte du projet. Expliquez le contexte, vos contributions et les résultats obtenus.',
      tags: ['Flask', 'SQL'],
      accentTag: 'Python',
      github: '#',
      demo: '#',
    },
    {
      num: '03',
      title: 'Troisième Projet',
      description: 'Description courte du projet. Mettez en avant les défis techniques surmontés et les apprentissages clés.',
      tags: ['Docker', 'API REST'],
      accentTag: 'TypeScript',
      github: '#',
      demo: '#',
    },
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
