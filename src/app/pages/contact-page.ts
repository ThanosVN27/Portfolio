import { Component, AfterViewInit, ViewChildren, QueryList, ElementRef, signal } from '@angular/core';
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
export class ContactPage implements AfterViewInit {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef>;

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
  }
}
