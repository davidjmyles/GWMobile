import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './tabnav/auth/auth.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
/* guard which checks if users details have been verified, and navigates accordingly */
export class VerifiedGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (!this.userService.isVerified) {
      this.router.navigateByUrl('/tabnav/unverified');
      console.log(
        'blocked by verified guard. authenticated: ' +
          this.userService.isVerified
      );
    } else {
      // console.log(
      //   'allowed by verified guard. verified: ' + this.userService.isVerified
      // );
      return this.userService.isVerified;
    }
  }
}
