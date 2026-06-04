import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
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
