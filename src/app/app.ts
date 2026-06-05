import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { trigger, transition, style, animate, query } from '@angular/animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  animations: [
    trigger('routeAnim', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(28px) scale(0.98)' }),
          animate('380ms cubic-bezier(0.4, 0, 0.2, 1)',
            style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
        ], { optional: true }),
        query(':leave', [
          style({ opacity: 1 }),
          animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
        ], { optional: true }),
      ])
    ])
  ],
  template: `
    <app-navbar />
    <main [@routeAnim]="getState(outlet)">
      <router-outlet #outlet="outlet" />
    </main>
    <app-footer />
  `,
  styles: [`
    main { position: relative; }
    main > * { width: 100%; }
  `]
})
export class App {
  getState(outlet: RouterOutlet) {
    return outlet.isActivated ? outlet.activatedRoute.snapshot.data['anim'] : '';
  }
}
