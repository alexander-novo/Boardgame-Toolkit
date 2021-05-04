import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { LobbyComponent } from './common-app/lobby/lobby.component';
import { LobbyService } from './services/lobby.service';
import { RegisterService } from './services/register.service';
import { LOBBY_SOCKET } from './tokens';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
	title = 'Boardgame Toolkit';
	lobbyOverlayRef: OverlayRef;

	constructor(
		private registerService: RegisterService,
		public vcRef: ViewContainerRef,
		private overlay: Overlay,
		private lobbyService: LobbyService,
		private injector: Injector) { }

	ngOnInit(): void {
		this.lobbyService.lobbyJoined$.subscribe(socket => {
			this.lobbyOverlayRef = this.overlay.create({
				positionStrategy: this.overlay.position().global().bottom().right(),
				width: 450,
				height: 450,
			});

			// Instantiate new PortalInjector
			let injector = Injector.create({
				parent: this.injector,
				providers: [
					{ provide: LOBBY_SOCKET, useValue: socket },
					{ provide: OverlayRef, useValue: this.lobbyOverlayRef },
				],
			});
			const filePreviewPortal = new ComponentPortal(LobbyComponent, null, injector);

			this.lobbyOverlayRef.attach(filePreviewPortal);
		});
	}

	getUserName(): string {
		return this.registerService.getUsername();
	}

	logout() {
		this.registerService.logout();
	}

	loggedIn = () => this.registerService.loggedIn();
}
