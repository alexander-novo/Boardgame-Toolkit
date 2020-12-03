import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, AsyncValidator, AbstractControl, ValidationErrors, NG_ASYNC_VALIDATORS, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router } from '@angular/router';

import { RegisterService, uniqueUsernameValidator } from '../register.service';

class CrossFieldErrorMatcher implements ErrorStateMatcher {
	constructor(private error: string) { }

	isErrorState(control: FormControl, form: FormGroupDirective | NgForm): boolean {
		return control.touched && control.invalid || control.dirty && form.invalid && form.hasError(this.error);
	}
}

@Component({
	selector: 'app-register',
	templateUrl: './register.component.html',
	styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
	registerForm = new FormGroup({
		username: new FormControl('', [Validators.required, Validators.minLength(4)]),
		name: new FormControl('', [Validators.required]),
		email: new FormControl('', [Validators.required, Validators.email]),
		password: new FormControl('', [Validators.required, Validators.minLength(8)]),
		date: new FormGroup({
			birth: new FormControl('', [Validators.required]),
		}),
	}, { asyncValidators: uniqueUsernameValidator(this.registerService) });

	usernameErrorMatcher = new CrossFieldErrorMatcher('userNotUnique');
	emailErrorMatcher = new CrossFieldErrorMatcher('emailNotUnique');
	hidePW = true;

	constructor(private registerService: RegisterService, private router: Router) { }

	ngOnInit(): void {
	}

	onSubmit(): void {
		console.log(this.registerForm.value);
		this.registerService.registerNewUser(this.registerForm.value).subscribe(
			x => localStorage.setItem('jwt', x.token),
			err => console.log(err),
			() => this.router.navigateByUrl('/')
		);
	}

	get username() { return this.registerForm.get("username"); }
	get name() { return this.registerForm.get("name"); }
	get email() { return this.registerForm.get("email"); }
	get password() { return this.registerForm.get("password"); }
	get birthdate() { return this.registerForm.get("date").get("birth"); }

}
