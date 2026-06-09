import { Component, OnDestroy, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  typedText = signal('');
  private texts = ['Développeur Logiciel', 'Étudiant BUT Informatique', 'Fan de Jeux Vidéo'];
  private textIndex = 0;
  private charIndex = 0;
  private isDeleting = false;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private particles!: THREE.Points;
  private lines!: THREE.LineSegments;
  private rings: THREE.Mesh[] = [];
  private animId!: number;
  private mouse = { x: 0, y: 0 };
  private clock = new THREE.Clock();

  ngAfterViewInit() {
    this.initThree();
    this.typeNext();
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animId);
    if (this.typingTimer) clearTimeout(this.typingTimer);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    this.renderer?.dispose();
  }

  private typeNext() {
    const current = this.texts[this.textIndex];
    if (this.isDeleting) {
      this.typedText.set(current.substring(0, this.charIndex - 1));
      this.charIndex--;
    } else {
      this.typedText.set(current.substring(0, this.charIndex + 1));
      this.charIndex++;
    }
    let delay = this.isDeleting ? 50 : 100;
    if (!this.isDeleting && this.charIndex === current.length) {
      delay = 1800; this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.textIndex = (this.textIndex + 1) % this.texts.length;
      delay = 300;
    }
    this.typingTimer = setTimeout(() => this.typeNext(), delay);
  }

  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    this.camera.position.z = 5;
    this.particles = this.buildParticles();
    this.lines = this.buildLines();
    this.rings = this.buildRings();
    this.scene.add(this.particles);
    this.scene.add(this.lines);
    this.rings.forEach(r => this.scene.add(r));
    this.animate();
  }

  private buildParticles(): THREE.Points {
    const count = 2500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#7c6fff'),
      new THREE.Color('#00d4ff'),
      new THREE.Color('#ff6b9d'),
      new THREE.Color('#c084fc'),
    ];
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.5) * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.05, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true,
    }));
  }

  private buildLines(): THREE.LineSegments {
    const pts = this.particles.geometry.attributes['position'].array as Float32Array;
    const n = 220;
    const maxDist = 2.4;
    const linePos: number[] = [];
    const lineCol: number[] = [];
    const c1 = new THREE.Color('#7c6fff');
    const c2 = new THREE.Color('#00d4ff');
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pts[i*3]-pts[j*3], dy = pts[i*3+1]-pts[j*3+1], dz = pts[i*3+2]-pts[j*3+2];
        if (Math.sqrt(dx*dx+dy*dy+dz*dz) < maxDist) {
          linePos.push(pts[i*3], pts[i*3+1], pts[i*3+2], pts[j*3], pts[j*3+1], pts[j*3+2]);
          const c = c1.clone().lerp(c2, j / n);
          lineCol.push(c.r, c.g, c.b, c.r, c.g, c.b);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePos), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(lineCol), 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.22,
    }));
  }

  private buildRings(): THREE.Mesh[] {
    return [
      { r: 3.5, tube: 0.02,  color: '#7c6fff', rx: 0.4,  ry: 0   },
      { r: 5.2, tube: 0.012, color: '#00d4ff', rx: -0.3, ry: 0.5 },
      { r: 2.2, tube: 0.025, color: '#ff6b9d', rx: 1.1,  ry: 0.2 },
    ].map(cfg => {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.r, cfg.tube, 8, 128),
        new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.5 }),
      );
      mesh.rotation.x = cfg.rx;
      mesh.rotation.y = cfg.ry;
      return mesh;
    });
  }

  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();
    this.particles.rotation.y += 0.0006;
    this.particles.rotation.x += 0.0002;
    this.lines.rotation.y = this.particles.rotation.y;
    this.lines.rotation.x = this.particles.rotation.x;
    this.rings[0].rotation.z += 0.003;
    this.rings[1].rotation.z -= 0.0015;
    this.rings[2].rotation.y += 0.004;
    (this.rings[0].material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 0.8) * 0.2;
    (this.rings[1].material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(t * 1.1 + 1) * 0.15;
    (this.rings[2].material as THREE.MeshBasicMaterial).opacity = 0.3  + Math.sin(t * 0.6 + 2) * 0.15;
    this.camera.position.x += (this.mouse.x * 0.8 - this.camera.position.x) * 0.04;
    this.camera.position.y += (-this.mouse.y * 0.5 - this.camera.position.y) * 0.04;
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
