import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';

@Component({
  selector: 'app-contact-page',
  imports: [FormsModule],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss',
})
export class ContactPage implements AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas') bgCanvasRef!: ElementRef<HTMLCanvasElement>;

  form = { name: '', email: '', message: '' };
  submitted = signal(false);

  onSubmit() {
    this.submitted.set(true);
    setTimeout(() => {
      this.submitted.set(false);
      this.form = { name: '', email: '', message: '' };
    }, 3000);
  }

  // ── Three.js ────────────────────────────────────────────────────────────────
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private globe!: THREE.Group;
  private pulses: { mesh: THREE.Mesh; phase: number; speed: number }[] = [];
  private stars!: THREE.Points;
  private animId!: number;
  private clock = new THREE.Clock();
  private mouse = { x: 0, y: 0 };

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
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    this.camera.position.set(0, 0.5, 5.5);
    this.camera.lookAt(0, 0, 0);

    this.globe = this.buildGlobe();
    this.stars = this.buildStars();
    this.scene.add(this.globe);
    this.scene.add(this.stars);
    this.animate();
  }

  private buildGlobe(): THREE.Group {
    const g = new THREE.Group();
    const R = 1.8;

    // Dark inner sphere
    g.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.98, 48, 48),
      new THREE.MeshBasicMaterial({ color: '#060818', transparent: true, opacity: 0.95 }),
    ));

    // Dense wireframe
    g.add(new THREE.Mesh(
      new THREE.IcosahedronGeometry(R, 5),
      new THREE.MeshBasicMaterial({ color: '#7c6fff', wireframe: true, transparent: true, opacity: 0.15 }),
    ));

    // Lat/lon grid lines
    g.add(new THREE.Mesh(
      new THREE.SphereGeometry(R + 0.01, 18, 12),
      new THREE.MeshBasicMaterial({ color: '#00d4ff', wireframe: true, transparent: true, opacity: 0.08 }),
    ));

    // Atmosphere glow (outer shell)
    g.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.08, 32, 32),
      new THREE.MeshBasicMaterial({ color: '#7c6fff', transparent: true, opacity: 0.05 }),
    ));
    g.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.14, 32, 32),
      new THREE.MeshBasicMaterial({ color: '#00d4ff', transparent: true, opacity: 0.03 }),
    ));

    // Location nodes: France (48.8°N, 2.3°E) and Vietnam (16°N, 108°E)
    const locations = [
      { lat: 48.8, lon: 2.3,   color: '#7c6fff', size: 0.055 },  // France
      { lat: 16.0, lon: 108.0, color: '#ff6b9d', size: 0.05  },  // Vietnam
      { lat: 51.5, lon: -0.1,  color: '#00d4ff', size: 0.04  },  // London
      { lat: 35.7, lon: 139.7, color: '#f59e0b', size: 0.04  },  // Tokyo
      { lat: 40.7, lon: -74.0, color: '#10b981', size: 0.04  },  // New York
    ];

    const locPositions: THREE.Vector3[] = [];
    locations.forEach(loc => {
      const pos = this.latLonToVec3(loc.lat, loc.lon, R);
      locPositions.push(pos);

      const node = new THREE.Mesh(
        new THREE.SphereGeometry(loc.size, 10, 10),
        new THREE.MeshBasicMaterial({ color: loc.color }),
      );
      node.position.copy(pos);
      g.add(node);

      // Pulse rings that expand outward
      for (let p = 0; p < 3; p++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(loc.size * 2, 0.008, 6, 40),
          new THREE.MeshBasicMaterial({ color: loc.color, transparent: true, opacity: 0 }),
        );
        ring.position.copy(pos);
        ring.lookAt(pos.clone().multiplyScalar(2)); // face outward
        const phaseOffset = p / 3;
        this.pulses.push({ mesh: ring, phase: phaseOffset, speed: 0.6 });
        g.add(ring);
      }
    });

    // Arc connection from France to Vietnam
    const france  = locPositions[0];
    const vietnam = locPositions[1];
    const arcPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const t   = i / 60;
      const mid = france.clone().lerp(vietnam, t).normalize().multiplyScalar(R + 0.3 * Math.sin(t * Math.PI));
      arcPts.push(mid);
    }
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
    g.add(new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: '#ff6b9d', transparent: true, opacity: 0.6 })));

    // Orbit rings
    const orbitColors = ['#7c6fff', '#00d4ff', '#ff6b9d'];
    [2.4, 2.7, 3.0].forEach((r, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.014, 8, 100),
        new THREE.MeshBasicMaterial({ color: orbitColors[i], transparent: true, opacity: 0.3 }),
      );
      ring.rotation.x = 0.3 + i * 0.4;
      ring.rotation.y = i * 0.6;
      ring.userData['spinZ'] = (i % 2 === 0 ? 1 : -1) * 0.004;
      ring.userData['spinX'] = 0.002 * (i + 1);
      g.add(ring);
    });

    return g;
  }

  private latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
    const phi   = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta),
    );
  }

  private buildStars(): THREE.Points {
    const count = 1500;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color('#ffffff'), new THREE.Color('#7c6fff'), new THREE.Color('#00d4ff')];
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 30;
      pos[i*3+1] = (Math.random() - 0.5) * 24;
      pos[i*3+2] = (Math.random() - 0.5) * 14;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.06, vertexColors: true, transparent: true, opacity: 0.8, sizeAttenuation: true,
    }));
  }

  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();

    // Globe rotates
    this.globe.rotation.y += 0.003;

    // Spin orbit rings
    this.globe.children.forEach(child => {
      if ((child as THREE.Mesh).userData['spinZ'] !== undefined) {
        child.rotation.z += (child as THREE.Mesh).userData['spinZ'];
        child.rotation.x += (child as THREE.Mesh).userData['spinX'] || 0;
      }
    });

    // Animate pulse rings
    this.pulses.forEach(p => {
      const phase = ((t * p.speed + p.phase) % 1);
      const scale = 1 + phase * 4;
      p.mesh.scale.setScalar(scale);
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - phase) * 0.6;
    });

    this.stars.rotation.y += 0.0002;

    // Camera parallax
    this.camera.position.x += (this.mouse.x * 0.8 - this.camera.position.x) * 0.03;
    this.camera.position.y += (-this.mouse.y * 0.6 + 0.5 - this.camera.position.y) * 0.03;
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
