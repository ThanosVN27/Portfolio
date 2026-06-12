import { Component, AfterViewInit, OnDestroy, ViewChild, ViewChildren, QueryList, ElementRef, signal } from '@angular/core';
import * as THREE from 'three';
import { FormsModule } from '@angular/forms';
import emailjs from '@emailjs/browser';

// ── EmailJS config ─────────────────────────────────────────────────────────
// 1. Crée un compte sur https://www.emailjs.com (gratuit)
// 2. Ajoute un service Gmail → copie le Service ID
// 3. Crée un template → copie le Template ID
// 4. Dans Account > API Keys → copie ta Public Key
const EJS_SERVICE  = 'YOUR_SERVICE_ID';   // ex: 'service_abc123'
const EJS_TEMPLATE = 'YOUR_TEMPLATE_ID';  // ex: 'template_xyz789'
const EJS_KEY      = 'YOUR_PUBLIC_KEY';   // ex: 'AbCdEfGhIjKlMnOp'
// ───────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-contact-page',
  imports: [FormsModule],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss',
})
export class ContactPage implements AfterViewInit, OnDestroy {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;
  @ViewChild('knotCanvas') knotRef!: ElementRef<HTMLCanvasElement>;
  private knotRenderer?: THREE.WebGLRenderer;
  private knotAnimId!: number;

  form = { name: '', email: '', message: '' };
  submitted  = signal(false);
  sending    = signal(false);
  sendError  = signal(false);
  charCount  = signal(0);

  onMessageInput(e: Event) {
    this.charCount.set((e.target as HTMLTextAreaElement).value.length);
  }

  async onSubmit() {
    if (this.sending()) return;
    this.sending.set(true);
    this.sendError.set(false);

    try {
      await emailjs.send(
        EJS_SERVICE,
        EJS_TEMPLATE,
        {
          from_name:    this.form.name,
          from_email:   this.form.email,
          message:      this.form.message,
          reply_to:     this.form.email,
        },
        { publicKey: EJS_KEY }
      );
      this.submitted.set(true);
      this.form = { name: '', email: '', message: '' };
      this.charCount.set(0);
      setTimeout(() => this.submitted.set(false), 4000);
    } catch {
      this.sendError.set(true);
      setTimeout(() => this.sendError.set(false), 4000);
    } finally {
      this.sending.set(false);
    }
  }

  ngAfterViewInit() {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    this.revealEls.forEach(el => obs.observe(el.nativeElement));
    this.initKnot();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.knotAnimId);
    this.knotRenderer?.dispose();
  }

  private initKnot() {
    const el = this.knotRef?.nativeElement;
    if (!el) return;
    const size = 180;
    const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.knotRenderer = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.z = 3.8;
    const clock = new THREE.Clock();

    // Torus knot — symbolizes connection/link
    const knotGeo  = new THREE.TorusKnotGeometry(0.9, 0.28, 80, 14, 2, 3);
    const knotWire = new THREE.WireframeGeometry(knotGeo);
    const knot = new THREE.LineSegments(knotWire, new THREE.LineBasicMaterial({
      color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.65,
    }));
    scene.add(knot);

    // Outer ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.004, 6, 80),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#7c6fff'), transparent: true, opacity: 0.3 })
    );
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    // Particles
    const pCount = 100;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 1.6 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: 0.05, color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.65, sizeAttenuation: true,
    }));
    scene.add(particles);

    const animate = () => {
      this.knotAnimId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      knot.rotation.y += 0.008;
      knot.rotation.x += 0.004;
      (knot.material as THREE.LineBasicMaterial).opacity = 0.5 + Math.sin(t * 1.2) * 0.2;
      ring.rotation.z += 0.005;
      particles.rotation.y -= 0.003;
      renderer.render(scene, camera);
    };
    animate();
  }
}
