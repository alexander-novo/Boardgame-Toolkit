import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { LobbyService } from './services/lobby.service';

@Injectable({
	providedIn: 'root'
})
export class PlayGuard implements CanActivate {
	constructor(private lobbyService: LobbyService, private router: Router) { }

	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		let roomInfo = JSON.parse(atob(window.decodeURIComponent(route.params.id)));

		this.lobbyService.joinLobby(roomInfo);
		return this.router.parseUrl('/play');
	}

}
