import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForgotComponent } from './forgot/forgot.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { NewProjectComponent } from './new-project/new-project.component';
import { RegisterComponent } from './register/register.component';
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';
import { MaterialFileInputModule } from 'ngx-material-file-input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TimeagoModule } from 'ngx-timeago';

import { AngularMaterialModule } from '../angular-material.module';
import { AppRoutingModule } from '../app-routing.module';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
	declarations: [
		LoginComponent,
		RegisterComponent,
		ForgotComponent,
		HomeComponent,
		NewProjectComponent,
	],
	imports: [
		AngularMaterialModule,
		AppRoutingModule,
		CommonModule,
		FlexLayoutModule,
		FormsModule,
		MaterialFileInputModule,
		PipesModule,
		ReactiveFormsModule,
		RecaptchaModule,
		RecaptchaFormsModule,
		TimeagoModule,
	]
})
export class CommonAppModule { }
