import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { environment } from '../../environments/environment';

export interface Entry {
  id: string; title: string; year: number;
  score: number; category: string; emoji: string; poster: string;
}

@Injectable({ providedIn: 'root' })
export class ClassementService {
  private db: Firestore | null = null;

  get isConfigured(): boolean {
    return !!environment.firebase.projectId;
  }

  constructor() {
    if (this.isConfigured) {
      const app: FirebaseApp = getApps().length
        ? getApps()[0]
        : initializeApp(environment.firebase);
      this.db = getFirestore(app);
    }
  }

  async load(): Promise<Entry[] | null> {
    if (!this.db) return null;
    try {
      const snap = await getDoc(doc(this.db, 'classement', 'main'));
      return snap.exists() ? (snap.data()['entries'] as Entry[]) : null;
    } catch {
      return null;
    }
  }

  async save(entries: Entry[]): Promise<void> {
    if (!this.db) return;
    await setDoc(doc(this.db, 'classement', 'main'), {
      entries,
      updatedAt: new Date().toISOString()
    });
  }

  checkPin(pin: string): boolean {
    return !!environment.adminPin && pin === environment.adminPin;
  }
}
