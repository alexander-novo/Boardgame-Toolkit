import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RECAPTCHA_SETTINGS, RecaptchaSettings } from "ng-recaptcha";

import { JwtModule } from "@auth0/angular-jwt";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

<<<<<<< HEAD
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotComponent } from './forgot/forgot.component';
import { HomeComponent } from './home/home.component';
import { NewProjectComponent } from './new-project/new-project.component';
import { AboutComponent } from './about/about.component'
=======
>>>>>>> origin/master
import { CookieService } from 'ngx-cookie-service';
import { CommonAppModule } from './common-app/common-app.module';
import { AngularMaterialModule } from './angular-material.module';
import { TimeagoModule } from 'ngx-timeago';
import { ProjectEditorModule } from './project-editor/project-editor.module';

@NgModule({
	declarations: [
		AppComponent,
<<<<<<< HEAD
		LoginComponent,
		RegisterComponent,
		ForgotComponent,
		HomeComponent,
		NewProjectComponent,
		AboutComponent
=======
>>>>>>> origin/master
	],
	imports: [
		CommonAppModule,
		ProjectEditorModule,
		AngularMaterialModule,
		BrowserModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		HttpClientModule,
		TimeagoModule.forRoot(),
		JwtModule.forRoot({
			config: {
				tokenGetter: () => localStorage.getItem("jwt"),
			}
		})
	],
	providers: [
		CookieService,
		{
			provide: RECAPTCHA_SETTINGS,
			useValue: { siteKey: "6LfMqD0aAAAAAF-0krIJHlcKKWIWFiH0LyiTXj0M" } as RecaptchaSettings,
		},
	],
	bootstrap: [AppComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }
