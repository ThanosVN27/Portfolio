import { Component, AfterViewInit, OnDestroy, ElementRef, QueryList, ViewChild, ViewChildren, signal } from '@angular/core';
import * as THREE from 'three';

interface SkillBar   { name: string; percent: number; color: string; }
interface SkillGroup { title: string; icon: string; skills: SkillBar[]; badge?: string; }

@Component({
  selector: 'app-competences-page',
  imports: [],
  templateUrl: './competences-page.html',
  styleUrl: './competences-page.scss',
})
export class CompetencesPage implements AfterViewInit, OnDestroy {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;
  @ViewChild('sphereCanvas') sphereRef!: ElementRef<HTMLCanvasElement>;
  barsVisible = signal(false);
  private sphereRenderer?: THREE.WebGLRenderer;
  private sphereAnimId!: number;

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
      title: 'Développement Web', icon: '{ }',
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
      title: 'Mobile', icon: '[ ]',
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
      title: 'Cybersécurité & Réseaux', icon: '##',
      skills: [
        { name: 'Sécurité réseau',   percent: 50, color: 'orange' },
        { name: 'Analyse Wireshark', percent: 55, color: 'orange' },
        { name: 'CTF (débutant)',    percent: 40, color: 'orange' },
        { name: 'Pentest (bases)',   percent: 35, color: 'orange' },
        { name: 'Protocoles réseau', percent: 60, color: 'orange' },
      ],
    },
    {
      title: 'DevOps & Cloud', icon: '~~', badge: 'En apprentissage',
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

  skillLevel(p: number): string {
    return p >= 70 ? 'AVANCÉ' : p >= 50 ? 'CONFIRMÉ' : 'DÉBUTANT';
  }

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
    this.initSphere();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.sphereAnimId);
    this.sphereRenderer?.dispose();
  }

  private initSphere() {
    const el = this.sphereRef?.nativeElement;
    if (!el) return;
    const size = 180;
    const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.sphereRenderer = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.z = 3.8;
    const clock = new THREE.Clock();

    // Neural network sphere — 80 skill nodes on a sphere surface
    const nodeCount = 80;
    const nodePos = new Float32Array(nodeCount * 3);
    const nodeColors = new Float32Array(nodeCount * 3);
    const palette = [
      new THREE.Color('#7c6fff'),
      new THREE.Color('#00d4ff'),
      new THREE.Color('#4ade80'),
      new THREE.Color('#ff9a3c'),
    ];
    const positions3 = Array.from({ length: nodeCount }, (_, i) => {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      const r = 1.5;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      nodePos[i * 3] = x; nodePos[i * 3 + 1] = y; nodePos[i * 3 + 2] = z;
      const c = palette[Math.floor(i / nodeCount * palette.length)];
      nodeColors[i * 3] = c.r; nodeColors[i * 3 + 1] = c.g; nodeColors[i * 3 + 2] = c.b;
      return new THREE.Vector3(x, y, z);
    });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute('color',    new THREE.BufferAttribute(nodeColors, 3));
    const nodes = new THREE.Points(nodeGeo, new THREE.PointsMaterial({
      size: 0.08, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true,
    }));
    scene.add(nodes);

    // Connection lines between nearby nodes
    const lineVerts: number[] = [];
    const maxConnDist = 0.9;
    for (let a = 0; a < positions3.length; a++) {
      for (let b = a + 1; b < positions3.length; b++) {
        if (positions3[a].distanceTo(positions3[b]) < maxConnDist) {
          lineVerts.push(positions3[a].x, positions3[a].y, positions3[a].z);
          lineVerts.push(positions3[b].x, positions3[b].y, positions3[b].z);
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVerts), 3));
    const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
      color: new THREE.Color('#7c6fff'), transparent: true, opacity: 0.14,
    }));
    scene.add(lines);

    // Outer wireframe shell
    const shellGeo  = new THREE.IcosahedronGeometry(1.85, 1);
    const shellWire = new THREE.WireframeGeometry(shellGeo);
    const shell = new THREE.LineSegments(shellWire, new THREE.LineBasicMaterial({
      color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.1,
    }));
    scene.add(shell);

    const animate = () => {
      this.sphereAnimId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      nodes.rotation.y  += 0.006;
      nodes.rotation.x  += 0.002;
      lines.rotation.y  += 0.006;
      lines.rotation.x  += 0.002;
      shell.rotation.y  -= 0.004;
      shell.rotation.z  += 0.002;
      (shell.material as THREE.LineBasicMaterial).opacity = 0.07 + Math.sin(t * 0.9) * 0.06;
      renderer.render(scene, camera);
    };
    animate();
  }
}
