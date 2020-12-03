import { Component, OnInit } from '@angular/core';
import { RegisterService } from './register.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
	title = 'Boardgame Toolkit';

	constructor(private registerService: RegisterService) { }

	ngOnInit(): void { }

	getUserName(): string {
		return this.registerService.getUsername();
	}

	logout() {
		this.registerService.logout();
	}

	loggedIn = () => this.registerService.loggedIn();
}
