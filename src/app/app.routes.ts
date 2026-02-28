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
        path: 'register',
        loadComponent: () =>
            import('./components/register/register').then(m => m.Register)
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./components/layout/layout').then(m => m.Layout),
        children: [
            {
                path: 'calendar',
                loadComponent: () =>
                    import('./components/calendar/calendar').then(m => m.Calendar)
            },
            {
                path: 'calendar/createEvent',
                loadComponent: () => 
                    import('./components/create-event/create-event').then(m => m.CreateEvent)
            }
            //rest of components go here
        ]
    }
];
