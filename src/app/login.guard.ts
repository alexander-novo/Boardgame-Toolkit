import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { RegisterService } from './register.service';

// A router guard for determining places we can't go if we aren't logged in
@Injectable({
	providedIn: 'root'
})
export class LoginGuard implements CanActivate {
	constructor(private registerService: RegisterService, private router: Router) { }

	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		// If we aren't logged in, route to login page instead
		if (!this.registerService.loggedIn()) {
			return this.router.parseUrl('/login');
		}

		// Otherwise we're fine
		return true;
	}

}
