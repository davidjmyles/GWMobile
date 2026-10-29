import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Provider } from 'src/app/provider.model';
import { ProviderService } from 'src/app/provider.service';
import { AuthService } from '../auth/auth.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-aboutus',
  templateUrl: './aboutus.page.html',
  styleUrls: ['./aboutus.page.scss'],
  standalone: false,
})
/* defines & controls functionality on about us page */
export class AboutusPage implements OnInit, OnDestroy {
  public actionSheetButtons = [
    {
      text: 'Call',
      data: {
        action: 'delete',
      },
      cssClass: 'custom-delete-button',
    },
    {
      text: 'Email',
      data: {
        action: 'share',
      },
    },
        {
      text: 'Visit Website',
      data: {
        action: 'share',
      },
    },
    {
      text: 'Cancel',
      role: 'cancel',
      data: {
        action: 'cancel',
      },
    },
  ]; 

  providerSub: Subscription;
  currentProvider: Provider;
  providerName;
  providerImage = 'assets/img/promoImage.jpg';
  providerBlurb;
  providerTelephone;
  providerEmail;
  providerWebsite;
  details;
  promoImage = '././assets/img/aboutus2.jpg';
  isPopoverOpen: boolean;

  constructor(
    private modalCtrl: ModalController,
    private providerService: ProviderService,
    private router: Router,
    private authService: AuthService,
    public sanitizer: DomSanitizer
  ) {}

  /* subscribes to provider service & sets local variables to subscription values */
  ngOnInit() {
    this.providerSub = this.providerService.provider.subscribe((provider) => {
      this.currentProvider = provider;

      this.providerName = this.currentProvider.name;
      //if (this.currentProvider.imageUrl)  {
        //this.providerImage = this.currentProvider.aboutUrl;
      //}
      this.providerBlurb = this.currentProvider.blurb;
      //this.providerTelephone = this.currentProvider.telephone;
      //this.providerEmail = this.currentProvider.email;
      //this.providerWebsite = this.currentProvider.website;
    });
  }


  /* closes help modal*/
  onCloseAbout() {
    this.modalCtrl.dismiss();
  }

  /* opens device phone client & populates with providers number */
  linkTel() {
    window.location.href = `tel:${this.providerTelephone}`;
  }

  /* opens device email client & populates with providers email address */
  linkEmail() {
    window.location.href = `mailto:${this.providerEmail}`;
  }

  /* opens device web browser & navigates to providers website */
  linkWebsite() {
    window.location.href = this.providerWebsite;
  }

  /* triggers logout function from the authService */
  onLogout() {
    this.authService.logout();
  }

  /* unsubscribes from subscriptions when page is destroyed */
  ngOnDestroy(): void {
    if (this.providerSub) {
      this.providerSub.unsubscribe();
    }
  }
}
