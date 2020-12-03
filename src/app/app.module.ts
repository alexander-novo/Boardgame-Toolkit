import { BrowserModule } from '@angular/platform-browser';
import { AngularMaterialModule } from './angular-material.module';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { JwtModule } from "@auth0/angular-jwt";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotComponent } from './forgot/forgot.component';
import { HomeComponent } from './home/home.component';
import { NewProjectComponent } from './new-project/new-project.component';
import { CookieService } from 'ngx-cookie-service';

@NgModule({
	declarations: [
		AppComponent,
		LoginComponent,
		RegisterComponent,
		ForgotComponent,
		HomeComponent,
		NewProjectComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		AngularMaterialModule,
		FlexLayoutModule,
		FormsModule,
		ReactiveFormsModule,
		HttpClientModule,
		JwtModule.forRoot({
			config: {
				tokenGetter: () => localStorage.getItem("jwt"),
			}
		})
	],
	providers: [CookieService],
	bootstrap: [AppComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }
