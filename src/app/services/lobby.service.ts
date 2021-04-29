import { Injectable } from '@angular/core';
import { ProjectThumbnail } from './project.service';

export interface Lobby {
	name: string;
	owner: string;
	players: number;
	maxPlayers: number;
	game: ProjectThumbnail;
}

@Injectable({
	providedIn: 'root'
})
export class LobbyService {

	constructor() { }
}
