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
                path: 'dashboard',
                loadComponent: () =>
                    import('./components/dashboard/dashboard').then(m => m.Dashboard)
            },
            {
                path:'workouts',
                loadComponent: () =>
                    import('./components/workout-dashboard/workout-dashboard').then(m => m.WorkoutDashboard)
            },
            {
                path: 'calendar',
                loadComponent: () =>
                    import('./components/calendar/calendar').then(m => m.Calendar)
            },
            {
                path: 'calendar/createEvent',
                loadComponent: () => 
                    import('./components/create-event/create-event').then(m => m.CreateEvent)
            },
            {
                path: 'calendar/editEvent/:id',
                loadComponent: () =>
                    import('./components/edit-event/edit-event').then(m => m.EditEvent)
            },
            {
                path: 'calendar/editWorkoutLog/:id',
                loadComponent: () => 
                    import('./components/edit-workout-log/edit-workout-log').then(m => m.EditWorkoutLog)
            }
            //rest of components go here
        ]
    }
];
