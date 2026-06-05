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
  private animId!: number;
  private mouse = { x: 0, y: 0 };

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

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    this.camera.position.z = 4;
    this.particles = this.buildParticles();
    this.scene.add(this.particles);
    this.animate();
  }

  private buildParticles(): THREE.Points {
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [new THREE.Color('#7c6fff'), new THREE.Color('#00d4ff'), new THREE.Color('#ff6b9d')];
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true }));
  }

  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);
    this.particles.rotation.y += 0.0008;
    this.particles.rotation.x += 0.0003;
    this.camera.position.x += (this.mouse.x * 0.5 - this.camera.position.x) * 0.04;
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
