import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/inbox/inbox.component').then(m => m.InboxComponent)
  }
];

