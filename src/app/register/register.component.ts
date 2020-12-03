import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, AsyncValidator, AbstractControl, ValidationErrors, NG_ASYNC_VALIDATORS, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router } from '@angular/router';

import { RegisterService, uniqueUsernameValidator } from '../register.service';

// An ErrorStateMatcher which marks certain controls as in an error state if the form itself is invalid and has a specific error,
// such as userNotUnique or emailNotUnique (which are overall form errors since it's a cross field validator)
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
	// Form validation
	registerForm = new FormGroup({
		username: new FormControl('', [Validators.required, Validators.minLength(4)]),
		name: new FormControl('', [Validators.required]),
		email: new FormControl('', [Validators.required, Validators.email]),
		password: new FormControl('', [Validators.required, Validators.minLength(8)]),
		date: new FormGroup({
			birth: new FormControl('', [Validators.required]),
		}),
		// Add the custom unique username/email validator from RegisterService,
		// To make certain the username/email isn't taken before submitting.
	}, { asyncValidators: uniqueUsernameValidator(this.registerService) });

	usernameErrorMatcher = new CrossFieldErrorMatcher('userNotUnique');
	emailErrorMatcher = new CrossFieldErrorMatcher('emailNotUnique');
	hidePW = true; // Whether or not the password should be hidden. Toggled with button.

	constructor(private registerService: RegisterService, private router: Router) { }

	ngOnInit(): void {
	}

	onSubmit(): void {
		// When form is submitted, register the new user.
		// The form structure has been setup to match with MongoDB document Schema for User,
		// so we can just send the form value.
		this.registerService.registerNewUser(this.registerForm.value).subscribe(
			x => localStorage.setItem('jwt', x.token),
			err => console.log(err),
			() => this.router.navigateByUrl('/')
		);
	}

	// Element references
	get username() { return this.registerForm.get("username"); }
	get name() { return this.registerForm.get("name"); }
	get email() { return this.registerForm.get("email"); }
	get password() { return this.registerForm.get("password"); }
	get birthdate() { return this.registerForm.get("date").get("birth"); }

}
