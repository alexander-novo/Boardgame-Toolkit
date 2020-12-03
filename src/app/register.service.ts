import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormGroup, ValidationErrors, AsyncValidatorFn } from '@angular/forms';

import { ObjectUnsubscribedError, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
	providedIn: 'root'
})
export class RegisterService {

	username = '';
	usernameDirty = false;

	constructor(private http: HttpClient, private jwtService: JwtHelperService, private cookieService: CookieService) {
		if (this.loggedIn()) {
			this.usernameDirty = true;
			this.getUsername();
		}
	}

	checkForUniqueUsername(user: string, email: string): Observable<any> {
		const params = new HttpParams().set("user", user).set("email", email);
		return this.http.get("api/users/unique", { params });
	}

	registerNewUser(user) {
		let obs = this.http.post<any>("api/register", user);
		let sub = new Subject<any>();

		obs.subscribe(sub);
		sub.subscribe(() => this.usernameDirty = true);
		return sub;
	}

	login(creds: { username: string, password: string }) {
		let obs = this.http.post<any>('/api/login', creds);
		let sub = new Subject<any>();

		obs.subscribe(sub);
		sub.subscribe(() => this.usernameDirty = true);
		return sub;
	}

	me() {
		return this.http.get<any>('/api/users/me');
	}

	createNewProject(name: string) {
		return this.http.put<any>('/api/projects/new', { name });
	}

	getMyProjects() {
		return this.http.get<any[]>('/api/projects/mine');
	}

	loggedIn(): boolean {
		return !this.jwtService.isTokenExpired() && this.cookieService.check('jwt');
	}

	logout(): void {
		localStorage.removeItem('jwt');
		this.cookieService.delete('jwt');
		this.username = '';
	}

	getUsername(): string {
		if (this.loggedIn() && this.usernameDirty) {
			this.usernameDirty = false;
			this.me().subscribe(me => this.username = me.username);
		}

		return this.username;
	}
}

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
