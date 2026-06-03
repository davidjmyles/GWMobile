import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RejectedPageRoutingModule } from './rejected-routing.module';

import { RejectedPage } from './rejected.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RejectedPageRoutingModule
  ],
  declarations: [RejectedPage]
})
export class RejectedPageModule {}
