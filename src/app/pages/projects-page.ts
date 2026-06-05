import { Component, signal, computed } from '@angular/core';

interface Project {
  num: string; title: string; description: string;
  tags: string[]; accentTag: string; github: string;
}

@Component({
  selector: 'app-projects-page',
  imports: [],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
})
export class ProjectsPage {
  activeFilter = signal('Tous');

  filters = ['Tous', 'Java', 'C', 'C#', 'Godot', 'Web', 'Android'];

  allProjects: Project[] = [
    {
      num: '01', title: 'Jeu Sérieux sur l\'Auditeur',
      description: 'Jeu sérieux développé avec Godot (GDScript) sur 15 semaines en équipe de 4. Gestion du code source avec Git et collaboration.',
      tags: ['GDScript', 'Git', 'Travail d\'équipe'], accentTag: 'Godot', github: '#',
    },
    {
      num: '02', title: 'Jeu Bataille Navale',
      description: 'Application JavaFX de Bataille Navale en 5 semaines en équipe de 2. Mise en œuvre des principes de la programmation orientée objet.',
      tags: ['JavaFX', 'POO'], accentTag: 'Java', github: '#',
    },
    {
      num: '03', title: 'Jeu 2048',
      description: 'Implémentation du jeu 2048 en C en 5 semaines en équipe de 3. Algorithmes de déplacement et de fusion des tuiles.',
      tags: ['Algorithmes', 'Structures de données'], accentTag: 'C', github: '#',
    },
    {
      num: '04', title: 'Simulateur de Réseau',
      description: 'Simulation d\'un réseau local Ethernet en C en 5 semaines en équipe de 2. Gestion des trames et du protocole.',
      tags: ['Réseau', 'Ethernet'], accentTag: 'C', github: '#',
    },
    {
      num: '05', title: 'Jeu de Yams',
      description: 'Jeu de Yams en C# avec interface HTML/CSS en 5 semaines en équipe de 2. Logique de jeu et interface web.',
      tags: ['HTML/CSS', 'Logique de jeu'], accentTag: 'C#', github: '#',
    },
    {
      num: '06', title: 'Donjon & Dragon',
      description: 'Jeu de plateau en JavaFX en 5 semaines en équipe de 3. Création d\'un jeu basé sur la programmation orientée objet.',
      tags: ['JavaFX', 'POO'], accentTag: 'Java', github: '#',
    },
    {
      num: '07', title: 'POOkemon Project',
      description: 'Jeu de combat au tour par tour inspiré de Pokémon, en ligne de commande. Joueur humain vs IA — gestion des éléments, attaques, stratégie et génération aléatoire des Pokémons.',
      tags: ['POO', 'IA', 'Tour par tour'], accentTag: 'Java', github: '#',
    },
    {
      num: '08', title: 'P42 — Programmation Mobile',
      description: 'Application Android développée avec Android Studio. Fragments, requêtes HTTP, navigation, ViewModels et RecyclerView. Projet de SAE évalué sur 7 semaines.',
      tags: ['Android Studio', 'Fragments', 'HTTP'], accentTag: 'Android', github: '#',
    },
  ];

  filtered = computed(() => {
    const f = this.activeFilter();
    if (f === 'Tous') return this.allProjects;
    if (f === 'Web') return this.allProjects.filter(p => p.tags.some(t => t.includes('HTML') || t.includes('Web')));
    if (f === 'Android') return this.allProjects.filter(p => p.accentTag === 'Android' || p.tags.some(t => t.includes('Android')));
    return this.allProjects.filter(p => p.accentTag === f || p.tags.includes(f));
  });

  setFilter(f: string) { this.activeFilter.set(f); }
}
