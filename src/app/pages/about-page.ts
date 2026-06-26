import { Component, AfterViewInit, OnDestroy, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import * as THREE from 'three';

interface TimelineItem { year: string; title: string; school: string; current: boolean; }

@Component({
  selector: 'app-about-page',
  imports: [],
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss',
})
export class AboutPage implements AfterViewInit, OnDestroy {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;
  @ViewChild('dodecCanvas') dodecRef!: ElementRef<HTMLCanvasElement>;
  private dodecRenderer?: THREE.WebGLRenderer;
  private dodecAnimId!: number;

  timeline: TimelineItem[] = [
    { year: '2025 – 2026', title: 'BUT Informatique — 2e année', school: 'IUT Robert Schumann, Illkirch', current: true },
    { year: '2023 – 2025', title: 'BUT Informatique — 1re année', school: 'IUT Robert Schumann, Illkirch', current: false },
    { year: '2023', title: 'Baccalauréat STI2D — Option SIN', school: 'Lycée Marc Bloch, Strasbourg', current: false },
  ];

  ngAfterViewInit() {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    this.revealEls.forEach(el => obs.observe(el.nativeElement));
    this.initDodec();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.dodecAnimId);
    this.dodecRenderer?.dispose();
  }

  private initDodec() {
    const el = this.dodecRef?.nativeElement;
    if (!el) return;
    const size = 180;
    const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.dodecRenderer = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.z = 3.5;
    const clock = new THREE.Clock();

    // Dodecahedron — 12-faced wireframe, purple tones
    const dodGeo  = new THREE.DodecahedronGeometry(1.1, 0);
    const dodWire = new THREE.WireframeGeometry(dodGeo);
    const dodec = new THREE.LineSegments(dodWire, new THREE.LineBasicMaterial({
      color: new THREE.Color('#a78bfa'), transparent: true, opacity: 0.72,
    }));
    scene.add(dodec);

    // Inner icosahedron — cyan, smaller
    const innerGeo  = new THREE.IcosahedronGeometry(0.65, 0);
    const innerWire = new THREE.WireframeGeometry(innerGeo);
    const inner = new THREE.LineSegments(innerWire, new THREE.LineBasicMaterial({
      color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.55,
    }));
    scene.add(inner);

    // Two orbit rings
    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(1.65, 0.005, 6, 80),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#7c6fff'), transparent: true, opacity: 0.35 })
    );
    ringA.rotation.x = Math.PI / 3;
    scene.add(ringA);

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(1.85, 0.004, 6, 80),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#a78bfa'), transparent: true, opacity: 0.2 })
    );
    ringB.rotation.x = Math.PI / 5;
    ringB.rotation.z = Math.PI / 4;
    scene.add(ringB);

    // Floating particles
    const pCount = 100;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 1.7 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: 0.05, color: new THREE.Color('#a78bfa'), transparent: true, opacity: 0.7, sizeAttenuation: true,
    }));
    scene.add(particles);

    const animate = () => {
      this.dodecAnimId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      dodec.rotation.y += 0.007;
      dodec.rotation.x += 0.003;
      inner.rotation.y -= 0.012;
      inner.rotation.z += 0.005;
      (dodec.material as THREE.LineBasicMaterial).opacity = 0.58 + Math.sin(t * 1.1) * 0.18;
      ringA.rotation.z += 0.007;
      ringB.rotation.y += 0.005;
      particles.rotation.y -= 0.003;
      renderer.render(scene, camera);
    };
    animate();
  }
}
