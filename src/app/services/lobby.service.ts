import { HttpClient } from '@angular/common/http';
import { EventEmitter } from '@angular/core';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ProjectThumbnail } from './project.service';

export interface Lobby {
	name: string;
	owner: string;
	players: number;
	maxPlayers: number;
	game: ProjectThumbnail;
	mode: 'lobby' | 'playing';
	roomInfo: RoomInfo;
}

export interface RoomInfo {
	id: string;
	public: boolean;
	index: number;
}

@Injectable({
	providedIn: 'root'
})
export class LobbyService {

	private lobbyJoinedSource = new Subject<Socket>();
	lobbyJoined$ = this.lobbyJoinedSource.asObservable();

	constructor(private http: HttpClient) { }

	newLobby(lobby: { name: string, maxPlayers: number, projectId: string, public: boolean }) {
		return this.http.put<RoomInfo>('/api/lobbies', lobby);
	}

	listLobbies() {
		return this.http.get<Lobby[]>('/api/lobbies');
	}

	joinLobby(roomInfo: RoomInfo) {
		let socket = io({
			path: "/api/play/",
			auth: {
				jwt: localStorage.getItem('jwt'),
				roomInfo,
			},
		});

		console.log(this);
		this.lobbyJoinedSource.next(socket);
	}
}
