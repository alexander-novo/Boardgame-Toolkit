import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { RegisterService } from './services/register.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
	title = 'Boardgame Toolkit';

	constructor(private registerService: RegisterService, public vcRef: ViewContainerRef) { }

	ngOnInit(): void { }

	getUserName(): string {
		return this.registerService.getUsername();
	}

	logout() {
		this.registerService.logout();
	}

	loggedIn = () => this.registerService.loggedIn();
}
