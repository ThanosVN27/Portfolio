import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '',            loadComponent: () => import('./pages/home-page').then(m => m.HomePage) },
  { path: 'about',       loadComponent: () => import('./pages/about-page').then(m => m.AboutPage) },
  { path: 'competences', loadComponent: () => import('./pages/competences-page').then(m => m.CompetencesPage) },
  { path: 'projets',     loadComponent: () => import('./pages/projects-page').then(m => m.ProjectsPage) },
  { path: 'classement',  loadComponent: () => import('./pages/classement-page').then(m => m.ClassementPage) },
  { path: 'contact',     loadComponent: () => import('./pages/contact-page').then(m => m.ContactPage) },
  { path: '**',          redirectTo: '' },
];
