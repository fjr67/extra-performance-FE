import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'login' },

    {
        path: 'login',
        loadComponent: () =>
            import('./components/login/login').then(m => m.Login)
    },
    {
        path: '',
        canActivate: [authGuard],
        children: [
            {
                path: 'calendar',
                loadComponent: () =>
                    import('./components/calendar/calendar').then(m => m.Calendar)
            }
            //rest of components go here
        ]
    }
];
