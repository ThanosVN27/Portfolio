import { Component, OnInit, ElementRef, QueryList, ViewChildren, inject } from '@angular/core';

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
  private el = inject(ElementRef);

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
    setTimeout(() => {
      this.revealEls.forEach(el => observer.observe(el.nativeElement));
      this.addTilt(this.el.nativeElement.querySelectorAll('.skill-category'));
    });
  }

  private addTilt(cards: NodeListOf<HTMLElement>) {
    cards.forEach(card => {
      card.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 9}deg) translateZ(8px)`;
        const shine = card.querySelector('.card-shine') as HTMLElement;
        if (shine) {
          shine.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(0,212,255,0.18) 0%, transparent 65%)`;
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
