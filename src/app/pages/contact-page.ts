import { Component, AfterViewInit, ViewChildren, QueryList, ElementRef, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-page',
  imports: [FormsModule],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss',
})
export class ContactPage implements AfterViewInit {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;

  form = { name: '', email: '', message: '' };
  submitted = signal(false);

  onSubmit() {
    this.submitted.set(true);
    setTimeout(() => {
      this.submitted.set(false);
      this.form = { name: '', email: '', message: '' };
    }, 3000);
  }

  ngAfterViewInit() {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    this.revealEls.forEach(el => obs.observe(el.nativeElement));
  }
}
