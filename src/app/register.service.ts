import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormGroup, ValidationErrors, AsyncValidatorFn } from '@angular/forms';

import { ObjectUnsubscribedError, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CookieService } from 'ngx-cookie-service';

// Service for managing basic account information
// TODO: Rename to more descriptive name, such as 'AuthService', and put in /auth folder maybe?
@Injectable({
	providedIn: 'root'
})
export class RegisterService {

	// Keep track of currently logged in user's username
	username = '';
	// Whether or not the username needs to be updated
	usernameDirty = false;

	constructor(private http: HttpClient, private jwtService: JwtHelperService, private cookieService: CookieService) {
		// If we're already logged in, then the username is dirty immediately - we need to get it
		if (this.loggedIn()) {
			this.usernameDirty = true;
			this.getUsername();
		}
	}

	// Service for checking whether new account information (username/email) is unique
	checkForUniqueUsername(user: string, email: string): Observable<any> {
		const params = new HttpParams().set("user", user).set("email", email);
		return this.http.get("api/users/unique", { params });
	}

	// Service for registering new user
	// TODO: set up new user data type for Typescript
	registerNewUser(user) {
		// Change the Observable to a Subject, so multiple people can subscribe.
		// TODO: set up return data type for info from server.
		let obs = this.http.post<any>("api/register", user);
		let sub = new Subject<any>();
		obs.subscribe(sub);

		// Then subscribe to the Subject - when we get a response, the username is now dirty,
		// since registering new users logs them in.
		sub.subscribe(() => this.usernameDirty = true);
		return sub;
	}

	// Service for logging in with credentials
	login(creds: { username: string, password: string }) {
		// Change the Observable to a Subject, so multiple people can subscribe.
		// TODO: set up return data type for info from server.
		let obs = this.http.post<any>('/api/login', creds);
		let sub = new Subject<any>();
		obs.subscribe(sub);

		// Then subscribe to the Subject - when we get a response, the username is now dirty.
		sub.subscribe(() => this.usernameDirty = true);
		return sub;
	}

	// Service for getting personal details (such as username, email, name).
	// Must be logged in.
	me() {
		return this.http.get<any>('/api/users/me');
	}

	// Service for creating new project.
	// Must be logged in.
	createNewProject(name: string) {
		return this.http.put<any>('/api/projects/new', { name });
	}

	// Service for getting list of personal projects
	// Must be logged in.
	getMyProjects() {
		return this.http.get<any[]>('/api/projects/mine');
	}

	// Whether or not the user is currently logged in.
	loggedIn(): boolean {
		// The cookie is more important (it's what actually gets sent to the server),
		// but we use the localStorage version to make certain it isn't expired.
		return !this.jwtService.isTokenExpired() && this.cookieService.check('jwt');
	}

	// Log the user out
	logout(): void {
		localStorage.removeItem('jwt');
		this.cookieService.delete('jwt');
		this.username = '';
	}

	// Get current user's username.
	getUsername(): string {
		if (this.loggedIn() && this.usernameDirty) {
			this.usernameDirty = false;
			this.me().subscribe(me => this.username = me.username);
		}

		return this.username;
	}
}

// Validator for validating Registration form to make certain email and username are unique
export const uniqueUsernameValidator = (service: RegisterService): AsyncValidatorFn => {
	return (group: FormGroup) => {
		return service.checkForUniqueUsername(group.get("username").value, group.get("email").value).pipe(
			map(unique => {
				let error = {};
				if (!unique.emailUnique) {
					error["emailNotUnique"] = true;
				}
				if (!unique.userUnique) {
					error["userNotUnique"] = true;
				}

				return (unique.emailUnique && unique.userUnique) ? null : error;
			})
		);
	};
};
