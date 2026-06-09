import { Component, AfterViewInit, OnInit, OnDestroy, ElementRef, QueryList, ViewChild, ViewChildren, signal } from '@angular/core';
import * as THREE from 'three';

interface SkillBar   { name: string; percent: number; color: string; }
interface SkillGroup { title: string; icon: string; skills: SkillBar[]; badge?: string; }

@Component({
  selector: 'app-competences-page',
  imports: [],
  templateUrl: './competences-page.html',
  styleUrl: './competences-page.scss',
})
export class CompetencesPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;
  @ViewChild('bgCanvas') bgCanvasRef!: ElementRef<HTMLCanvasElement>;
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
        { name: 'Android Studio',         percent: 55, color: 'cyan' },
        { name: 'Développement Android',  percent: 50, color: 'cyan' },
        { name: 'API REST (Android)',      percent: 55, color: 'cyan' },
        { name: 'RecyclerView / ViewModels', percent: 50, color: 'cyan' },
      ],
    },
    {
      title: 'Systèmes & Outils', icon: '⚙',
      skills: [
        { name: 'Git / GitHub / GitLab', percent: 80, color: 'pink' },
        { name: 'Linux / BASH',          percent: 65, color: 'pink' },
        { name: 'Administration Système',percent: 55, color: 'pink' },
        { name: 'Postman',               percent: 60, color: 'pink' },
      ],
    },
    {
      title: 'Cybersécurité & Réseaux', icon: '🔐',
      skills: [
        { name: 'Sécurité réseau',    percent: 50, color: 'orange' },
        { name: 'Analyse Wireshark',  percent: 55, color: 'orange' },
        { name: 'CTF (débutant)',     percent: 40, color: 'orange' },
        { name: 'Pentest (bases)',    percent: 35, color: 'orange' },
        { name: 'Protocoles réseau',  percent: 60, color: 'orange' },
      ],
    },
    {
      title: 'DevOps & Cloud', icon: '☁️', badge: 'En apprentissage',
      skills: [
        { name: 'Docker',       percent: 40, color: 'green' },
        { name: 'CI/CD',        percent: 35, color: 'green' },
        { name: 'Cloud (bases)',percent: 30, color: 'green' },
      ],
    },
  ];

  languages = [
    { name: 'Vietnamien', level: 'Langue maternelle', percent: 100, flag: '🇻🇳' },
    { name: 'Français',   level: 'Courant',            percent: 95,  flag: '🇫🇷' },
    { name: 'Anglais',    level: 'Niveau B1',          percent: 55,  flag: '🇬🇧' },
  ];

  softSkills = ['Travail d\'équipe', 'Curiosité', 'Adaptabilité', 'Rigueur', 'Autonomie'];

  // ── Three.js ────────────────────────────────────────────────────────────────
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private constellation!: THREE.Group;
  private stars!: THREE.Points;
  private animId!: number;
  private clock = new THREE.Clock();
  private mouse = { x: 0, y: 0 };

  private readonly catDefs = [
    { color: '#7c6fff', label: 'Langages',  skills: 6 },
    { color: '#00d4ff', label: 'Web',       skills: 7 },
    { color: '#ff6b9d', label: 'Mobile',    skills: 4 },
    { color: '#f59e0b', label: 'Systèmes',  skills: 4 },
    { color: '#10b981', label: 'Cyber',     skills: 5 },
    { color: '#c084fc', label: 'DevOps',    skills: 3 },
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
      { threshold: 0.2 }
    );
    setTimeout(() => {
      this.revealEls.forEach(el => observer.observe(el.nativeElement));
      const first = document.querySelector('.skills-grid-section');
      if (first) barsObserver.observe(first);
    });
  }

  ngAfterViewInit() {
    this.initThree();
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);
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
    this.camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 100);
    this.camera.position.set(0, 1.5, 8);
    this.camera.lookAt(0, 0, 0);

    this.constellation = this.buildConstellation();
    this.stars         = this.buildStars();
    this.scene.add(this.constellation);
    this.scene.add(this.stars);
    this.animate();
  }

  // ── Skill Constellation ─────────────────────────────────────────────────────
  private buildConstellation(): THREE.Group {
    const g = new THREE.Group();

    // Glowing central core
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 32, 32),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95 }),
    );
    g.add(core);

    // Pulsing halo rings around core
    [0.65, 0.9, 1.2].forEach((r, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.01, 6, 64),
        new THREE.MeshBasicMaterial({ color: '#7c6fff', transparent: true, opacity: 0.25 - i * 0.07 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.userData['haloIdx'] = i;
      g.add(ring);
    });

    const orbitRadius = 3.0;
    const nodePositions: THREE.Vector3[] = [];

    this.catDefs.forEach((cat, i) => {
      const angle = (i / this.catDefs.length) * Math.PI * 2;
      const yOff  = Math.sin(i * 1.1) * 0.7;
      const pos   = new THREE.Vector3(
        Math.cos(angle) * orbitRadius,
        yOff,
        Math.sin(angle) * orbitRadius * 0.6,
      );
      nodePositions.push(pos);

      // Category node sphere
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 20, 20),
        new THREE.MeshBasicMaterial({ color: cat.color }),
      );
      node.position.copy(pos);
      g.add(node);

      // Outer glow ring around node
      const nr = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.012, 6, 48),
        new THREE.MeshBasicMaterial({ color: cat.color, transparent: true, opacity: 0.45 }),
      );
      nr.position.copy(pos);
      nr.rotation.x = 1.2 + i * 0.3;
      nr.userData['nodeRing'] = true;
      nr.userData['speed'] = 0.012 + i * 0.004;
      g.add(nr);

      // Line from center to node
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos]);
      g.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: cat.color, transparent: true, opacity: 0.3 })));

      // Sub-skill satellites orbiting the node
      const skillCount = cat.skills;
      for (let j = 0; j < skillCount; j++) {
        const sa = (j / skillCount) * Math.PI * 2;
        const sr = 0.55;
        const sub = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshBasicMaterial({ color: cat.color, transparent: true, opacity: 0.85 }),
        );
        sub.position.set(
          pos.x + Math.cos(sa) * sr,
          pos.y + Math.sin(sa * 0.7) * 0.18,
          pos.z + Math.sin(sa) * sr,
        );
        sub.userData['orbitCx'] = pos.x;
        sub.userData['orbitCy'] = pos.y;
        sub.userData['orbitCz'] = pos.z;
        sub.userData['orbitR']  = sr;
        sub.userData['orbitA']  = sa;
        sub.userData['orbitS']  = 0.006 + j * 0.002;
        g.add(sub);
      }
    });

    // Polygon edges connecting adjacent category nodes
    for (let i = 0; i < nodePositions.length; i++) {
      const next = nodePositions[(i + 1) % nodePositions.length];
      const geo  = new THREE.BufferGeometry().setFromPoints([nodePositions[i], next]);
      g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#7c6fff', transparent: true, opacity: 0.12 })));
    }

    return g;
  }

  private buildStars(): THREE.Points {
    const count = 1200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color('#ffffff'), new THREE.Color('#7c6fff'), new THREE.Color('#00d4ff')];
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 28;
      pos[i*3+1] = (Math.random() - 0.5) * 22;
      pos[i*3+2] = (Math.random() - 0.5) * 12;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.05, vertexColors: true, transparent: true, opacity: 0.7, sizeAttenuation: true,
    }));
  }

  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();

    // Rotate whole constellation slowly
    this.constellation.rotation.y += 0.0025;

    // Animate sub-skill orbits and node rings
    this.constellation.children.forEach(child => {
      const m = child as THREE.Mesh;
      if (m.userData['nodeRing']) {
        m.rotation.z += m.userData['speed'];
        m.rotation.x += m.userData['speed'] * 0.4;
      }
      if (m.userData['orbitS'] !== undefined) {
        m.userData['orbitA'] += m.userData['orbitS'];
        const a = m.userData['orbitA'];
        const r = m.userData['orbitR'];
        m.position.set(
          m.userData['orbitCx'] + Math.cos(a) * r,
          m.userData['orbitCy'] + Math.sin(a * 0.7) * 0.18,
          m.userData['orbitCz'] + Math.sin(a) * r,
        );
      }
      if (m.userData['haloIdx'] !== undefined) {
        const mat = (m as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = 0.12 + Math.sin(t * 1.5 + m.userData['haloIdx']) * 0.1;
      }
    });

    this.stars.rotation.y += 0.0002;

    // Camera parallax
    this.camera.position.x += (this.mouse.x * 1.5 - this.camera.position.x) * 0.03;
    this.camera.position.y += (-this.mouse.y * 1 + 1.5 - this.camera.position.y) * 0.03;
    this.camera.lookAt(0, 0, 0);

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
