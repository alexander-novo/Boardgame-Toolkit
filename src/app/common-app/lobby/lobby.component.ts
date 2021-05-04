import { OverlayRef } from '@angular/cdk/overlay';
import { Component, Inject, OnInit } from '@angular/core';
import { Socket } from 'socket.io-client';
import { LobbyService } from 'src/app/services/lobby.service';
import { LOBBY_SOCKET } from 'src/app/tokens';

export interface Message {
	content: string;
	self: boolean;
}

@Component({
	selector: 'app-lobby',
	templateUrl: './lobby.component.html',
	styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent {

	players: string[] = [];
	messages: Message[] = [];


	constructor(public lobbyService: LobbyService, private overlayRef: OverlayRef, @Inject(LOBBY_SOCKET) private socket: Socket) {
		socket.on('players in lobby', (players: string[]) => {
			this.players = players;
		});

		socket.on('new player', (player: string) => {
			this.players.push(player);
		});

		socket.on('player left', (player: string) => {
			this.players.splice(this.players.indexOf(player), 1);
		});

		socket.on('chat', content => {
			this.messages.push({ content, self: false });
		})
	}

	close(): void {
		this.socket.disconnect();
		this.overlayRef.dispose();
	}

	sendMessage(content: string): void {
		this.messages.push({ content, self: true });
		this.socket.emit('chat', content);
	}

	copyShareLink(): void {
		navigator.clipboard.writeText(`${window.location.hostname}/play/${btoa(JSON.stringify(this.lobbyService.currentLobby.roomInfo))}`);
	}
}
