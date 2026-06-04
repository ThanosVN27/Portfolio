import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-page',
  imports: [FormsModule],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss',
})
export class ContactPage {
  form = { name: '', email: '', message: '' };
  submitted = signal(false);

  onSubmit() {
    this.submitted.set(true);
    setTimeout(() => {
      this.submitted.set(false);
      this.form = { name: '', email: '', message: '' };
    }, 3000);
  }
}
