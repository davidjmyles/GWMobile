import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { StorageService } from 'src/app/storage.service';
import { BiometricsService } from 'src/app/biometrics.service';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.page.html',
  styleUrls: ['./reset.page.scss'],
  standalone: false,
})
/* defines & controls functionality on rejected page */
export class ResetPage implements OnInit {
  showPassword = false;
  passwordIcon = 'eye-outline';
  formReset: FormGroup;
  resetCodeSystem;
  token;
  username;
  password;
  confirmPassword;
  submitAttempt = false;
  authSub: Subscription;
  authSub2: Subscription;
  biometricsSub: Subscription;
  hasBiometrics;

  constructor(
    private authService: AuthService,
    private alertCtrl: AlertController,
    private storageService: StorageService,
    private biometricsService: BiometricsService
  ) {}

  /* initialises password reset form */
  ngOnInit() {
    this.formReset = new FormGroup(
      {
        resetCodeUser: new FormControl('', {
          updateOn: 'blur',
          validators: [Validators.required],
        }),
        password: new FormControl('', {
          updateOn: 'blur',
          validators: [
            Validators.required,
            Validators.pattern(
              '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[?!@*.]).{8,16}$'
            ),
          ],
        }),
        confirmPassword: new FormControl('', {
          updateOn: 'change',
          validators: [Validators.required],
        }),
      },
      {
        validators: this.passwordMatch.bind(this),
      }
    );
    this.authSub = this.authService.reset.subscribe((resetData) => {
      this.resetCodeSystem = resetData.resetCode;
      this.token = resetData.token;
      this.username = resetData.username;
    });
    this.biometricsSub =
      this.biometricsService.checkBiometricsUserPermission.subscribe(
        (permission) => {
          this.hasBiometrics = permission;
        }
      );
  }

  /* subscription retrieves reset data which is combined with user inputs to complete password reset */
  async resetPassword() {
    let check = await this.storageService.get('hasBiometrics');
    this.submitAttempt = true;
    this.authSub2 = this.authService.reset.subscribe((resetData) => {
      //console.log(resetData);
      this.resetCodeSystem = resetData.resetCode;
      this.token = resetData.token;
      this.username = resetData.username;
    });
    if (!this.formReset.valid) {
      return;
    }
    this.authService.resetPassword(
      this.formReset.value.resetCodeUser,
      this.formReset.value.password,
      this.username,
      this.token,
      check
    );
    if (this.hasBiometrics) {
      const message =
        'Could not reset biometric login function. Please continue and retry from main menu';
      this.biometricsService.setCredential(
        this.username,
        this.formReset.value.password,
        'server',
        message,
        false
      );
    }
    this.submitAttempt = false;
  }

  /* requests new reset code to be sent to users email address */
  resendCode() {
    this.authService.forgotPassword(this.username);
    //console.log(this.username);
    this.alertCtrl
      .create({
        header: 'New Code Requested',
        message: 'a new reset code has been sent to your email',
        buttons: ['ok'],
      })
      .then((alertEl) => alertEl.present());
  }

  /* validator to check that passwords match */
  passwordMatch(formGroup: FormGroup) {
    const { value: password } = formGroup.get('password');
    const { value: confirmPassword } = formGroup.get('confirmPassword');
    return password === confirmPassword ? null : { passwordNotMatch: true };
  }

  /* controls show/hide password functionality */
  toggleViewPassword() {
    this.showPassword = !this.showPassword;
    this.passwordIcon = this.showPassword ? 'eye-off-outline' : 'eye-outline';
  }

  /* unsubscribes from all subscriptions when page is destroyed */
  ngOnDestroy(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    if (this.authSub2) {
      this.authSub2.unsubscribe();
    }
    if (this.biometricsSub) {
      this.biometricsSub.unsubscribe();
    }
  }
}
