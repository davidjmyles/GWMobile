import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LogoutService } from 'src/app/logout.service';
import { Provider } from 'src/app/provider.model';
import { ProviderService } from 'src/app/provider.service';
import { User } from 'src/app/user.model';
import { UserService } from 'src/app/user.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-rejected',
  templateUrl: './rejected.page.html',
  styleUrls: ['./rejected.page.scss'],
  standalone: false,
})
/* defines & controls functionality on rejected page */
export class RejectedPage implements OnInit {
  currentProvider: Provider;
  currentUser: User;
  private providerSub: Subscription;
  private userSub: Subscription;
  userEmail: string;
  providerTelephone: string;
  providerEmail: string;
  providerName: string;

  constructor(
    private router: Router,
    private providerService: ProviderService,
    private userService: UserService,
    private authService: AuthService,
    private logoutService: LogoutService
  ) {}

  /* subscribes to providerService/dataService & sets local variables to subscription values */
  ngOnInit() {
    this.providerSub = this.providerService.provider.subscribe((provider) => {
      this.currentProvider = provider;
      //this.providerTelephone = this.currentProvider.telephone;
      //this.providerEmail = this.currentProvider.email;
      this.providerName = this.currentProvider.name;
    });
    this.userSub = this.userService.user.subscribe((user) => {
      this.currentUser = user;
      this.userEmail = this.currentUser.username;
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

  /* initiates logout & navigates to auth screen */
  onLogout() {
    this.logoutService.logout();
  }

    resubmitDetails() {
    this.router.navigate(['/tabnav/resubmit']);
  }

  /* initiates logout & navigates to signup screen */
  onReturnToSignup() {
    this.authService.logoutToSignup();
  }

  /* unsubscribes from all subscriptions to prevent data leaks when page is destroyed */
  ngOnDestroy(): void {
    if (this.providerSub) {
      this.providerSub.unsubscribe();
    }
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }
}
