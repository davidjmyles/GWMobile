import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Provider } from 'src/app/provider.model';
import { ProviderService } from 'src/app/provider.service';
import { StorageService } from 'src/app/storage.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: false,
})
/* defines & controls functionality on splash page */
export class SplashPage implements OnInit {
  providerSub: Subscription;
  currentProvider: Provider;

  constructor(
    private storageService: StorageService,
    private providerService: ProviderService,
    private router: Router
  ) {}

  /* checks if database code exists in local storage. if it does, theme & provider details are set.
   * if not, navigates to theme page
   */
  async ngOnInit() {
    let databaseCode = await this.storageService.get('databaseCode');
    let parishCode = await this.storageService.get('parishCode');
    console.log(parishCode);
    console.log(databaseCode);
    if (databaseCode !== null) {
      this.onSubmit2(databaseCode);
      this.providerSub = this.providerService.provider.subscribe(
        async (provider) => {
          this.currentProvider = provider;
        }
      );
    } else {
      this.router.navigateByUrl('/tabnav/theme');
    }
  }

  /*
   * sets app theme & provider details based on database code
   *
   * @param databaseCode - code unique to each lottery provider
   */
  onSubmit2(code: string) {
    //this.providerService.setTheme(code);
    this.providerService.setProvider(code);
    this.storageService.set('databaseCode', code);
  }

  /* unsubscribes from all subscriptions when page is destroyed */
  ngOnDestroy(): void {
    if (this.providerSub) {
      this.providerSub.unsubscribe();
    }
  }
}
