import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '',            data: { anim: 'Home' },        loadComponent: () => import('./pages/home-page').then(m => m.HomePage) },
  { path: 'about',       data: { anim: 'About' },       loadComponent: () => import('./pages/about-page').then(m => m.AboutPage) },
  { path: 'competences', data: { anim: 'Competences' }, loadComponent: () => import('./pages/competences-page').then(m => m.CompetencesPage) },
  { path: 'projets',     data: { anim: 'Projets' },     loadComponent: () => import('./pages/projects-page').then(m => m.ProjectsPage) },
  { path: 'films',       data: { anim: 'Films' },       loadComponent: () => import('./pages/classement-page').then(m => m.ClassementPage) },
  { path: 'contact',     data: { anim: 'Contact' },     loadComponent: () => import('./pages/contact-page').then(m => m.ContactPage) },
  { path: '**',          data: { anim: '404' },        loadComponent: () => import('./pages/not-found-page').then(m => m.NotFoundPage) },
];
