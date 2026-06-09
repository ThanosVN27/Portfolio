import { Component, AfterViewInit, OnInit, OnDestroy, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import * as THREE from 'three';

interface TimelineItem { year: string; title: string; school: string; current: boolean; }

@Component({
  selector: 'app-about-page',
  imports: [],
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss',
})
export class AboutPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;
  @ViewChild('bgCanvas') bgCanvasRef!: ElementRef<HTMLCanvasElement>;

  timeline: TimelineItem[] = [
    { year: '2025 – 2026', title: 'BUT Informatique — 2e année', school: 'IUT Robert Schumann, Illkirch', current: true },
    { year: '2023 – 2025', title: 'BUT Informatique — 1re année', school: 'IUT Robert Schumann, Illkirch', current: false },
    { year: '2023', title: 'Baccalauréat STI2D — Option SIN', school: 'Lycée Marc Bloch, Strasbourg', current: false },
  ];

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private dna!: THREE.Group;
  private floaters!: THREE.Group;
  private particles!: THREE.Points;
  private animId!: number;
  private clock = new THREE.Clock();
  private mouse = { x: 0, y: 0 };

  ngOnInit() {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    setTimeout(() => this.revealEls.forEach(el => observer.observe(el.nativeElement)));
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
    this.scene   = new THREE.Scene();
    this.camera  = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    this.camera.position.set(3.5, 0, 7);
    this.camera.lookAt(0, 0, 0);

    this.dna      = this.buildDNA();
    this.floaters = this.buildFloaters();
    this.particles = this.buildParticles();

    this.dna.position.set(2.5, 0, 0);
    this.scene.add(this.dna);
    this.scene.add(this.floaters);
    this.scene.add(this.particles);
    this.animate();
  }

  // ── DNA Double Helix ────────────────────────────────────────────────────────
  private buildDNA(): THREE.Group {
    const g = new THREE.Group();
    const steps = 60;
    const radius = 1.4;
    const totalHeight = 9;
    const pos1: THREE.Vector3[] = [];
    const pos2: THREE.Vector3[] = [];

    for (let i = 0; i < steps; i++) {
      const t     = i / (steps - 1);
      const angle = t * Math.PI * 6;       // 3 full turns
      const y     = (t - 0.5) * totalHeight;

      const p1 = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      const p2 = new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);
      pos1.push(p1);
      pos2.push(p2);

      // Nucleotide beads on strand 1
      const c1 = i % 2 === 0 ? '#7c6fff' : '#c084fc';
      const bead1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 10),
        new THREE.MeshBasicMaterial({ color: c1 }),
      );
      bead1.position.copy(p1);
      g.add(bead1);

      // Nucleotide beads on strand 2
      const c2 = i % 2 === 0 ? '#00d4ff' : '#ff6b9d';
      const bead2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 10),
        new THREE.MeshBasicMaterial({ color: c2 }),
      );
      bead2.position.copy(p2);
      g.add(bead2);

      // Base pair rungs every 4 steps
      if (i % 4 === 0) {
        const mid = p1.clone().lerp(p2, 0.5);
        // Left rung
        const lg1 = new THREE.BufferGeometry().setFromPoints([p1, mid]);
        g.add(new THREE.Line(lg1, new THREE.LineBasicMaterial({ color: c1, transparent: true, opacity: 0.6 })));
        // Right rung
        const lg2 = new THREE.BufferGeometry().setFromPoints([mid, p2]);
        g.add(new THREE.Line(lg2, new THREE.LineBasicMaterial({ color: c2, transparent: true, opacity: 0.6 })));
      }
    }

    // Backbone strands as smooth tubes
    const tube1 = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pos1), 120, 0.025, 8, false);
    g.add(new THREE.Mesh(tube1, new THREE.MeshBasicMaterial({ color: '#7c6fff', transparent: true, opacity: 0.75 })));

    const tube2 = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pos2), 120, 0.025, 8, false);
    g.add(new THREE.Mesh(tube2, new THREE.MeshBasicMaterial({ color: '#00d4ff', transparent: true, opacity: 0.75 })));

    return g;
  }

  // ── Small floating shapes around the DNA ────────────────────────────────────
  private buildFloaters(): THREE.Group {
    const g = new THREE.Group();
    const colors = ['#7c6fff', '#00d4ff', '#ff6b9d', '#c084fc', '#f59e0b'];
    for (let i = 0; i < 18; i++) {
      const size  = Math.random() * 0.15 + 0.06;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mesh  = new THREE.Mesh(
        new THREE.OctahedronGeometry(size, 0),
        new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: Math.random() * 0.5 + 0.3 }),
      );
      mesh.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 6,
      );
      mesh.userData['rx'] = (Math.random() - 0.5) * 0.018;
      mesh.userData['ry'] = (Math.random() - 0.5) * 0.018;
      g.add(mesh);
    }
    return g;
  }

  // ── Background star particles ────────────────────────────────────────────────
  private buildParticles(): THREE.Points {
    const count = 900;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color('#7c6fff'), new THREE.Color('#00d4ff'), new THREE.Color('#ff6b9d'), new THREE.Color('#ffffff')];
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 24;
      pos[i*3+1] = (Math.random() - 0.5) * 20;
      pos[i*3+2] = (Math.random() - 0.5) * 10;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.05, vertexColors: true, transparent: true, opacity: 0.75, sizeAttenuation: true,
    }));
  }

  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();

    // DNA rotates
    this.dna.rotation.y = t * 0.22;

    // Floaters spin individually
    this.floaters.children.forEach(child => {
      const m = child as THREE.Mesh;
      m.rotation.x += m.userData['rx'];
      m.rotation.y += m.userData['ry'];
    });

    this.particles.rotation.y += 0.00025;

    // Camera parallax
    this.camera.position.x += (this.mouse.x * 1.2 + 3.5 - this.camera.position.x) * 0.025;
    this.camera.position.y += (-this.mouse.y * 0.8 - this.camera.position.y) * 0.025;
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
