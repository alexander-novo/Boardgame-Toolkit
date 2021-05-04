import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LayoutModule } from '@angular/cdk/layout';
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';
import { MaterialFileInputModule } from 'ngx-material-file-input';
import { TimeagoModule } from 'ngx-timeago';

import { AngularMaterialModule } from '../angular-material.module';
import { AppRoutingModule } from '../app-routing.module';
import { PipesModule } from '../pipes/pipes.module';
import { LobbyListComponent } from './lobby-list/lobby-list.component';
import { NewLobbyDialogComponent } from './home/new-lobby-dialog.component';
import { ForgotComponent } from './forgot/forgot.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { NewProjectComponent } from './new-project/new-project.component';
import { RegisterComponent } from './register/register.component';
import { AboutComponent } from './about/about.component';
import { LobbyComponent } from './lobby/lobby.component';

@NgModule({
	declarations: [
		LoginComponent,
		RegisterComponent,
		ForgotComponent,
		HomeComponent,
		NewProjectComponent,
		AboutComponent,
		LobbyListComponent,
		NewLobbyDialogComponent,
		LobbyComponent,
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
		MatGridListModule,
		MatCardModule,
		MatMenuModule,
		MatIconModule,
		MatButtonModule,
		LayoutModule,
	]
})
export class CommonAppModule { }
