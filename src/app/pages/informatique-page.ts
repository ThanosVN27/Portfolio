import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-informatique-page',
  imports: [],
  templateUrl: './informatique-page.html',
  styleUrl: './informatique-page.scss',
})
export class InformatiquePage implements AfterViewInit, OnDestroy {
  @ViewChild('matrixCanvas') matrixRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sphereCanvas') sphereRef!: ElementRef<HTMLCanvasElement>;

  private matrixCtx!: CanvasRenderingContext2D;
  private matrixId!: number;
  private drops: number[] = [];
  private readonly fontSize = 14;
  private readonly chars = 'アイウエオカキクケコサシスセソタチツテトナ0123456789ABCDEF<>{}[]();=+-*/#';

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private globe!: THREE.Group;
  private sphereId!: number;
  private mouse = { x: 0, y: 0 };

  visibleLines = signal<string[]>([]);

  private terminalLines = [
    '> Initialisation du système...',
    '> Chargement des modules [██████████] 100%',
    '> Connexion réseau établie — latence: 2ms',
    '> Scan des ports terminé — 0 vulnérabilité détectée',
    '> Authentification réussie ✓',
    '> Bienvenue, développeur.',
  ];

  concepts = [
    { icon: '🧮', title: 'Algorithmique',    desc: 'Tri, Graphes, DP, Complexité O(n log n)', color: '#00ff41' },
    { icon: '🌐', title: 'Réseaux',          desc: 'TCP/IP, OSI, DNS, HTTP, WebSocket',       color: '#00d4ff' },
    { icon: '🔐', title: 'Sécurité',         desc: 'Chiffrement RSA, SSL/TLS, Auth 2FA',      color: '#ff6b9d' },
    { icon: '🗄️', title: 'Bases de données', desc: 'SQL, PL/SQL, NoSQL, Indexation B-Tree',    color: '#7c6fff' },
    { icon: '⚙️', title: 'Systèmes',         desc: 'Processus, Mémoire, Scheduling, BASH',    color: '#f59e0b' },
    { icon: '🤖', title: 'Dev logiciel',     desc: 'POO, Patrons, Tests, CI/CD, Git',         color: '#10b981' },
  ];

  ngAfterViewInit() {
    this.initMatrix();
    this.initSphere();
    this.runTerminal();
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.matrixId);
    cancelAnimationFrame(this.sphereId);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    this.renderer?.dispose();
  }

  private initMatrix() {
    const canvas = this.matrixRef.nativeElement;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    this.matrixCtx = canvas.getContext('2d')!;
    this.drops = Array(Math.floor(canvas.width / this.fontSize)).fill(1);
    this.tickMatrix();
  }

  private tickMatrix = () => {
    this.matrixId = requestAnimationFrame(this.tickMatrix);
    const ctx = this.matrixCtx;
    const { width, height } = ctx.canvas;
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${this.fontSize}px monospace`;
    for (let i = 0; i < this.drops.length; i++) {
      const ch = this.chars[Math.floor(Math.random() * this.chars.length)];
      const bright = Math.random() > 0.96;
      ctx.fillStyle = bright ? '#ccffcc' : '#00ff41';
      ctx.globalAlpha = bright ? 1 : 0.65;
      ctx.fillText(ch, i * this.fontSize, this.drops[i] * this.fontSize);
      ctx.globalAlpha = 1;
      if (this.drops[i] * this.fontSize > height && Math.random() > 0.975) {
        this.drops[i] = 0;
      }
      this.drops[i]++;
    }
  };

  private initSphere() {
    const canvas = this.sphereRef.nativeElement;
    const w = canvas.clientWidth  || 480;
    const h = canvas.clientHeight || 480;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    this.camera.position.z = 3.8;

    this.globe = new THREE.Group();

    // Outer wireframe
    const wGeo = new THREE.IcosahedronGeometry(1.5, 4);
    const wMat = new THREE.MeshBasicMaterial({ color: '#00ff41', wireframe: true, transparent: true, opacity: 0.18 });
    this.globe.add(new THREE.Mesh(wGeo, wMat));

    // Mid wireframe (denser)
    const wGeo2 = new THREE.IcosahedronGeometry(1.3, 2);
    const wMat2 = new THREE.MeshBasicMaterial({ color: '#00d4ff', wireframe: true, transparent: true, opacity: 0.12 });
    this.globe.add(new THREE.Mesh(wGeo2, wMat2));

    // Dark inner sphere
    const iGeo = new THREE.SphereGeometry(1.28, 32, 32);
    const iMat = new THREE.MeshBasicMaterial({ color: '#000c0a', transparent: true, opacity: 0.92 });
    this.globe.add(new THREE.Mesh(iGeo, iMat));

    // Nodes
    const nodeColors = ['#00ff41', '#00d4ff', '#7c6fff', '#ff6b9d', '#f59e0b'];
    const nodePositions: THREE.Vector3[] = [];
    for (let i = 0; i < 80; i++) {
      const phi   = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 1.5;
      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      );
      const color = nodeColors[Math.floor(Math.random() * nodeColors.length)];
      const size  = Math.random() * 0.02 + 0.015;
      const node  = new THREE.Mesh(
        new THREE.SphereGeometry(size, 6, 6),
        new THREE.MeshBasicMaterial({ color }),
      );
      node.position.copy(pos);
      nodePositions.push(pos);
      this.globe.add(node);
    }

    // Connections
    for (let i = 0; i < 50; i++) {
      const a = nodePositions[Math.floor(Math.random() * nodePositions.length)];
      const b = nodePositions[Math.floor(Math.random() * nodePositions.length)];
      if (a === b) continue;
      const geo  = new THREE.BufferGeometry().setFromPoints([a, b]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#00ff41', transparent: true, opacity: 0.25 }));
      this.globe.add(line);
    }

    // Orbit rings
    [1.7, 2.0].forEach((r, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.006, 6, 100),
        new THREE.MeshBasicMaterial({ color: i === 0 ? '#00d4ff' : '#7c6fff', transparent: true, opacity: 0.4 }),
      );
      ring.rotation.x = i === 0 ? 0.4 : -0.6;
      ring.rotation.y = i === 0 ? 0.2 : 0.8;
      this.globe.add(ring);
    });

    this.scene.add(this.globe);
    this.tickSphere();
  }

  private tickSphere = () => {
    this.sphereId = requestAnimationFrame(this.tickSphere);
    this.globe.rotation.y += 0.005;
    this.globe.rotation.x += 0.001;
    this.camera.position.x += (this.mouse.x * 0.4 - this.camera.position.x) * 0.05;
    this.camera.position.y += (-this.mouse.y * 0.3 - this.camera.position.y) * 0.05;
    this.camera.lookAt(this.scene.position);
    this.renderer.render(this.scene, this.camera);
  };

  private async runTerminal() {
    for (const line of this.terminalLines) {
      await new Promise(r => setTimeout(r, 700));
      this.visibleLines.update(lines => [...lines, line]);
    }
  }

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  private onResize = () => {
    const mc = this.matrixRef.nativeElement;
    mc.width  = window.innerWidth;
    mc.height = window.innerHeight;
    this.drops = Array(Math.floor(mc.width / this.fontSize)).fill(1);

    const sc = this.sphereRef.nativeElement;
    const w = sc.clientWidth, h = sc.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}
