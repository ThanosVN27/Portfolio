import { Component, AfterViewInit, ElementRef, QueryList, ViewChildren, signal } from '@angular/core';

interface SkillBar   { name: string; percent: number; color: string; }
interface SkillGroup { title: string; icon: string; skills: SkillBar[]; badge?: string; }

@Component({
  selector: 'app-competences-page',
  imports: [],
  templateUrl: './competences-page.html',
  styleUrl: './competences-page.scss',
})
export class CompetencesPage implements AfterViewInit {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;
  barsVisible = signal(false);

  skillGroups: SkillGroup[] = [
    {
      title: 'Langages', icon: '</>',
      skills: [
        { name: 'C',               percent: 80, color: 'purple' },
        { name: 'Java',            percent: 75, color: 'purple' },
        { name: 'Python',          percent: 65, color: 'purple' },
        { name: 'C#',              percent: 60, color: 'purple' },
        { name: 'SQL / PL-SQL',    percent: 65, color: 'purple' },
        { name: 'Assembleur MIPS32', percent: 45, color: 'purple' },
      ],
    },
    {
      title: 'Développement Web', icon: '🌐',
      skills: [
        { name: 'HTML / CSS',     percent: 75, color: 'cyan' },
        { name: 'Angular',        percent: 60, color: 'cyan' },
        { name: 'TypeScript',     percent: 60, color: 'cyan' },
        { name: 'React',          percent: 55, color: 'cyan' },
        { name: 'Node.js',        percent: 55, color: 'cyan' },
        { name: 'PHP',            percent: 50, color: 'cyan' },
        { name: 'MySQL / SQLite', percent: 65, color: 'cyan' },
      ],
    },
    {
      title: 'Mobile', icon: '📱',
      skills: [
        { name: 'Android Studio',           percent: 55, color: 'cyan' },
        { name: 'Développement Android',    percent: 50, color: 'cyan' },
        { name: 'API REST (Android)',        percent: 55, color: 'cyan' },
        { name: 'RecyclerView / ViewModels',percent: 50, color: 'cyan' },
      ],
    },
    {
      title: 'Systèmes & Outils', icon: '⚙',
      skills: [
        { name: 'Git / GitHub / GitLab',  percent: 80, color: 'pink' },
        { name: 'Linux / BASH',           percent: 65, color: 'pink' },
        { name: 'Administration Système', percent: 55, color: 'pink' },
        { name: 'Postman',                percent: 60, color: 'pink' },
      ],
    },
    {
      title: 'Cybersécurité & Réseaux', icon: '🔐',
      skills: [
        { name: 'Sécurité réseau',   percent: 50, color: 'orange' },
        { name: 'Analyse Wireshark', percent: 55, color: 'orange' },
        { name: 'CTF (débutant)',    percent: 40, color: 'orange' },
        { name: 'Pentest (bases)',   percent: 35, color: 'orange' },
        { name: 'Protocoles réseau', percent: 60, color: 'orange' },
      ],
    },
    {
      title: 'DevOps & Cloud', icon: '☁️', badge: 'En apprentissage',
      skills: [
        { name: 'Docker',        percent: 40, color: 'green' },
        { name: 'CI/CD',         percent: 35, color: 'green' },
        { name: 'Cloud (bases)', percent: 30, color: 'green' },
      ],
    },
  ];

  languages = [
    { name: 'Vietnamien', level: 'Langue maternelle', percent: 100, flag: '🇻🇳' },
    { name: 'Français',   level: 'Courant',            percent: 95,  flag: '🇫🇷' },
    { name: 'Anglais',    level: 'Niveau B1',          percent: 55,  flag: '🇬🇧' },
  ];

  softSkills = ['Travail d\'équipe', 'Curiosité', 'Adaptabilité', 'Rigueur', 'Autonomie'];

  ngAfterViewInit() {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    this.revealEls.forEach(el => obs.observe(el.nativeElement));

    const barsObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { this.barsVisible.set(true); barsObs.disconnect(); } },
      { threshold: 0.2 }
    );
    const firstSection = document.querySelector('.content-section');
    if (firstSection) barsObs.observe(firstSection);
  }
}
