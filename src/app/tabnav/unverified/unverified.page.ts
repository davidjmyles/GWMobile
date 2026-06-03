import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Provider } from 'src/app/provider.model';
import { ProviderService } from 'src/app/provider.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-unverified',
  templateUrl: './unverified.page.html',
  styleUrls: ['./unverified.page.scss'],
  standalone: false,
})
/* defines & controls functionality on tickets page */
export class UnverifiedPage implements OnInit, OnDestroy {
  currentProvider: Provider;
  private providerSub: Subscription;
  providerTelephone: string;
  providerEmail: string;
  providerName: string;

  constructor(
    private router: Router,
    private providerService: ProviderService,
    private authService: AuthService
  ) {}

  /* creates subscription to provide service & lets local variables to subscription values */
  ngOnInit() {
    this.providerSub = this.providerService.provider.subscribe((provider) => {
      this.currentProvider = provider;
      //this.providerTelephone = this.currentProvider.telephone;
      //this.providerEmail = this.currentProvider.email;
      this.providerName = this.currentProvider.name;
    });
  }

  /* opens device phone client & populates with providers number */
  linkTel() {
    window.location.href = `tel:${this.providerTelephone}`;
  }

  /* opens device email client & populates with providers email address */
  linkEmail() {
    window.location.href = `mailto:${this.providerEmail}`;
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
