import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Provider } from 'src/app/provider.model';
import { ProviderService } from 'src/app/provider.service';
import { StorageService } from 'src/app/storage.service';
import { UserService } from 'src/app/user.service';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.page.html',
  styleUrls: ['./theme.page.scss'],
  standalone: false,
})
/* defines & controls functionality on theme page */
export class ThemePage implements OnInit, OnDestroy {
  providerCode = '';
  providerSub: Subscription;
  currentProvider: Provider;
  code;
  largeScreen = false;
  shortScreen = false;
  standardScreen = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private providerService: ProviderService,
    private storageService: StorageService
  ) {}

  /* checks if there is a database code stored in local storage. if so, theme is applied using this code.
   * also sets up subscription to provider
   */
  async ngOnInit() {
    let code = await this.storageService.get('databaseCode');
    if (code !== null) {
      //this.onSubmit2(code);
      // await this.providerService.setProvider(code);
      // await this.setTheme(code);
      // this.providerSub = await this.providerService.provider.subscribe(
      //   async (provider) => {
      //     this.currentProvider = provider;
      //     this.currentProvider.iconUrl = provider.iconUrl;
      //   }
      // );
      // console.log(this.currentProvider);
      // console.log(this.currentProvider.iconUrl);
      // this.router.navigateByUrl('/tabnav/auth');
    }
    this.providerSub = this.providerService.provider.subscribe(
      async (provider) => {
        this.currentProvider = provider;
      }
    );
    let screenSize = window.innerWidth;
    let screenHeight = window.innerHeight;
    if (screenSize > 600) {
      this.largeScreen = true;
      //console.log('screen is large');
    } else if (screenSize <= 600 && screenHeight < 700) {
      this.shortScreen = true;
      //console.log('screen is short');
    } else {
      this.standardScreen = true;
      //console.log('screen is normal');
    }
  }

  /*
   * sets app theme using provider code
   *
   * @param providerCode - provider specific code entered by user
   */
  // setTheme(providerCode) {
  //   if (providerCode == 123456) {
  //     document.querySelector('body').classList.add('one');
  //     //this.setTheme('one');
  //   }
  //   if (providerCode == 654321) {
  //     document.querySelector('body').classList.add('two');
  //     //this.setTheme('two');
  //   }
  //   this.userService.themeIsSet = true;
  // }

  /*
   * retrieves code from form & uses it to set app theme & provider details
   *
   * @param form - user input containing provider code
   */
  onSubmit(form: NgForm) {
    const code = form.value.code;
    if (!form.valid) {
      return;
    }
    this.providerService.setProvider(code);
    //this.setTheme(code);
    // if (code == 123456) {
    //   this.setTheme('two');
    //   console.log('theme 1 created');
    // }
    // if (code == 654321) {
    //   this.setTheme('two');
    //   console.log('theme submitted');
    // }
    form.reset();
    this.storageService.set('databaseCode', code);
  }

  /*
   * sets app theme & provider details using the provided code. used when code is retrieved from storage, rather than user input
   *
   * @param Code - provider specific code entered by user
   */
  onSubmit2(databaseCode: string) {
    this.providerService.setProvider(databaseCode);
    //this.providerService.setTheme(databaseCode);
    //this.storageService.set('databaseCode', databaseCode);
  }

  /* unsubscribes from all subscriptions to prevent data leaks when page is destroyed */
  ngOnDestroy(): void {
    if (this.providerSub) {
      this.providerSub.unsubscribe();
    }
  }
}
