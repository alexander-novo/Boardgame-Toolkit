import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RECAPTCHA_SETTINGS, RecaptchaSettings } from "ng-recaptcha";

import { JwtModule } from "@auth0/angular-jwt";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { CookieService } from 'ngx-cookie-service';
import { CommonAppModule } from './common-app/common-app.module';
import { AngularMaterialModule } from './angular-material.module';

@NgModule({
	declarations: [
		AppComponent,
	],
	imports: [
		CommonAppModule,
		AngularMaterialModule,
		BrowserModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		HttpClientModule,
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
