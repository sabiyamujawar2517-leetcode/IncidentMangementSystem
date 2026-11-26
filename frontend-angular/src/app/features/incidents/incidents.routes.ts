import { Routes } from '@angular/router';

export const INCIDENT_ROUTES: Routes = [
  {
    path: '',
    title: 'All incidents · IncidentAgent',
    data: { mode: 'all' },
    loadComponent: () => import('./incident-list/incident-list').then((m) => m.IncidentList),
  },
  {
    path: 'new',
    title: 'Report incident · IncidentAgent',
    loadComponent: () => import('./incident-form/incident-form').then((m) => m.IncidentForm),
  },
  {
    path: ':id',
    title: 'Incident · IncidentAgent',
    loadComponent: () => import('./incident-details/incident-details').then((m) => m.IncidentDetails),
  },
  {
    path: ':id/edit',
    title: 'Edit incident · IncidentAgent',
    loadComponent: () => import('./incident-form/incident-form').then((m) => m.IncidentForm),
  },
];
