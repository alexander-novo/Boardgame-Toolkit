import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotComponent } from './forgot/forgot.component';
import { HomeComponent } from './home/home.component';
import { LoginGuard } from './login.guard';
import { NewProjectComponent } from './new-project/new-project.component';

const routes: Routes = [
	{ path: '', component: HomeComponent, canActivate: [LoginGuard] },
	{ path: 'login', component: LoginComponent },
	{ path: 'register', component: RegisterComponent },
	{ path: 'forgot', component: ForgotComponent },
	{ path: 'new-project', component: NewProjectComponent, canActivate: [LoginGuard] },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
