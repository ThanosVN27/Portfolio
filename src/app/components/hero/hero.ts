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
  private texts = ['Développeur Full-Stack', 'Passionné Cybersécurité', 'DevOps & Cloud Explorer', 'Créateur d\'expériences web'];
  private textIndex = 0;
  private charIndex = 0;
  private isDeleting = false;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private coreLines!: THREE.LineSegments;
  private outerLines!: THREE.LineSegments;
  private particles!: THREE.Points;
  private rings: THREE.Mesh[] = [];
  private orbs: { mesh: THREE.LineSegments; angle: number; radius: number; speed: number; incline: number }[] = [];
  private animId!: number;
  private mouse = { x: 0, y: 0 };
  private clock = new THREE.Clock();
  private sonarPulses: { mesh: THREE.Mesh; phase: number }[] = [];
  private constellationLines!: THREE.LineSegments;
  private innerCloud!: THREE.Points;

  ngAfterViewInit() {
    if (window.innerWidth >= 768) this.initThree();
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
    let delay = this.isDeleting ? 48 : 88;
    if (!this.isDeleting && this.charIndex === current.length) {
      delay = 2200; this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.textIndex = (this.textIndex + 1) % this.texts.length;
      delay = 400;
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
    this.camera = new THREE.PerspectiveCamera(62, w / h, 0.1, 1000);
    this.camera.position.z = 5;

    // Central wireframe icosahedron — cyan glow core
    const coreGeo  = new THREE.IcosahedronGeometry(1.65, 1);
    const coreWire = new THREE.WireframeGeometry(coreGeo);
    this.coreLines = new THREE.LineSegments(coreWire, new THREE.LineBasicMaterial({
      color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.68,
    }));
    this.scene.add(this.coreLines);

    // Outer cage — octahedron, purple, dim
    const outerGeo  = new THREE.OctahedronGeometry(2.55, 2);
    const outerWire = new THREE.WireframeGeometry(outerGeo);
    this.outerLines = new THREE.LineSegments(outerWire, new THREE.LineBasicMaterial({
      color: new THREE.Color('#7c6fff'), transparent: true, opacity: 0.14,
    }));
    this.scene.add(this.outerLines);

    // Orbit rings
    [
      { r: 2.85, tube: 0.008, color: '#00d4ff', rx: Math.PI / 2,   ry: 0,           rz: 0           },
      { r: 3.3,  tube: 0.005, color: '#00d4ff', rx: Math.PI / 3.5, ry: Math.PI / 5, rz: 0           },
      { r: 2.4,  tube: 0.01,  color: '#7c6fff', rx: 0,             ry: Math.PI / 3, rz: Math.PI / 4 },
    ].forEach(cfg => {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.r, cfg.tube, 8, 120),
        new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.4 })
      );
      mesh.rotation.set(cfg.rx, cfg.ry, cfg.rz);
      this.rings.push(mesh);
      this.scene.add(mesh);
    });

    // Background star particles
    this.particles = this.buildParticles();
    this.scene.add(this.particles);

    // Floating data orbs — small wireframe icosahedrons orbiting the core
    const orbCfgs = [
      { r: 3.8, speed:  0.38, incline: 0.5,  color: '#00d4ff', size: 0.22 },
      { r: 4.6, speed: -0.24, incline: 1.2,  color: '#7c6fff', size: 0.16 },
      { r: 5.3, speed:  0.15, incline: 2.1,  color: '#00d4ff', size: 0.13 },
      { r: 3.3, speed: -0.52, incline: 0.9,  color: '#a78bfa', size: 0.11 },
      { r: 4.1, speed:  0.42, incline: 1.7,  color: '#38bdf8', size: 0.14 },
    ];
    orbCfgs.forEach((cfg, i) => {
      const geo  = new THREE.IcosahedronGeometry(cfg.size, 0);
      const wire = new THREE.WireframeGeometry(geo);
      const mesh = new THREE.LineSegments(wire, new THREE.LineBasicMaterial({
        color: new THREE.Color(cfg.color), transparent: true, opacity: 0.75,
      }));
      this.scene.add(mesh);
      this.orbs.push({ mesh, angle: (i / orbCfgs.length) * Math.PI * 2, radius: cfg.r, speed: cfg.speed, incline: cfg.incline });
    });

    // Sonar pulse rings — 4 horizontal flat rings that expand outward from the core
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.004, 6, 80),
        new THREE.MeshBasicMaterial({ color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0 })
      );
      ring.rotation.x = Math.PI / 2;
      this.sonarPulses.push({ mesh: ring, phase: (i / 4) * Math.PI * 2 });
      this.scene.add(ring);
    }

    // Dynamic constellation lines between nearby orbs
    const conGeo = new THREE.BufferGeometry();
    const conPos = new Float32Array(10 * 2 * 3);
    conGeo.setAttribute('position', new THREE.BufferAttribute(conPos, 3));
    this.constellationLines = new THREE.LineSegments(conGeo, new THREE.LineBasicMaterial({
      color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.12,
    }));
    this.scene.add(this.constellationLines);

    // Inner particle cloud — dense near core, breathes with the icosahedron
    const innerCount = 450;
    const iPos = new Float32Array(innerCount * 3);
    for (let i = 0; i < innerCount; i++) {
      const r = 0.8 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      iPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      iPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      iPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const innerGeo = new THREE.BufferGeometry();
    innerGeo.setAttribute('position', new THREE.BufferAttribute(iPos, 3));
    this.innerCloud = new THREE.Points(innerGeo, new THREE.PointsMaterial({
      size: 0.015, color: new THREE.Color('#00d4ff'), transparent: true, opacity: 0.32, sizeAttenuation: true,
    }));
    this.scene.add(this.innerCloud);

    this.animate();
  }

  private buildParticles(): THREE.Points {
    const count   = 1800;
    const pos     = new Float32Array(count * 3);
    const col     = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#00d4ff'),
      new THREE.Color('#00d4ff'),
      new THREE.Color('#7c6fff'),
      new THREE.Color('#c0d8ff'),
    ];
    for (let i = 0; i < count; i++) {
      const r     = 3.5 + Math.random() * 7;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.042, vertexColors: true, transparent: true, opacity: 0.72, sizeAttenuation: true,
    }));
  }

  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();

    // Core — slow rotation + opacity breathe
    this.coreLines.rotation.y += 0.0028;
    this.coreLines.rotation.x += 0.001;
    (this.coreLines.material as THREE.LineBasicMaterial).opacity = 0.5 + Math.sin(t * 0.9) * 0.22;

    // Outer cage — opposite direction
    this.outerLines.rotation.y -= 0.0013;
    this.outerLines.rotation.z += 0.0007;

    // Rings
    this.rings[0].rotation.z += 0.002;
    this.rings[1].rotation.z -= 0.0011;
    this.rings[2].rotation.y += 0.0024;
    (this.rings[0].material as THREE.MeshBasicMaterial).opacity = 0.28 + Math.sin(t * 0.7) * 0.18;
    (this.rings[1].material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(t * 1.1 + 1) * 0.12;

    // Stars drift
    this.particles.rotation.y += 0.00025;

    // Floating data orbs
    this.orbs.forEach(orb => {
      orb.angle += orb.speed * 0.007;
      orb.mesh.position.x = Math.cos(orb.angle) * orb.radius;
      orb.mesh.position.y = Math.sin(orb.incline + orb.angle * 0.3) * 1.4;
      orb.mesh.position.z = Math.sin(orb.angle) * orb.radius * 0.55;
      orb.mesh.rotation.y += 0.025;
      orb.mesh.rotation.x += 0.018;
    });

    // Sonar pulses — expand outward, fade quadratically
    this.sonarPulses.forEach(sp => {
      const s = ((t * 0.42 + sp.phase) % (Math.PI * 2)) / (Math.PI * 2);
      sp.mesh.scale.setScalar(0.4 + s * 8);
      (sp.mesh.material as THREE.MeshBasicMaterial).opacity = 0.38 * Math.pow(1 - s, 2);
    });

    // Constellation lines — connect orbs within range each frame
    if (this.constellationLines) {
      const conAttr = this.constellationLines.geometry.attributes['position'] as THREE.BufferAttribute;
      let li = 0;
      for (let a = 0; a < this.orbs.length && li < 10; a++) {
        for (let b = a + 1; b < this.orbs.length && li < 10; b++) {
          const pa = this.orbs[a].mesh.position;
          const pb = this.orbs[b].mesh.position;
          if (pa.distanceTo(pb) < 4.5) {
            conAttr.setXYZ(li * 2, pa.x, pa.y, pa.z);
            conAttr.setXYZ(li * 2 + 1, pb.x, pb.y, pb.z);
            li++;
          }
        }
      }
      for (let k = li; k < 10; k++) { conAttr.setXYZ(k * 2, 0, 0, 0); conAttr.setXYZ(k * 2 + 1, 0, 0, 0); }
      conAttr.needsUpdate = true;
    }

    // Inner cloud — counter-rotate, pulse with core
    if (this.innerCloud) {
      this.innerCloud.rotation.y -= 0.003;
      this.innerCloud.rotation.x += 0.0015;
      (this.innerCloud.material as THREE.PointsMaterial).opacity = 0.2 + Math.sin(t * 1.9) * 0.14;
    }

    // Subtle mouse parallax
    this.camera.position.x += (this.mouse.x * 0.3 - this.camera.position.x) * 0.025;
    this.camera.position.y += (-this.mouse.y * 0.2 - this.camera.position.y) * 0.025;
    this.camera.lookAt(this.scene.position);

    this.renderer.render(this.scene, this.camera);
  };

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
    this.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  private onResize = () => {
    if (!this.renderer) return;
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}
