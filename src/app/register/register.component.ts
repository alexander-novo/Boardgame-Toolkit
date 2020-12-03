import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, AsyncValidator, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';

export class UniqueUsernameValidator implements AsyncValidator {
	validate(control: AbstractControl): Promise<ValidationErrors> | Observable<ValidationErrors> {
		throw new Error('Method not implemented.');
	}

	registerOnValidatorChange?(fn: () => void): void {
		throw new Error('Method not implemented.');
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
	});

	hidePW = true;

	constructor() { }

	ngOnInit(): void {
	}

	onSubmit(): void {
		console.log(this.registerForm.value);
	}

	get username() { return this.registerForm.get("username"); }
	get name() { return this.registerForm.get("name"); }
	get email() { return this.registerForm.get("email"); }
	get password() { return this.registerForm.get("password"); }
	get birthdate() { return this.registerForm.get("date").get("birth"); }

}
