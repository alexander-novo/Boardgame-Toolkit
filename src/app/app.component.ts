import { Component, OnInit } from '@angular/core';
import { RegisterService } from './register.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
	title = 'Boardgame Toolkit';
	username = '';
	tried = false;

	constructor(private registerService: RegisterService) { }

	ngOnInit(): void {
		this.getUserName();
	}

	getUserName(): string {
		if (this.registerService.loggedIn() && !this.tried) {
			this.registerService.me().subscribe(me => this.username = me.username);
			this.tried = true;
		}


		return this.username;
	}

	logout() {
		this.registerService.logout();
	}

	loggedIn = () => this.registerService.loggedIn();
}
