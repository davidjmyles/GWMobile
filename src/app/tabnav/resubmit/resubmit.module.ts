import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ResubmitPageRoutingModule } from './resubmit-routing.module';

import { ResubmitPage } from './resubmit.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResubmitPageRoutingModule,
    ReactiveFormsModule,
  ],
  declarations: [ResubmitPage]
})
export class ResubmitPageModule {}
