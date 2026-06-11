import { Directive, ElementRef, OnInit } from '@angular/core';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>/\\|{}[]!?';

@Directive({ selector: '[appDecrypt]', standalone: true })
export class DecryptText implements OnInit {
  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit() {
    const original = this.el.nativeElement.textContent ?? '';
    const total    = 28;
    let   frame    = 0;

    const step = () => {
      const progress = frame / total;
      const revealed = Math.floor(progress * original.length);
      this.el.nativeElement.textContent = original
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < revealed) return ch;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join('');
      frame++;
      if (frame <= total) requestAnimationFrame(step);
      else this.el.nativeElement.textContent = original;
    };

    setTimeout(() => requestAnimationFrame(step), 180);
  }
}
