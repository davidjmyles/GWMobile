import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { ProviderService } from 'src/app/provider.service';
import { StorageService } from 'src/app/storage.service';
import { UserService } from 'src/app/user.service';

@Injectable({
  providedIn: 'root',
})
/* guard which ensures that lottery provider data has been set */
export class ThemeGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private router: Router,
    private storageService: StorageService,
    private providerService: ProviderService
  ) {}

  /* allows page to activate if lottery provider is set. if not, user taken to splash page */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (!this.userService.providerIsSet) {
      this.router.navigateByUrl('/tabnav/splash');
    } else {
      return true;
    }
  }
}
