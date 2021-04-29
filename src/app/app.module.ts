import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { MAT_COLOR_FORMATS, NgxMatColorPickerModule, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RECAPTCHA_SETTINGS, RecaptchaSettings } from "ng-recaptcha";

import { JwtModule } from "@auth0/angular-jwt";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { CookieService } from 'ngx-cookie-service';
import { CommonAppModule } from './common-app/common-app.module';
import { AngularMaterialModule } from './angular-material.module';
import { TimeagoModule } from 'ngx-timeago';
import { ProjectEditorModule } from './project-editor/project-editor.module';
import { MonacoEditorModule } from '@sentinel-one/ngx-monaco-editor';
import { LightboxModule } from 'ngx-lightbox';

@NgModule({
	declarations: [
		AppComponent,
	],
	imports: [
		CommonAppModule,
		ProjectEditorModule,
		AngularMaterialModule,
		BrowserModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		HttpClientModule,
		NgxMatColorPickerModule,
		TimeagoModule.forRoot(),
		LightboxModule,
		JwtModule.forRoot({
			config: {
				tokenGetter: () => localStorage.getItem("jwt"),
			}
		}),
		NgxMatColorPickerModule,
		MonacoEditorModule.forRoot(),
	],
	providers: [
		CookieService,
		{
			provide: RECAPTCHA_SETTINGS,
			useValue: { siteKey: "6LfMqD0aAAAAAF-0krIJHlcKKWIWFiH0LyiTXj0M" } as RecaptchaSettings,
		},
		{
			provide: MAT_COLOR_FORMATS,
			useValue: NGX_MAT_COLOR_FORMATS
		}
	],
	bootstrap: [AppComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }
