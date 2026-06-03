import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Provider } from 'src/app/provider.model';
import { ProviderService } from 'src/app/provider.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: false,
})
/* defines & controls functionality on landing page */
export class LandingPage implements OnInit, OnDestroy {
  providerSub: Subscription;
  currentProvider: Provider;
  providerTelephone;
  providerEmail;

  constructor(
    private router: Router,
    private authService: AuthService,
    private providerService: ProviderService
  ) {}

  /* subscribes to providerService & sets local variables to subscription values */
  ngOnInit() {
    this.providerSub = this.providerService.provider.subscribe((provider) => {
      this.currentProvider = provider;
      //this.providerTelephone = this.currentProvider.telephone;
      //this.providerEmail = this.currentProvider.email;
    });
  }

  /* opens device phone client & populates with providers number */
  linkTel() {
    window.location.href = `tel:${this.providerTelephone}`;
  }

  /* opens device web browser & navigates to providers website */
  linkEmail() {
    window.location.href = `mailto:${this.providerEmail}`;
  }

  /* returns user to the auth page */
  onLogout() {
    this.router.navigateByUrl('/tabnav/auth');
  }

  ngOnDestroy(): void {
    if (this.providerSub) {
      this.providerSub.unsubscribe();
    }
  }
}
