import { Component, AfterViewInit, OnDestroy, ViewChild, ViewChildren, QueryList, ElementRef, signal, computed } from '@angular/core';
import * as THREE from 'three';

interface Project {
  num: string; title: string; description: string;
  tags: string[]; accentTag: string; github: string;
  status: 'ACADÉMIQUE' | 'PERSONNEL';
  period: string; team: string;
}

@Component({
  selector: 'app-projects-page',
  imports: [],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
})
export class ProjectsPage implements AfterViewInit, OnDestroy {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;
  @ViewChild('crystalCanvas') crystalRef!: ElementRef<HTMLCanvasElement>;
  private crystalRenderer?: THREE.WebGLRenderer;
  private crystalAnimId!: number;

  activeFilter = signal('Tous');
  filters = ['Tous', 'Java', 'C', 'C#', 'Godot', 'Web', 'Android'];

  allProjects: Project[] = [
    {
      num: '01', title: 'Audit Time',
      description: 'Jeu sérieux 2D (Godot 4.5) — auditeur interne explorant une université. NPCs dynamiques, système de quêtes et scoring temps-réel.',
      tags: ['GDScript', 'Godot 4.5', 'Git'], accentTag: 'Godot', github: 'https://github.com/ThanosVN27/Projet_AuditTime',
      status: 'ACADÉMIQUE', period: '15 semaines', team: '4 pers.',
    },
    {
      num: '02', title: 'Bataille Navale',
      description: 'JavaFX — grille 10×10, 5 types de navires, armes spéciales (bombe, sonar), pièges et IA configurable.',
      tags: ['JavaFX', 'POO', 'IA'], accentTag: 'Java', github: 'https://github.com/ThanosVN27/Projet_BatailleNavaille',
      status: 'ACADÉMIQUE', period: '5 semaines', team: '2 pers.',
    },
    {
      num: '03', title: 'Jeu 2048',
      description: 'Implémentation console en C — algorithmes de déplacement, fusion des tuiles et détection de fin de partie.',
      tags: ['Algorithmes', 'Structures de données'], accentTag: 'C', github: '#',
      status: 'ACADÉMIQUE', period: '5 semaines', team: '3 pers.',
    },
    {
      num: '04', title: 'Simulateur de Réseau',
      description: 'LAN Ethernet en C — switches, trames, apprentissage MAC, Spanning Tree (Kruskal) et export topologie DOT.',
      tags: ['Réseau', 'Ethernet', 'STP', 'Kruskal'], accentTag: 'C', github: 'https://github.com/ThanosVN27/Projet_Reseau',
      status: 'ACADÉMIQUE', period: '5 semaines', team: '3 pers.',
    },
    {
      num: '05', title: 'Jeu de Yams',
      description: 'Console C# + interface web HTML/CSS/JS — scores automatiques, sauvegarde JSON et visualisation des parties.',
      tags: ['C#', 'HTML/CSS', 'JavaScript'], accentTag: 'C#', github: 'https://github.com/ThanosVN27/Projet_Yams',
      status: 'ACADÉMIQUE', period: '5 semaines', team: '2 pers.',
    },
    {
      num: '06', title: 'Donjon & Dragon',
      description: 'Dungeon crawler Java — 4 races, 4 classes, combat tour par tour aux dés, 3 niveaux et gestion d\'équipements.',
      tags: ['POO', 'Java', 'Tour par tour'], accentTag: 'Java', github: 'https://github.com/ThanosVN27/DOOnjon-Dragon-Project',
      status: 'ACADÉMIQUE', period: 'SAÉ', team: 'Solo',
    },
    {
      num: '07', title: 'POOkemon',
      description: 'Combat tour par tour inspiré de Pokémon — joueur vs IA, gestion des types, attaques et génération d\'adversaires.',
      tags: ['POO', 'IA', 'Tour par tour'], accentTag: 'Java', github: 'https://github.com/ThanosVN27/Projet_Pokemon',
      status: 'ACADÉMIQUE', period: 'SAÉ', team: 'Solo',
    },
    {
      num: '08', title: 'Gestion de Bibliothèque',
      description: 'App Android — consultation de livres via API REST, ajout et suppression d\'entrées.',
      tags: ['Android Studio', 'API REST', 'Java'], accentTag: 'Android', github: '#',
      status: 'ACADÉMIQUE', period: 'SAÉ', team: 'Solo',
    },
    {
      num: '09', title: 'Society Tycoon',
      description: 'Simulation 2D — piloter une société agricole vers le numérique sur 15 ans, ressources et événements aléatoires.',
      tags: ['SVG procédural', 'Simulation'], accentTag: 'React', github: '#',
      status: 'PERSONNEL', period: 'En cours', team: 'Solo',
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

  ngAfterViewInit() {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    this.revealEls.forEach(el => obs.observe(el.nativeElement));
    if (window.innerWidth >= 768) this.initCrystal();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.crystalAnimId);
    this.crystalRenderer?.dispose();
  }

  private initCrystal() {
    const el = this.crystalRef?.nativeElement;
    if (!el) return;
    const size = 180;
    const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.crystalRenderer = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.z = 3.5;
    const clock = new THREE.Clock();

    // Core icosahedron — cyan wireframe
    const coreGeo  = new THREE.IcosahedronGeometry(1, 1);
    const coreWire = new THREE.WireframeGeometry(coreGeo);
    const core = new THREE.LineSegments(coreWire, new THREE.LineBasicMaterial({
      color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.75,
    }));
    scene.add(core);

    // Outer octahedron cage — purple, dim
    const cageGeo  = new THREE.OctahedronGeometry(1.6, 1);
    const cageWire = new THREE.WireframeGeometry(cageGeo);
    const cage = new THREE.LineSegments(cageWire, new THREE.LineBasicMaterial({
      color: new THREE.Color('#7c6fff'), transparent: true, opacity: 0.22,
    }));
    scene.add(cage);

    // Orbit ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.005, 6, 90),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.35 })
    );
    ring.rotation.x = Math.PI / 2.8;
    scene.add(ring);

    // Particle cloud
    const pCount = 130;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 1.9 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: 0.048, color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.65, sizeAttenuation: true,
    }));
    scene.add(particles);

    const animate = () => {
      this.crystalAnimId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      core.rotation.y += 0.009;
      core.rotation.x += 0.004;
      cage.rotation.y -= 0.005;
      cage.rotation.z += 0.003;
      (core.material as THREE.LineBasicMaterial).opacity = 0.55 + Math.sin(t * 1.3) * 0.22;
      ring.rotation.z += 0.007;
      particles.rotation.y += 0.004;
      renderer.render(scene, camera);
    };
    animate();
  }
}
