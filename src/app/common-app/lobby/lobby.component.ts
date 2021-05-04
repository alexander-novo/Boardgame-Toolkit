import { OverlayRef } from '@angular/cdk/overlay';
import { Component, Inject, OnInit } from '@angular/core';
import { Socket } from 'socket.io-client';
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
export class LobbyComponent implements OnInit {

	players: string[] = [];
	messages: Message[] = [{ content: 'test', self: false }, { content: 'second test', self: true }];


	constructor(private overlayRef: OverlayRef, @Inject(LOBBY_SOCKET) private socket: Socket) {
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

	ngOnInit(): void {
	}

	sendMessage(content: string) {
		this.messages.push({ content, self: true });
		this.socket.emit('chat', content);
	}

}
