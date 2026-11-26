import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · IncidentAgent',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'incidents',
        loadChildren: () => import('./features/incidents/incidents.routes').then((m) => m.INCIDENT_ROUTES),
      },
      {
        path: 'my-incidents',
        title: 'My incidents · IncidentAgent',
        data: { mode: 'mine' },
        loadComponent: () => import('./features/incidents/incident-list/incident-list').then((m) => m.IncidentList),
      },
      {
        path: 'categories',
        title: 'Categories · IncidentAgent',
        loadComponent: () => import('./features/reference-data/categories').then((m) => m.Categories),
      },
      {
        path: 'services',
        title: 'Application services · IncidentAgent',
        loadComponent: () => import('./features/reference-data/application-services').then((m) => m.ApplicationServices),
      },
      {
        path: '**',
        title: 'Not found · IncidentAgent',
        loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
