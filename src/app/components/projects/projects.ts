import { Component, OnInit, ElementRef, QueryList, ViewChildren, inject } from '@angular/core';

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
  private el = inject(ElementRef);

  projects: Project[] = [
    {
      num: '01',
      title: 'Jeu Sérieux sur l\'Auditeur',
      description: 'Développement d\'un jeu sérieux avec le moteur Godot (GDScript) sur 15 semaines en équipe de 4. Gestion du code source avec Git et travail collaboratif.',
      tags: ['GDScript', 'Git', 'Travail d\'équipe'],
      accentTag: 'Godot',
      github: '#',
      demo: '#',
    },
    {
      num: '02',
      title: 'Jeu Bataille Navale',
      description: 'Développement d\'une application de jeu Bataille Navale en JavaFX en 5 semaines. Mise en œuvre des principes de la programmation orientée objet.',
      tags: ['JavaFX', 'POO'],
      accentTag: 'Java',
      github: '#',
      demo: '#',
    },
    {
      num: '03',
      title: 'Jeu 2048',
      description: 'Développement du jeu 2048 en C en 5 semaines en équipe de 3. Implémentation des algorithmes de déplacement et de fusion des tuiles.',
      tags: ['Algorithmes', 'Structures de données'],
      accentTag: 'C',
      github: '#',
      demo: '#',
    },
    {
      num: '04',
      title: 'Simulateur de Réseau',
      description: 'Simulation du fonctionnement d\'un réseau local Ethernet en C, développé en 5 semaines en équipe de 2.',
      tags: ['Réseau', 'Ethernet'],
      accentTag: 'C',
      github: '#',
      demo: '#',
    },
    {
      num: '05',
      title: 'Jeu de Yams',
      description: 'Développement d\'un jeu de Yams en C# avec interface HTML/CSS en 5 semaines en équipe de 2. Compréhension de la logique de jeu et de la programmation.',
      tags: ['HTML / CSS', 'Logique de jeu'],
      accentTag: 'C#',
      github: '#',
      demo: '#',
    },
    {
      num: '06',
      title: 'Donjon & Dragon',
      description: 'Création d\'un jeu de plateau Donjon & Dragon en JavaFX en 5 semaines en équipe de 3, basé sur la programmation orientée objet.',
      tags: ['JavaFX', 'POO'],
      accentTag: 'Java',
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
    setTimeout(() => {
      this.revealEls.forEach(el => observer.observe(el.nativeElement));
      this.addTilt(this.el.nativeElement.querySelectorAll('.project-card'));
    });
  }

  private addTilt(cards: NodeListOf<HTMLElement>) {
    cards.forEach(card => {
      card.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateZ(10px)`;
        const shine = card.querySelector('.card-shine') as HTMLElement;
        if (shine) {
          shine.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(124,111,255,0.22) 0%, transparent 65%)`;
        }
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        const shine = card.querySelector('.card-shine') as HTMLElement;
        if (shine) shine.style.background = '';
      });
    });
  }
}
