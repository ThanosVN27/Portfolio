import { Component, HostListener, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit, OnDestroy {
  scrolled  = signal(false);
  menuOpen  = signal(false);
  time      = signal('00:00:00');
  private timeInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.tick();
    this.timeInterval = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  private tick() {
    const n = new Date();
    const pad = (v: number) => String(v).padStart(2, '0');
    this.time.set(`${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`);
  }

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 40); }

  toggleMenu() { this.menuOpen.update(v => !v); }
  closeMenu()  { this.menuOpen.set(false); }
}
