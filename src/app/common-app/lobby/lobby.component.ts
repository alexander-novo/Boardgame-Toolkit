import { OverlayRef } from '@angular/cdk/overlay';
import { Component, Inject, OnInit } from '@angular/core';
import { Socket } from 'socket.io-client';
import { LOBBY_SOCKET } from 'src/app/tokens';

@Component({
	selector: 'app-lobby',
	templateUrl: './lobby.component.html',
	styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {

	players: string[] = [];


	constructor(private overlayRef: OverlayRef, @Inject(LOBBY_SOCKET) private socket: Socket) {
		socket.on('players in lobby', (players: string[]) => {
			this.players = players;
		});

		socket.on('new player', (player: string) => {
			this.players.push(player);
		});
	}

	close(): void {
		this.socket.disconnect();
		this.overlayRef.dispose();
	}

	ngOnInit(): void {
	}

}
