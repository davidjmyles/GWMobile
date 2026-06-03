import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RejectedPage } from './rejected.page';

const routes: Routes = [
  {
    path: '',
    component: RejectedPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RejectedPageRoutingModule {}
