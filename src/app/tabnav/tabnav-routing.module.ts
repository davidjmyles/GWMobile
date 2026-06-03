import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VerifiedGuard } from '../verified.guard';
import { AuthGuard } from './auth/auth.guard';

import { TabnavPage } from './tabnav.page';
import { ThemeGuard } from './theme/theme.guard';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabnavPage,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
        //canActivate: [ThemeGuard, AuthGuard, VerifiedGuard],
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/dashboard.module').then(
            (m) => m.DashboardPageModule
          ),
        canActivate: [ThemeGuard, AuthGuard, VerifiedGuard],
      },
      {
        path: 'account',
        loadChildren: () =>
          import('./account/account.module').then((m) => m.AccountPageModule),
        canActivate: [ThemeGuard, AuthGuard, VerifiedGuard],
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('./payments/payments.module').then(
            (m) => m.PaymentsPageModule
          ),
        canActivate: [ThemeGuard, AuthGuard, VerifiedGuard],
      },
      {
        path: 'documents',
        loadChildren: () =>
          import('./documents/documents.module').then(
            (m) => m.DocumentsPageModule
          ),
        canActivate: [ThemeGuard, AuthGuard],
      },
      // {
      //   path: 'aboutus',
      //   loadChildren: () =>
      //     import('./aboutus/aboutus.module').then((m) => m.AboutusPageModule),
      //   canActivate: [ThemeGuard, AuthGuard, VerifiedGuard],
      // },
    ],
  },
  // {
  //   path: '',
  //   redirectTo: '/tabnav/tabs/dashboard',
  //   pathMatch: 'full',
  //   canActivate: [ThemeGuard, AuthGuard, VerifiedGuard],
  // },
  {
    path: '',
    redirectTo: '/tabnav/splash',
    pathMatch: 'full',
    //canActivate: [ThemeGuard, AuthGuard, VerifiedGuard],
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.module').then((m) => m.AuthPageModule),
    canActivate: [ThemeGuard],
  },
  {
    path: 'signup',
    loadChildren: () =>
      import('./signup/signup.module').then((m) => m.SignupPageModule),
    canActivate: [ThemeGuard],
  },
  {
    path: 'unverified',
    loadChildren: () =>
      import('./unverified/unverified.module').then(
        (m) => m.UnverifiedPageModule
      ),
    canActivate: [ThemeGuard, AuthGuard],
  },
  {
    path: 'landing',
    loadChildren: () =>
      import('./landing/landing.module').then((m) => m.LandingPageModule),
    canActivate: [ThemeGuard],
  },
  {
    path: 'theme',
    loadChildren: () =>
      import('./theme/theme.module').then((m) => m.ThemePageModule),
  },
  // {
  //   path: 'aboutus',
  //   loadChildren: () =>
  //     import('./aboutus/aboutus.module').then((m) => m.AboutusPageModule),
  // },
  {
    path: 'reset',
    loadChildren: () =>
      import('./reset/reset.module').then((m) => m.ResetPageModule),
    canActivate: [ThemeGuard],
  },
  {
    path: 'splash',
    loadChildren: () =>
      import('./splash/splash.module').then((m) => m.SplashPageModule),
  },
  {
    path: 'rejected',
    loadChildren: () =>
      import('./rejected/rejected.module').then((m) => m.RejectedPageModule),
    canActivate: [ThemeGuard, AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabnavPageRoutingModule {}
