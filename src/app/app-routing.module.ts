import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './common-app/login/login.component';
import { RegisterComponent } from './common-app/register/register.component';
import { ForgotComponent } from './common-app/forgot/forgot.component';
import { HomeComponent } from './common-app/home/home.component';
import { LoginGuard } from './login.guard';
import { NewProjectComponent } from './common-app/new-project/new-project.component';
import { EditorComponent } from './project-editor/editor/editor.component';

const routes: Routes = [
	// The home page can only be accessed if you are logged in. If not logged in, LoginGuard redirects to /login
	{ path: '', component: HomeComponent, canActivate: [LoginGuard] },
	{ path: 'login', component: LoginComponent },
	{ path: 'register', component: RegisterComponent },
	{ path: 'forgot', component: ForgotComponent },
	// The new project page can only be accessed if you are logged in. If not logged in, LoginGuard redirects to /login
	{ path: 'new-project', component: NewProjectComponent, canActivate: [LoginGuard] },
	{ path: 'project/:id', component: EditorComponent, pathMatch: 'prefix' }
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
