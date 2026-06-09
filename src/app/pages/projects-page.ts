import { Component, AfterViewInit, OnDestroy, ViewChild, ViewChildren, QueryList, ElementRef, signal, computed } from '@angular/core';
import * as THREE from 'three';

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
export class ProjectsPage implements AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas') bgCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;

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
      description: 'Jeu de combat au tour par tour inspiré de Pokémon. Joueur humain vs IA — gestion des éléments, attaques, stratégie et génération aléatoire.',
      tags: ['POO', 'IA', 'Tour par tour'], accentTag: 'Java', github: '#',
    },
    {
      num: '08', title: 'Gestion de Bibliothèque',
      description: 'Application Android de gestion de bibliothèque. Consultation de livres et auteurs via une API REST distante. Ajout et suppression.',
      tags: ['Android Studio', 'API REST', 'Java'], accentTag: 'Android', github: '#',
    },
    {
      num: '09', title: 'Society Tycoon',
      description: 'Jeu de simulation éducatif 2D : piloter la transition d\'une société agricole vers une société technologique sur 15 ans.',
      tags: ['SVG procédural', 'Simulation', 'Éducatif'], accentTag: 'React', github: '#',
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

  // ── Three.js ────────────────────────────────────────────────────────────────
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private debris!: THREE.Group;
  private stars!: THREE.Points;
  private wormholes: THREE.Mesh[] = [];
  private animId!: number;
  private clock = new THREE.Clock();
  private mouse = { x: 0, y: 0 };

  ngAfterViewInit() {
    this.initThree();
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);
    setTimeout(() => {
      const obs = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      this.revealEls.forEach(el => obs.observe(el.nativeElement));
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    this.renderer?.dispose();
  }

  private initThree() {
    const canvas = this.bgCanvasRef.nativeElement;
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100);
    this.camera.position.set(0, 0, 6);

    this.debris    = this.buildDebris();
    this.stars     = this.buildStars();
    this.wormholes = this.buildWormholes();

    this.scene.add(this.debris);
    this.scene.add(this.stars);
    this.wormholes.forEach(wh => this.scene.add(wh));
    this.animate();
  }

  // ── Floating wireframe debris ────────────────────────────────────────────────
  private buildDebris(): THREE.Group {
    const g = new THREE.Group();
    const colors  = ['#7c6fff', '#00d4ff', '#ff6b9d', '#c084fc', '#f59e0b'];
    const shapes  = [
      () => new THREE.IcosahedronGeometry(1, 0),
      () => new THREE.OctahedronGeometry(1, 0),
      () => new THREE.TetrahedronGeometry(1, 0),
    ];
    for (let i = 0; i < 30; i++) {
      const size  = Math.random() * 0.22 + 0.06;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shapeFactory = shapes[Math.floor(Math.random() * shapes.length)];
      const geo   = shapeFactory();
      geo.scale(size, size, size);
      const mesh  = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          color,
          wireframe: true,
          transparent: true,
          opacity: Math.random() * 0.55 + 0.2,
        }),
      );
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8 - 2,
      );
      mesh.userData['rx'] = (Math.random() - 0.5) * 0.016;
      mesh.userData['ry'] = (Math.random() - 0.5) * 0.016;
      mesh.userData['dx'] = (Math.random() - 0.5) * 0.003;
      mesh.userData['dy'] = (Math.random() - 0.5) * 0.002;
      g.add(mesh);
    }
    return g;
  }

  // ── Star field ───────────────────────────────────────────────────────────────
  private buildStars(): THREE.Points {
    const count = 2000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#7c6fff'),
      new THREE.Color('#00d4ff'),
      new THREE.Color('#ff6b9d'),
    ];
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 35;
      pos[i*3+1] = (Math.random() - 0.5) * 28;
      pos[i*3+2] = (Math.random() - 0.5) * 15;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.055, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true,
    }));
  }

  // ── Wormhole portal rings ────────────────────────────────────────────────────
  private buildWormholes(): THREE.Mesh[] {
    const whs: THREE.Mesh[] = [];
    const configs = [
      { r: 2.0, pos: [-5, 2, -4], color: '#7c6fff' },
      { r: 1.5, pos: [5, -1, -5],  color: '#00d4ff' },
      { r: 1.2, pos: [0, -4, -3],  color: '#ff6b9d' },
    ];
    configs.forEach(cfg => {
      for (let ring = 0; ring < 4; ring++) {
        const mesh = new THREE.Mesh(
          new THREE.TorusGeometry(cfg.r - ring * 0.12, 0.018, 8, 80),
          new THREE.MeshBasicMaterial({
            color: cfg.color,
            transparent: true,
            opacity: 0.4 - ring * 0.08,
          }),
        );
        mesh.position.set(...cfg.pos as [number, number, number]);
        mesh.rotation.x = Math.PI / 2 + Math.random() * 0.3;
        mesh.userData['spinZ'] = (ring % 2 === 0 ? 1 : -1) * (0.008 + ring * 0.003);
        mesh.userData['color'] = cfg.color;
        whs.push(mesh);
      }
    });
    return whs;
  }

  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();

    // Spin & drift debris
    this.debris.children.forEach(child => {
      const m = child as THREE.Mesh;
      m.rotation.x += m.userData['rx'];
      m.rotation.y += m.userData['ry'];
      m.position.x += m.userData['dx'];
      m.position.y += m.userData['dy'];
      // Wrap around
      if (Math.abs(m.position.x) > 9) m.userData['dx'] *= -1;
      if (Math.abs(m.position.y) > 7) m.userData['dy'] *= -1;
    });

    // Stars very gently drift
    this.stars.rotation.y += 0.00015;
    this.stars.rotation.x += 0.00005;

    // Spin wormhole rings + pulse opacity
    this.wormholes.forEach((wh, i) => {
      wh.rotation.z += wh.userData['spinZ'];
      wh.rotation.x += wh.userData['spinZ'] * 0.3;
      const mat = wh.material as THREE.MeshBasicMaterial;
      const base = 0.4 - (i % 4) * 0.08;
      mat.opacity = base * (0.7 + Math.sin(t * 1.4 + i * 0.4) * 0.3);
    });

    // Camera parallax
    this.camera.position.x += (this.mouse.x * 0.6 - this.camera.position.x) * 0.03;
    this.camera.position.y += (-this.mouse.y * 0.4 - this.camera.position.y) * 0.03;
    this.camera.lookAt(this.scene.position);

    this.renderer.render(this.scene, this.camera);
  };

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  private onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}
