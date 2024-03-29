import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from '../../services/register.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

	loginForm = new FormGroup({
		username: new FormControl('', [Validators.required]),
		password: new FormControl('', [Validators.required]),
	});

	hidePW = true;

	constructor(private registerService: RegisterService, private router: Router) { }

	ngOnInit(): void {
	}

	onSubmit(): void {
		this.registerService.login(this.loginForm.value).subscribe(
			x => { localStorage.setItem('jwt', x.token) },
			err => console.error(err),
			() => this.router.navigateByUrl('/'),
		);
	}

	get username() { return this.loginForm.get("username"); }
	get password() { return this.loginForm.get("password"); }
}
